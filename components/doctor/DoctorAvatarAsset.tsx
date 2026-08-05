"use client";

import Image from "next/image";

import type { DoctorAvatarState } from "./DoctorAvatarState";
import { doctorStateLabel } from "./DoctorAvatarState";

type Props = {
  state: DoctorAvatarState;
  compact?: boolean;
  className?: string;
};

export function DoctorAvatarAsset({
  state,
  compact = false,
  className = "",
}: Props) {
  const waving = state === "WELCOME" || state === "WAVING";
  const thinking = state === "THINKING";
  const asking = state === "ASKING";
  const diagnosisReady = state === "DIAGNOSIS_READY";

  const warning =
    state === "WARNING" ||
    state === "UNAVAILABLE" ||
    state === "SESSION_EXPIRED";

  const unavailable =
    state === "UNAVAILABLE" ||
    state === "SESSION_EXPIRED";

  return (
    <div
      className={[
        "relative select-none",
        compact
          ? "w-24 sm:w-28"
          : "w-full max-w-[520px]",
        unavailable ? "opacity-80 grayscale-[20%]" : "",
        className,
      ].join(" ")}
      aria-label={doctorStateLabel[state]}
      role="img"
      data-doctor-state={state}
    >
      <span
        className="sr-only"
        aria-live="polite"
      >
        {doctorStateLabel[state]}
      </span>

      <div
        className={[
          "relative mx-auto",
          compact
            ? "aspect-[3/4] w-full"
            : "aspect-[520/720] w-full",
          waving ? "doctor-welcome" : "",
          thinking ? "doctor-thinking" : "",
          asking ? "doctor-asking" : "",
          diagnosisReady ? "doctor-ready" : "",
        ].join(" ")}
      >
        <div
          className="absolute bottom-[1%] left-1/2 h-[5%] w-[72%] -translate-x-1/2 rounded-[50%] bg-black/65 blur-xl"
          aria-hidden="true"
        />

        <div className="doctor-breathe absolute inset-0">
          <Image
            src="/images/artvert-doctor-approved.png"
            alt=""
            fill
            priority={!compact}
            sizes={
              compact
                ? "112px"
                : "(max-width: 640px) 320px, 520px"
            }
            className="object-contain object-bottom drop-shadow-[0_30px_34px_rgba(0,0,0,.5)]"
          />
        </div>

        {thinking && (
          <div
            className="absolute right-[7%] top-[10%] flex items-end gap-1"
            aria-hidden="true"
          >
            <span className="doctor-thinking-dot h-2 w-2 rounded-full bg-lime-300" />
            <span className="doctor-thinking-dot h-3 w-3 rounded-full bg-lime-300/85" />
            <span className="doctor-thinking-dot h-5 w-5 rounded-full bg-lime-300/70" />
          </div>
        )}

        {asking && !compact && (
          <div
            className="absolute right-[2%] top-[10%] max-w-[190px] rounded-2xl border border-white/15 bg-[#07150a]/92 px-4 py-3 text-right text-xs leading-6 text-white shadow-xl backdrop-blur-md"
            dir="rtl"
          >
            احكي لي الأعراض أو ارفع صورة للنبات.
          </div>
        )}

        {diagnosisReady && (
          <div
            className="absolute right-[6%] top-[11%] grid h-12 w-12 place-items-center rounded-full border border-lime-200/50 bg-lime-300 text-xl font-black text-[#09210f] shadow-[0_0_30px_rgba(177,255,48,.35)]"
            aria-hidden="true"
          >
            ✓
          </div>
        )}

        {warning && (
          <div
            className="absolute right-[6%] top-[11%] grid h-12 w-12 place-items-center rounded-full border border-amber-200/60 bg-amber-400 text-xl font-black text-[#201504] shadow-[0_0_28px_rgba(251,191,36,.3)]"
            aria-hidden="true"
          >
            !
          </div>
        )}

        {unavailable && !compact && (
          <div
            className="absolute inset-x-[8%] bottom-[7%] rounded-2xl border border-amber-300/30 bg-[#130f06]/92 px-4 py-3 text-center text-xs font-bold text-amber-100 shadow-xl backdrop-blur"
            dir="rtl"
          >
            الدكتور غير متاح مؤقتًا، حاول مرة أخرى.
          </div>
        )}
      </div>

      <style jsx>{`
        .doctor-breathe {
          transform-origin: center bottom;
          animation: doctor-breathe 4.2s ease-in-out infinite;
        }

        .doctor-welcome {
          animation: doctor-welcome 0.9s ease-out both;
        }

        .doctor-thinking {
          animation: doctor-thinking 2.2s ease-in-out infinite;
        }

        .doctor-thinking-dot {
          animation: doctor-dot 1.15s ease-in-out infinite;
        }

        .doctor-thinking-dot:nth-child(2) {
          animation-delay: 0.15s;
        }

        .doctor-thinking-dot:nth-child(3) {
          animation-delay: 0.3s;
        }

        .doctor-asking {
          animation: doctor-asking 2.6s ease-in-out infinite;
        }

        .doctor-ready {
          animation: doctor-ready 0.7s ease-out both;
        }

        @keyframes doctor-breathe {
          0%,
          100% {
            transform: translateY(0) scale(1);
          }

          50% {
            transform: translateY(-5px) scale(1.008);
          }
        }

        @keyframes doctor-welcome {
          0% {
            opacity: 0;
            transform: translateY(22px) scale(0.97);
          }

          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes doctor-thinking {
          0%,
          100% {
            transform: rotate(0deg);
          }

          50% {
            transform: rotate(-1deg);
          }
        }

        @keyframes doctor-dot {
          0%,
          100% {
            opacity: 0.35;
            transform: translateY(0);
          }

          50% {
            opacity: 1;
            transform: translateY(-5px);
          }
        }

        @keyframes doctor-asking {
          0%,
          100% {
            transform: translateX(0);
          }

          50% {
            transform: translateX(4px);
          }
        }

        @keyframes doctor-ready {
          0% {
            opacity: 0;
            transform: scale(0.94);
          }

          70% {
            transform: scale(1.02);
          }

          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .doctor-breathe,
          .doctor-welcome,
          .doctor-thinking,
          .doctor-thinking-dot,
          .doctor-asking,
          .doctor-ready {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}