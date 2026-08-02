"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { DoctorCharacter } from "@/components/doctor/DoctorCharacter";
import { DoctorImageAttachment } from "@/components/doctor/DoctorImageAttachment";
import { DoctorResult } from "@/components/doctor/DoctorResult";
import { FollowUpQuestionCard } from "@/components/doctor/FollowUpQuestionCard";
import { sendDoctorMessage } from "@/lib/doctor/client";
import { characterStateFor, type DoctorAnswer, type DoctorChatRequest, type DoctorChatResponse, type DoctorStatus } from "@/lib/doctor/chat-contract";

type TranscriptItem = { id: string; role: "user" | "doctor"; text?: string; result?: DoctorChatResponse };
type UiStatus = DoctorStatus | "welcome" | "thinking";

const statusCopy: Record<UiStatus, string> = {
  welcome: "مرحباً، أنا دكتور ArtVert. أخبرني عن النبات والأعراض التي تراها.",
  thinking: "أرتّب المعلومات المرسلة…",
  needs_information: "أحتاج إلى ملاحظة قصيرة إضافية قبل تقديم إرشاد أدق.",
  differential_ready: "هذا ملخص الاحتمالات والإرشادات المتاحة.",
  insufficient_information: "المعلومات الحالية لا تكفي لتشخيص مفيد بعد.",
  unavailable: "الخدمة غير متاحة الآن. يمكنك المحاولة مرة أخرى.",
  session_expired: "انتهت صلاحية الجلسة. يظل السجل ظاهراً للقراءة فقط.",
  knowledge_release_unavailable: "لا يمكن متابعة هذه الجلسة لأن إصدار المعرفة لم يعد متاحاً.",
};

function isTerminal(status: UiStatus) {
  return status === "session_expired" || status === "knowledge_release_unavailable";
}

function turnText(input: DoctorChatRequest) {
  if (input.message?.trim()) return input.message.trim();
  if (input.answers) return `إجابة المتابعة: ${Object.values(input.answers).flatMap((answer) => Array.isArray(answer) ? answer : [answer]).join("، ")}`;
  return "طلب تشخيص جديد";
}

