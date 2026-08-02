"use client";

import type { DoctorAvatarState } from "./DoctorAvatarState";
import { doctorStateLabel } from "./DoctorAvatarState";

type Props = { state: DoctorAvatarState; compact?: boolean; className?: string };

export function DoctorAvatarAsset({ state, compact = false, className = "" }: Props) {
  const waving = state === "WELCOME" || state === "WAVING";
  const thinking = state === "THINKING";
  const warning = state === "WARNING" || state === "UNAVAILABLE";

  return (
    <div className={`relative select-none ${compact ? "w-28" : "w-full max-w-[360px]"} ${className}`} aria-label={doctorStateLabel[state]} role="img">
      <span className="sr-only" aria-live="polite">{doctorStateLabel[state]}</span>
      <svg viewBox="0 0 360 510" className="h-auto w-full drop-shadow-[0_25px_28px_rgba(0,0,0,.42)]" aria-hidden="true">
        <defs>
          <linearGradient id="coat" x1="0" x2="1"><stop stopColor="#f7faf4"/><stop offset="1" stopColor="#cfe0d1"/></linearGradient>
          <linearGradient id="shirt" x1="0" x2="1"><stop stopColor="#9ddb30"/><stop offset="1" stopColor="#316f29"/></linearGradient>
        </defs>
        <ellipse cx="181" cy="488" rx="124" ry="14" fill="#07120b" opacity=".45"/>
        <g className="motion-safe:animate-[doctor-breathe_4s_ease-in-out_infinite]">
          <path d="M112 469 L128 288 Q179 254 235 289 L257 469Z" fill="url(#coat)" stroke="#a9c4ad" strokeWidth="3"/>
          <path d="M153 288 L181 368 L212 288 L202 271 L163 271Z" fill="url(#shirt)"/>
          <path d="M128 294 L180 367 L154 408 L114 335Z" fill="white" opacity=".96"/>
          <path d="M233 294 L181 367 L212 408 L250 335Z" fill="white" opacity=".96"/>
          <path d="M177 271 L184 291" stroke="#745134" strokeWidth="8" strokeLinecap="round"/>
          <rect x="198" y="342" width="37" height="13" rx="4" fill="#0b542e"/><text x="216" y="352" textAnchor="middle" fontSize="8" fontWeight="700" fill="white">ARTVERT</text>
          <path d="M124 309 Q89 350 82 425" fill="none" stroke="url(#coat)" strokeWidth="36" strokeLinecap="round"/>
          <path d="M240 309 Q282 342 286 392" fill="none" stroke="url(#coat)" strokeWidth="36" strokeLinecap="round"/>
          <g className={waving ? "origin-[282px_342px] motion-safe:animate-[doctor-wave_1.2s_ease-in-out_infinite]" : ""}>
            <path d="M284 390 Q307 375 310 348" fill="none" stroke="#b9784e" strokeWidth="24" strokeLinecap="round"/>
            <path d="M305 351 q12 -20 20 -3 m-19 5 q22 -17 23 2 m-18 5 q20 -12 20 6" fill="none" stroke="#b9784e" strokeWidth="8" strokeLinecap="round"/>
          </g>
          <path d="M131 255 Q126 205 137 156 Q151 106 184 105 Q222 107 233 157 Q242 209 229 255 Q207 288 179 288 Q151 287 131 255Z" fill="#c98a60"/>
          <path d="M135 183 Q130 117 180 105 Q227 117 232 172 Q210 147 185 148 Q156 148 135 183Z" fill="#172017"/>
          <path d="M159 197 h19 M201 197 h19" stroke="#132019" strokeWidth="7" strokeLinecap="round" className={thinking ? "motion-safe:animate-pulse" : ""}/>
          <path d="M177 230 Q185 238 196 230" stroke="#743f32" strokeWidth="5" fill="none" strokeLinecap="round"/>
          <path d="M139 216 Q150 218 158 214 M202 214 Q214 218 224 214" stroke="#744932" strokeWidth="4" fill="none" strokeLinecap="round"/>
          <path d="M178 238 v18" stroke="#9f6046" strokeWidth="3"/>
          {warning && <circle cx="244" cy="116" r="18" fill="#f6c542"/><text x="244" y="123" textAnchor="middle" fontSize="24" fontWeight="900" fill="#172017">!</text>}
        </g>
      </svg>
    </div>
  );
}
