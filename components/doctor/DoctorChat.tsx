"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Bot,
  Camera,
  CheckCircle2,
  ClipboardList,
  FlaskConical,
  Image as ImageIcon,
  Leaf,
  Lightbulb,
  Loader2,
  LogIn,
  Menu,
  Mic,
  Pill,
  Plus,
  Search,
  Send,
  ShieldCheck,
  ShoppingCart,
  Stethoscope,
  User,
  X,
} from "lucide-react";

import { sendDoctorMessage } from "@/lib/doctor/client";
import type {
  DoctorChatRequest,
  DoctorChatResponse,
  DoctorStatus,
} from "@/lib/doctor/chat-contract";

type ExtendedProduct = {
  id: string;
  slug?: string;
  nameAr: string;
  nameEn?: string;
  category?: string;
  composition?: string;
  dosage?: string;
  benefits?: string[];
  crops?: string[];
  reason?: string;
  warnings?: string[];
};

type PossibleDiagnosis = {
  name: string;
  confidence: "HIGH" | "MODERATE" | "LOW";
  reasoning?: string;
};

type ExtendedDoctorChatResponse = DoctorChatResponse & {
  reply?: string;
  intent?: string;
  products?: ExtendedProduct[];
  possibleDiagnoses?: PossibleDiagnosis[];
  observedSymptoms?: string[];
  followUpQuestion?: string;
  immediateActions?: string[];
  treatmentGuidance?: string[];
  warning?: string;
};

type TranscriptItem = {
  id: string;
  role: "user" | "assistant";
  text: string;
  imageUrl?: string;
  result?: ExtendedDoctorChatResponse;
  createdAt: string;
};

type UiStatus = DoctorStatus | "welcome" | "thinking";

type ImageUploadResponse = {
  status?: string;
  sessionId?: string;
  imageRef?: string;
  error?: string;
};

function isTerminal(status: UiStatus) {
  return (
    status === "session_expired" ||
    status === "knowledge_release_unavailable"
  );
}

function turnText(input: DoctorChatRequest) {
  if (input.message?.trim()) return input.message.trim();

  if (input.answers) {
    return Object.values(input.answers)
      .flatMap((answer) => (Array.isArray(answer) ? answer : [answer]))
      .join("، ");
  }

  return "طلب جديد";
}

function confidenceValue(
  result: ExtendedDoctorChatResponse | undefined,
) {
  const confidence =
    result?.possibleDiagnoses?.[0]?.confidence ??
    result?.candidates?.[0]?.confidence;

  if (confidence === "HIGH") return 96;
  if (confidence === "MODERATE") return 82;
  if (confidence === "LOW") return 58;
  return 0;
}

function resultProducts(
  result: ExtendedDoctorChatResponse | undefined,
): ExtendedProduct[] {
  if (!result) return [];

  if (result.products && result.products.length > 0) {
    return result.products.slice(0, 3);
  }

  return result.treatment.products.slice(0, 3).map((product) => ({
    id: product.productId,
    nameAr: product.name,
    reason: product.reason,
  }));
}

