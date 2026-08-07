"use client";

import Image from "next/image";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  CircleCheck,
  Banknote,
  Landmark,
  MapPin,
  MessageCircle,
  PackageCheck,
  Phone,
  Printer,
  ReceiptText,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Truck,
  User,
  WalletCards,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  useCart,
} from "@/components/cart/CartProvider";
import { useLanguage } from "@/components/i18n/LanguageProvider";

const EGYPT_GOVERNORATES = [
  "القاهرة",
  "الجيزة",
  "الإسكندرية",
  "الدقهلية",
  "البحر الأحمر",
  "البحيرة",
  "الفيوم",
  "الغربية",
  "الإسماعيلية",
  "المنوفية",
  "المنيا",
  "القليوبية",
  "الوادي الجديد",
  "السويس",
  "أسوان",
  "أسيوط",
  "بني سويف",
  "بورسعيد",
  "دمياط",
  "الشرقية",
  "جنوب سيناء",
  "كفر الشيخ",
  "مطروح",
  "الأقصر",
  "قنا",
  "شمال سيناء",
  "سوهاج",
] as const;

const EGYPT_GOVERNORATES_EN: Record<string, string> = {
  "القاهرة": "Cairo",
  "الجيزة": "Giza",
  "الإسكندرية": "Alexandria",
  "الدقهلية": "Dakahlia",
  "البحر الأحمر": "Red Sea",
  "البحيرة": "Beheira",
  "الفيوم": "Fayoum",
  "الغربية": "Gharbia",
  "الإسماعيلية": "Ismailia",
  "المنوفية": "Monufia",
  "المنيا": "Minya",
  "القليوبية": "Qalyubia",
  "الوادي الجديد": "New Valley",
  "السويس": "Suez",
  "أسوان": "Aswan",
  "أسيوط": "Assiut",
  "بني سويف": "Beni Suef",
  "بورسعيد": "Port Said",
  "دمياط": "Damietta",
  "الشرقية": "Sharqia",
  "جنوب سيناء": "South Sinai",
  "كفر الشيخ": "Kafr El Sheikh",
  "مطروح": "Matrouh",
  "الأقصر": "Luxor",
  "قنا": "Qena",
  "شمال سيناء": "North Sinai",
  "سوهاج": "Sohag",
} as const;


type CatalogPriceProduct = {
  slug: string;
  price: number | null;
  comparePrice: number | null;
};

type PaymentMethod =
  | "CASH_ON_DELIVERY"
  | "VODAFONE_CASH"
  | "INSTAPAY"
  | "BANK_TRANSFER";

type CustomerData = {
  fullName: string;
  phone: string;
  alternativePhone: string;
  governorate: string;
  city: string;
  address: string;
  notes: string;
};

type CreatedOrderItem = {
  slug: string;
  nameAr: string;
  nameEn: string;
  image: string;
  quantity: number;
  category?: string;
  unitPrice: number | null;
  lineTotal: number | null;
};

type CreatedOrder = {
  orderNumber: string;
  createdAt: string;
  customer: CustomerData;
  items: CreatedOrderItem[];
  totalItems: number;
  status: string;
  paymentMethod: PaymentMethod;
  subtotal: number;
};

type OrderApiRecord = {
  orderNumber?: unknown;
  createdAt?: unknown;
  status?: unknown;
};

type OrderApiResponse = {
  order?: OrderApiRecord;
  data?: OrderApiRecord;
  error?: unknown;
  message?: unknown;
};

const WHATSAPP_NUMBER =
  "201080040408";

const DIGITAL_PAYMENT_NUMBER =
  "01028266555";

function buildWhatsAppMessage(
  order: CreatedOrder,
) {
  const productLines =
    order.items
      .map(
        (item, index) =>
          `${index + 1}- ${item.nameAr} × ${item.quantity}`,
      )
      .join("\n");

  const optionalPhone =
    order.customer
      .alternativePhone
      ? `\nرقم بديل: ${order.customer.alternativePhone}`
      : "";

  const optionalNotes =
    order.customer.notes
      ? `\nملاحظات: ${order.customer.notes}`
      : "";

  return [
    "طلب جديد من موقع ArtVert Egypt 🌱",
    "",
    `رقم الطلب: ${order.orderNumber}`,
    `الاسم: ${order.customer.fullName}`,
    `الهاتف: ${order.customer.phone}${optionalPhone}`,
    `المحافظة: ${order.customer.governorate}`,
    `المدينة/المنطقة: ${order.customer.city}`,
    `العنوان: ${order.customer.address}${optionalNotes}`,
    "",
    "المنتجات:",
    productLines,
    "",
    `إجمالي عدد القطع: ${order.totalItems}`,
    "",
    "يرجى تأكيد السعر والشحن وموعد التوصيل.",
  ].join("\n");
}

function getApiRecord(
  responseBody: OrderApiResponse | null,
): OrderApiRecord | null {
  if (!responseBody) {
    return null;
  }

  if (responseBody.order) {
    return responseBody.order;
  }

  if (responseBody.data) {
    return responseBody.data;
  }

  return responseBody as OrderApiRecord;
}

