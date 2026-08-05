"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Bot,
  CheckCircle2,
  Image as ImageIcon,
  Leaf,
  Loader2,
  LogIn,
  Menu,
  Mic,
  Plus,
  Send,
  ShieldCheck,
  ShoppingCart,
  User,
  X,
} from "lucide-react";

import { sendDoctorMessage } from "@/lib/doctor/client";
import type {
  DoctorChatRequest,
  DoctorChatResponse,
  DoctorStatus,
} from "@/lib/doctor/chat-contract";

type ExtendedDoctorChatResponse = DoctorChatResponse & {
  reply?: string;
};

type TranscriptItem = {
  id: string;
  role: "user" | "assistant";
  text: string;
  imageUrl?: string;
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
  if (input.message?.trim()) {
    return input.message.trim();
  }

  if (input.answers) {
    return Object.values(input.answers)
      .flatMap((answer) =>
        Array.isArray(answer) ? answer : [answer],
      )
      .join("، ");
  }

  return "طلب جديد";
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

  const sessionIdRef = useRef<string | undefined>(undefined);
  const requestRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const previewUrlsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
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
        },
      ]);
    },
    [],
  );

  const submitTurn = useCallback(
    async (
      turn: DoctorChatRequest,
      displayImageUrl?: string,
    ) => {
      if (
        isRequestPending ||
        isTerminal(status)
      ) {
        return;
      }

      const controller =
        new AbortController();

      requestRef.current =
        controller;

      setIsRequestPending(true);
      setStatus("thinking");

      setTranscript((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "user",
          text: turnText(turn),
          imageUrl:
            displayImageUrl,
        },
      ]);

      try {
        const result =
          (await sendDoctorMessage(
            turn,
            controller.signal,
          )) as ExtendedDoctorChatResponse;

        if (
          requestRef.current !==
          controller
        ) {
          return;
        }

        if (result.sessionId) {
          sessionIdRef.current =
            result.sessionId;
          setSessionId(
            result.sessionId,
          );
        }

        setStatus(result.status);
        appendAssistant(result);
      } catch (error) {
        if (
          controller.signal.aborted
        ) {
          return;
        }

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
          },
        ]);
      } finally {
        if (
          requestRef.current ===
          controller
        ) {
          requestRef.current =
            null;

          setIsRequestPending(
            false,
          );
        }
      }
    },
    [
      appendAssistant,
      isRequestPending,
      status,
    ],
  );

  async function chooseImage(
    file: File | undefined,
  ) {
    if (
      !file ||
      isRequestPending ||
      imageUploading
    ) {
      return;
    }

    setImageUploading(true);

    const preview =
      URL.createObjectURL(file);

    previewUrlsRef.current.add(
      preview,
    );

    setImagePreview(preview);

    async function upload(
      activeSessionId?: string,
      fileToUpload?: File,
    ) {
      const body =
        new FormData();

      if (activeSessionId) {
        body.set(
          "sessionId",
          activeSessionId,
        );
      }

      // ensure we use a defined File when adding to FormData
      if (fileToUpload) {
        body.set("image", fileToUpload);
      }

      const response =
        await fetch(
          "/api/doctor/images",
          {
            method: "POST",
            body,
          },
        );

      const result =
        (await response.json()) as ImageUploadResponse;

      return {
        response,
        result,
      };
    }

    try {
      const activeSessionId =
        sessionIdRef.current ??
        sessionId;

      let {
        response,
        result,
      } = await upload(
        activeSessionId,
        file,
      );

      if (
        response.status ===
          409 ||
        result.status ===
          "session_expired"
      ) {
        sessionIdRef.current =
          undefined;

        setSessionId(undefined);

        ({
          response,
          result,
        } = await upload(undefined, file));
      }

      if (
        !response.ok ||
        !result.imageRef ||
        !result.sessionId
      ) {
        throw new Error(
          result.error ||
            "تعذر رفع الصورة.",
        );
      }

      setImageRef(
        result.imageRef,
      );

      sessionIdRef.current =
        result.sessionId;

      setSessionId(
        result.sessionId,
      );
    } catch (error) {
      URL.revokeObjectURL(
        preview,
      );

      previewUrlsRef.current.delete(
        preview,
      );

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
        },
      ]);
    } finally {
      setImageUploading(false);
    }
  }

  function removeImage() {
    if (imagePreview) {
      URL.revokeObjectURL(
        imagePreview,
      );

      previewUrlsRef.current.delete(
        imagePreview,
      );
    }

    setImagePreview(undefined);
    setImageRef(undefined);
  }

  function sendCurrentMessage() {
    const trimmed =
      message.trim();

    if (
      (!trimmed &&
        !imageRef) ||
      isRequestPending ||
      imageUploading ||
      isTerminal(status)
    ) {
      return;
    }

    const displayImageUrl =
      imagePreview;

    setMessage("");
    setImageRef(undefined);
    setImagePreview(undefined);

    void submitTurn(
      {
        message:
          trimmed ||
          "حلل صورة النبات المرفوعة وساعدني في معرفة المشكلة.",
        imageRef,
        sessionId:
          sessionIdRef.current ??
          sessionId,
      },
      displayImageUrl,
    );
  }

  function resetConversation() {
    requestRef.current?.abort();
    requestRef.current = null;

    for (
      const url of
        previewUrlsRef.current
    ) {
      URL.revokeObjectURL(url);
    }

    previewUrlsRef.current.clear();

    setTranscript([]);
    sessionIdRef.current =
      undefined;

    setSessionId(undefined);
    setStatus("welcome");
    setMessage("");
    setImageRef(undefined);
    setImagePreview(undefined);
    setImageUploading(false);
    setIsRequestPending(false);
    setRecording(false);
  }

  const canSend =
    Boolean(message.trim()) ||
    Boolean(imageRef);

  return (
    <main
      dir="rtl"
      className="min-h-[100dvh] bg-[#03130c] px-3 py-3 text-white sm:px-4"
    >
      <div className="mx-auto flex min-h-[calc(100dvh-24px)] max-w-[1500px] flex-col overflow-hidden rounded-[28px] border border-[#a5c42e]/35 bg-[linear-gradient(145deg,#03170f,#05261a)] shadow-[0_25px_80px_rgba(0,0,0,.35)]">
        <header className="border-b border-[#a5c42e]/25 bg-[#02110b]/85">
          <div className="flex min-h-[78px] items-center justify-between px-5 sm:px-8">
            <Link
              href="/"
              className="flex items-center gap-2"
              dir="ltr"
            >
              <div className="leading-none">
                <span className="text-3xl font-black text-[#c8f33f]">
                  ArtVert
                </span>
                <span className="mt-1 block text-center text-sm font-black text-white">
                  Egypt
                </span>
              </div>

              <Leaf
                size={34}
                className="text-[#c8f33f]"
              />
            </Link>

            <nav className="hidden items-center gap-8 text-sm font-black text-white/85 lg:flex">
              <Link href="/">
                الرئيسية
              </Link>

              <Link href="/plant-care">
                الرعاية والحماية
              </Link>

              <Link href="/doctor">
                الرعاية والتشخيص
              </Link>

              <Link href="/blog">
                المدونة
              </Link>

              <Link href="/about">
                من نحن
              </Link>

              <Link
                href="/contact"
                className="rounded-xl border border-[#c8f33f]/35 px-5 py-3"
              >
                تواصل معنا
              </Link>
            </nav>
          </div>

          <div className="flex items-center justify-between border-t border-white/[.05] px-5 py-3 sm:px-8">
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="hidden min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[.03] px-4 text-sm font-black sm:flex"
              >
                تسجيل الدخول
                <LogIn size={17} />
              </Link>

              <button className="hidden h-11 rounded-xl border border-white/10 bg-white/[.03] px-4 text-sm font-black sm:block">
                AR
              </button>

              <Link
                href="/cart"
                className="relative grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/[.03]"
              >
                <ShoppingCart size={18} />

                <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-[#c8f33f] text-[10px] font-black text-[#102014]">
                  0
                </span>
              </Link>

              <Link
                href="/products"
                className="flex min-h-11 items-center rounded-xl bg-[#c8f33f] px-5 text-sm font-black text-[#102014] shadow-[0_0_20px_rgba(200,243,63,.2)]"
              >
                تسوق الآن
              </Link>

              <button className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/[.03]">
                <Menu size={20} />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <Leaf
                size={27}
                className="text-[#c8f33f]"
              />

              <div
                className="leading-none"
                dir="ltr"
              >
                <span className="text-xl font-black text-white">
                  ART
                  <span className="text-[#c8f33f]">
                    VERT
                  </span>
                </span>

                <span className="mt-1 block text-center text-[9px] font-black tracking-[.3em] text-[#c8f33f]">
                  EGYPT
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 gap-3 p-3 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="flex min-h-[680px] flex-col overflow-hidden rounded-[24px] border border-[#a5c42e]/25 bg-[#031b11]/80">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <h1 className="text-2xl font-black text-[#c8f33f]">
                  اسأل دكتور ArtVert
                </h1>

                <p className="mt-1 text-sm text-white/60">
                  المهندس الزراعي الذكي
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-black text-white/75">
                <span className="h-2.5 w-2.5 rounded-full bg-[#65ff5b]" />
                أنت تتحدث مع دكتور ArtVert
              </div>
            </div>

            <div
              ref={scrollRef}
              className="min-h-0 flex-1 overflow-y-auto px-5 py-6"
            >
              <div className="space-y-5">
                <div className="flex justify-end">
                  <div className="max-w-[76%] rounded-[22px] border border-[#a5c42e]/20 bg-[linear-gradient(145deg,rgba(47,81,57,.65),rgba(17,50,33,.65))] px-5 py-4 text-sm leading-8 text-white/80">
                    <p className="font-black text-[#c8f33f]">
                      مرحبًا بك! أنا دكتور آرت فيرت.
                    </p>

                    <p className="mt-2">
                      اسألني عن أي مشكلة في نباتك، وسأساعدك في التشخيص والعلاج خطوة بخطوة لأفضل نتائج.
                    </p>
                  </div>
                </div>

                {transcript.map((item) => {
                  const isUser =
                    item.role ===
                    "user";

                  return (
                    <div
                      key={item.id}
                      className={[
                        "flex items-start gap-3",
                        isUser
                          ? "justify-start"
                          : "justify-end",
                      ].join(" ")}
                    >
                      {isUser && (
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/15 bg-white/[.05]">
                          <User size={18} />
                        </div>
                      )}

                      <div
                        className={[
                          "max-w-[78%] rounded-[22px] border px-5 py-4 text-sm leading-8",
                          isUser
                            ? "border-white/10 bg-[#0c2a1d] text-white/85"
                            : "border-[#a5c42e]/20 bg-[linear-gradient(145deg,rgba(47,81,57,.65),rgba(17,50,33,.65))] text-white/80",
                        ].join(" ")}
                      >
                        {item.imageUrl && (
                          <img
                            src={
                              item.imageUrl
                            }
                            alt="صورة النبات"
                            className="mb-3 max-h-64 w-full rounded-2xl object-contain"
                          />
                        )}

                        <div className="whitespace-pre-line">
                          {item.text}
                        </div>
                      </div>

                      {!isUser && (
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#c8f33f]/25 bg-[#c8f33f]/10 text-[#c8f33f]">
                          <Leaf size={18} />
                        </div>
                      )}
                    </div>
                  );
                })}

                {isRequestPending && (
                  <div className="flex justify-end">
                    <div className="flex items-center gap-3 rounded-[20px] border border-[#a5c42e]/20 bg-[#123621] px-4 py-3">
                      <Loader2
                        size={17}
                        className="animate-spin text-[#c8f33f]"
                      />

                      <span className="text-sm text-white/60">
                        دكتور ArtVert بيجهز الرد...
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-white/10 p-4">
              {imagePreview && (
                <div className="mb-3 flex items-center justify-between rounded-2xl border border-[#c8f33f]/20 bg-[#c8f33f]/[.05] p-2">
                  <img
                    src={imagePreview}
                    alt="معاينة الصورة"
                    className="h-14 w-14 rounded-xl object-cover"
                  />

                  <button
                    type="button"
                    onClick={removeImage}
                    className="grid h-9 w-9 place-items-center rounded-xl border border-rose-300/20 bg-rose-400/10 text-rose-200"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              <div className="rounded-[24px] border border-[#c8f33f]/30 bg-[#02150d] p-3 shadow-[0_0_24px_rgba(200,243,63,.08)]">
                <div className="flex items-center gap-3">
                  <label className="flex min-h-[74px] w-[105px] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-[#c8f33f]/25 text-[#c8f33f]">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) =>
                        void chooseImage(
                          event.target.files?.[0],
                        )
                      }
                      disabled={
                        isRequestPending ||
                        imageUploading
                      }
                      className="sr-only"
                    />

                    {imageUploading ? (
                      <Loader2
                        size={24}
                        className="animate-spin"
                      />
                    ) : (
                      <ImageIcon size={24} />
                    )}

                    <span className="text-xs font-black text-white">
                      تحميل صورة
                    </span>
                  </label>

                  <button
                    type="button"
                    onClick={() =>
                      setRecording(
                        (current) =>
                          !current,
                      )
                    }
                    className={[
                      "flex min-h-[74px] w-[105px] flex-col items-center justify-center gap-2 rounded-2xl border",
                      recording
                        ? "border-rose-300/30 bg-rose-400/10 text-rose-200"
                        : "border-[#c8f33f]/25 text-[#c8f33f]",
                    ].join(" ")}
                  >
                    <Mic
                      size={24}
                      className={
                        recording
                          ? "animate-pulse"
                          : ""
                      }
                    />

                    <span className="text-xs font-black text-white">
                      تسجيل صوتي
                    </span>
                  </button>

                  <div className="flex min-w-0 flex-1 items-center rounded-2xl border border-white/10 bg-white/[.025] px-4">
                    <input
                      value={message}
                      onChange={(event) =>
                        setMessage(
                          event.target.value,
                        )
                      }
                      onKeyDown={(event) => {
                        if (
                          event.key ===
                            "Enter" &&
                          !event.shiftKey
                        ) {
                          event.preventDefault();
                          sendCurrentMessage();
                        }
                      }}
                      placeholder="اكتب هنا واسأل عن مشكلتك..."
                      className="min-w-0 flex-1 bg-transparent py-5 text-sm text-white outline-none placeholder:text-white/35"
                    />

                    <button
                      type="button"
                      onClick={
                        sendCurrentMessage
                      }
                      disabled={
                        !canSend ||
                        isRequestPending ||
                        imageUploading
                      }
                      className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-[#c8f33f]/35 bg-[#718b25] text-white disabled:opacity-40"
                    >
                      <Send
                        size={21}
                        className="-rotate-180"
                      />
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={resetConversation}
                    className="inline-flex items-center gap-2 text-sm font-black text-white/75"
                  >
                    <Plus size={18} />
                    محادثة جديدة
                  </button>
                </div>
              </div>
            </div>
          </section>

          <aside className="flex min-h-[680px] flex-col overflow-hidden rounded-[24px] border border-[#a5c42e]/30 bg-[#031b11]/85">
            <div className="border-b border-white/10 px-5 py-4 text-center">
              <h2 className="text-2xl font-black text-[#c8f33f]">
                دكتور ArtVert
              </h2>

              <p className="mt-1 text-sm text-white/70">
                المهندس الزراعي الذكي
              </p>
            </div>

            <div className="relative mx-auto mt-4 h-[300px] w-full max-w-[320px]">
              <Image
                src="/doctor/artvert-doctor.png"
                alt="دكتور ArtVert"
                fill
                priority
                sizes="320px"
                className="object-contain object-bottom"
              />
            </div>

            <div className="px-5 pb-5">
              <div className="rounded-xl border border-[#a5c42e]/20 bg-[#0b2b1c] px-4 py-3 text-center">
                <p className="text-sm leading-7 text-white/75">
                  تحدث مع أذكى مهندس زراعي في الوطن العربي، جاهز لمساعدتك 24/7.
                </p>
              </div>

              <button
                type="button"
                onClick={resetConversation}
                className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[.04] text-sm font-black"
              >
                <Bot size={18} />
                محادثة جديدة
              </button>

              <div className="mt-3 space-y-2">
                <div className="rounded-xl border border-[#a5c42e]/20 bg-[#0b2b1c] p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-black text-white">
                        أكثر من 10,000 مزارع
                      </p>
                      <p className="mt-1 text-xs text-[#c8f33f]">
                        يثقون بخبرتنا
                      </p>
                    </div>

                    <ShieldCheck
                      size={26}
                      className="text-[#c8f33f]"
                    />
                  </div>

                  <p className="mt-2 tracking-[.18em] text-[#c8f33f]">
                    ★★★★★
                  </p>
                </div>

                <div className="rounded-xl border border-[#a5c42e]/20 bg-[#0b2b1c] p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-black text-white">
                        جودة مضمونة
                      </p>
                      <p className="mt-1 text-xs text-white/55">
                        منتجات عالية الفعالية
                      </p>
                    </div>

                    <Leaf
                      size={26}
                      className="text-[#c8f33f]"
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-[#a5c42e]/20 bg-[#0b2b1c] p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-black text-white">
                        آمنة على النباتات
                      </p>
                      <p className="mt-1 text-xs text-white/55">
                        طويلة المفعول
                      </p>
                    </div>

                    <CheckCircle2
                      size={26}
                      className="text-[#c8f33f]"
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-[#a5c42e]/20 bg-[#0b2b1c] p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-black text-white">
                        آمنة على المحاصيل
                      </p>
                      <p className="mt-1 text-xs text-white/55">
                        وحماية البيئة
                      </p>
                    </div>

                    <ShieldCheck
                      size={26}
                      className="text-[#c8f33f]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