function timeLabel(value: string) {
  return new Intl.DateTimeFormat("ar-EG", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function StatusDot() {
  return (
    <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#6cff62] shadow-[0_0_14px_rgba(108,255,98,.75)]" />
  );
}

function EmptyResultPanel() {
  return (
    <div className="grid min-h-[520px] place-items-center px-6 py-12 text-center">
      <div className="max-w-xl">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-[24px] border border-[#c8f33f]/30 bg-[#c8f33f]/10 text-[#c8f33f]">
          <Stethoscope size={36} />
        </div>

        <h2 className="mt-6 text-3xl font-black text-white">
          ابدأ تشخيصًا جديدًا
        </h2>

        <p className="mx-auto mt-4 max-w-lg text-base leading-8 text-white/60">
          اكتب أعراض النبات أو ارفع صورة واضحة، وسيظهر التشخيص والتوصيات هنا
          في بطاقات مرتبة.
        </p>
      </div>
    </div>
  );
}

export function DoctorChat() {
  const [sessionId, setSessionId] = useState<string>();
  const [status, setStatus] = useState<UiStatus>("welcome");
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [message, setMessage] = useState("");
  const [imageRef, setImageRef] = useState<string>();
  const [imagePreview, setImagePreview] = useState<string>();
  const [imageUploading, setImageUploading] = useState(false);
  const [isRequestPending, setIsRequestPending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string>();

  const sessionIdRef = useRef<string | undefined>(undefined);
  const requestRef = useRef<AbortController | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const previewUrlsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    chatScrollRef.current?.scrollTo({
      top: chatScrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [transcript, isRequestPending]);

  useEffect(() => {
    return () => {
      requestRef.current?.abort();

      for (const url of previewUrlsRef.current) {
        URL.revokeObjectURL(url);
      }

      previewUrlsRef.current.clear();
    };
  }, []);

  const lastResult = useMemo(() => {
    return [...transcript]
      .reverse()
      .find(
        (
          item,
        ): item is TranscriptItem & {
          result: ExtendedDoctorChatResponse;
        } => item.role === "assistant" && Boolean(item.result),
      )?.result;
  }, [transcript]);

  const lastUserImage = useMemo(() => {
    return [...transcript]
      .reverse()
      .find((item) => item.role === "user" && item.imageUrl)?.imageUrl;
  }, [transcript]);

  const diagnosis =
    lastResult?.possibleDiagnoses?.[0]?.name ??
    lastResult?.candidates?.[0]?.name;

  const confidence = confidenceValue(lastResult);
  const products = resultProducts(lastResult);

  const observedSymptoms =
    lastResult?.observedSymptoms?.filter(Boolean) ?? [];

  const immediateActions = [
    ...(lastResult?.immediateActions ?? []),
    ...(lastResult?.treatment.immediateActions ?? []),
  ].filter(Boolean);

  const treatmentGuidance = [
    ...(lastResult?.treatmentGuidance ?? []),
    ...(lastResult?.treatment.treatmentGuidance ?? []),
  ].filter(Boolean);

  const followUpQuestion =
    lastResult?.followUpQuestion ??
    lastResult?.followUpQuestions?.[0]?.prompt;

  const warning =
    lastResult?.warning ??
    lastResult?.treatment.contraindications?.[0] ??
    lastResult?.disclaimer;

  const appendAssistant = useCallback(
    (result: ExtendedDoctorChatResponse) => {
      setTranscript((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text:
            result.reply ||
            result.error ||
            "محتاج توضيح بسيط أكتر.",
          result,
          createdAt: new Date().toISOString(),
        },
      ]);
    },
    [],
  );

  const submitTurn = useCallback(
    async (turn: DoctorChatRequest, displayImageUrl?: string) => {
      if (isRequestPending || isTerminal(status)) return;

      const controller = new AbortController();
      requestRef.current = controller;

      setIsRequestPending(true);
      setStatus("thinking");

      setTranscript((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "user",
          text: turnText(turn),
          imageUrl: displayImageUrl,
          createdAt: new Date().toISOString(),
        },
      ]);

      try {
        const result = (await sendDoctorMessage(
          turn,
          controller.signal,
        )) as ExtendedDoctorChatResponse;

        if (requestRef.current !== controller) return;

        if (result.sessionId) {
          sessionIdRef.current = result.sessionId;
          setSessionId(result.sessionId);
        }

        setStatus(result.status);
        appendAssistant(result);
      } catch (error) {
        if (controller.signal.aborted) return;

        setStatus("unavailable");
        setTranscript((current) => [
          ...current,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            text:
              error instanceof Error
                ? error.message
                : "تعذر الاتصال بدكتور ArtVert AI.",
            createdAt: new Date().toISOString(),
          },
        ]);
      } finally {
        if (requestRef.current === controller) {
          requestRef.current = null;
          setIsRequestPending(false);
        }
      }
    },
    [appendAssistant, isRequestPending, status],
  );

  async function chooseImage(file: File | undefined) {
    if (!file || isRequestPending || imageUploading) return;

    const image = file;

    setImageUploading(true);

    const preview = URL.createObjectURL(image);
    previewUrlsRef.current.add(preview);
    setImagePreview(preview);

    async function upload(activeSessionId?: string) {
      const body = new FormData();

      if (activeSessionId) {
        body.set("sessionId", activeSessionId);
      }

      body.set("image", image);

      const response = await fetch("/api/doctor/images", {
        method: "POST",
        body,
      });

      const result = (await response.json()) as ImageUploadResponse;

      return {
        response,
        result,
      };
    }

    try {
      const currentSessionId = sessionIdRef.current ?? sessionId;

      let { response, result } = await upload(currentSessionId);

      if (
        response.status === 409 ||
        result.status === "session_expired"
      ) {
        sessionIdRef.current = undefined;
        setSessionId(undefined);

        ({ response, result } = await upload());
      }

      if (!response.ok || !result.imageRef || !result.sessionId) {
        throw new Error(result.error || "تعذر رفع الصورة.");
      }

      setImageRef(result.imageRef);
      sessionIdRef.current = result.sessionId;
      setSessionId(result.sessionId);
    } catch (error) {
      URL.revokeObjectURL(preview);
      previewUrlsRef.current.delete(preview);
      setImagePreview(undefined);
      setImageRef(undefined);

      setTranscript((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text:
            error instanceof Error
              ? error.message
              : "تعذر رفع الصورة.",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setImageUploading(false);
    }
  }

  function removeImage() {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      previewUrlsRef.current.delete(imagePreview);
    }

    setImagePreview(undefined);
    setImageRef(undefined);
  }

  function sendCurrentMessage() {
    const trimmed = message.trim();

    if (
      (!trimmed && !imageRef) ||
      isRequestPending ||
      imageUploading ||
      isTerminal(status)
    ) {
      return;
    }

    const displayImageUrl = imagePreview;

    setMessage("");
    setImageRef(undefined);
    setImagePreview(undefined);

    void submitTurn(
      {
        message:
          trimmed ||
          "حلل صورة النبات المرفوعة وساعدني في معرفة المشكلة.",
        imageRef,
        sessionId: sessionIdRef.current ?? sessionId,
      },
      displayImageUrl,
    );
  }

  function resetConversation() {
    requestRef.current?.abort();
    requestRef.current = null;

    for (const url of previewUrlsRef.current) {
      URL.revokeObjectURL(url);
    }

    previewUrlsRef.current.clear();

    setTranscript([]);
    sessionIdRef.current = undefined;
    setSessionId(undefined);
    setStatus("welcome");
    setMessage("");
    setImageRef(undefined);
    setImagePreview(undefined);
    setIsRequestPending(false);
    setRecording(false);
    setZoomedImage(undefined);
  }

  const canSend = Boolean(message.trim()) || Boolean(imageRef);

  const doctorState =
    status === "thinking"
      ? "جاري التحليل"
      : status === "differential_ready"
        ? "تم تجهيز التشخيص"
        : status === "needs_information"
          ? "محتاج معلومة إضافية"
          : "متصل الآن";

  return (
    <main
      dir="rtl"
      className="relative min-h-[100dvh] overflow-hidden bg-[#03140c] text-white"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(200,243,63,.08),transparent_25%),radial-gradient(circle_at_85%_20%,rgba(42,164,99,.12),transparent_25%),linear-gradient(145deg,#021009_0%,#052719_50%,#02110a_100%)]" />

      <div className="relative z-10 mx-auto flex min-h-[100dvh] max-w-[1600px] flex-col px-3 py-3 sm:px-5">
        <nav className="flex min-h-[68px] items-center justify-between rounded-[24px] border border-[#9fbd35]/25 bg-[#03170e]/90 px-4 shadow-[0_16px_45px_rgba(0,0,0,.26)] backdrop-blur-xl sm:px-6">
          <Link href="/" className="flex items-center gap-2" dir="ltr">
            <Leaf size={30} className="text-[#c8f33f]" />
            <div className="leading-none">
              <span className="text-2xl font-black text-white">
                ART<span className="text-[#c8f33f]">VERT</span>
              </span>
              <span className="mt-1 block text-center text-[9px] font-black tracking-[.28em] text-[#c8f33f]">
                EGYPT
              </span>
            </div>
          </Link>

          <div className="hidden items-center gap-7 text-sm font-black text-white/85 lg:flex">
            <Link href="/" className="transition hover:text-[#c8f33f]">
              الرئيسية
            </Link>
            <Link
              href="/plant-care"
              className="transition hover:text-[#c8f33f]"
            >
              الرعاية والحماية
            </Link>
            <Link href="/doctor" className="text-[#c8f33f]">
              الرعاية والتشخيص
            </Link>
            <Link href="/blog" className="transition hover:text-[#c8f33f]">
              المدونة
            </Link>
            <Link href="/about" className="transition hover:text-[#c8f33f]">
              من نحن
            </Link>
            <Link
              href="/contact"
              className="transition hover:text-[#c8f33f]"
            >
              تواصل معنا
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-4 text-sm font-black text-white sm:flex"
            >
              تسجيل الدخول
              <LogIn size={16} />
            </Link>

            <Link
              href="/cart"
              className="relative grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/[.04]"
            >
              <ShoppingCart size={18} />
              <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-[#c8f33f] text-[10px] font-black text-[#102014]">
                0
              </span>
            </Link>

            <Link
              href="/products"
              className="hidden min-h-11 items-center rounded-xl bg-[#c8f33f] px-5 text-sm font-black text-[#102014] shadow-[0_0_22px_rgba(200,243,63,.2)] sm:flex"
            >
              تسوق الآن
            </Link>

            <button
              type="button"
              className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/[.04] lg:hidden"
              aria-label="فتح القائمة"
            >
              <Menu size={19} />
            </button>
          </div>
        </nav>

        <div className="mt-3 grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_370px]">
          <section className="flex min-h-[760px] min-w-0 flex-col overflow-hidden rounded-[28px] border border-[#9fbd35]/25 bg-[#061f14]/82 shadow-[0_24px_80px_rgba(0,0,0,.24)] backdrop-blur-xl">
            <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-7">
              <div>
                <p className="text-xs font-black text-[#c8f33f]">
                  دكتور ArtVert AI
                </p>
                <h1 className="mt-1 text-2xl font-black text-white sm:text-3xl">
                  التشخيص والتوصيات
                </h1>
              </div>

              <div className="flex items-center gap-2 rounded-full border border-[#9fbd35]/30 bg-[#153a25]/70 px-4 py-2">
                <StatusDot />
                <span className="text-xs font-black text-white">
                  {doctorState}
                </span>
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
              {!lastResult ? (
                <EmptyResultPanel />
              ) : (
                <div className="space-y-4">
                  <section className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
                    {lastUserImage ? (
                      <button
                        type="button"
                        onClick={() => setZoomedImage(lastUserImage)}
                        className="group relative min-h-[340px] overflow-hidden rounded-[24px] border border-[#c8f33f]/25 bg-black/25"
                      >
                        <img
                          src={lastUserImage}
                          alt="صورة النبات المرفوعة"
                          className="h-full max-h-[430px] w-full object-contain"
                        />

                        <span className="absolute left-4 top-4 grid h-11 w-11 place-items-center rounded-xl border border-white/15 bg-black/55 text-white backdrop-blur-md transition group-hover:border-[#c8f33f]/60 group-hover:text-[#c8f33f]">
                          <Search size={19} />
                        </span>

                        <span className="absolute inset-x-0 bottom-0 bg-black/55 px-4 py-3 text-right text-xs font-black text-white backdrop-blur-md">
                          الصورة المرفوعة
                        </span>
                      </button>
                    ) : (
                      <div className="grid min-h-[340px] place-items-center rounded-[24px] border border-dashed border-white/15 bg-black/10 text-white/35">
                        <Camera size={42} />
                      </div>
                    )}

                    <div className="rounded-[24px] border border-[#c8f33f]/25 bg-[linear-gradient(145deg,rgba(200,243,63,.08),rgba(255,255,255,.025))] p-5 sm:p-6">
                      <div className="flex items-center gap-3 text-[#c8f33f]">
                        <Stethoscope size={22} />
                        <span className="text-sm font-black">التشخيص</span>
                      </div>

                      <h2 className="mt-5 text-3xl font-black text-white sm:text-4xl">
                        {diagnosis || "تشخيص مبدئي"}
                      </h2>

                      {confidence > 0 && (
                        <>
                          <div className="mt-6 inline-flex rounded-full border border-[#c8f33f]/30 bg-[#c8f33f]/10 px-5 py-2 text-sm font-black text-[#c8f33f]">
                            نسبة الثقة {confidence}%
                          </div>

                          <div className="mt-5 h-2.5 overflow-hidden rounded-full border border-white/10 bg-black/25">
                            <div
                              className="h-full rounded-full bg-[linear-gradient(90deg,#8fb92a,#c8f33f)] shadow-[0_0_16px_rgba(200,243,63,.35)]"
                              style={{
                                width: `${confidence}%`,
                              }}
                            />
                          </div>
                        </>
                      )}

                      {lastResult.reply && (
                        <p className="mt-6 text-sm leading-8 text-white/65">
                          {lastResult.reply}
                        </p>
                      )}
                    </div>
                  </section>

                  {observedSymptoms.length > 0 && (
                    <section className="rounded-[24px] border border-white/10 bg-black/15 p-5 sm:p-6">
                      <h3 className="flex items-center gap-2 text-xl font-black text-white">
                        <FlaskConical size={21} className="text-[#c8f33f]" />
                        الأسباب المحتملة
                      </h3>

                      <div className="mt-5 grid gap-3">
                        {observedSymptoms.map((item, index) => (
                          <div
                            key={`${item}-${index}`}
                            className="flex items-start gap-3 text-sm leading-7 text-white/75"
                          >
                            <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#c8f33f]" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {(immediateActions.length > 0 ||
                    treatmentGuidance.length > 0) && (
                    <section className="rounded-[24px] border border-white/10 bg-black/15 p-5 sm:p-6">
                      <h3 className="flex items-center gap-2 text-xl font-black text-white">
                        <Pill size={21} className="text-[#c8f33f]" />
                        العلاج والممارسات الموصى بها
                      </h3>

                      <div className="mt-5 grid gap-3">
                        {[...immediateActions, ...treatmentGuidance].map(
                          (item, index) => (
                            <div
                              key={`${item}-${index}`}
                              className="grid grid-cols-[34px_minmax(0,1fr)] items-start gap-3 rounded-2xl border border-white/[.07] bg-white/[.025] p-3"
                            >
                              <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#c8f33f] text-xs font-black text-[#102014]">
                                {index + 1}
                              </span>
                              <p className="text-sm leading-7 text-white/75">
                                {item}
                              </p>
                            </div>
                          ),
                        )}
                      </div>
                    </section>
                  )}

                  {products.length > 0 && (
                    <section className="rounded-[24px] border border-[#c8f33f]/20 bg-black/15 p-5 sm:p-6">
                      <h3 className="flex items-center gap-2 text-xl font-black text-white">
                        <ShieldCheck size={21} className="text-[#c8f33f]" />
                        منتجات ArtVert المقترحة
                      </h3>

                      <div className="mt-5 grid gap-4 md:grid-cols-3">
                        {products.map((product) => (
                          <article
                            key={product.id}
                            className="flex min-h-[220px] flex-col rounded-[20px] border border-[#c8f33f]/20 bg-[#082319]/80 p-4"
                          >
                            <div className="grid h-14 w-14 place-items-center rounded-2xl border border-[#c8f33f]/25 bg-[#c8f33f]/10 text-[#c8f33f]">
                              <Leaf size={26} />
                            </div>

                            <h4 className="mt-4 text-lg font-black text-white">
                              {product.nameAr}
                            </h4>

                            <p className="mt-2 flex-1 text-xs leading-6 text-white/55">
                              {product.reason ||
                                product.benefits?.[0] ||
                                product.composition ||
                                "منتج ArtVert مناسب للحالة وفق البيانات المنشورة."}
                            </p>

                            {product.slug ? (
                              <Link
                                href={`/products/${product.slug}`}
                                className="mt-4 flex min-h-11 items-center justify-center rounded-xl bg-[#c8f33f] px-4 text-sm font-black text-[#102014]"
                              >
                                عرض المنتج
                              </Link>
                            ) : null}
                          </article>
                        ))}
                      </div>
                    </section>
                  )}

                  <section className="grid gap-4 md:grid-cols-2">
                    {followUpQuestion && (
                      <div className="rounded-[24px] border border-white/10 bg-black/15 p-5">
                        <h3 className="flex items-center gap-2 text-lg font-black text-white">
                          <ClipboardList
                            size={20}
                            className="text-[#c8f33f]"
                          />
                          سؤال المتابعة
                        </h3>

                        <p className="mt-4 text-sm leading-8 text-white/70">
                          {followUpQuestion}
                        </p>
                      </div>
                    )}

                    {warning && (
                      <div className="rounded-[24px] border border-white/10 bg-black/15 p-5">
                        <h3 className="flex items-center gap-2 text-lg font-black text-white">
                          <Lightbulb size={20} className="text-[#c8f33f]" />
                          نصيحة
                        </h3>

                        <p className="mt-4 text-sm leading-8 text-white/70">
                          {warning}
                        </p>
                      </div>
                    )}
                  </section>
                </div>
              )}
            </div>

            <div className="border-t border-white/10 bg-[#03170f]/92 p-3 sm:p-4">
              {imagePreview && (
                <div className="mb-3 flex items-center justify-between rounded-2xl border border-[#c8f33f]/20 bg-[#c8f33f]/[.06] p-2">
                  <div className="flex items-center gap-3">
                    <img
                      src={imagePreview}
                      alt="معاينة الصورة"
                      className="h-14 w-14 rounded-xl object-cover"
                    />

                    <div>
                      <p className="text-xs font-black text-white">
                        صورة جاهزة للإرسال
                      </p>
                      <p className="mt-1 text-[10px] text-white/45">
                        سيتم تحليلها مع رسالتك
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={removeImage}
                    className="grid h-9 w-9 place-items-center rounded-lg border border-rose-300/20 bg-rose-400/10 text-rose-200"
                    aria-label="حذف الصورة"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              <div className="flex items-stretch gap-2 rounded-[22px] border border-white/10 bg-black/25 p-2">
                <label className="grid h-14 w-14 shrink-0 cursor-pointer place-items-center rounded-2xl border border-white/10 bg-white/[.035] text-white transition hover:border-[#c8f33f]/45 hover:text-[#c8f33f]">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      void chooseImage(event.target.files?.[0])
                    }
                    disabled={isRequestPending || imageUploading}
                    className="sr-only"
                  />
                  {imageUploading ? (
                    <Loader2 size={21} className="animate-spin" />
                  ) : (
                    <ImageIcon size={21} />
                  )}
                </label>

                <button
                  type="button"
                  onClick={() => setRecording((current) => !current)}
                  className={[
                    "grid h-14 w-14 shrink-0 place-items-center rounded-2xl border transition",
                    recording
                      ? "border-rose-300/35 bg-rose-400/15 text-rose-200"
                      : "border-white/10 bg-white/[.035] text-white hover:border-[#c8f33f]/45 hover:text-[#c8f33f]",
                  ].join(" ")}
                  aria-label="تسجيل صوتي"
                >
                  <Mic size={21} className={recording ? "animate-pulse" : ""} />
                </button>

                <input
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      sendCurrentMessage();
                    }
                  }}
                  placeholder="اكتب رسالتك هنا..."
                  className="min-w-0 flex-1 bg-transparent px-3 text-sm text-white outline-none placeholder:text-white/35"
                />

                <button
                  type="button"
                  onClick={sendCurrentMessage}
                  disabled={!canSend || isRequestPending || imageUploading}
                  className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#c8f33f] text-[#102014] shadow-[0_0_18px_rgba(200,243,63,.22)] disabled:cursor-not-allowed disabled:opacity-35"
                  aria-label="إرسال"
                >
                  {isRequestPending ? (
                    <Loader2 size={21} className="animate-spin" />
                  ) : (
                    <Send size={21} className="-rotate-180" />
                  )}
                </button>
              </div>
            </div>
          </section>

          <aside className="flex min-h-[760px] flex-col overflow-hidden rounded-[28px] border border-[#9fbd35]/25 bg-[#041a10]/92 shadow-[0_24px_80px_rgba(0,0,0,.24)] backdrop-blur-xl">
            <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <p className="text-xs font-black text-[#c8f33f]">
                  كل الرسائل في جانب واحد
                </p>
                <h2 className="mt-1 text-xl font-black text-white">
                  المحادثة
                </h2>
              </div>

              <button
                type="button"
                onClick={resetConversation}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-3 text-xs font-black text-white transition hover:border-[#c8f33f]/45 hover:text-[#c8f33f]"
              >
                <Plus size={16} />
                محادثة جديدة
              </button>
            </header>

            <div
              ref={chatScrollRef}
              className="min-h-0 flex-1 overflow-y-auto px-4 py-5"
            >
              <div className="space-y-4">
                <article className="rounded-[20px] border border-white/10 bg-[#082319]/80 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="grid h-8 w-8 place-items-center rounded-full border border-[#c8f33f]/30 bg-[#c8f33f]/10 text-[#c8f33f]">
                        <Bot size={15} />
                      </span>
                      <span className="text-xs font-black text-[#c8f33f]">
                        دكتور ArtVert
                      </span>
                    </div>

                    <span className="text-[10px] text-white/35">
                      الآن
                    </span>
                  </div>

                  <p className="mt-3 text-sm leading-7 text-white/75">
                    أهلاً بك، اكتب مشكلتك أو ارفع صورة للنبات وسأساعدك في
                    التشخيص والعلاج.
                  </p>
                </article>

                {transcript.map((item) => {
                  const isUser = item.role === "user";

                  return (
                    <article
                      key={item.id}
                      className={[
                        "rounded-[20px] border p-4",
                        isUser
                          ? "border-[#c8f33f]/25 bg-[#143b25]/90"
                          : "border-white/10 bg-[#082319]/80",
                      ].join(" ")}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={[
                              "grid h-8 w-8 place-items-center rounded-full border",
                              isUser
                                ? "border-white/20 bg-white/10 text-white"
                                : "border-[#c8f33f]/30 bg-[#c8f33f]/10 text-[#c8f33f]",
                            ].join(" ")}
                          >
                            {isUser ? <User size={15} /> : <Bot size={15} />}
                          </span>

                          <span
                            className={[
                              "text-xs font-black",
                              isUser ? "text-white" : "text-[#c8f33f]",
                            ].join(" ")}
                          >
                            {isUser ? "أنت" : "دكتور ArtVert"}
                          </span>
                        </div>

                        <span className="text-[10px] text-white/35">
                          {timeLabel(item.createdAt)}
                        </span>
                      </div>

                      {item.imageUrl && (
                        <button
                          type="button"
                          onClick={() => setZoomedImage(item.imageUrl)}
                          className="mt-3 block overflow-hidden rounded-2xl border border-white/10"
                        >
                          <img
                            src={item.imageUrl}
                            alt="صورة النبات"
                            className="max-h-52 w-full object-contain"
                          />
                        </button>
                      )}

                      <p className="mt-3 whitespace-pre-line text-sm leading-7 text-white/75">
                        {item.text}
                      </p>
                    </article>
                  );
                })}

                {isRequestPending && (
                  <article className="rounded-[20px] border border-white/10 bg-[#082319]/80 p-4">
                    <div className="flex items-center gap-3">
                      <Loader2 size={17} className="animate-spin text-[#c8f33f]" />
                      <span className="text-xs font-black text-white/65">
                        دكتور ArtVert بيحلل الحالة...
                      </span>
                    </div>
                  </article>
                )}
              </div>
            </div>

            <div className="border-t border-white/10 p-4">
              <div className="rounded-[20px] border border-[#c8f33f]/20 bg-[#c8f33f]/[.05] p-4">
                <div className="flex items-center gap-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-[#c8f33f]/25 bg-[#082319]">
                    <Image
                      src="/doctor/artvert-doctor.png"
                      alt="دكتور ArtVert"
                      fill
                      priority
                      sizes="56px"
                      className="object-contain object-bottom"
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-black text-white">
                        دكتور ArtVert AI
                      </p>
                      <CheckCircle2 size={15} className="text-[#c8f33f]" />
                    </div>
                    <p className="mt-1 text-[11px] text-white/45">
                      مساعدك الزراعي الذكي — متاح الآن
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {zoomedImage && (
        <div
          className="fixed inset-0 z-[120] grid place-items-center bg-black/88 p-4 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label="معاينة صورة النبات"
          onClick={() => setZoomedImage(undefined)}
        >
          <button
            type="button"
            onClick={() => setZoomedImage(undefined)}
            className="absolute left-4 top-4 grid h-11 w-11 place-items-center rounded-xl border border-white/15 bg-black/55 text-white"
            aria-label="إغلاق الصورة"
          >
            <X size={21} />
          </button>

          <img
            src={zoomedImage}
            alt="صورة النبات بالحجم الكبير"
            className="max-h-[88dvh] max-w-[94vw] rounded-2xl border border-white/15 object-contain shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </main>
  );
}