export function DoctorChat() {
  const [sessionId, setSessionId] = useState<string>();
  const [status, setStatus] = useState<UiStatus>("welcome");
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [message, setMessage] = useState("");
  const [plant, setPlant] = useState("");
  const [imageRef, setImageRef] = useState<string | undefined>(undefined);
  const [isRequestPending, setIsRequestPending] = useState(false);
  const [lastTurn, setLastTurn] = useState<DoctorChatRequest | undefined>(undefined);
  const requestRef = useRef<AbortController | null>(null);
  const newestResponseRef = useRef<HTMLDivElement>(null);
  const [newestResponseId, setNewestResponseId] = useState<string | undefined>(undefined);

  useEffect(() => () => requestRef.current?.abort(), []);
  useEffect(() => { newestResponseRef.current?.focus(); }, [newestResponseId]);

  const appendDoctor = useCallback((result: DoctorChatResponse) => {
    const id = `doctor-${crypto.randomUUID()}`;
    setTranscript((current) => [...current, { id, role: "doctor", result }]);
    setNewestResponseId(id);
  }, []);

  const submitTurn = useCallback(async (turn: DoctorChatRequest) => {
    if (isRequestPending || isTerminal(status)) return;
    const controller = new AbortController();
    requestRef.current = controller;
    setLastTurn(turn);
    setIsRequestPending(true);
    setTranscript((current) => [...current, { id: `user-${crypto.randomUUID()}`, role: "user", text: turnText(turn) }]);
    setStatus("thinking");
    try {
      const result = await sendDoctorMessage(turn, controller.signal);
      if (requestRef.current !== controller) return;
      if (result.sessionId) setSessionId(result.sessionId);
      setStatus(result.status);
      appendDoctor(result);
    } catch (error) {
      if (controller.signal.aborted || requestRef.current !== controller) return;
      const detail = error instanceof Error ? error.message : "تعذر الاتصال بالطبيب.";
      const result: DoctorChatResponse = { sessionId: undefined, status: "unavailable", error: detail, knowledgeRelease: { version: "", manifestChecksum: "", contentChecksum: "" }, plant: { alternatives: [] }, candidates: [], followUpQuestions: [], treatment: { immediateActions: [], monitoringSteps: [], treatmentGuidance: [], products: [], contraindications: [], unknownCompatibilityWarnings: [] }, emergencyFlags: [], disclaimer: "" };
      setStatus("unavailable");
      appendDoctor(result);
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null;
        setIsRequestPending(false);
      }
    }
  }, [appendDoctor, isRequestPending, status]);

  function submitInitial(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || isRequestPending || isTerminal(status)) return;
    setMessage("");
    void submitTurn({ message: trimmed, imageRef, sessionId, context: plant.trim() ? { plant: plant.trim() } : undefined });
    setImageRef(undefined);
  }

  function answerQuestion(questionId: string, answer: DoctorAnswer, summary: string) {
    if (!sessionId || isRequestPending || isTerminal(status)) return;
    void submitTurn({ sessionId, answers: { [questionId]: answer } });
    setTranscript((current) => current.map((item) => item.id.startsWith("user-") && item.text === turnText({ answers: { [questionId]: answer } }) ? { ...item, text: `إجابة المتابعة: ${summary}` } : item));
  }

  function selectPlant(name: string) {
    if (isRequestPending) return;
    setSessionId(undefined);
    setStatus("welcome");
    setPlant(name);
    void submitTurn({ message: `النبات المتأثر هو ${name}`, context: { plant: name } });
  }

  function retry() {
    if (!lastTurn || isRequestPending || isTerminal(status)) return;
    void submitTurn(lastTurn);
  }

  function startNewSession() {
    requestRef.current?.abort();
    requestRef.current = null;
    setIsRequestPending(false);
    setLastTurn(undefined);
    setSessionId(undefined);
    setTranscript([]);
    setMessage("");
    setPlant("");
    setImageRef(undefined);
    setStatus("welcome");
  }

  const lastDoctor = [...transcript].reverse().find((item) => item.role === "doctor")?.result;
  const followUp = lastDoctor?.followUpQuestions.find((question) => !transcript.some((item) => item.role === "user" && item.text?.includes(question.id)));
  const characterState = characterStateFor(status, Boolean(lastDoctor?.emergencyFlags.length));
  const locked = isTerminal(status);

  return <section data-doctor-ui className="grid min-w-0 gap-6 lg:grid-cols-[minmax(260px,0.36fr)_minmax(0,1fr)]" aria-label="محادثة دكتور ArtVert">
    <div className="min-w-0 space-y-4 lg:sticky lg:top-6 lg:self-start"><DoctorCharacter state={characterState} /><section className="rounded-2xl border border-green-700/60 bg-black/20 p-4"><h2 className="font-black text-lime-200">كيف يساعدك الطبيب؟</h2><p className="mt-2 break-words text-sm leading-7 text-green-50/75">اكتب اسم النبات وأهم عرض ظاهر. لا نطلب صوراً في هذه المرحلة.</p></section></div>
    <div className="min-w-0 rounded-3xl border border-green-700/60 bg-[#161b17]/95 p-4 shadow-2xl shadow-black/20 sm:p-6">
      <header className="border-b border-green-800/70 pb-4"><h1 className="text-2xl font-black text-lime-300 sm:text-3xl">اسأل دكتور ArtVert</h1><p className="mt-2 text-sm leading-7 text-green-50/75">إرشاد زراعي مبني على المعلومات التي تشاركها.</p></header>
      <p aria-live="polite" role="status" className="mt-4 rounded-xl bg-green-900/25 px-4 py-3 text-sm leading-6 text-green-50/90">{statusCopy[status]}</p>
      <div className="mt-5 space-y-4" aria-label="سجل المحادثة">
        {transcript.map((item) => item.role === "user" ? <article key={item.id} className="mr-auto max-w-[88%] break-words rounded-2xl rounded-tr-sm bg-lime-300 px-4 py-3 text-sm font-bold leading-7 text-[#152015]">{item.text}</article> : <div key={item.id} ref={item.id === newestResponseId ? newestResponseRef : undefined} tabIndex={-1} className="min-w-0 overflow-hidden rounded-2xl border border-green-700/60 bg-[#1b2820] p-4 outline-none focus-visible:ring-2 focus-visible:ring-lime-200 sm:p-5"><DoctorResult result={item.result!} />{item.result?.plant.alternatives.length ? <section className="mt-5"><h2 className="font-black text-lime-200">هل تقصد أحد هذه النباتات؟</h2><div className="mt-3 flex flex-wrap gap-2">{item.result.plant.alternatives.map((alternative) => <button type="button" key={alternative.id} onClick={() => selectPlant(alternative.name)} disabled={isRequestPending} className="min-h-11 max-w-full break-words rounded-xl border border-lime-300/60 px-4 py-2 text-sm font-bold text-lime-100 transition hover:bg-lime-300 hover:text-[#152015] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-100 disabled:opacity-50"><bdi>{alternative.name}</bdi></button>)}</div></section> : null}</div>)}
        {status === "thinking" ? <div className="rounded-2xl border border-green-700/50 bg-green-900/15 p-4 text-sm text-green-50/80 motion-safe:animate-pulse">جارٍ تجهيز الرد…</div> : null}
      </div>
      {followUp && !locked && status !== "thinking" ? <div className="mt-5"><FollowUpQuestionCard key={followUp.id} question={followUp} disabled={!sessionId || isRequestPending} onSubmit={answerQuestion} /></div> : null}
      {status === "unavailable" ? <button type="button" onClick={retry} disabled={!lastTurn || isRequestPending} className="mt-5 rounded-xl border border-lime-300/60 px-5 py-3 font-black text-lime-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-100 disabled:opacity-50">إعادة المحاولة</button> : null}
      {locked ? <button type="button" onClick={startNewSession} className="mt-5 rounded-xl bg-lime-300 px-5 py-3 font-black text-[#152015] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-100">بدء جلسة جديدة</button> : null}
      {!locked ? <form onSubmit={submitInitial} className="doctor-composer sticky bottom-0 z-20 mt-6 border-t border-green-800/70 bg-[#161b17]/95 pt-5"><label className="block text-sm font-bold text-lime-100">اسم النبات <span className="font-normal text-green-50/60">(اختياري)</span><input value={plant} onChange={(event) => setPlant(event.target.value)} disabled={isRequestPending} maxLength={300} className="mt-2 w-full rounded-xl border border-green-500/35 bg-black/20 px-4 py-3 text-white outline-none focus:border-lime-300 focus:ring-2 focus:ring-lime-300/50 disabled:opacity-60" /></label><label className="mt-4 block text-sm font-bold text-lime-100">ما المشكلة التي تراها؟<textarea value={message} onChange={(event) => setMessage(event.target.value)} disabled={isRequestPending} maxLength={2000} rows={4} className="mt-2 w-full resize-y rounded-xl border border-green-500/35 bg-black/20 px-4 py-3 text-white outline-none focus:border-lime-300 focus:ring-2 focus:ring-lime-300/50 disabled:opacity-60" placeholder="مثال: بقع بنية على أوراق الطماطم" /></label><DoctorImageAttachment sessionId={sessionId} disabled={isRequestPending} onReady={setImageRef} onRemove={() => setImageRef(undefined)} /><button type="submit" disabled={!message.trim() || isRequestPending} className="mt-4 min-h-11 max-w-full rounded-xl bg-lime-300 px-6 py-3 font-black text-[#152015] transition hover:bg-lime-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-100 disabled:cursor-not-allowed disabled:opacity-50">إرسال للدكتور</button></form> : null}
    </div>
  </section>;
}
