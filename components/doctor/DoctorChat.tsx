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
  Image as ImageIcon,
  Leaf,
  Loader2,
  Mic,
  Plus,
  Send,
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

type ExtendedProduct = {
  id: string;
  slug?: string;
  nameAr: string;
  nameEn?: string;
  reason?: string;
  benefits?: string[];
  composition?: string;
};

type ExtendedDoctorChatResponse = DoctorChatResponse & {
  reply?: string;
  products?: ExtendedProduct[];
};

type TranscriptItem = {
  id: string;
  role: "user" | "assistant";
  text: string;
  imageUrl?: string;
  products?: ExtendedProduct[];
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

function ProductCard({
  product,
}: {
  product: ExtendedProduct;
}) {
  const imageSrc = product.slug
    ? `/products/${product.slug}.jpeg`
    : "/icon.png";

  return (
    <article className="overflow-hidden rounded-2xl border border-[#a7c934]/25 bg-[#082419]">
      <div className="relative h-40 bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc}
          alt={product.nameAr}
          className="h-full w-full object-contain p-3"
          onError={(event) => {
            event.currentTarget.src = "/icon.png";
          }}
        />
      </div>

      <div className="p-4">
        <h3 className="text-base font-black text-white">
          {product.nameAr}
        </h3>

        <p className="mt-2 line-clamp-2 text-xs leading-6 text-white/55">
          {product.reason ||
            product.benefits?.[0] ||
            product.composition ||
            "منتج ArtVert مقترح للحالة."}
        </p>

        {product.slug ? (
          <Link
            href={`/products/${product.slug}`}
            className="mt-4 flex min-h-10 items-center justify-center rounded-xl bg-[#c8f33f] px-4 text-sm font-black text-[#102014]"
          >
            عرض المنتج
          </Link>
        ) : null}
      </div>
    </article>
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
          products: result.products?.slice(0, 3) ?? [],
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

    const selectedFile = file;

    setImageUploading(true);

    const preview = URL.createObjectURL(selectedFile);
    previewUrlsRef.current.add(preview);
    setImagePreview(preview);

    async function upload(activeSessionId?: string) {
      const body = new FormData();

      if (activeSessionId) {
        body.set("sessionId", activeSessionId);
      }

      body.set("image", selectedFile);

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
      const currentSessionId =
        sessionIdRef.current ?? sessionId;

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
    setImageUploading(false);
    setIsRequestPending(false);
    setRecording(false);
  }

  const canSend = Boolean(message.trim()) || Boolean(imageRef);

  return (
    <main
      dir="rtl"
      className="min-h-[100dvh] bg-[#03130c] px-2 py-2 text-white sm:px-4 sm:py-4"
    >
      <div className="mx-auto grid min-h-[calc(100dvh-16px)] max-w-[1380px] gap-3 lg:grid-cols-[minmax(0,1fr)_310px]">
        <section className="flex min-h-[620px] flex-col overflow-hidden rounded-[24px] border border-[#9fbd35]/25 bg-[#041c12]">
          <header className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-5">
            <div>
              <h1 className="text-xl font-black text-[#c8f33f] sm:text-2xl">
                اسأل دكتور ArtVert
              </h1>
              <p className="mt-1 text-xs text-white/50">
                شات زراعي مباشر
              </p>
            </div>

            <button
              type="button"
              onClick={resetConversation}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-3 text-xs font-black"
            >
              <Plus size={16} />
              محادثة جديدة
            </button>
          </header>

          <div
            ref={scrollRef}
            className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-5"
          >
            <div className="space-y-4">
              <div className="flex justify-end">
                <div className="max-w-[88%] rounded-2xl border border-[#9fbd35]/20 bg-[#123522] px-4 py-3 text-sm leading-7 text-white/80 sm:max-w-[72%]">
                  أهلاً بك، اكتب مشكلتك أو ارفع صورة للنبات.
                </div>
              </div>

              {transcript.map((item) => {
                const isUser = item.role === "user";

                return (
                  <div
                    key={item.id}
                    className={[
                      "flex items-start gap-2",
                      isUser ? "justify-start" : "justify-end",
                    ].join(" ")}
                  >
                    {isUser && (
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[.05]">
                        <User size={16} />
                      </span>
                    )}

                    <div className="max-w-[88%] sm:max-w-[72%]">
                      <div
                        className={[
                          "rounded-2xl border px-4 py-3 text-sm leading-7",
                          isUser
                            ? "border-white/10 bg-[#0c2a1d] text-white/85"
                            : "border-[#9fbd35]/20 bg-[#123522] text-white/80",
                        ].join(" ")}
                      >
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt="صورة النبات"
                            className="mb-3 max-h-56 w-full rounded-xl object-contain"
                          />
                        )}

                        <div className="whitespace-pre-line">
                          {item.text}
                        </div>
                      </div>

                      {!isUser &&
                        item.products &&
                        item.products.length > 0 && (
                          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            {item.products.map((product) => (
                              <ProductCard
                                key={product.id}
                                product={product}
                              />
                            ))}
                          </div>
                        )}
                    </div>

                    {!isUser && (
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#c8f33f]/25 bg-[#c8f33f]/10 text-[#c8f33f]">
                        <Bot size={16} />
                      </span>
                    )}
                  </div>
                );
              })}

              {isRequestPending && (
                <div className="flex justify-end">
                  <div className="flex items-center gap-2 rounded-2xl border border-[#9fbd35]/20 bg-[#123522] px-4 py-3">
                    <Loader2
                      size={16}
                      className="animate-spin text-[#c8f33f]"
                    />
                    <span className="text-xs text-white/60">
                      جاري كتابة الرد...
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-white/10 p-3">
            {imagePreview && (
              <div className="mb-2 flex items-center justify-between rounded-xl border border-[#c8f33f]/20 bg-[#c8f33f]/[.05] p-2">
                <img
                  src={imagePreview}
                  alt="معاينة الصورة"
                  className="h-12 w-12 rounded-lg object-cover"
                />

                <button
                  type="button"
                  onClick={removeImage}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-rose-300/20 bg-rose-400/10 text-rose-200"
                  aria-label="حذف الصورة"
                >
                  <X size={15} />
                </button>
              </div>
            )}

            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#02150d] p-2">
              <label className="grid h-12 w-12 shrink-0 cursor-pointer place-items-center rounded-xl border border-white/10 bg-white/[.035] text-white">
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
                  <Loader2 size={19} className="animate-spin" />
                ) : (
                  <ImageIcon size={19} />
                )}
              </label>

              <button
                type="button"
                onClick={() => setRecording((current) => !current)}
                className={[
                  "grid h-12 w-12 shrink-0 place-items-center rounded-xl border",
                  recording
                    ? "border-rose-300/30 bg-rose-400/10 text-rose-200"
                    : "border-white/10 bg-white/[.035] text-white",
                ].join(" ")}
                aria-label="تسجيل صوتي"
              >
                <Mic
                  size={19}
                  className={recording ? "animate-pulse" : ""}
                />
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
                placeholder="اكتب رسالتك..."
                className="min-w-0 flex-1 bg-transparent px-2 text-sm text-white outline-none placeholder:text-white/35"
              />

              <button
                type="button"
                onClick={sendCurrentMessage}
                disabled={!canSend || isRequestPending || imageUploading}
                className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#c8f33f] text-[#102014] disabled:opacity-40"
                aria-label="إرسال"
              >
                <Send size={19} className="-rotate-180" />
              </button>
            </div>
          </div>
        </section>

        <aside className="hidden overflow-hidden rounded-[24px] border border-[#9fbd35]/25 bg-[#041c12] lg:flex lg:flex-col">
          <div className="border-b border-white/10 px-4 py-4 text-center">
            <Link href="/" className="inline-flex items-center gap-2">
              <Leaf size={25} className="text-[#c8f33f]" />
              <span className="text-xl font-black text-white">
                ArtVert
              </span>
            </Link>
          </div>

          <div className="relative mx-auto mt-4 h-[250px] w-full max-w-[260px]">
            <Image
              src="/doctor/artvert-doctor.png"
              alt="دكتور ArtVert"
              fill
              priority
              sizes="260px"
              className="object-contain object-bottom"
            />
          </div>

          <div className="px-4 pb-4 text-center">
            <h2 className="text-lg font-black text-white">
              دكتور ArtVert AI
            </h2>

            <p className="mt-2 text-xs leading-6 text-white/50">
              مساعدك الزراعي الذكي
            </p>

            <Link
              href="/products"
              className="mt-4 flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#c8f33f] px-4 text-sm font-black text-[#102014]"
            >
              <ShoppingCart size={17} />
              تصفح المنتجات
            </Link>
          </div>
        </aside>
      </div>
    </main>
  );
}
