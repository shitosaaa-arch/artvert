"use client";

import { useState } from "react";

import type { DoctorAnswer, DoctorQuestion } from "@/lib/doctor/chat-contract";

type Props = { question: DoctorQuestion; disabled?: boolean; onSubmit: (questionId: string, answer: DoctorAnswer, summary: string) => void };

export function FollowUpQuestionCard({ question, disabled = false, onSubmit }: Props) {
  const [text, setText] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const options = question.answerShape === "boolean" ? ["نعم", "لا"] : question.options ?? [];
  const isText = question.answerShape === "text";
  const valid = isText ? Boolean(text.trim()) : selected.length > 0;

  function choose(option: string) {
    if (submitted || disabled) return;
    if (question.answerShape === "multiple_choice") {
      setSelected((current) => current.includes(option) ? current.filter((item) => item !== option) : [...current, option]);
      return;
    }
    setSelected([option]);
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!valid || submitted || disabled) return;
    const answer = isText ? text.trim() : question.answerShape === "multiple_choice" ? selected : selected[0]!;
    setSubmitted(true);
    onSubmit(question.id, answer, isText ? text.trim() : selected.join("، "));
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-lime-500/30 bg-lime-100/10 p-5" aria-labelledby={`question-${question.id}`}>
      <p id={`question-${question.id}`} className="font-bold text-lime-200">{question.prompt}</p>
      <p className="mt-2 text-sm leading-6 text-green-50/75">لماذا نسأل؟ {question.why}</p>
      {isText ? (
        <label className="mt-4 block text-sm text-green-50/90">
          <span className="sr-only">إجابتك</span>
          <input value={text} onChange={(event) => setText(event.target.value)} disabled={disabled || submitted} maxLength={300} className="mt-2 w-full rounded-xl border border-green-400/35 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-lime-300 focus:ring-2 focus:ring-lime-300/50 disabled:opacity-60" />
        </label>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2" role={question.answerShape === "multiple_choice" ? "group" : "radiogroup"} aria-label={question.prompt}>
          {options.map((option) => {
            const active = selected.includes(option);
            return <button key={option} type="button" onClick={() => choose(option)} disabled={disabled || submitted} aria-pressed={question.answerShape === "multiple_choice" ? active : undefined} aria-checked={question.answerShape !== "multiple_choice" ? active : undefined} role={question.answerShape !== "multiple_choice" ? "radio" : undefined} className={`rounded-xl border px-4 py-2 text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-200 disabled:opacity-60 ${active ? "border-lime-300 bg-lime-300 text-[#122015]" : "border-green-300/40 bg-black/10 text-green-50 hover:bg-green-800/50"}`}>{option}</button>;
          })}
        </div>
      )}
      <button type="submit" disabled={!valid || disabled || submitted} className="mt-4 rounded-xl bg-lime-300 px-5 py-3 font-black text-[#122015] transition hover:bg-lime-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-100 disabled:cursor-not-allowed disabled:opacity-50">{submitted ? "تم إرسال الإجابة" : "إرسال الإجابة"}</button>
    </form>
  );
}
