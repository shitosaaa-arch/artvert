"use client";

import { useState } from "react";

import type { DoctorAnswer, DoctorQuestion } from "@/lib/doctor/chat-contract";

type Props = {
  question: DoctorQuestion;
  disabled?: boolean;
  onSubmit: (questionId: string, answer: DoctorAnswer, summary: string) => void;
};

const yesNoOptions = ["نعم", "لا"];

export function FollowUpQuestionCard({ question, disabled = false, onSubmit }: Props) {
  const [text, setText] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const isShortText = question.answerShape === "short_text";
  const isMultipleChoice = question.answerShape === "multiple_choice";
  const options = question.answerShape === "yes_no" ? yesNoOptions : question.options ?? [];
  const valid = isShortText ? Boolean(text.trim()) : selected.length > 0;
  const groupName = `doctor-question-${question.id}`;

  function selectOne(option: string) {
    if (!disabled && !submitted) setSelected([option]);
  }

  function toggleOption(option: string) {
    if (disabled || submitted) return;
    setSelected((current) => current.includes(option) ? current.filter((item) => item !== option) : [...current, option]);
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!valid || submitted || disabled) return;
    const answer = isShortText ? text.trim() : isMultipleChoice ? selected : selected[0]!;
    setSubmitted(true);
    onSubmit(question.id, answer, isShortText ? text.trim() : selected.join("، "));
  }

  return <form onSubmit={submit} className="rounded-2xl border border-lime-500/30 bg-lime-100/10 p-5 motion-safe:transition-colors" aria-labelledby={`question-${question.id}`}>
    <p id={`question-${question.id}`} className="font-bold text-lime-200">{question.prompt}</p>
    <p className="mt-2 text-sm leading-6 text-green-50/75">لماذا نسأل؟ {question.why}</p>
    {isShortText ? <label className="mt-4 block text-sm text-green-50/90"><span className="sr-only">إجابتك</span><input value={text} onChange={(event) => setText(event.target.value)} disabled={disabled || submitted} maxLength={300} className="mt-2 w-full rounded-xl border border-green-400/35 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-lime-300 focus:ring-2 focus:ring-lime-300/50 disabled:opacity-60" /></label> : null}
    {question.answerShape === "single_choice" || question.answerShape === "yes_no" ? <fieldset className="mt-4 flex flex-wrap gap-2" dir="rtl"><legend className="sr-only">اختر إجابة واحدة</legend>{options.map((option) => <label key={option} className={`min-h-11 max-w-full cursor-pointer break-words rounded-xl border px-4 py-2 text-sm font-bold transition focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-lime-200 ${selected[0] === option ? "border-lime-300 bg-lime-300 text-[#122015]" : "border-green-300/40 bg-black/10 text-green-50 hover:bg-green-800/50"}`}><input type="radio" name={groupName} value={option} checked={selected[0] === option} onChange={() => selectOne(option)} disabled={disabled || submitted} className="sr-only" />{option}</label>)}</fieldset> : null}
    {isMultipleChoice ? <fieldset className="mt-4 flex flex-wrap gap-2" dir="rtl"><legend className="sr-only">اختر كل الإجابات المناسبة</legend>{options.map((option) => <label key={option} className={`min-h-11 max-w-full cursor-pointer break-words rounded-xl border px-4 py-2 text-sm font-bold transition focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-lime-200 ${selected.includes(option) ? "border-lime-300 bg-lime-300 text-[#122015]" : "border-green-300/40 bg-black/10 text-green-50 hover:bg-green-800/50"}`}><input type="checkbox" value={option} checked={selected.includes(option)} onChange={() => toggleOption(option)} disabled={disabled || submitted} className="sr-only" />{option}</label>)}</fieldset> : null}
    <button type="submit" disabled={!valid || disabled || submitted} className="mt-4 min-h-11 max-w-full rounded-xl bg-lime-300 px-5 py-3 font-black text-[#122015] transition hover:bg-lime-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-100 disabled:cursor-not-allowed disabled:opacity-50">{submitted ? "تم إرسال الإجابة" : "إرسال الإجابة"}</button>
  </form>;
}