function getApiErrorMessage(
  responseBody: OrderApiResponse | null,
  status: number,
) {
  if (
    responseBody &&
    typeof responseBody.error ===
      "string" &&
    responseBody.error.trim()
  ) {
    return responseBody.error.trim();
  }

  if (
    responseBody &&
    typeof responseBody.message ===
      "string" &&
    responseBody.message.trim()
  ) {
    return responseBody.message.trim();
  }

  if (status === 400) {
    return "بعض بيانات الطلب غير صحيحة. راجع البيانات وحاول مرة أخرى.";
  }

  if (status === 409) {
    return "تعذر إنشاء رقم طلب جديد. حاول مرة أخرى.";
  }

  if (status >= 500) {
    return "تعذر حفظ الطلب حاليًا بسبب مشكلة في الخادم. حاول مرة أخرى.";
  }

  return "تعذر تسجيل الطلب. راجع اتصال الإنترنت وحاول مرة أخرى.";
}

const translations = {
  AR: {
    cartStep: "السلة",
    detailsStep: "البيانات",
    confirmStep: "التأكيد",
    successTitle: "تم تسجيل طلبك بنجاح",
    successText:
      "تم حفظ الطلب داخل قاعدة البيانات. أرسل الطلب عبر واتساب حتى يتم تأكيد الأسعار وتكلفة الشحن وموعد التوصيل.",
    orderNumber: "رقم الطلب",
    totalItems: "إجمالي القطع",
    sendWhatsapp: "إرسال الطلب عبر واتساب",
    continueShopping: "متابعة التسوق",
    backHome: "العودة للرئيسية",
    emptyTitle: "لا توجد منتجات لإتمام الطلب",
    emptyText: "أضف منتجًا واحدًا على الأقل إلى السلة أولًا.",
    browseProducts: "تصفح المنتجات",
    finalStep: "الخطوة الأخيرة",
    checkout: "إتمام الطلب",
    checkoutIntro:
      "أدخل بيانات التواصل والتوصيل، ثم أكد الطلب لإرساله إلى فريق ArtVert.",
    customerData: "بيانات العميل",
    requiredData: "البيانات المطلوبة لتأكيد الطلب",
    orderFailed: "لم يتم تسجيل الطلب",
    fullName: "الاسم بالكامل *",
    fullNamePlaceholder: "اكتب الاسم بالكامل",
    phone: "رقم الهاتف *",
    alternativePhone: "رقم هاتف بديل",
    optional: "اختياري",
    governorate: "المحافظة *",
    selectGovernorate: "اختر المحافظة",
    city: "المدينة أو المنطقة *",
    cityPlaceholder: "مثال: المعادي",
    address: "العنوان بالتفصيل *",
    addressPlaceholder:
      "اسم الشارع، رقم العقار، الدور، الشقة وأقرب علامة مميزة",
    notes: "ملاحظات على الطلب",
    notesPlaceholder: "أي تفاصيل إضافية أو وقت مناسب للتواصل",
    shippingByGovernorate: "الشحن يُحدد حسب المحافظة.",
    dataUse: "بياناتك تستخدم لتأكيد الطلب فقط.",
    noCharge: "لا يتم خصم أي مبلغ الآن.",
    submitting: "جاري تسجيل الطلب...",
    confirmOrder: "تأكيد الطلب",
    orderSummary: "ملخص الطلب",
    reviewProducts: "راجع المنتجات قبل التأكيد",
    quantity: "الكمية:",
    finalConfirmation:
      "سيتم تأكيد السعر النهائي والعبوات وتكلفة الشحن قبل تجهيز الطلب.",
    editCart: "تعديل السلة",
    paymentMethod: "طريقة الدفع",
    paymentMethodText: "اختر الطريقة المناسبة لإتمام طلبك",
    cashOnDelivery: "الدفع عند الاستلام",
    cashOnDeliveryText: "ادفع قيمة الطلب عند استلامه.",
    vodafoneCash: "Vodafone Cash",
    vodafoneCashText: `حوّل على رقم Vodafone Cash: ${DIGITAL_PAYMENT_NUMBER}`,
    instapay: "InstaPay",
    instapayText: `حوّل عبر InstaPay على الرقم: ${DIGITAL_PAYMENT_NUMBER}`,
    bankTransfer: "تحويل بنكي",
    bankTransferText: "الدفع عن طريق التحويل البنكي.",
    invoice: "فاتورة الطلب",
    invoiceDate: "تاريخ الطلب",
    customerInfo: "بيانات العميل",
    payment: "طريقة الدفع",
    unitPrice: "سعر الوحدة",
    itemTotal: "الإجمالي",
    productsTotal: "إجمالي المنتجات",
    printInvoice: "طباعة الفاتورة",
  },
  EN: {
    cartStep: "Cart",
    detailsStep: "Details",
    confirmStep: "Confirmation",
    successTitle: "Your order has been registered successfully",
    successText:
      "Your order has been saved in our database. Send the order via WhatsApp so prices, shipping cost, and delivery time can be confirmed.",
    orderNumber: "Order Number",
    totalItems: "Total Items",
    sendWhatsapp: "Send Order via WhatsApp",
    continueShopping: "Continue Shopping",
    backHome: "Back to Home",
    emptyTitle: "There are no products to checkout",
    emptyText: "Add at least one product to your cart first.",
    browseProducts: "Browse Products",
    finalStep: "Final Step",
    checkout: "Checkout",
    checkoutIntro:
      "Enter your contact and delivery details, then confirm the order to send it to the ArtVert team.",
    customerData: "Customer Details",
    requiredData: "Information required to confirm your order",
    orderFailed: "Order was not registered",
    fullName: "Full Name *",
    fullNamePlaceholder: "Enter your full name",
    phone: "Phone Number *",
    alternativePhone: "Alternative Phone",
    optional: "Optional",
    governorate: "Governorate *",
    selectGovernorate: "Select Governorate",
    city: "City or Area *",
    cityPlaceholder: "Example: Maadi",
    address: "Detailed Address *",
    addressPlaceholder:
      "Street name, building number, floor, apartment, and nearest landmark",
    notes: "Order Notes",
    notesPlaceholder: "Any additional details or preferred contact time",
    shippingByGovernorate: "Shipping is determined by governorate.",
    dataUse: "Your data is used only to confirm the order.",
    noCharge: "No payment is charged now.",
    submitting: "Registering order...",
    confirmOrder: "Confirm Order",
    orderSummary: "Order Summary",
    reviewProducts: "Review your products before confirmation",
    quantity: "Quantity:",
    finalConfirmation:
      "The final price, package sizes, and shipping cost will be confirmed before preparing your order.",
    editCart: "Edit Cart",
    paymentMethod: "Payment Method",
    paymentMethodText: "Choose the payment method that suits you",
    cashOnDelivery: "Cash on Delivery",
    cashOnDeliveryText: "Pay for your order when it is delivered.",
    vodafoneCash: "Vodafone Cash",
    vodafoneCashText: `Transfer to Vodafone Cash: ${DIGITAL_PAYMENT_NUMBER}`,
    instapay: "InstaPay",
    instapayText: `Transfer via InstaPay to: ${DIGITAL_PAYMENT_NUMBER}`,
    bankTransfer: "Bank Transfer",
    bankTransferText: "Pay by bank transfer.",
    invoice: "Order Invoice",
    invoiceDate: "Order Date",
    customerInfo: "Customer Details",
    payment: "Payment Method",
    unitPrice: "Unit Price",
    itemTotal: "Total",
    productsTotal: "Products Total",
    printInvoice: "Print Invoice",
  },
} as const;

