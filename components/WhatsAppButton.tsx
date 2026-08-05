"use client";

import Image from "next/image";
import {
  MessageCircle,
  ShoppingCart,
  Stethoscope,
  X,
} from "lucide-react";
import {
  usePathname,
} from "next/navigation";
import {
  useMemo,
  useState,
} from "react";

const PHONE =
  "201080040408";

type ContextCopy = {
  title: string;
  subtitle: string;
  message: string;
  buttonLabel: string;
  icon:
    | "chat"
    | "doctor"
    | "cart";
};

function contextForPath(
  pathname: string,
): ContextCopy {
  if (
    pathname.startsWith(
      "/products/",
    )
  ) {
    return {
      title:
        "اسأل عن المنتج",
      subtitle:
        "محتاج تعرف الجرعة أو الاستخدام؟",
      message:
        "السلام عليكم، أريد الاستفسار عن المنتج الموجود في هذه الصفحة: ",
      buttonLabel:
        "اسأل عن المنتج",
      icon: "chat",
    };
  }

  if (
    pathname.startsWith(
      "/cart",
    )
  ) {
    return {
      title:
        "أكمل طلبك",
      subtitle:
        "فريق ArtVert جاهز يساعدك",
      message:
        "السلام عليكم، أريد إكمال طلبي من سلة ArtVert عبر واتساب.",
      buttonLabel:
        "إكمال الطلب",
      icon: "cart",
    };
  }

  if (
    pathname.startsWith(
      "/doctor",
    )
  ) {
    return {
      title:
        "تحدث مع الدعم الزراعي",
      subtitle:
        "أرسل تفاصيل الحالة أو صورة النبات",
      message:
        "السلام عليكم، أحتاج مساعدة زراعية من فريق ArtVert.",
      buttonLabel:
        "ابدأ واتساب",
      icon: "doctor",
    };
  }

  return {
    title:
      "دكتور ArtVert",
    subtitle:
      "متصل الآن وجاهز لمساعدتك",
    message:
      "السلام عليكم، أحتاج استشارة زراعية من ArtVert.",
    buttonLabel:
      "ابدأ واتساب",
    icon: "chat",
  };
}

function ContextIcon({
  type,
}: {
  type:
    | "chat"
    | "doctor"
    | "cart";
}) {
  if (type === "cart") {
    return (
      <ShoppingCart
        size={17}
      />
    );
  }

  if (type === "doctor") {
    return (
      <Stethoscope
        size={17}
      />
    );
  }

  return (
    <MessageCircle
      size={17}
    />
  );
}

export default function WhatsAppButton() {
  const pathname =
    usePathname();

  const [
    open,
    setOpen,
  ] = useState(false);

  const context =
    useMemo(
      () =>
        contextForPath(
          pathname,
        ),
      [pathname],
    );

  const whatsappUrl =
    useMemo(() => {
      const pageUrl =
        typeof window !==
        "undefined"
          ? window.location.href
          : "";

      const message =
        context.message.includes(
          "هذه الصفحة",
        )
          ? `${context.message}${pageUrl}`
          : context.message;

      return `https://wa.me/${PHONE}?text=${encodeURIComponent(
        message,
      )}`;
    }, [
      context.message,
    ]);

  return (
    <div
      className="whatsapp-button fixed bottom-4 right-4 z-[80] sm:bottom-5 sm:right-5"
      dir="rtl"
    >
      {open ? (
        <div
          role="dialog"
          aria-label="التواصل مع ArtVert عبر واتساب"
          className="artvert-card mb-3 w-[min(330px,calc(100vw-2rem))] p-4 shadow-2xl"
        >
          <button
            type="button"
            onClick={() =>
              setOpen(false)
            }
            className="artvert-icon-button absolute left-3 top-3 h-9 w-9"
            aria-label="إغلاق نافذة واتساب"
          >
            <X size={16} />
          </button>

          <div className="flex items-center gap-3 pl-10">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-[var(--artvert-border-strong)] bg-[rgba(200,243,63,.08)]">
              <Image
                src="/images/artvert-doctor-approved.png"
                alt="دكتور ArtVert"
                fill
                sizes="64px"
                className="object-cover object-top"
              />

              <span className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full border-2 border-[var(--artvert-bg)] bg-[var(--artvert-success)]" />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-black text-white">
                {context.title}
              </p>

              <p className="mt-1 text-[11px] font-bold text-[var(--artvert-primary)]">
                ● متصل الآن
              </p>

              <p className="mt-1 text-xs leading-5 text-[var(--artvert-text-muted)]">
                {context.subtitle}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-[var(--artvert-border-soft)] bg-white/[.035] p-3">
            <p className="text-xs leading-6 text-[var(--artvert-text-soft)]">
              👋 أهلًا بك في ArtVert Egypt
              <br />
              ابعت لنا رسالتك وهيرد عليك فريقنا في أقرب وقت.
            </p>
          </div>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="artvert-button-primary mt-4 w-full"
            onClick={() =>
              setOpen(false)
            }
          >
            <ContextIcon
              type={
                context.icon
              }
            />

            {
              context.buttonLabel
            }
          </a>

          <p className="mt-3 text-center text-[10px] text-[var(--artvert-text-faint)]">
            سيتم فتح المحادثة في تطبيق واتساب
          </p>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() =>
          setOpen(
            (current) =>
              !current,
          )
        }
        aria-expanded={open}
        aria-label={
          open
            ? "إغلاق زر واتساب"
            : "فتح التواصل عبر واتساب"
        }
        className="group flex min-h-14 items-center gap-3 rounded-full border border-[var(--artvert-border-strong)] bg-[var(--artvert-surface-glass)] py-1.5 pl-4 pr-1.5 shadow-[var(--artvert-shadow-card)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:shadow-[var(--artvert-shadow-glow-strong)]"
      >
        <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border-2 border-[var(--artvert-border-strong)] bg-[rgba(200,243,63,.08)]">
          <Image
            src="/images/artvert-doctor-approved.png"
            alt=""
            fill
            sizes="44px"
            className="object-cover object-top"
          />

          <span className="absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full border-2 border-[var(--artvert-bg)] bg-[var(--artvert-success)]" />
        </span>

        <span className="hidden min-w-0 text-right sm:block">
          <strong className="block truncate text-xs font-black text-white">
            {context.title}
          </strong>

          <span className="mt-0.5 block text-[10px] font-bold text-[var(--artvert-primary)]">
            متصل الآن
          </span>
        </span>

        <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--artvert-primary)] text-[var(--artvert-text-dark)] transition group-hover:bg-[var(--artvert-primary-hover)]">
          <MessageCircle
            size={18}
          />
        </span>
      </button>
    </div>
  );
}
