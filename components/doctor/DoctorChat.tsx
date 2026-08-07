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
  CheckCircle2,
  FlaskConical,
  Image as ImageIcon,
  Leaf,
  Loader2,
  Menu,
  Mic,
  Plus,
  Send,
  ShieldCheck,
  ShoppingCart,
  User,
  X,
  LogIn,
} from "lucide-react";

import { sendDoctorMessage } from "@/lib/doctor/client";
import { useLanguage } from "@/components/i18n/LanguageProvider";
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
  image?: string;
  price?: number;
  compareAtPrice?: number;
  currency?: string;
  productUrl?: string;
  inStock?: boolean;
  stockQuantity?: number;
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
};

type TranscriptItem = {
  id: string;
  role: "user" | "assistant";
  text: string;
  imageUrl?: string;
  result?: ExtendedDoctorChatResponse;
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

function confidenceValue(
  result: ExtendedDoctorChatResponse | undefined,
) {
  const confidence =
    result?.possibleDiagnoses?.[0]?.confidence ??
    result?.candidates?.[0]?.confidence;

  if (confidence === "HIGH") {
    return 96;
  }
  if (confidence === "MODERATE") {
    return 82;
  }
  if (confidence === "LOW") {
    return 58;
  }
  return 0;
}

function resultProducts(
  result: ExtendedDoctorChatResponse,
): ExtendedProduct[] {
  if (result.products && result.products.length > 0) {
    return result.products.slice(0, 3);
  }

  return result.treatment.products
    .slice(0, 3)
    .map<ExtendedProduct>((product) => ({
      id: product.productId,
      slug: undefined,
      nameAr: product.name,
      reason: product.reason,
    }));
}

function assistantTextWithoutProductList(
  text: string,
  hasProductCards: boolean,
) {
  if (!hasProductCards) {
    return text;
  }

  const marker = "المنتجات المقترحة من ArtVert:";
  const markerIndex = text.indexOf(marker);

  return markerIndex >= 0
    ? text.slice(0, markerIndex).trim()
    : text;
}

function formattedProductPrice(product: ExtendedProduct) {
  if (typeof product.price !== "number") {
    return undefined;
  }

  const currency =
    product.currency === "EGP" || !product.currency
      ? "ج.م"
      : product.currency;

  return `${product.price.toLocaleString("ar-EG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

function AudioWave({ compact = false }: { compact?: boolean }) {
  const count = compact ? 28 : 50;

  return (
    <div
      className={[
        "flex items-center justify-center gap-1.5 overflow-hidden opacity-50",
        compact ? "h-16" : "h-24",
      ].join(" ")}
      aria-hidden="true"
    >
      {Array.from({ length: count }).map((_, index) => (
        <span
          key={index}
          className="w-[2px] rounded-full bg-[#7dff53]/70 animate-pulse"
          style={{
            height: `${
              8 + ((index * 19) % (compact ? 38 : 64))
            }px`,
            animationDelay: `${index * 32}ms`,
          }}
        />
      ))}
    </div>
  );
}

function TrustCard({
  icon,
  title,
  text,
  featured = false,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  featured?: boolean;
}) {
  return (
    <div
      className={[
        "flex min-h-[90px] items-center gap-4 rounded-[20px] border p-4 backdrop-blur-md transition-all",
        featured
          ? "border-[#c8f33f] bg-[linear-gradient(145deg,rgba(200,243,63,0.1),rgba(200,243,63,0.02))] shadow-[0_0_20px_rgba(200,243,63,0.15)]"
          : "border-[#9fbd35]/30 bg-white/5",
      ].join(" ")}
    >
      <div
        className={[
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border",
          featured
            ? "border-[#c8f33f]/50 bg-[#c8f33f]/20 text-[#c8f33f]"
            : "border-[#b4d82f]/35 bg-[#b4d82f]/8 text-[#b7df35]",
        ].join(" ")}
      >
        {icon}
      </div>

      <div>
        <p
          className={[
            "text-base font-black",
            featured ? "text-white" : "text-white",
          ].join(" ")}
        >
          {title}
        </p>
        <p
          className={[
            "mt-1 text-sm leading-6",
            featured ? "text-[#c8f33f]" : "text-white/60",
          ].join(" ")}
        >
          {text}
        </p>
        {featured && (
          <p className="mt-1 text-lg tracking-[.15em] text-[#c8f33f]">
            ★★★★★
          </p>
        )}
      </div>
    </div>
  );
}

export function DoctorChat() {
  const { isArabic, toggleLocale } = useLanguage();
  const t = (ar: string, en: string) => (isArabic ? ar : en);
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

  const diagnosisName =
    lastResult?.possibleDiagnoses?.[0]?.name ??
    lastResult?.candidates?.[0]?.name;

  const confidence = confidenceValue(lastResult);
  const productsCount =
    (lastResult?.products ?? []).length ||
    lastResult?.treatment.products.length ||
    0;

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
            t("محتاج توضيح بسيط أكتر.", "I need a little more information."),
          result,
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
                : t("تعذر الاتصال بدكتور ArtVert AI.", "Unable to connect to Doctor ArtVert AI."),
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
      if (activeSessionId) body.set("sessionId", activeSessionId);
      body.set("image", selectedFile);

      const response = await fetch("/api/doctor/images", {
        method: "POST",
        body,
      });
      const result = (await response.json()) as ImageUploadResponse;
      return { response, result };
    }

    try {
      const currentSessionId = sessionIdRef.current ?? sessionId;
      let { response, result } = await upload(currentSessionId);

      if (response.status === 409 || result.status === "session_expired") {
        sessionIdRef.current = undefined;
        setSessionId(undefined);
        ({ response, result } = await upload());
      }

      if (!response.ok || !result.imageRef || !result.sessionId) {
        throw new Error(result.error || t("تعذر رفع الصورة.", "Unable to upload the image."));
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
            error instanceof Error ? error.message : t("تعذر رفع الصورة.", "Unable to upload the image."),
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
    if ((!trimmed && !imageRef) || isRequestPending || imageUploading || isTerminal(status)) {
      return;
    }

    const displayImageUrl = imagePreview;
    setMessage("");
    setImageRef(undefined);
    setImagePreview(undefined);

    void submitTurn(
      {
        message:
          trimmed || t("حلل صورة النبات المرفوعة وساعدني في معرفة المشكلة.", "Analyze the uploaded plant image and help me identify the problem."),
        imageRef,
        sessionId: sessionIdRef.current ?? sessionId,
      },
      displayImageUrl,
    );
  }

  function resetConversation() {
    requestRef.current?.abort();
    requestRef.current = null;
    setTranscript([]);
    sessionIdRef.current = undefined;
    setSessionId(undefined);
    setStatus("welcome");
    setMessage("");
    setIsRequestPending(false);
    setRecording(false);
    removeImage();
  }

  const canSend = Boolean(message.trim()) || Boolean(imageRef);
  const doctorState =
    status === "thinking"
      ? t("براجع الحالة الآن", "Reviewing the case now")
      : status === "differential_ready"
      ? t("وصلنا للنتيجة", "Diagnosis ready")
      : status === "needs_information"
      ? t("محتاج معلومة إضافية", "More information needed")
      : t("وصلت الطبيب شغالة", "Doctor is online");

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="relative min-h-[100dvh] w-full overflow-x-hidden bg-[#0a1e12] px-2 py-2 text-white sm:px-3 lg:h-[100dvh] lg:overflow-hidden font-sans"
    >
      {/* Background Gradient & Pattern */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_6%,rgba(143,202,45,.12),transparent_25%),radial-gradient(circle_at_88%_18%,rgba(38,164,83,.12),transparent_27%),linear-gradient(145deg,#02150d_0%,#063220_48%,#02180f_100%)]" />
      
      {/* Subtle Grid Overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.2) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.2) 1px,transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />

      <div className="relative z-10 mx-auto flex min-h-[calc(100dvh-16px)] w-full max-w-screen-2xl flex-col lg:h-full lg:min-h-0">
        {/* Top Navbar */}
        <nav className="mb-2 flex items-center justify-between gap-3 rounded-[20px] border border-[#9fbd35]/25 bg-black/40 px-3 py-2.5 backdrop-blur-md sm:rounded-full sm:px-6 sm:py-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="text-left">
              <span className="text-2xl font-black text-[#c8f33f] sm:text-3xl">ArtVert</span>
              <span className="block text-center text-sm font-bold leading-none text-white">Egypt</span>
            </div>
            <Leaf size={32} className="text-[#c8f33f]" />
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-white/90">
            <Link href="/" className="hover:text-[#c8f33f] transition-colors">{t("الرئيسية", "Home")}</Link>
            <Link href="/plant-care" className="hover:text-[#c8f33f] transition-colors">{t("الرعاية والحماية", "Plant Care")}</Link>
            <Link href="/doctor" className="text-[#c8f33f]">{t("الرعاية والتشخيص", "Care & Diagnosis")}</Link>
            <Link href="/blog" className="hover:text-[#c8f33f] transition-colors">{t("المدونة", "Blog")}</Link>
            <Link href="/about" className="hover:text-[#c8f33f] transition-colors">{t("من نحن", "About Us")}</Link>
          </div>

          <Link
            href="/contact"
            className="hidden rounded-xl border border-white/20 bg-white/10 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-white/20 sm:inline-flex"
          >
            {t("تواصل معنا", "Contact Us")}
          </Link>
        </nav>

        {/* Secondary Navbar */}
        <div className="mb-3 flex items-center justify-between gap-2 rounded-[18px] border border-[#9fbd35]/20 bg-[#072517]/80 px-2.5 py-2 backdrop-blur-md sm:mb-4 sm:rounded-[24px] sm:px-4 sm:py-3">
          <div className="flex items-center gap-3">
            <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 lg:hidden">
              <Menu size={20} />
            </button>
            <button className="hidden sm:flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-xs font-bold text-white hover:bg-white/10">
              {t("تسجيل الدخول", "Login")} <LogIn size={16} className="rotate-180" />
            </button>
            <button onClick={toggleLocale} className="hidden sm:flex h-10 items-center rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-bold text-white/80 hover:bg-white/10">
              {isArabic ? "EN" : "AR"}
            </button>
            <Link href="/cart" className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/10">
              <ShoppingCart size={18} />
              <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#c8f33f] text-[10px] font-black text-black">0</span>
            </Link>
            <Link href="/products" className="flex h-10 items-center rounded-xl bg-[#c8f33f] px-3 text-xs font-black text-[#102014] shadow-[0_0_15px_rgba(200,243,63,.3)] transition-colors hover:bg-[#d4f85e] sm:px-5 sm:text-sm">
              {t("تسوق الآن", "Shop Now")} <ShoppingCart size={16} className="ml-2 hidden sm:block" />
            </Link>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="hidden text-right leading-tight sm:block">
              <span className="block text-xl font-black text-white">ARTVERT</span>
              <span className="block text-[10px] font-black tracking-widest text-[#c8f33f]">EGYPT</span>
            </div>
            <Leaf size={28} className="text-[#c8f33f]" />
          </div>
        </div>

        {/* Main Grid Layout */}
        <div className="flex min-h-0 flex-1 flex-col gap-3 lg:grid lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-4">
          
          {/* Right Sidebar (Doctor Panel) */}
          <aside className="hidden lg:flex flex-col gap-4 order-2 lg:order-1">
            {/* Doctor Card */}
            <div className="relative flex flex-col items-center overflow-hidden rounded-[24px] border border-[#9fbd35]/30 bg-[#072517]/80 pb-6 pt-4 backdrop-blur-md">
              <div className="absolute top-4 right-4 z-20 flex items-center gap-2 rounded-full bg-black/40 px-3 py-1.5 border border-[#9fbd35]/30">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#62ff59]" />
                <span className="text-[10px] font-bold text-white">{t("وصلنا للنتيجة", "Diagnosis ready")}</span>
              </div>
              
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-0 opacity-40">
                <AudioWave compact />
              </div>

              <div className="relative z-10 mt-6 h-48 w-48">
                <Image src="/doctor/artvert-doctor.png" alt={t("دكتور ArtVert AI", "Doctor ArtVert AI")} fill className="object-contain object-bottom drop-shadow-2xl" />
              </div>

              <div className="relative z-10 flex flex-col items-center mt-2 text-center px-4">
                <div className="flex items-center gap-2">
                   <h2 className="text-lg font-black text-white">{t("دكتور ArtVert AI", "Doctor ArtVert AI")}</h2>
                   <CheckCircle2 size={16} className="text-[#c8f33f] fill-[#c8f33f]/20" />
                </div>
                <p className="mt-2 text-xs leading-5 text-white/70">
                  {t("تحدث مع أسرع ذكاء زراعي في الوطن العربي.", "Talk to advanced agricultural AI.")}<br/> {t("جاهز لمساعدتك 24/2", "Ready to help you anytime") }
                </p>
                <div className="mt-4 flex items-center justify-center gap-4 text-white/60">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="hover:text-white cursor-pointer transition-colors">
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
                  </svg>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="hover:text-white cursor-pointer transition-colors">
                    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                  </svg>
                </div>
              </div>
              
              <button onClick={resetConversation} className="relative z-10 mx-4 mt-5 flex w-[calc(100%-32px)] items-center justify-center rounded-xl bg-[#2a4d3b] border border-[#3e6650] py-3 text-sm font-bold text-white transition-colors hover:bg-[#325a45]">
                {t("محادثة جديدة", "New conversation")}
              </button>
            </div>

            {/* Sidebar Trust Cards */}
            <div className="rounded-[24px] border border-[#c8f33f]/40 bg-[#122e1e]/80 p-4 flex items-center justify-between shadow-[0_0_15px_rgba(200,243,63,.1)] backdrop-blur-md">
               <div>
                  <p className="text-sm font-black text-white">{t("أكثر من 10,000 مزارع", "More than 10,000 growers")}</p>
                  <p className="text-xs font-bold text-[#c8f33f] mt-0.5">{t("يثقون بدكتور آرت فيرت", "trust Doctor ArtVert")}</p>
                  <p className="mt-1 text-sm tracking-[.15em] text-[#c8f33f]">★★★★★</p>
               </div>
               <div className="h-10 w-10 rounded-xl border border-[#c8f33f]/40 bg-[#c8f33f]/10 flex items-center justify-center text-[#c8f33f]">
                  <ShieldCheck size={20} />
               </div>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-[#072517]/80 p-4 flex items-center justify-between backdrop-blur-md">
               <div>
                  <p className="text-sm font-black text-white">{t("جودة على مضمونة", "Guaranteed quality")}</p>
                  <p className="text-xs text-white/60 mt-0.5">{t("منتجات عالية الفعالية", "Highly effective products")}</p>
               </div>
               <div className="h-10 w-10 rounded-xl border border-white/20 bg-white/5 flex items-center justify-center text-white/80">
                  <FlaskConical size={20} />
               </div>
            </div>
          </aside>

          {/* Chat Section */}
          <section className="relative order-1 flex min-h-[calc(100dvh-150px)] min-w-0 flex-1 flex-col overflow-hidden rounded-[20px] border border-[#9fbd35]/20 bg-[#072517]/40 backdrop-blur-xl sm:min-h-[calc(100dvh-165px)] sm:rounded-[24px] lg:order-2 lg:min-h-0">
            
            {/* Background Image / Overlay for Chat */}
            <div className="absolute inset-0 pointer-events-none opacity-20 bg-[url('/leaf-bg-placeholder.png')] bg-cover bg-center" />
            
            {/* Chat Header */}
            <div className="relative z-10 flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-6 sm:py-4">
              <div>
                <h1 className="text-lg font-black text-[#c8f33f] sm:text-2xl">
                  {t("اسأل دكتور ArtVert AI", "Ask Doctor ArtVert AI")}
                </h1>
                <p className="mt-1 text-xs text-white/70 sm:text-sm">{t("المهندس الزراعي الذكي", "Your smart agricultural expert")}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2 rounded-full border border-[#9fbd35]/30 bg-[#153a25] px-3 py-2 sm:px-4">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#62ff59]" />
                <span className="text-[11px] font-bold text-white">{doctorState}</span>
              </div>
            </div>

            {/* Chat Messages */}
            <div ref={scrollRef} className="relative z-10 min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-6 sm:py-6">
              {transcript.length === 0 ? (
                <div className="flex h-full flex-col justify-center">
                  <div className="relative mb-8 max-w-2xl">
                    <div className="pointer-events-none absolute -left-12 top-0 bottom-0 opacity-40">
                      <AudioWave />
                    </div>
                    
                    {/* Welcome Bubbles */}
                    <div className="space-y-4 pr-0 sm:pr-12">
                      <div className="relative rounded-2xl rounded-tr-sm bg-[#153a25]/80 border border-white/10 px-5 py-4 text-sm leading-7 text-white backdrop-blur-md">
                        <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full border border-[#c8f33f]/40 bg-[#9fbd35]/20 text-[#c8f33f] sm:absolute sm:-right-10 sm:top-0 sm:mb-0">
                          <Leaf size={18} />
                        </div>
                        <p className="font-black text-[#c8f33f] mb-1">{t("مرحباً بك! أنا دكتور آرت فيرت.", "Welcome! I’m Doctor ArtVert.")}</p>
                        {t("اسألني عن أي مشكلة في نباتك، وسأساعدك في التشخيص والعلاج خطوة بخطوة لأفضل نتائج.", "Ask me about any plant problem, and I’ll help you with diagnosis and treatment step by step for the best results.")}
                      </div>
                      <div className="relative rounded-2xl rounded-tr-sm bg-white/5 border border-white/10 px-5 py-3 text-sm text-white/90 backdrop-blur-md w-[85%]">
                        <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/70 sm:absolute sm:-right-10 sm:top-0 sm:mb-0">
                          <Leaf size={18} />
                        </div>
                        {t("تعبت ندردش في إيه النهاردة؟ أو عندك زرع محتاج متابعة؟", "What would you like to talk about today? Do you have a plant that needs attention?")}
                      </div>
                    </div>
                  </div>

                  {/* Trust Cards Grid */}
                  <div className="ml-auto grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                    <TrustCard icon={<ShieldCheck size={24} />} title={t("جودة مضمونة", "Guaranteed quality")} text={t("منتجات عالية الفعالية", "Highly effective products")} />
                    <TrustCard featured icon={<CheckCircle2 size={24} />} title={t("أكثر من 10,000 مزارع", "More than 10,000 growers")} text={t("يثقون بخبرتنا", "trust our expertise")} />
                    <TrustCard icon={<FlaskConical size={24} />} title={t("حلول فعالة وموثوقة", "Effective, trusted solutions")} text="" />
                    <TrustCard icon={<Leaf size={24} />} title={t("تركيبة مبتكرة لطيفة وآمنة", "Innovative, gentle and safe formula")} text="" />
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {transcript.map((item) => {
                    const isUser = item.role === "user";
                    const products = item.result ? resultProducts(item.result) : [];
                    return (
                      <div key={item.id} className={["flex items-start gap-4", isUser ? "justify-start" : "justify-end"].join(" ")}>
                        {!isUser && (
                          <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#c8f33f]/40 bg-[#9fbd35]/20 text-[#c8f33f]">
                            <Leaf size={16} />
                          </div>
                        )}
                        <div className={["max-w-[85%] rounded-2xl p-4 text-sm leading-7 backdrop-blur-md", isUser ? "rounded-tr-sm bg-[#c8f33f]/10 border border-[#c8f33f]/30 text-white" : "rounded-tl-sm bg-[#153a25]/80 border border-white/10 text-white/90"].join(" ")}>
                          {item.imageUrl && (
                            <img src={item.imageUrl} alt="Uploaded plant" className="mb-3 max-h-60 w-full rounded-xl object-cover border border-white/10" />
                          )}
                          <div className="whitespace-pre-line">
                            {assistantTextWithoutProductList(
                              item.text,
                              !isUser && products.length > 0,
                            )}
                          </div>
                          
                          {/* Product recommendation cards */}
                          {!isUser && products.length > 0 ? (
                            <div className="mt-5">
                              <div className="mb-3 flex items-center gap-2 text-[#c8f33f]">
                                <ShoppingCart size={17} aria-hidden="true" />
                                <p className="text-xs font-black">
                                  {t("منتجات ArtVert المقترحة", "Recommended ArtVert products")}
                                </p>
                              </div>

                              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                {products.map((product) => {
                                  const price = formattedProductPrice(product);
                                  const hasDiscount =
                                    typeof product.compareAtPrice === "number" &&
                                    typeof product.price === "number" &&
                                    product.compareAtPrice > product.price;
                                  const href =
                                    product.productUrl ??
                                    (product.slug
                                      ? `/products/${product.slug}`
                                      : undefined);

                                  return (
                                    <article
                                      key={product.id}
                                      className="group overflow-hidden rounded-2xl border border-[#c8f33f]/25 bg-[#0d2b1a]/90 shadow-[0_12px_30px_rgba(0,0,0,.22)] transition duration-300 hover:-translate-y-0.5 hover:border-[#c8f33f]/50"
                                    >
                                      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_50%_40%,rgba(200,243,63,.12),rgba(4,28,16,.2)_65%)]">
                                        {product.image ? (
                                          <img
                                            src={product.image}
                                            alt={product.nameAr}
                                            loading="lazy"
                                            className="h-full w-full object-contain p-3 transition-transform duration-500 group-hover:scale-[1.04]"
                                          />
                                        ) : (
                                          <div className="flex flex-col items-center gap-2 text-white/35">
                                            <ImageIcon size={30} aria-hidden="true" />
                                            <span className="text-[10px] font-bold">
                                              {t("صورة المنتج غير متاحة", "Product image unavailable")}
                                            </span>
                                          </div>
                                        )}

                                        <span className="absolute right-2 top-2 rounded-full border border-[#c8f33f]/30 bg-[#071d11]/85 px-2.5 py-1 text-[9px] font-black text-[#c8f33f] backdrop-blur-md">
                                          {t("موصى به", "Recommended")}
                                        </span>
                                      </div>

                                      <div className="p-3.5">
                                        <h3 className="line-clamp-2 min-h-10 text-sm font-black leading-5 text-white">
                                          {product.nameAr}
                                        </h3>

                                        {product.nameEn ? (
                                          <p
                                            dir="ltr"
                                            className="mt-1 truncate text-[10px] font-bold uppercase tracking-[.08em] text-white/35"
                                          >
                                            {product.nameEn}
                                          </p>
                                        ) : null}

                                        {product.reason ? (
                                          <p className="mt-2 line-clamp-2 min-h-10 text-[11px] leading-5 text-white/65">
                                            {product.reason}
                                          </p>
                                        ) : null}

                                        {price ? (
                                          <div className="mt-3 flex min-h-7 flex-wrap items-center gap-2">
                                            <span className="text-base font-black text-[#c8f33f]">
                                              {price}
                                            </span>

                                            {hasDiscount ? (
                                              <span className="text-[11px] font-bold text-white/35 line-through">
                                                {product.compareAtPrice?.toLocaleString(
                                                  "ar-EG",
                                                  {
                                                    minimumFractionDigits: 0,
                                                    maximumFractionDigits: 2,
                                                  },
                                                )}{" "}
                                                ج.م
                                              </span>
                                            ) : null}
                                          </div>
                                        ) : null}

                                        {href ? (
                                          <Link
                                            href={href}
                                            className="mt-3 flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#c8f33f] px-4 py-2 text-xs font-black text-[#102014] shadow-[0_7px_18px_rgba(200,243,63,.16)] transition hover:bg-[#d9ff63]"
                                          >
                                            <ShoppingCart size={15} aria-hidden="true" />
                                            {t("عرض المنتج", "View product")}
                                          </Link>
                                        ) : (
                                          <div className="mt-3 flex min-h-10 w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white/40">
                                            {t("رابط المنتج غير متاح", "Product link unavailable")}
                                          </div>
                                        )}
                                      </div>
                                    </article>
                                  );
                                })}
                              </div>
                            </div>
                          ) : null}

                        </div>
                        {isUser && (
                          <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/70">
                            <User size={16} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {isRequestPending && (
                    <div className="flex items-start gap-4 justify-end">
                      <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full border border-[#c8f33f]/40 bg-[#9fbd35]/20 text-[#c8f33f]">
                         <Leaf size={16} />
                      </div>
                      <div className="flex items-center gap-3 rounded-2xl rounded-tl-sm bg-[#153a25]/80 border border-white/10 px-5 py-3 backdrop-blur-md">
                        <Loader2 size={16} className="animate-spin text-[#c8f33f]" />
                        <span className="text-sm font-bold text-white/70">{t("بكتب...", "Typing...")}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Input Area */}
            <div className="relative z-20 shrink-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2.5 sm:p-4">
              <div className="mx-auto flex w-full max-w-4xl flex-col gap-2 rounded-[22px] border border-white/10 bg-black/40 p-2 backdrop-blur-xl sm:flex-row sm:gap-3 sm:rounded-[32px] sm:p-3">
                
                {/* Media Buttons (Left side visually in RTL) */}
                <div className="order-2 flex shrink-0 gap-2 sm:order-1">
                  <label className="flex h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-[16px] border border-white/10 bg-transparent text-white transition-colors hover:bg-white/5 sm:h-20 sm:w-[90px] sm:flex-none sm:flex-col sm:gap-2 sm:rounded-[22px]">
                    <input type="file" accept="image/*" onChange={(e) => void chooseImage(e.target.files?.[0])} disabled={isRequestPending || imageUploading} className="sr-only" />
                    <ImageIcon size={22} className={imageUploading ? "animate-bounce" : ""} />
                    <span className="text-[10px] sm:text-xs">{t("تحميل صورة", "Upload image")}</span>
                  </label>

                  <button type="button" onClick={() => setRecording(!recording)} className={["flex h-16 w-20 sm:h-20 sm:w-[90px] flex-col items-center justify-center gap-1 sm:gap-2 rounded-[22px] border transition-colors", recording ? "border-rose-400/50 bg-rose-400/20 text-rose-300" : "border-white/10 bg-transparent text-white hover:bg-white/5"].join(" ")}>
                    <Mic size={22} className={recording ? "animate-pulse" : ""} />
                    <span className="text-[10px] sm:text-xs">{t("تسجيل صوتي", "Voice recording")}</span>
                  </button>
                </div>

                {/* Text Input (Right side visually in RTL) */}
                <div className="relative order-1 flex min-h-14 min-w-0 flex-1 flex-col justify-center rounded-[18px] border border-white/5 bg-white/5 px-3 sm:order-2 sm:rounded-[22px] sm:px-4">
                  {imagePreview && (
                     <div className="absolute -top-16 right-4 flex items-center gap-2 rounded-xl bg-black/80 p-2 backdrop-blur-md border border-white/10">
                       <img src={imagePreview} className="h-10 w-10 rounded-lg object-cover" alt="preview" />
                       <button onClick={removeImage} className="text-rose-400 hover:text-rose-300"><X size={16}/></button>
                     </div>
                  )}
                  <input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendCurrentMessage())}
                    placeholder={t("اكتب هنا واسأل عن مشكلتك...", "Type here and ask about your problem...")}
                    className="w-full bg-transparent pl-12 text-sm leading-loose text-white outline-none placeholder:text-white/40 sm:pl-16"
                  />
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <span className="hidden sm:inline text-xs font-bold text-white/60">{t("محادثة جديدة", "New conversation")}</span>
                    <button
                      onClick={sendCurrentMessage}
                      disabled={!canSend || isRequestPending || imageUploading}
                      className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-transparent text-white/60 hover:text-[#c8f33f] transition-colors disabled:opacity-40"
                    >
                      <Send size={20} className="-rotate-180" />
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </section>

        </div>
      </div>
    </main>
  );
}