function CheckoutSteps({ isArabic }: { isArabic: boolean }) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2 rounded-2xl border border-white/10 bg-white/[.03] p-3 sm:p-4">
      <div className="flex min-w-0 items-center gap-2">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-lime-300 text-[#071109]">
          <CircleCheck size={17} />
        </span>
        <span className="truncate text-xs font-black text-white sm:text-sm">
          {isArabic ? translations.AR.cartStep : translations.EN.cartStep}
        </span>
      </div>

      <span className="h-px w-5 bg-lime-300/50 sm:w-10" />

      <div className="flex min-w-0 items-center gap-2">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-lime-300/35 bg-lime-300/10 text-lime-300">
          2
        </span>
        <span className="truncate text-xs font-black text-lime-300 sm:text-sm">
          {isArabic ? translations.AR.detailsStep : translations.EN.detailsStep}
        </span>
      </div>

      <span className="h-px w-5 bg-white/10 sm:w-10" />

      <div className="flex min-w-0 items-center gap-2">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[.03] text-white/40">
          3
        </span>
        <span className="truncate text-xs font-black text-white/40 sm:text-sm">
          {isArabic ? translations.AR.confirmStep : translations.EN.confirmStep}
        </span>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const { locale, isArabic } = useLanguage();
  const t = translations[locale];

  const [catalogPrices, setCatalogPrices] = useState<CatalogPriceProduct[]>([]);
  const [pricesReady, setPricesReady] = useState(false);
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("CASH_ON_DELIVERY");

  const {
    items,
    totalItems,
    isReady,
    clearCart,
  } = useCart();

  useEffect(() => {
    let active = true;

    async function loadPrices() {
      try {
        const response = await fetch("/api/products", {
          method: "GET",
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Unable to load product prices.");
        const data = (await response.json()) as CatalogPriceProduct[];
        if (active && Array.isArray(data)) setCatalogPrices(data);
      } catch {
        if (active) setCatalogPrices([]);
      } finally {
        if (active) setPricesReady(true);
      }
    }

    void loadPrices();
    return () => { active = false; };
  }, []);

  const priceBySlug = useMemo(
    () => new Map(catalogPrices.map((product) => [product.slug, product.price])),
    [catalogPrices],
  );

  const subtotal = useMemo(
    () => items.reduce((total, item) => {
      const price = priceBySlug.get(item.slug);
      return total + (typeof price === "number" ? price * item.quantity : 0);
    }, 0),
    [items, priceBySlug],
  );

  const formatPrice = (value: number) =>
    new Intl.NumberFormat(isArabic ? "ar-EG" : "en-EG", {
      style: "currency",
      currency: "EGP",
      maximumFractionDigits: 2,
    }).format(value);

  const paymentMethodLabel = (method: PaymentMethod) => {
    switch (method) {
      case "VODAFONE_CASH":
        return t.vodafoneCash;
      case "INSTAPAY":
        return t.instapay;
      case "BANK_TRANSFER":
        return t.bankTransfer;
      default:
        return t.cashOnDelivery;
    }
  };

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    submitError,
    setSubmitError,
  ] = useState("");

  const [
    createdOrder,
    setCreatedOrder,
  ] =
    useState<CreatedOrder | null>(
      null,
    );

  const whatsappUrl =
    useMemo(() => {
      if (!createdOrder) {
        return "";
      }

      const message =
        buildWhatsAppMessage(
          createdOrder,
        );

      return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
        message,
      )}`;
    }, [createdOrder]);

  async function submitOrder(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      items.length === 0 ||
      submitting
    ) {
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    const formData =
      new FormData(
        event.currentTarget,
      );

    const customer: CustomerData =
      {
        fullName: String(
          formData.get(
            "fullName",
          ) || "",
        ).trim(),
        phone: String(
          formData.get(
            "phone",
          ) || "",
        ).trim(),
        alternativePhone:
          String(
            formData.get(
              "alternativePhone",
            ) || "",
          ).trim(),
        governorate: String(
          formData.get(
            "governorate",
          ) || "",
        ).trim(),
        city: String(
          formData.get(
            "city",
          ) || "",
        ).trim(),
        address: String(
          formData.get(
            "address",
          ) || "",
        ).trim(),
        notes: String(
          formData.get(
            "notes",
          ) || "",
        ).trim(),
      };

    const orderItems: CreatedOrderItem[] =
      items.map((item) => {
        const unitPrice =
          typeof priceBySlug.get(item.slug) === "number"
            ? (priceBySlug.get(item.slug) as number)
            : null;

        return {
          slug: item.slug,
          nameAr:
            item.nameAr,
          nameEn:
            item.nameEn,
          image: item.image,
          quantity:
            item.quantity,
          category:
            item.category,
          unitPrice,
          lineTotal:
            unitPrice === null
              ? null
              : unitPrice * item.quantity,
        };
      });

    try {
      const response =
        await fetch(
          "/api/orders",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            cache:
              "no-store",
            body: JSON.stringify({
              customer,
              items:
                orderItems,
              paymentMethod,
            }),
          },
        );

      const responseBody =
        (await response
          .json()
          .catch(
            () => null,
          )) as OrderApiResponse | null;

      if (!response.ok) {
        throw new Error(
          getApiErrorMessage(
            responseBody,
            response.status,
          ),
        );
      }

      const savedOrder =
        getApiRecord(
          responseBody,
        );

      if (
        !savedOrder ||
        typeof savedOrder.orderNumber !==
          "string" ||
        !savedOrder.orderNumber.trim()
      ) {
        throw new Error(
          "تم إرسال الطلب، لكن الخادم لم يُرجع رقم الطلب بصورة صحيحة.",
        );
      }

      const createdAt =
        typeof savedOrder.createdAt ===
          "string" &&
        savedOrder.createdAt.trim()
          ? savedOrder.createdAt
          : new Date().toISOString();

      const status =
        typeof savedOrder.status ===
          "string" &&
        savedOrder.status.trim()
          ? savedOrder.status
          : "PENDING";

      setCreatedOrder({
        orderNumber:
          savedOrder.orderNumber.trim(),
        createdAt,
        customer,
        items: orderItems,
        totalItems,
        status,
        paymentMethod,
        subtotal,
      });

      clearCart();

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "حدث خطأ غير متوقع أثناء تسجيل الطلب.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!isReady) {
    return (
      <main
        className="relative min-h-screen overflow-hidden bg-[#061008] px-3 py-10 text-white font-sans sm:px-6 sm:py-14"
        dir="rtl"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(200,243,63,.06),transparent_42%)]" />

        <div className="relative z-10 mx-auto max-w-6xl">
          <div className="h-10 w-60 animate-pulse rounded-xl bg-white/[.06]" />

          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
            <div className="h-[620px] animate-pulse rounded-[28px] bg-[#0b1a0e]/50 backdrop-blur-md" />
            <div className="h-[460px] animate-pulse rounded-[28px] bg-[#0b1a0e]/50 backdrop-blur-md" />
          </div>
        </div>
      </main>
    );
  }

  if (createdOrder) {
    return (
      <main
        className="relative grid min-h-[calc(100vh-76px)] place-items-center overflow-hidden bg-[#061008] px-3 py-12 text-white font-sans sm:px-6 sm:py-16"
        dir="rtl"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(200,243,63,.09),transparent_48%)]" />

        <section className="relative z-10 w-full max-w-2xl rounded-[28px] border border-lime-300/20 bg-[#0b1a0e]/95 p-6 text-center shadow-[0_0_45px_rgba(200,243,63,0.13)] backdrop-blur-xl sm:rounded-[32px] sm:p-10">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-lime-300 text-[#071109] shadow-[0_15px_45px_rgba(200,243,63,.35)]">
            <CheckCircle2
              aria-hidden="true"
              size={42}
            />
          </div>

          <h1 className="mt-6 text-2xl font-black text-white sm:text-4xl">
            {t.successTitle}
          </h1>

          <p className="mx-auto mt-4 max-w-lg text-sm leading-8 text-white/68 sm:text-base">
            {t.successText}
          </p>

          <div className="mx-auto mt-6 max-w-md rounded-2xl border border-lime-300/15 bg-lime-300/[.06] p-5">
            <span className="text-sm text-white/60">
              {t.orderNumber}
            </span>

            <strong
              className="mt-2 block text-xl font-black text-lime-300"
              dir="ltr"
            >
              {
                createdOrder.orderNumber
              }
            </strong>

            <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4 text-sm">
              <span className="text-white/60">
                {t.totalItems}
              </span>

              <strong className="text-white">
                {
                  createdOrder.totalItems
                }
              </strong>
            </div>
          </div>

          <section
            id="artvert-invoice"
            className="mt-6 rounded-[24px] border border-white/10 bg-white/[.025] p-4 text-right sm:p-6"
          >
            <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-lime-300/10 text-lime-300">
                  <ReceiptText size={20} />
                </div>

                <div>
                  <h2 className="text-lg font-black text-white">
                    {t.invoice}
                  </h2>

                  <p className="mt-1 text-xs text-white/45" dir="ltr">
                    {createdOrder.orderNumber}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-lime-300/20 bg-lime-300/10 px-4 text-xs font-black text-lime-300 transition hover:bg-lime-300/15"
              >
                <Printer size={16} />
                {t.printInvoice}
              </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/[.06] bg-white/[.02] p-4">
                <p className="text-xs font-bold text-white/40">
                  {t.invoiceDate}
                </p>
                <p className="mt-2 text-sm font-black text-white">
                  {new Intl.DateTimeFormat(
                    isArabic ? "ar-EG" : "en-EG",
                    {
                      dateStyle: "medium",
                      timeStyle: "short",
                    },
                  ).format(new Date(createdOrder.createdAt))}
                </p>
              </div>

              <div className="rounded-2xl border border-white/[.06] bg-white/[.02] p-4">
                <p className="text-xs font-bold text-white/40">
                  {t.payment}
                </p>
                <p className="mt-2 text-sm font-black text-lime-300">
                  {paymentMethodLabel(createdOrder.paymentMethod)}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-white/[.06] bg-white/[.02] p-4">
              <p className="text-xs font-bold text-white/40">
                {t.customerInfo}
              </p>

              <div className="mt-3 grid gap-2 text-sm text-white/72 sm:grid-cols-2">
                <p>
                  <strong className="text-white">
                    {createdOrder.customer.fullName}
                  </strong>
                </p>
                <p dir="ltr" className="text-right">
                  {createdOrder.customer.phone}
                </p>
                <p>
                  {createdOrder.customer.governorate} - {createdOrder.customer.city}
                </p>
                <p>
                  {createdOrder.customer.address}
                </p>
              </div>
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-white/[.06]">
              <div className="grid grid-cols-[minmax(0,1fr)_70px_110px_110px] gap-2 bg-white/[.05] px-3 py-3 text-[11px] font-black text-white/55">
                <span>{isArabic ? "المنتج" : "Product"}</span>
                <span className="text-center">{t.quantity}</span>
                <span className="text-center">{t.unitPrice}</span>
                <span className="text-center">{t.itemTotal}</span>
              </div>

              <div className="divide-y divide-white/[.06]">
                {createdOrder.items.map((item) => (
                  <div
                    key={item.slug}
                    className="grid grid-cols-[minmax(0,1fr)_70px_110px_110px] items-center gap-2 px-3 py-3 text-xs"
                  >
                    <span className="min-w-0 truncate font-bold text-white">
                      {isArabic ? item.nameAr : item.nameEn}
                    </span>

                    <span className="text-center font-black text-lime-300">
                      {item.quantity}
                    </span>

                    <span className="text-center text-white/65">
                      {item.unitPrice === null
                        ? "-"
                        : formatPrice(item.unitPrice)}
                    </span>

                    <span className="text-center font-black text-white">
                      {item.lineTotal === null
                        ? "-"
                        : formatPrice(item.lineTotal)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-2xl border border-lime-300/15 bg-lime-300/[.05] p-4">
              <span className="font-black text-white/75">
                {t.productsTotal}
              </span>

              <strong className="text-xl font-black text-lime-300">
                {formatPrice(createdOrder.subtotal)}
              </strong>
            </div>
          </section>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-7 flex min-h-[54px] w-full items-center justify-center gap-2 rounded-xl bg-[#21a366] px-6 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#27b875] sm:text-base"
          >
            <MessageCircle
              aria-hidden="true"
              size={21}
            />
            {t.sendWhatsapp}
          </a>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Link
              href="/products"
              className="flex min-h-12 items-center justify-center rounded-xl border border-white/10 bg-white/[.04] px-5 font-bold text-white/75 transition hover:border-lime-300/35 hover:text-white"
            >
              {t.continueShopping}
            </Link>

            <Link
              href="/"
              className="flex min-h-12 items-center justify-center rounded-xl border border-white/10 bg-white/[.04] px-5 font-bold text-white/75 transition hover:border-lime-300/35 hover:text-white"
            >
              {t.backHome}
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main
        className="relative grid min-h-[calc(100vh-76px)] place-items-center overflow-hidden bg-[#061008] px-3 py-12 text-white font-sans sm:px-6 sm:py-16"
        dir="rtl"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(200,243,63,.07),transparent_50%)]" />

        <section className="relative z-10 w-full max-w-xl rounded-[28px] border border-lime-300/20 bg-[#0b1a0e]/95 p-6 text-center shadow-[0_0_40px_rgba(200,243,63,0.12)] backdrop-blur-xl sm:rounded-[32px] sm:p-8">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-lime-300/10 text-lime-300 shadow-[0_0_20px_rgba(200,243,63,0.18)]">
            <ShoppingBag
              aria-hidden="true"
              size={38}
            />
          </div>

          <h1 className="mt-6 text-2xl font-black text-white sm:text-3xl">
            {t.emptyTitle}
          </h1>

          <p className="mt-3 text-sm leading-7 text-white/58 sm:text-base">
            {t.emptyText}
          </p>

          <Link
            href="/products"
            className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-lime-300 px-6 font-black text-[#071109] shadow-[0_8px_25px_rgba(200,243,63,0.22)] transition hover:-translate-y-0.5 hover:bg-lime-200 sm:w-auto"
          >
            {t.browseProducts}
            <ArrowLeft
              aria-hidden="true"
              size={18}
            />
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-[#061008] px-3 py-10 text-white font-sans sm:px-6 sm:py-14"
      dir="rtl"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(200,243,63,.3) 1px,transparent 1px),linear-gradient(90deg,rgba(200,243,63,.3) 1px,transparent 1px)",
          backgroundSize:
            "50px 50px",
        }}
      />

      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_14%_8%,rgba(200,243,63,.06),transparent_28%),radial-gradient(circle_at_88%_15%,rgba(38,164,83,.08),transparent_30%)]" />

      <div className="relative z-10 mx-auto max-w-7xl">
        <CheckoutSteps isArabic={isArabic} />

        <div className="mt-7">
          <span className="text-sm font-bold text-lime-300">
            {t.finalStep}
          </span>

          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            {t.checkout}
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/58 sm:text-base">
            {t.checkoutIntro}
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:mt-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8">
          <form
            onSubmit={submitOrder}
            className="rounded-[28px] border border-lime-300/15 bg-[#0b1a0e]/95 p-4 shadow-[0_0_30px_rgba(200,243,63,0.08)] backdrop-blur-xl sm:p-7"
          >
            <div className="flex items-center gap-3 border-b border-white/10 pb-5">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-lime-300/10 text-lime-300">
                <User
                  aria-hidden="true"
                  size={23}
                />
              </div>

              <div>
                <h2 className="text-xl font-black">
                  {t.customerData}
                </h2>

                <p className="mt-1 text-xs text-white/55">
                  {t.requiredData}
                </p>
              </div>
            </div>

            {submitError ? (
              <div
                className="mt-6 flex items-start gap-3 rounded-2xl border border-red-400/25 bg-red-500/10 p-4 text-sm leading-7 text-red-100"
                role="alert"
                aria-live="assertive"
              >
                <AlertCircle
                  aria-hidden="true"
                  size={21}
                  className="mt-1 shrink-0 text-red-300"
                />

                <div>
                  <strong className="block font-black">
                    {t.orderFailed}
                  </strong>

                  <p className="mt-1 text-red-100/80">
                    {
                      submitError
                    }
                  </p>
                </div>
              </div>
            ) : null}

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-2 block text-sm font-bold text-white/80">
                  {t.fullName}
                </span>

                <input
                  required
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  maxLength={120}
                  disabled={
                    submitting
                  }
                  placeholder={t.fullNamePlaceholder}
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 text-white outline-none transition placeholder:text-white/25 focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </label>

              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-bold text-white/80">
                  <Phone
                    aria-hidden="true"
                    size={15}
                    className="text-lime-300"
                  />
                  {t.phone}
                </span>

                <input
                  required
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  pattern="[0-9+ ]{10,16}"
                  maxLength={16}
                  disabled={
                    submitting
                  }
                  placeholder="01xxxxxxxxx"
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 text-left text-white outline-none transition placeholder:text-white/25 focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10 disabled:cursor-not-allowed disabled:opacity-60"
                  dir="ltr"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-white/80">
                  {t.alternativePhone}
                </span>

                <input
                  name="alternativePhone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  pattern="[0-9+ ]{10,16}"
                  maxLength={16}
                  disabled={
                    submitting
                  }
                  placeholder={t.optional}
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 text-left text-white outline-none transition placeholder:text-white/25 focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10 disabled:cursor-not-allowed disabled:opacity-60"
                  dir="ltr"
                />
              </label>

              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-bold text-white/80">
                  <MapPin
                    aria-hidden="true"
                    size={15}
                    className="text-lime-300"
                  />
                  {t.governorate}
                </span>

                <select
                  required
                  name="governorate"
                  defaultValue=""
                  disabled={
                    submitting
                  }
                  className="h-12 w-full rounded-xl border border-white/10 bg-[#08140c] px-4 text-white outline-none transition focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option
                    value=""
                    disabled
                  >
                    {t.selectGovernorate}
                  </option>

                  {EGYPT_GOVERNORATES.map(
                    (governorate) => (
                      <option
                        key={
                          governorate
                        }
                        value={
                          governorate
                        }
                      >
                        {
                          isArabic
                            ? governorate
                            : EGYPT_GOVERNORATES_EN[governorate] ?? governorate
                        }
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-white/80">
                  {t.city}
                </span>

                <input
                  required
                  name="city"
                  type="text"
                  autoComplete="address-level2"
                  maxLength={120}
                  disabled={
                    submitting
                  }
                  placeholder={t.cityPlaceholder}
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 text-white outline-none transition placeholder:text-white/25 focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-2 block text-sm font-bold text-white/80">
                  {t.address}
                </span>

                <textarea
                  required
                  name="address"
                  autoComplete="street-address"
                  rows={4}
                  maxLength={500}
                  disabled={
                    submitting
                  }
                  placeholder={t.addressPlaceholder}
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/[.04] p-4 text-white outline-none transition placeholder:text-white/25 focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-2 block text-sm font-bold text-white/80">
                  {t.notes}
                </span>

                <textarea
                  name="notes"
                  rows={3}
                  maxLength={1000}
                  disabled={
                    submitting
                  }
                  placeholder={t.notesPlaceholder}
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/[.04] p-4 text-white outline-none transition placeholder:text-white/25 focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </label>
            </div>

            <section className="mt-6 rounded-[24px] border border-white/10 bg-white/[.025] p-4 sm:p-5">
              <div>
                <h3 className="text-lg font-black text-white">
                  {t.paymentMethod}
                </h3>

                <p className="mt-1 text-xs leading-6 text-white/50">
                  {t.paymentMethodText}
                </p>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label
                  className={[
                    "flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition",
                    paymentMethod === "CASH_ON_DELIVERY"
                      ? "border-lime-300/45 bg-lime-300/[.08]"
                      : "border-white/[.07] bg-white/[.025] hover:border-lime-300/20",
                  ].join(" ")}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="CASH_ON_DELIVERY"
                    checked={paymentMethod === "CASH_ON_DELIVERY"}
                    onChange={() => setPaymentMethod("CASH_ON_DELIVERY")}
                    disabled={submitting}
                    className="mt-1 h-4 w-4 accent-lime-300"
                  />

                  <Banknote
                    size={20}
                    className="mt-0.5 shrink-0 text-lime-300"
                  />

                  <span>
                    <strong className="block text-sm font-black text-white">
                      {t.cashOnDelivery}
                    </strong>
                    <span className="mt-1 block text-xs leading-6 text-white/45">
                      {t.cashOnDeliveryText}
                    </span>
                  </span>
                </label>

                <label
                  className={[
                    "flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition",
                    paymentMethod === "VODAFONE_CASH"
                      ? "border-lime-300/45 bg-lime-300/[.08]"
                      : "border-white/[.07] bg-white/[.025] hover:border-lime-300/20",
                  ].join(" ")}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="VODAFONE_CASH"
                    checked={paymentMethod === "VODAFONE_CASH"}
                    onChange={() => setPaymentMethod("VODAFONE_CASH")}
                    disabled={submitting}
                    className="mt-1 h-4 w-4 accent-lime-300"
                  />

                  <Smartphone
                    size={20}
                    className="mt-0.5 shrink-0 text-lime-300"
                  />

                  <span>
                    <strong className="block text-sm font-black text-white">
                      {t.vodafoneCash}
                    </strong>
                    <span className="mt-1 block text-xs leading-6 text-white/45">
                      {t.vodafoneCashText}
                    </span>
                  </span>
                </label>

                <label
                  className={[
                    "flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition",
                    paymentMethod === "INSTAPAY"
                      ? "border-lime-300/45 bg-lime-300/[.08]"
                      : "border-white/[.07] bg-white/[.025] hover:border-lime-300/20",
                  ].join(" ")}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="INSTAPAY"
                    checked={paymentMethod === "INSTAPAY"}
                    onChange={() => setPaymentMethod("INSTAPAY")}
                    disabled={submitting}
                    className="mt-1 h-4 w-4 accent-lime-300"
                  />

                  <WalletCards
                    size={20}
                    className="mt-0.5 shrink-0 text-lime-300"
                  />

                  <span>
                    <strong className="block text-sm font-black text-white">
                      {t.instapay}
                    </strong>
                    <span className="mt-1 block text-xs leading-6 text-white/45">
                      {t.instapayText}
                    </span>
                  </span>
                </label>

                <label
                  className={[
                    "flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition",
                    paymentMethod === "BANK_TRANSFER"
                      ? "border-lime-300/45 bg-lime-300/[.08]"
                      : "border-white/[.07] bg-white/[.025] hover:border-lime-300/20",
                  ].join(" ")}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="BANK_TRANSFER"
                    checked={paymentMethod === "BANK_TRANSFER"}
                    onChange={() => setPaymentMethod("BANK_TRANSFER")}
                    disabled={submitting}
                    className="mt-1 h-4 w-4 accent-lime-300"
                  />

                  <Landmark
                    size={20}
                    className="mt-0.5 shrink-0 text-lime-300"
                  />

                  <span>
                    <strong className="block text-sm font-black text-white">
                      {t.bankTransfer}
                    </strong>
                    <span className="mt-1 block text-xs leading-6 text-white/45">
                      {t.bankTransferText}
                    </span>
                  </span>
                </label>
              </div>
            </section>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="flex items-start gap-3 rounded-2xl border border-white/[.06] bg-white/[.025] p-3">
                <Truck
                  size={18}
                  className="mt-0.5 shrink-0 text-lime-300"
                />
                <p className="text-xs leading-6 text-white/52">
                  {t.shippingByGovernorate}
                </p>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-white/[.06] bg-white/[.025] p-3">
                <ShieldCheck
                  size={18}
                  className="mt-0.5 shrink-0 text-lime-300"
                />
                <p className="text-xs leading-6 text-white/52">
                  {t.dataUse}
                </p>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-white/[.06] bg-white/[.025] p-3">
                <PackageCheck
                  size={18}
                  className="mt-0.5 shrink-0 text-lime-300"
                />
                <p className="text-xs leading-6 text-white/52">
                  {t.noCharge}
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 flex min-h-[54px] w-full items-center justify-center gap-2 rounded-xl bg-lime-300 px-6 text-sm font-black text-[#071109] shadow-[0_8px_20px_rgba(200,243,63,0.2)] transition hover:-translate-y-0.5 hover:bg-lime-200 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 sm:text-base"
            >
              <PackageCheck
                aria-hidden="true"
                size={21}
              />

              {submitting
                ? t.submitting
                : t.confirmOrder}
            </button>
          </form>

          <aside className="h-fit rounded-[28px] border border-lime-300/20 bg-[#0b1a0e]/95 p-5 shadow-[0_0_30px_rgba(200,243,63,0.12)] backdrop-blur-xl sm:p-6 lg:sticky lg:top-24">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-lime-300/10 text-lime-300">
                <ShoppingBag size={21} />
              </div>

              <div>
                <h2 className="text-xl font-black text-white sm:text-2xl">
                  {t.orderSummary}
                </h2>
                <p className="mt-1 text-xs text-white/40">
                  {t.reviewProducts}
                </p>
              </div>
            </div>

            <div className="mt-6 max-h-[430px] space-y-3 overflow-y-auto border-b border-white/10 pb-6 pl-1">
              {items.map((item) => (
                <article
                  key={item.slug}
                  className="grid grid-cols-[72px_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-white/[.06] bg-white/[.025] p-3"
                >
                  <Link
                    href={`/products/${item.slug}`}
                    className="relative h-[72px] overflow-hidden rounded-xl border border-white/[.06] bg-white"
                  >
                    <Image
                      src={item.image}
                      alt={isArabic ? item.nameAr : item.nameEn}
                      fill
                      sizes="72px"
                      className="object-contain p-1.5"
                    />
                  </Link>

                  <div className="min-w-0">
                    <Link
                      href={`/products/${item.slug}`}
                      className="block truncate text-sm font-black text-white transition hover:text-lime-300"
                    >
                      {
                        isArabic ? item.nameAr : item.nameEn
                      }
                    </Link>

                    <p
                      dir="ltr"
                      className="mt-1 truncate text-[10px] font-bold uppercase tracking-[.09em] text-white/35"
                    >
                      {
                        isArabic ? item.nameEn : item.nameAr
                      }
                    </p>

                    <span className="mt-2 block text-xs text-white/55">
                      الكمية:{" "}
                      <strong className="text-lime-300">
                        {
                          item.quantity
                        }
                      </strong>
                    </span>
                    <span className="mt-2 block text-xs font-bold text-lime-300">
                      {typeof priceBySlug.get(item.slug) === "number"
                        ? formatPrice((priceBySlug.get(item.slug) as number) * item.quantity)
                        : pricesReady
                        ? isArabic ? "السعر غير متاح" : "Price unavailable"
                        : "..."}
                    </span>

                  </div>

                  <span className="grid h-8 min-w-8 place-items-center rounded-full bg-lime-300/10 px-2 text-xs font-black text-lime-300">
                    {
                      item.quantity
                    }
                  </span>
                </article>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-between pt-1">
              <span className="text-white/70">
                {t.totalItems}
              </span>

              <strong className="text-2xl font-black text-lime-300">
                {
                  totalItems
                }
              </strong>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
              <span className="font-bold text-white/70">
                {isArabic ? "إجمالي المنتجات" : "Products Total"}
              </span>
              <strong className="text-xl font-black text-lime-300">
                {pricesReady ? formatPrice(subtotal) : "..."}
              </strong>
            </div>

            <div className="mt-5 rounded-2xl border border-lime-300/15 bg-lime-300/[.05] p-4 text-xs leading-6 text-white/58">
              {t.finalConfirmation}
            </div>

            <Link
              href="/cart"
              className="mt-5 flex min-h-11 items-center justify-center rounded-xl border border-white/10 bg-white/[.04] px-5 text-sm font-bold text-white/75 transition hover:border-lime-300/35 hover:bg-white/[.08] hover:text-white"
            >
              {t.editCart}
            </Link>
          </aside>
        </div>
      </div>
    </main>
  );
}
