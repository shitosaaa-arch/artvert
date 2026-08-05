"use client";

import {
  motion,
  useReducedMotion,
} from "framer-motion";

export type DoctorAvatarState =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "success";

type Props = {
  state?: DoctorAvatarState;
  compact?: boolean;
  className?: string;
};

const stateCopy: Record<
  DoctorAvatarState,
  string
> = {
  idle: "جاهز أساعدك",
  listening: "سامعك",
  thinking: "براجع الحالة",
  speaking: "بشرحلك",
  success: "وصلنا للنتيجة",
};

export function DoctorAvatarLive({
  state = "idle",
  compact = false,
  className = "",
}: Props) {
  const reduceMotion =
    useReducedMotion();

  const animate =
    reduceMotion
      ? undefined
      : {
          y:
            state === "thinking"
              ? [0, -3, 0]
              : [0, -6, 0],
          rotate:
            state === "speaking"
              ? [0, -1, 1, 0]
              : [0, 0.6, 0],
        };

  return (
    <section
      className={[
        "relative isolate overflow-hidden rounded-[2rem] border border-white/10",
        "bg-[radial-gradient(circle_at_50%_15%,rgba(190,242,100,0.18),transparent_34%),linear-gradient(160deg,#112018_0%,#08110d_72%)]",
        "shadow-[0_30px_90px_rgba(0,0,0,0.36)]",
        compact
          ? "min-h-[220px]"
          : "min-h-[340px]",
        className,
      ].join(" ")}
      aria-label={`دكتور ArtVert AI - ${stateCopy[state]}`}
    >
      <div className="absolute inset-0 opacity-50">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full border border-lime-300/20" />
        <div className="absolute -left-10 bottom-6 h-28 w-28 rounded-full border border-emerald-300/10" />
        <div className="absolute inset-x-8 bottom-8 h-px bg-gradient-to-r from-transparent via-lime-300/30 to-transparent" />
      </div>

      <div className="absolute left-4 top-4 z-20 flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-2 backdrop-blur-xl">
        <span
          className={[
            "h-2.5 w-2.5 rounded-full",
            state === "thinking"
              ? "bg-amber-300"
              : state === "success"
                ? "bg-emerald-300"
                : "bg-lime-300",
            state === "speaking" ||
            state === "listening"
              ? "animate-pulse"
              : "",
          ].join(" ")}
        />

        <span className="text-xs font-black text-white/85">
          {stateCopy[state]}
        </span>
      </div>

      <motion.div
        className="absolute inset-x-0 bottom-0 flex justify-center"
        animate={animate}
        transition={{
          duration:
            state === "speaking"
              ? 1
              : 3.8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <svg
          viewBox="0 0 420 420"
          className={
            compact
              ? "w-[245px]"
              : "w-[340px]"
          }
          role="img"
          aria-label="شخصية دكتور ArtVert AI"
        >
          <defs>
            <linearGradient
              id="coat"
              x1="0"
              y1="0"
              x2="1"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="#ffffff"
              />
              <stop
                offset="100%"
                stopColor="#dbe9df"
              />
            </linearGradient>

            <linearGradient
              id="shirt"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="#19392a"
              />
              <stop
                offset="100%"
                stopColor="#0c2419"
              />
            </linearGradient>

            <filter
              id="softShadow"
              x="-30%"
              y="-30%"
              width="160%"
              height="160%"
            >
              <feDropShadow
                dx="0"
                dy="12"
                stdDeviation="12"
                floodColor="#000000"
                floodOpacity=".28"
              />
            </filter>
          </defs>

          <ellipse
            cx="210"
            cy="388"
            rx="120"
            ry="18"
            fill="#000"
            opacity=".2"
          />

          <g filter="url(#softShadow)">
            <path
              d="M135 255C139 213 170 190 210 190C250 190 281 213 285 255L315 394H105L135 255Z"
              fill="url(#coat)"
            />

            <path
              d="M178 198L210 228L242 198L266 394H154L178 198Z"
              fill="url(#shirt)"
            />

            <path
              d="M178 198L210 228L188 252L158 216L178 198Z"
              fill="#f7fff9"
            />

            <path
              d="M242 198L210 228L232 252L262 216L242 198Z"
              fill="#f7fff9"
            />

            <path
              d="M105 394L132 260C135 238 145 221 160 210L184 394H105Z"
              fill="#f5faf6"
            />

            <path
              d="M315 394L288 260C285 238 275 221 260 210L236 394H315Z"
              fill="#f5faf6"
            />

            <rect
              x="122"
              y="286"
              width="66"
              height="78"
              rx="12"
              fill="#e8f2eb"
              stroke="#b8c9bd"
            />

            <path
              d="M138 306H172"
              stroke="#7ca88a"
              strokeWidth="5"
              strokeLinecap="round"
            />

            <path
              d="M138 320H164"
              stroke="#7ca88a"
              strokeWidth="5"
              strokeLinecap="round"
            />

            <path
              d="M247 292C273 270 300 285 300 315"
              fill="none"
              stroke="#173d2a"
              strokeWidth="7"
              strokeLinecap="round"
            />

            <circle
              cx="300"
              cy="322"
              r="12"
              fill="#dff5e4"
              stroke="#173d2a"
              strokeWidth="6"
            />

            <path
              d="M189 193V169H231V193"
              fill="#c9855d"
            />

            <ellipse
              cx="210"
              cy="122"
              rx="67"
              ry="78"
              fill="#d99569"
            />

            <path
              d="M149 110C151 61 177 35 214 35C253 35 279 64 278 115C260 91 236 78 207 78C186 78 166 89 149 110Z"
              fill="#1b211d"
            />

            <path
              d="M152 116C156 81 178 61 213 61C246 61 268 80 276 112C274 77 255 43 214 43C174 43 153 75 152 116Z"
              fill="#222b25"
            />

            <ellipse
              cx="182"
              cy="128"
              rx="7"
              ry="9"
              fill="#1c241f"
            />

            <ellipse
              cx="238"
              cy="128"
              rx="7"
              ry="9"
              fill="#1c241f"
            />

            <path
              d="M171 111C180 106 190 106 198 111"
              fill="none"
              stroke="#443126"
              strokeWidth="5"
              strokeLinecap="round"
            />

            <path
              d="M222 111C230 106 240 106 249 111"
              fill="none"
              stroke="#443126"
              strokeWidth="5"
              strokeLinecap="round"
            />

            <path
              d="M210 130L203 151H216"
              fill="none"
              stroke="#ad674b"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            <motion.path
              d={
                state === "speaking"
                  ? "M185 164C198 178 222 178 235 164"
                  : state === "success"
                    ? "M184 160C199 177 222 177 236 160"
                    : "M190 165C202 171 218 171 230 165"
              }
              fill="none"
              stroke="#6c392d"
              strokeWidth="5"
              strokeLinecap="round"
              animate={
                reduceMotion
                  ? undefined
                  : state === "speaking"
                    ? {
                        d: [
                          "M190 165C202 171 218 171 230 165",
                          "M185 164C198 178 222 178 235 164",
                          "M190 165C202 171 218 171 230 165",
                        ],
                      }
                    : undefined
              }
              transition={{
                duration: 0.7,
                repeat:
                  state === "speaking"
                    ? Infinity
                    : 0,
              }}
            />

            <path
              d="M167 190C145 195 128 213 122 238"
              fill="none"
              stroke="#173d2a"
              strokeWidth="7"
              strokeLinecap="round"
            />

            <path
              d="M253 190C275 195 292 213 298 238"
              fill="none"
              stroke="#173d2a"
              strokeWidth="7"
              strokeLinecap="round"
            />

            <circle
              cx="122"
              cy="244"
              r="12"
              fill="#dff5e4"
              stroke="#173d2a"
              strokeWidth="6"
            />

            <circle
              cx="298"
              cy="244"
              r="12"
              fill="#dff5e4"
              stroke="#173d2a"
              strokeWidth="6"
            />

            <rect
              x="222"
              y="270"
              width="69"
              height="34"
              rx="10"
              fill="#153522"
            />

            <text
              x="256.5"
              y="291"
              textAnchor="middle"
              fontSize="13"
              fontWeight="800"
              fill="#d9f99d"
            >
              ART VERT
            </text>

            <path
              d="M120 388C134 348 138 318 138 282"
              fill="none"
              stroke="#d3e2d8"
              strokeWidth="4"
            />

            <path
              d="M300 388C286 348 282 318 282 282"
              fill="none"
              stroke="#d3e2d8"
              strokeWidth="4"
            />
          </g>
        </svg>
      </motion.div>

      {state === "thinking" ? (
        <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/10 bg-black/30 px-4 py-2 backdrop-blur-xl">
          {[0, 1, 2].map(
            (index) => (
              <motion.span
                key={index}
                className="h-2 w-2 rounded-full bg-lime-300"
                animate={
                  reduceMotion
                    ? undefined
                    : {
                        y: [0, -5, 0],
                        opacity: [
                          0.45,
                          1,
                          0.45,
                        ],
                      }
                }
                transition={{
                  duration: 0.9,
                  repeat: Infinity,
                  delay:
                    index * 0.15,
                }}
              />
            ),
          )}
        </div>
      ) : null}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#08110d] to-transparent" />
    </section>
  );
}
