"use client";

import Link from "next/link";
import {
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  CheckCircle2,
  Crown,
  FileText,
  GripVertical,
  ImageIcon,
  Images,
  Link2,
  Loader2,
  Package,
  Plus,
  RotateCcw,
  Save,
  Sparkles,
  Tags,
  Trash2,
  UploadCloud,
  WalletCards,
  Wheat,
  ZoomIn,
} from "lucide-react";

type PublicationState =
  | "DRAFT"
  | "PUBLISHED"
  | "ARCHIVED";

type ImageFit =
  | "COVER"
  | "CONTAIN"
  | "FILL"
  | "SCALE_DOWN";

type ImagePosition =
  | "CENTER"
  | "TOP"
  | "BOTTOM"
  | "LEFT"
  | "RIGHT";

type InitialProductImage = {
  id: string;
  url: string;
  alt: string;
  sortOrder: number;
  isPrimary?: boolean;
  objectFit?: ImageFit;
  objectPosition?: ImagePosition;
  zoom?: number;
  cropX?: number;
  cropY?: number;
  rotation?: number;
};

type InitialProductData = {
  id: string;
  slug: string;
  category: string;
  nameAr: string;
  nameEn: string;
  shortDescription: string;
  description: string;
  composition: string;
  dosage: string;
  packageSize: string;
  price: string;
  comparePrice: string | null;
  publicationState: PublicationState;
  aliases: string[];
  benefits: string[];
  crops: string[];
  images: InitialProductImage[];
};

type ProductEditFormProps = {
  product: InitialProductData;
};

type ProductFormState = {
  slug: string;
  category: string;
  nameAr: string;
  nameEn: string;
  shortDescription: string;
  description: string;
  composition: string;
  dosage: string;
  packageSize: string;
  price: string;
  comparePrice: string;
  publicationState: PublicationState;
};

type GalleryImage = {
  clientId: string;
  id?: string;
  url: string;
  alt: string;
  sortOrder: number;
  isPrimary: boolean;
  objectFit: ImageFit;
  objectPosition: ImagePosition;
  zoom: number;
  cropX: number;
  cropY: number;
  rotation: number;
};

type ProductApiResponse = {
  success?: boolean;
  message?: string;
  error?: string;
  product?: {
    id?: string;
    slug?: string;
    nameAr?: string;
    updatedAt?: string;
  };
};

type FeedbackState =
  | {
      type: "success";
      message: string;
    }
  | {
      type: "error";
      message: string;
    }
  | null;

type UploadApiResponse = {
  success?: boolean;
  message?: string;
  error?: string;
  image?: {
    url: string;
    pathname?: string;
    originalName?: string;
    contentType?: string;
    size?: number;
  };
};

const MAX_IMAGES = 20;

const PRODUCT_CATEGORIES = [
  "أسمدة مركبة",
  "أسمدة ورقية",
  "محفزات نمو",
  "عناصر صغرى",
  "مبيدات حشرية",
  "مبيدات فطرية",
  "محسنات تربة",
  "تجذير",
  "زراعة منزلية",
  "نباتات زينة",
] as const;

const IMAGE_FITS: Array<{
  value: ImageFit;
  label: string;
}> = [
  { value: "COVER", label: "ملء البرواز مع قص الأطراف" },
  { value: "CONTAIN", label: "إظهار الصورة كاملة" },
  { value: "FILL", label: "تمديد الصورة داخل البرواز" },
  { value: "SCALE_DOWN", label: "تصغير عند الحاجة" },
];

const IMAGE_POSITIONS: Array<{
  value: ImagePosition;
  label: string;
}> = [
  { value: "CENTER", label: "المنتصف" },
  { value: "TOP", label: "أعلى" },
  { value: "BOTTOM", label: "أسفل" },
  { value: "LEFT", label: "يسار" },
  { value: "RIGHT", label: "يمين" },
];

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function splitLines(value: string) {
  return Array.from(
    new Set(
      value
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

function normalizeMoneyInput(value: string) {
  const normalized = value
    .replace(/[^\d.]/g, "")
    .replace(/(\..*)\./g, "$1");

  const [whole = "", decimals] =
    normalized.split(".");
  const safeWhole = whole.slice(0, 8);

  if (decimals === undefined) {
    return safeWhole;
  }

  return `${safeWhole}.${decimals.slice(0, 2)}`;
}

function parseMoney(value: string) {
  const normalized = value.trim();

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return Math.round(parsed * 100) / 100;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function createClientId() {
  if (
    typeof crypto !== "undefined" &&
    "randomUUID" in crypto
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function normalizeGalleryImages(
  product: InitialProductData,
): GalleryImage[] {
  const ordered = [...product.images].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );

  const primaryIndex = ordered.findIndex(
    (image) => image.isPrimary,
  );

  return ordered.map((image, index) => ({
    clientId: image.id || createClientId(),
    id: image.id,
    url: image.url,
    alt:
      image.alt ||
      `${product.nameAr} - ${index + 1}`,
    sortOrder: index,
    isPrimary:
      primaryIndex >= 0
        ? index === primaryIndex
        : index === 0,
    objectFit: image.objectFit ?? "CONTAIN",
    objectPosition:
      image.objectPosition ?? "CENTER",
    zoom: clamp(image.zoom ?? 100, 50, 200),
    cropX: clamp(image.cropX ?? 0, -100, 100),
    cropY: clamp(image.cropY ?? 0, -100, 100),
    rotation: clamp(
      image.rotation ?? 0,
      -180,
      180,
    ),
  }));
}

function clamp(
  value: number,
  minimum: number,
  maximum: number,
) {
  if (!Number.isFinite(value)) {
    return minimum;
  }

  return Math.min(
    maximum,
    Math.max(minimum, Math.round(value)),
  );
}

function getObjectFit(
  value: ImageFit,
):
  | "cover"
  | "contain"
  | "fill"
  | "scale-down" {
  switch (value) {
    case "COVER":
      return "cover";
    case "FILL":
      return "fill";
    case "SCALE_DOWN":
      return "scale-down";
    default:
      return "contain";
  }
}

function getObjectPosition(
  value: ImagePosition,
) {
  switch (value) {
    case "TOP":
      return "center top";
    case "BOTTOM":
      return "center bottom";
    case "LEFT":
      return "left center";
    case "RIGHT":
      return "right center";
    default:
      return "center center";
  }
}

function isValidImageUrl(value: string) {
  const url = value.trim();

  return (
    url.startsWith("/") ||
    url.startsWith("https://") ||
    url.startsWith("http://")
  );
}

function serializeGallery(
  images: GalleryImage[],
) {
  return images.map((image, index) => ({
    id: image.id ?? null,
    url: image.url.trim(),
    alt: image.alt.trim(),
    sortOrder: index,
    isPrimary: image.isPrimary,
    objectFit: image.objectFit,
    objectPosition: image.objectPosition,
    zoom: image.zoom,
    cropX: image.cropX,
    cropY: image.cropY,
    rotation: image.rotation,
  }));
}

function getApiErrorMessage(
  response: ProductApiResponse | null,
  status: number,
) {
  if (
    response &&
    typeof response.message === "string" &&
    response.message.trim()
  ) {
    return response.message.trim();
  }

  if (
    response &&
    typeof response.error === "string" &&
    response.error.trim()
  ) {
    return response.error.trim();
  }

  if (status === 400) {
    return "راجع بيانات المنتج وتأكد من صحة الحقول.";
  }

  if (status === 401) {
    return "انتهت جلسة تسجيل الدخول. سجل الدخول مرة أخرى.";
  }

  if (status === 403) {
    return "ليس لديك صلاحية لتعديل المنتجات.";
  }

  if (status === 404) {
    return "المنتج غير موجود.";
  }

  if (status === 409) {
    return "يوجد تعارض في بيانات المنتج أو روابط الصور.";
  }

  if (status >= 500) {
    return "تعذر حفظ التعديلات بسبب مشكلة في الخادم.";
  }

  return "تعذر تعديل المنتج. حاول مرة أخرى.";
}

function buildInitialForm(
  product: InitialProductData,
): ProductFormState {
  return {
    slug: product.slug,
    category: product.category,
    nameAr: product.nameAr,
    nameEn: product.nameEn,
    shortDescription:
      product.shortDescription,
    description: product.description,
    composition: product.composition,
    dosage: product.dosage,
    packageSize: product.packageSize,
    price: product.price,
    comparePrice:
      product.comparePrice ?? "",
    publicationState:
      product.publicationState,
  };
}

export default function ProductEditForm({
  product,
}: ProductEditFormProps) {
  const router = useRouter();

  const initialForm = useMemo(
    () => buildInitialForm(product),
    [product],
  );

  const initialAliasesText = useMemo(
    () => product.aliases.join("\n"),
    [product.aliases],
  );

  const initialBenefitsText = useMemo(
    () => product.benefits.join("\n"),
    [product.benefits],
  );

  const initialCropsText = useMemo(
    () => product.crops.join("\n"),
    [product.crops],
  );

  const initialGallery = useMemo(
    () => normalizeGalleryImages(product),
    [product],
  );

  const [form, setForm] =
    useState<ProductFormState>(initialForm);

  const [aliasesText, setAliasesText] =
    useState(initialAliasesText);

  const [benefitsText, setBenefitsText] =
    useState(initialBenefitsText);

  const [cropsText, setCropsText] =
    useState(initialCropsText);

  const [gallery, setGallery] =
    useState<GalleryImage[]>(initialGallery);

  const [newImageUrls, setNewImageUrls] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [uploading, setUploading] =
    useState(false);

  const [uploadStatus, setUploadStatus] =
    useState("");

  const [feedback, setFeedback] =
    useState<FeedbackState>(null);

  const [draggedImageId, setDraggedImageId] =
    useState<string | null>(null);

  const addUrlsInputRef =
    useRef<HTMLTextAreaElement>(null);

  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const aliases = useMemo(
    () => splitLines(aliasesText),
    [aliasesText],
  );

  const benefits = useMemo(
    () => splitLines(benefitsText),
    [benefitsText],
  );

  const crops = useMemo(
    () => splitLines(cropsText),
    [cropsText],
  );

  const parsedPrice = useMemo(
    () => parseMoney(form.price),
    [form.price],
  );

  const parsedComparePrice = useMemo(
    () => parseMoney(form.comparePrice),
    [form.comparePrice],
  );

  const serializedGallery = useMemo(
    () => serializeGallery(gallery),
    [gallery],
  );

  const currentSnapshot = useMemo(
    () =>
      JSON.stringify({
        form,
        aliases,
        benefits,
        crops,
        images: serializedGallery,
      }),
    [
      form,
      aliases,
      benefits,
      crops,
      serializedGallery,
    ],
  );

  const initialSnapshot = useMemo(
    () =>
      JSON.stringify({
        form: initialForm,
        aliases: product.aliases,
        benefits: product.benefits,
        crops: product.crops,
        images:
          serializeGallery(initialGallery),
      }),
    [
      initialForm,
      initialGallery,
      product.aliases,
      product.benefits,
      product.crops,
    ],
  );

  const hasChanges =
    currentSnapshot !== initialSnapshot;

  function updateField<
    K extends keyof ProductFormState,
  >(
    field: K,
    value: ProductFormState[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setFeedback(null);
  }

  function resetForm() {
    if (saving || uploading) {
      return;
    }

    setForm(initialForm);
    setAliasesText(initialAliasesText);
    setBenefitsText(initialBenefitsText);
    setCropsText(initialCropsText);
    setGallery(initialGallery);
    setNewImageUrls("");
    setUploadStatus("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setFeedback(null);
  }

  function updateImage(
    clientId: string,
    patch: Partial<GalleryImage>,
  ) {
    setGallery((current) =>
      current.map((image) =>
        image.clientId === clientId
          ? {
              ...image,
              ...patch,
            }
          : image,
      ),
    );

    setFeedback(null);
  }

  async function uploadSelectedFiles(
    files: FileList | null,
  ) {
    if (!files || files.length === 0) {
      return;
    }

    const selectedFiles = Array.from(files);

    if (
      gallery.length +
        selectedFiles.length >
      MAX_IMAGES
    ) {
      setFeedback({
        type: "error",
        message: `يمكن إضافة ${
          MAX_IMAGES - gallery.length
        } صورة فقط حاليًا، والحد الأقصى ${MAX_IMAGES} صورة.`,
      });

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      return;
    }

    const invalidFile = selectedFiles.find(
      (file) =>
        ![
          "image/jpeg",
          "image/png",
          "image/webp",
          "image/avif",
        ].includes(file.type) ||
        file.size <= 0 ||
        file.size >
          4 * 1024 * 1024,
    );

    if (invalidFile) {
      setFeedback({
        type: "error",
        message:
          "الصيغ المسموحة JPG وPNG وWEBP وAVIF، وحجم كل صورة لا يتجاوز 4 ميجابايت.",
      });

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      return;
    }

    setUploading(true);
    setFeedback(null);

    const uploadedImages: Array<{
      url: string;
      originalName: string;
    }> = [];

    try {
      for (
        let index = 0;
        index < selectedFiles.length;
        index += 1
      ) {
        const file = selectedFiles[index];

        setUploadStatus(
          `جاري رفع الصورة ${index + 1} من ${selectedFiles.length}: ${file.name}`,
        );

        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(
          "/api/admin/uploads",
          {
            method: "POST",
            body: formData,
            cache: "no-store",
          },
        );

        const body = (await response
          .json()
          .catch(
            () => null,
          )) as UploadApiResponse | null;

        if (
          !response.ok ||
          !body?.image?.url
        ) {
          throw new Error(
            body?.message ||
              body?.error ||
              `تعذر رفع الصورة ${file.name}.`,
          );
        }

        uploadedImages.push({
          url: body.image.url,
          originalName:
            body.image.originalName ||
            file.name,
        });
      }

      setGallery((current) => {
        const hasPrimary =
          current.some(
            (image) =>
              image.isPrimary,
          );

        const additions =
          uploadedImages.map(
            (
              uploaded,
              index,
            ): GalleryImage => ({
              clientId:
                createClientId(),
              url: uploaded.url,
              alt: `${
                form.nameAr.trim() ||
                "صورة المنتج"
              } - ${
                current.length +
                index +
                1
              }`,
              sortOrder:
                current.length +
                index,
              isPrimary:
                !hasPrimary &&
                current.length === 0 &&
                index === 0,
              objectFit:
                "CONTAIN",
              objectPosition:
                "CENTER",
              zoom: 100,
              cropX: 0,
              cropY: 0,
              rotation: 0,
            }),
          );

        return [
          ...current,
          ...additions,
        ];
      });

      setFeedback({
        type: "success",
        message: `تم رفع ${uploadedImages.length.toLocaleString(
          "ar-EG",
        )} صورة وإضافتها للمعرض. اضغط حفظ التعديلات لتثبيتها على المنتج.`,
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "تعذر رفع الصور.",
      });
    } finally {
      setUploading(false);
      setUploadStatus("");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function addImageUrls() {
    const urls = splitLines(newImageUrls);

    if (urls.length === 0) {
      setFeedback({
        type: "error",
        message:
          "أضف رابط صورة واحدًا على الأقل.",
      });
      addUrlsInputRef.current?.focus();
      return;
    }

    const invalidUrl = urls.find(
      (url) => !isValidImageUrl(url),
    );

    if (invalidUrl) {
      setFeedback({
        type: "error",
        message: `رابط الصورة غير صحيح: ${invalidUrl}`,
      });
      return;
    }

    const existingUrls = new Set(
      gallery.map((image) =>
        image.url.trim().toLowerCase(),
      ),
    );

    const uniqueNewUrls = urls.filter(
      (url) =>
        !existingUrls.has(
          url.trim().toLowerCase(),
        ),
    );

    if (
      gallery.length +
        uniqueNewUrls.length >
      MAX_IMAGES
    ) {
      setFeedback({
        type: "error",
        message: `الحد الأقصى هو ${MAX_IMAGES} صورة لكل منتج.`,
      });
      return;
    }

    if (uniqueNewUrls.length === 0) {
      setFeedback({
        type: "error",
        message:
          "كل الروابط التي أضفتها موجودة بالفعل.",
      });
      return;
    }

    setGallery((current) => {
      const hasPrimary = current.some(
        (image) => image.isPrimary,
      );

      return [
        ...current,
        ...uniqueNewUrls.map(
          (url, index): GalleryImage => ({
            clientId: createClientId(),
            url,
            alt: `${form.nameAr.trim() || "صورة المنتج"} - ${
              current.length + index + 1
            }`,
            sortOrder:
              current.length + index,
            isPrimary:
              !hasPrimary &&
              current.length === 0 &&
              index === 0,
            objectFit: "CONTAIN",
            objectPosition: "CENTER",
            zoom: 100,
            cropX: 0,
            cropY: 0,
            rotation: 0,
          }),
        ),
      ];
    });

    setNewImageUrls("");
    setFeedback(null);
  }

  function removeImage(clientId: string) {
    setGallery((current) => {
      const target = current.find(
        (image) =>
          image.clientId === clientId,
      );

      const next = current.filter(
        (image) =>
          image.clientId !== clientId,
      );

      if (
        target?.isPrimary &&
        next.length > 0
      ) {
        next[0] = {
          ...next[0],
          isPrimary: true,
        };
      }

      return next.map((image, index) => ({
        ...image,
        sortOrder: index,
      }));
    });

    setFeedback(null);
  }

  function makePrimary(clientId: string) {
    setGallery((current) =>
      current.map((image) => ({
        ...image,
        isPrimary:
          image.clientId === clientId,
      })),
    );

    setFeedback(null);
  }

  function moveImage(
    clientId: string,
    direction: -1 | 1,
  ) {
    setGallery((current) => {
      const index = current.findIndex(
        (image) =>
          image.clientId === clientId,
      );

      const nextIndex = index + direction;

      if (
        index < 0 ||
        nextIndex < 0 ||
        nextIndex >= current.length
      ) {
        return current;
      }

      const next = [...current];

      [next[index], next[nextIndex]] = [
        next[nextIndex],
        next[index],
      ];

      return next.map((image, sortOrder) => ({
        ...image,
        sortOrder,
      }));
    });

    setFeedback(null);
  }

  function reorderByDrop(
    targetClientId: string,
  ) {
    if (
      !draggedImageId ||
      draggedImageId === targetClientId
    ) {
      setDraggedImageId(null);
      return;
    }

    setGallery((current) => {
      const fromIndex = current.findIndex(
        (image) =>
          image.clientId ===
          draggedImageId,
      );

      const toIndex = current.findIndex(
        (image) =>
          image.clientId ===
          targetClientId,
      );

      if (
        fromIndex < 0 ||
        toIndex < 0
      ) {
        return current;
      }

      const next = [...current];
      const [moved] = next.splice(
        fromIndex,
        1,
      );

      next.splice(toIndex, 0, moved);

      return next.map(
        (image, sortOrder) => ({
          ...image,
          sortOrder,
        }),
      );
    });

    setDraggedImageId(null);
    setFeedback(null);
  }

  function handleDragOver(
    event: DragEvent<HTMLElement>,
  ) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }

  async function submitProduct(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (saving || uploading || !hasChanges) {
      return;
    }

    const normalizedSlug =
      normalizeSlug(form.slug);

    if (!normalizedSlug) {
      setFeedback({
        type: "error",
        message:
          "اكتب رابطًا إنجليزيًا صحيحًا مثل plant-grow.",
      });
      return;
    }

    if (
      parsedPrice === null ||
      parsedPrice <= 0
    ) {
      setFeedback({
        type: "error",
        message:
          "اكتب سعرًا أساسيًا صحيحًا أكبر من صفر.",
      });
      return;
    }

    if (
      form.comparePrice.trim() &&
      (parsedComparePrice === null ||
        parsedComparePrice <= 0)
    ) {
      setFeedback({
        type: "error",
        message:
          "السعر قبل الخصم غير صحيح.",
      });
      return;
    }

    if (
      parsedComparePrice !== null &&
      parsedComparePrice <= parsedPrice
    ) {
      setFeedback({
        type: "error",
        message:
          "السعر قبل الخصم يجب أن يكون أكبر من السعر الحالي.",
      });
      return;
    }

    if (benefits.length === 0) {
      setFeedback({
        type: "error",
        message:
          "أضف فائدة واحدة على الأقل.",
      });
      return;
    }

    if (crops.length === 0) {
      setFeedback({
        type: "error",
        message:
          "أضف محصولًا أو استخدامًا واحدًا على الأقل.",
      });
      return;
    }

    if (gallery.length > MAX_IMAGES) {
      setFeedback({
        type: "error",
        message: `الحد الأقصى هو ${MAX_IMAGES} صورة.`,
      });
      return;
    }

    const invalidImage =
      gallery.find(
        (image) =>
          !isValidImageUrl(image.url),
      );

    if (invalidImage) {
      setFeedback({
        type: "error",
        message: `رابط الصورة غير صحيح: ${invalidImage.url}`,
      });
      return;
    }

    if (
      gallery.length > 0 &&
      !gallery.some(
        (image) => image.isPrimary,
      )
    ) {
      setFeedback({
        type: "error",
        message:
          "اختر صورة رئيسية للمنتج.",
      });
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      const response = await fetch(
        `/api/admin/products/${encodeURIComponent(
          product.id,
        )}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          cache: "no-store",
          body: JSON.stringify({
            slug: normalizedSlug,
            category:
              form.category.trim(),
            nameAr: form.nameAr.trim(),
            nameEn: form.nameEn.trim(),
            shortDescription:
              form.shortDescription.trim(),
            description:
              form.description.trim(),
            composition:
              form.composition.trim(),
            dosage: form.dosage.trim(),
            packageSize:
              form.packageSize.trim(),
            price: parsedPrice,
            comparePrice:
              parsedComparePrice,
            publicationState:
              form.publicationState,
            aliases,
            benefits,
            crops,
            images: serializeGallery(
              gallery,
            ).map((image, index) => ({
              ...image,
              alt:
                image.alt ||
                (index === 0
                  ? form.nameAr.trim()
                  : `${form.nameAr.trim()} - ${
                      index + 1
                    }`),
            })),
          }),
        },
      );

      const responseBody =
        (await response
          .json()
          .catch(
            () => null,
          )) as ProductApiResponse | null;

      if (!response.ok) {
        throw new Error(
          getApiErrorMessage(
            responseBody,
            response.status,
          ),
        );
      }

      setFeedback({
        type: "success",
        message:
          responseBody?.message ||
          "تم تحديث المنتج بنجاح.",
      });

      router.refresh();
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "حدث خطأ غير متوقع أثناء تعديل المنتج.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={submitProduct}
      className="space-y-8"
    >
      {feedback ? (
        <section
          role={
            feedback.type === "error"
              ? "alert"
              : "status"
          }
          aria-live="polite"
          className={`flex items-start gap-3 rounded-2xl border p-5 text-sm leading-7 ${
            feedback.type === "success"
              ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-100"
              : "border-red-400/25 bg-red-400/10 text-red-100"
          }`}
        >
          {feedback.type ===
          "success" ? (
            <CheckCircle2
              aria-hidden="true"
              size={22}
              className="mt-1 shrink-0 text-emerald-300"
            />
          ) : (
            <AlertCircle
              aria-hidden="true"
              size={22}
              className="mt-1 shrink-0 text-red-300"
            />
          )}

          <div>
            <strong className="font-black">
              {feedback.type ===
              "success"
                ? "تم الحفظ"
                : "لم يتم الحفظ"}
            </strong>

            <p className="mt-1">
              {feedback.message}
            </p>
          </div>
        </section>
      ) : null}

      <section className="rounded-3xl border border-white/10 bg-[#0b1a0e] p-5 shadow-2xl sm:p-7">
        <SectionHeading
          icon={Package}
          title="البيانات الأساسية"
          description="الاسم والتصنيف والرابط وحالة النشر"
        />

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <TextField
            label="اسم المنتج بالعربية *"
            value={form.nameAr}
            disabled={saving || uploading}
            maxLength={200}
            onChange={(value) =>
              updateField(
                "nameAr",
                value,
              )
            }
          />

          <TextField
            label="اسم المنتج بالإنجليزية *"
            value={form.nameEn}
            disabled={saving || uploading}
            maxLength={200}
            dir="ltr"
            onChange={(value) =>
              updateField(
                "nameEn",
                value,
              )
            }
          />

          <TextField
            label="رابط المنتج Slug *"
            value={form.slug}
            disabled={saving || uploading}
            maxLength={160}
            dir="ltr"
            onChange={(value) =>
              updateField(
                "slug",
                value,
              )
            }
            onBlur={() =>
              updateField(
                "slug",
                normalizeSlug(form.slug),
              )
            }
          />

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-white/75">
              التصنيف *
            </span>

            <input
              required
              list="edit-product-categories"
              value={form.category}
              disabled={saving || uploading}
              maxLength={120}
              onChange={(event) =>
                updateField(
                  "category",
                  event.target.value,
                )
              }
              className="h-12 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 outline-none transition focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10 disabled:opacity-60"
            />

            <datalist id="edit-product-categories">
              {PRODUCT_CATEGORIES.map(
                (category) => (
                  <option
                    key={category}
                    value={category}
                  />
                ),
              )}
            </datalist>
          </label>

          <TextField
            label="حجم العبوة *"
            value={form.packageSize}
            disabled={saving || uploading}
            maxLength={120}
            onChange={(value) =>
              updateField(
                "packageSize",
                value,
              )
            }
          />

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-white/75">
              حالة النشر *
            </span>

            <select
              value={
                form.publicationState
              }
              disabled={saving || uploading}
              onChange={(event) =>
                updateField(
                  "publicationState",
                  event.target
                    .value as PublicationState,
                )
              }
              className="h-12 w-full rounded-xl border border-white/10 bg-[#0d2112] px-4 outline-none transition focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10 disabled:opacity-60"
            >
              <option value="DRAFT">
                مسودة
              </option>
              <option value="PUBLISHED">
                منشور
              </option>
              <option value="ARCHIVED">
                مؤرشف
              </option>
            </select>
          </label>

          <label className="block sm:col-span-2">
            <span className="mb-2 block text-sm font-bold text-white/75">
              الوصف المختصر *
            </span>

            <textarea
              required
              rows={3}
              value={
                form.shortDescription
              }
              disabled={saving || uploading}
              maxLength={500}
              onChange={(event) =>
                updateField(
                  "shortDescription",
                  event.target.value,
                )
              }
              className="w-full resize-none rounded-xl border border-white/10 bg-white/[.04] p-4 outline-none transition focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10 disabled:opacity-60"
            />
          </label>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-[#0b1a0e] p-5 shadow-2xl sm:p-7">
        <SectionHeading
          icon={WalletCards}
          title="السعر"
          description="السعر الحالي والسعر قبل الخصم"
        />

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-white/75">
              السعر الأساسي بالجنيه *
            </span>

            <input
              required
              value={form.price}
              disabled={saving || uploading}
              inputMode="decimal"
              dir="ltr"
              onChange={(event) =>
                updateField(
                  "price",
                  normalizeMoneyInput(
                    event.target.value,
                  ),
                )
              }
              className="h-12 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 text-left outline-none transition focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10 disabled:opacity-60"
            />

            {parsedPrice !== null &&
            parsedPrice > 0 ? (
              <span className="mt-2 block text-xs text-lime-200">
                {formatMoney(parsedPrice)}
              </span>
            ) : null}
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-white/75">
              السعر قبل الخصم
            </span>

            <input
              value={
                form.comparePrice
              }
              disabled={saving || uploading}
              inputMode="decimal"
              dir="ltr"
              onChange={(event) =>
                updateField(
                  "comparePrice",
                  normalizeMoneyInput(
                    event.target.value,
                  ),
                )
              }
              className="h-12 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 text-left outline-none transition focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10 disabled:opacity-60"
            />

            {parsedComparePrice !==
              null &&
            parsedComparePrice > 0 ? (
              <span className="mt-2 block text-xs text-white/50">
                {formatMoney(
                  parsedComparePrice,
                )}
              </span>
            ) : null}
          </label>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-[#0b1a0e] p-5 shadow-2xl sm:p-7">
        <SectionHeading
          icon={FileText}
          title="تفاصيل المنتج"
          description="الوصف والتركيب والجرعة"
        />

        <div className="mt-6 space-y-5">
          <TextAreaField
            label="الوصف الكامل *"
            value={form.description}
            disabled={saving || uploading}
            rows={7}
            maxLength={5000}
            onChange={(value) =>
              updateField(
                "description",
                value,
              )
            }
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <TextAreaField
              label="التركيب *"
              value={
                form.composition
              }
              disabled={saving || uploading}
              rows={5}
              maxLength={3000}
              onChange={(value) =>
                updateField(
                  "composition",
                  value,
                )
              }
            />

            <TextAreaField
              label="الجرعة وطريقة الاستخدام *"
              value={form.dosage}
              disabled={saving || uploading}
              rows={5}
              maxLength={3000}
              onChange={(value) =>
                updateField(
                  "dosage",
                  value,
                )
              }
            />
          </div>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <ListTextArea
          icon={Sparkles}
          title="الفوائد"
          value={benefitsText}
          count={benefits.length}
          disabled={saving || uploading}
          required
          onChange={(value) => {
            setBenefitsText(value);
            setFeedback(null);
          }}
        />

        <ListTextArea
          icon={Wheat}
          title="المحاصيل والاستخدامات"
          value={cropsText}
          count={crops.length}
          disabled={saving || uploading}
          required
          onChange={(value) => {
            setCropsText(value);
            setFeedback(null);
          }}
        />
      </div>

      <section className="rounded-3xl border border-white/10 bg-[#0b1a0e] p-5 shadow-2xl sm:p-7">
        <SectionHeading
          icon={Tags}
          title="الأسماء البديلة"
          description="اكتب كل اسم في سطر منفصل"
        />

        <textarea
          rows={7}
          value={aliasesText}
          disabled={saving || uploading}
          onChange={(event) => {
            setAliasesText(
              event.target.value,
            );
            setFeedback(null);
          }}
          className="mt-5 w-full resize-y rounded-xl border border-white/10 bg-white/[.04] p-4 leading-8 outline-none transition focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10 disabled:opacity-60"
        />

        <p className="mt-3 text-xs text-white/40">
          عدد الأسماء البديلة:{" "}
          <strong className="text-lime-300">
            {aliases.length.toLocaleString(
              "ar-EG",
            )}
          </strong>
        </p>
      </section>

      <section className="rounded-3xl border border-white/10 bg-[#0b1a0e] p-5 shadow-2xl sm:p-7">
        <SectionHeading
          icon={Images}
          title="معرض صور المنتج"
          description="أضف حتى 20 صورة واضبط كل صورة داخل البرواز"
        />

        <div className="mt-6 rounded-2xl border border-lime-300/15 bg-lime-300/[.035] p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <Link2
              size={20}
              className="mt-1 shrink-0 text-lime-300"
            />

            <div className="min-w-0 flex-1">
              <h3 className="font-black">
                إضافة صور جديدة
              </h3>

              <p className="mt-1 text-sm leading-7 text-white/45">
                اختر صورًا من جهازك لرفعها إلى Vercel Blob، أو أضف روابط صور خارجية.
              </p>

              <div className="mt-4 rounded-2xl border border-dashed border-lime-300/25 bg-black/15 p-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  multiple
                  disabled={
                    saving ||
                    uploading ||
                    gallery.length >=
                      MAX_IMAGES
                  }
                  onChange={(event) =>
                    void uploadSelectedFiles(
                      event.target.files,
                    )
                  }
                  className="sr-only"
                  id="product-gallery-files"
                />

                <label
                  htmlFor="product-gallery-files"
                  className={`flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border border-white/10 bg-white/[.03] px-4 text-center transition ${
                    saving ||
                    uploading ||
                    gallery.length >=
                      MAX_IMAGES
                      ? "pointer-events-none opacity-45"
                      : "hover:border-lime-300/45 hover:bg-lime-300/[.05]"
                  }`}
                >
                  {uploading ? (
                    <Loader2
                      size={28}
                      className="animate-spin text-lime-300"
                    />
                  ) : (
                    <UploadCloud
                      size={30}
                      className="text-lime-300"
                    />
                  )}

                  <strong className="mt-3">
                    {uploading
                      ? "جاري رفع الصور..."
                      : "اضغط لاختيار صور من الجهاز"}
                  </strong>

                  <span className="mt-1 text-xs leading-6 text-white/40">
                    JPG أو PNG أو WEBP أو AVIF — حتى 4 ميجابايت للصورة
                  </span>
                </label>

                {uploadStatus ? (
                  <p className="mt-3 text-center text-xs font-bold text-lime-200">
                    {uploadStatus}
                  </p>
                ) : null}
              </div>

              <div className="my-5 flex items-center gap-3">
                <span className="h-px flex-1 bg-white/10" />
                <span className="text-xs font-bold text-white/30">
                  أو أضف روابط
                </span>
                <span className="h-px flex-1 bg-white/10" />
              </div>

              <textarea
                ref={addUrlsInputRef}
                rows={4}
                dir="ltr"
                value={newImageUrls}
                disabled={
                  saving ||
                  uploading ||
                  gallery.length >=
                    MAX_IMAGES
                }
                placeholder={
                  "/products/plant-grow-front.jpg\nhttps://example.com/image-2.jpg"
                }
                onChange={(event) => {
                  setNewImageUrls(
                    event.target.value,
                  );
                  setFeedback(null);
                }}
                className="mt-4 w-full resize-y rounded-xl border border-white/10 bg-black/20 p-4 text-left leading-7 outline-none transition placeholder:text-white/20 focus:border-lime-300 disabled:opacity-50"
              />

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-white/40">
                  المستخدم:{" "}
                  <strong className="text-lime-300">
                    {gallery.length}
                  </strong>{" "}
                  / {MAX_IMAGES}
                </span>

                <button
                  type="button"
                  onClick={addImageUrls}
                  disabled={
                    saving ||
                    gallery.length >=
                      MAX_IMAGES
                  }
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-lime-300 px-5 text-sm font-black text-[#071109] disabled:opacity-40"
                >
                  <Plus size={17} />
                  إضافة الصور
                </button>
              </div>
            </div>
          </div>
        </div>

        {gallery.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-white/15 px-6 py-14 text-center">
            <ImageIcon
              size={42}
              className="mx-auto text-lime-300"
            />
            <h3 className="mt-4 text-xl font-black">
              لا توجد صور
            </h3>
            <p className="mt-2 text-sm text-white/45">
              أضف رابط صورة أو أكثر من الحقل الموجود بالأعلى.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-5 xl:grid-cols-2">
            {gallery.map(
              (image, index) => (
                <article
                  key={image.clientId}
                  draggable={!saving}
                  onDragStart={() =>
                    setDraggedImageId(
                      image.clientId,
                    )
                  }
                  onDragEnd={() =>
                    setDraggedImageId(
                      null,
                    )
                  }
                  onDragOver={
                    handleDragOver
                  }
                  onDrop={() =>
                    reorderByDrop(
                      image.clientId,
                    )
                  }
                  className={`rounded-3xl border p-4 transition ${
                    draggedImageId ===
                    image.clientId
                      ? "border-lime-300/50 bg-lime-300/[.05] opacity-60"
                      : image.isPrimary
                        ? "border-lime-300/35 bg-lime-300/[.035]"
                        : "border-white/10 bg-white/[.02]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <GripVertical
                        size={18}
                        className="cursor-grab text-white/30"
                      />

                      <span className="text-sm font-black">
                        الصورة{" "}
                        {(
                          index + 1
                        ).toLocaleString(
                          "ar-EG",
                        )}
                      </span>

                      {image.isPrimary ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-lime-300 px-2.5 py-1 text-[11px] font-black text-[#071109]">
                          <Crown
                            size={13}
                          />
                          الرئيسية
                        </span>
                      ) : null}
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={
                          saving ||
                          uploading ||
                          index === 0
                        }
                        onClick={() =>
                          moveImage(
                            image.clientId,
                            -1,
                          )
                        }
                        className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 text-white/55 disabled:opacity-25"
                        aria-label="تحريك لأعلى"
                      >
                        <ArrowUp
                          size={16}
                        />
                      </button>

                      <button
                        type="button"
                        disabled={
                          saving ||
                          uploading ||
                          index ===
                            gallery.length -
                              1
                        }
                        onClick={() =>
                          moveImage(
                            image.clientId,
                            1,
                          )
                        }
                        className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 text-white/55 disabled:opacity-25"
                        aria-label="تحريك لأسفل"
                      >
                        <ArrowDown
                          size={16}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-white">
                    <div className="relative aspect-square overflow-hidden bg-[linear-gradient(45deg,#eee_25%,transparent_25%),linear-gradient(-45deg,#eee_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#eee_75%),linear-gradient(-45deg,transparent_75%,#eee_75%)] bg-[length:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0px]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image.url}
                        alt={
                          image.alt ||
                          form.nameAr
                        }
                        className="absolute inset-0 h-full w-full transition-transform duration-200"
                        style={{
                          objectFit:
                            getObjectFit(
                              image.objectFit,
                            ),
                          objectPosition:
                            getObjectPosition(
                              image.objectPosition,
                            ),
                          transform: `translate(${image.cropX}%, ${image.cropY}%) scale(${image.zoom / 100}) rotate(${image.rotation}deg)`,
                        }}
                        onError={(
                          event,
                        ) => {
                          event.currentTarget.style.opacity =
                            "0.18";
                        }}
                        onLoad={(
                          event,
                        ) => {
                          event.currentTarget.style.opacity =
                            "1";
                        }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4">
                    <label>
                      <span className="mb-2 block text-xs font-bold text-white/55">
                        رابط الصورة
                      </span>
                      <input
                        value={image.url}
                        dir="ltr"
                        disabled={saving || uploading}
                        onChange={(event) =>
                          updateImage(
                            image.clientId,
                            {
                              url: event
                                .target
                                .value,
                            },
                          )
                        }
                        className="h-11 w-full rounded-xl border border-white/10 bg-white/[.04] px-3 text-left text-sm outline-none focus:border-lime-300"
                      />
                    </label>

                    <label>
                      <span className="mb-2 block text-xs font-bold text-white/55">
                        النص البديل للصورة
                      </span>
                      <input
                        value={image.alt}
                        disabled={saving || uploading}
                        maxLength={300}
                        onChange={(event) =>
                          updateImage(
                            image.clientId,
                            {
                              alt: event
                                .target
                                .value,
                            },
                          )
                        }
                        className="h-11 w-full rounded-xl border border-white/10 bg-white/[.04] px-3 text-sm outline-none focus:border-lime-300"
                      />
                    </label>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <label>
                        <span className="mb-2 block text-xs font-bold text-white/55">
                          ملاءمة الصورة
                        </span>
                        <select
                          value={
                            image.objectFit
                          }
                          disabled={saving || uploading}
                          onChange={(event) =>
                            updateImage(
                              image.clientId,
                              {
                                objectFit:
                                  event
                                    .target
                                    .value as ImageFit,
                              },
                            )
                          }
                          className="h-11 w-full rounded-xl border border-white/10 bg-[#0d2112] px-3 text-sm outline-none"
                        >
                          {IMAGE_FITS.map(
                            (option) => (
                              <option
                                key={
                                  option.value
                                }
                                value={
                                  option.value
                                }
                              >
                                {option.label}
                              </option>
                            ),
                          )}
                        </select>
                      </label>

                      <label>
                        <span className="mb-2 block text-xs font-bold text-white/55">
                          موضع الصورة
                        </span>
                        <select
                          value={
                            image.objectPosition
                          }
                          disabled={saving || uploading}
                          onChange={(event) =>
                            updateImage(
                              image.clientId,
                              {
                                objectPosition:
                                  event
                                    .target
                                    .value as ImagePosition,
                              },
                            )
                          }
                          className="h-11 w-full rounded-xl border border-white/10 bg-[#0d2112] px-3 text-sm outline-none"
                        >
                          {IMAGE_POSITIONS.map(
                            (option) => (
                              <option
                                key={
                                  option.value
                                }
                                value={
                                  option.value
                                }
                              >
                                {option.label}
                              </option>
                            ),
                          )}
                        </select>
                      </label>
                    </div>

                    <RangeField
                      label="التكبير"
                      value={image.zoom}
                      minimum={50}
                      maximum={200}
                      suffix="%"
                      disabled={saving || uploading}
                      icon={ZoomIn}
                      onChange={(value) =>
                        updateImage(
                          image.clientId,
                          {
                            zoom: value,
                          },
                        )
                      }
                    />

                    <div className="grid gap-4 sm:grid-cols-2">
                      <RangeField
                        label="تحريك أفقي"
                        value={image.cropX}
                        minimum={-100}
                        maximum={100}
                        suffix="%"
                        disabled={saving || uploading}
                        onChange={(value) =>
                          updateImage(
                            image.clientId,
                            {
                              cropX: value,
                            },
                          )
                        }
                      />

                      <RangeField
                        label="تحريك رأسي"
                        value={image.cropY}
                        minimum={-100}
                        maximum={100}
                        suffix="%"
                        disabled={saving || uploading}
                        onChange={(value) =>
                          updateImage(
                            image.clientId,
                            {
                              cropY: value,
                            },
                          )
                        }
                      />
                    </div>

                    <RangeField
                      label="تدوير الصورة"
                      value={image.rotation}
                      minimum={-180}
                      maximum={180}
                      suffix="°"
                      disabled={saving || uploading}
                      onChange={(value) =>
                        updateImage(
                          image.clientId,
                          {
                            rotation: value,
                          },
                        )
                      }
                    />

                    <div className="grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        disabled={
                          saving ||
                          uploading ||
                          image.isPrimary
                        }
                        onClick={() =>
                          makePrimary(
                            image.clientId,
                          )
                        }
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-lime-300/25 bg-lime-300/[.06] px-4 text-sm font-black text-lime-200 disabled:opacity-40"
                      >
                        <Crown size={16} />
                        تعيين كرئيسية
                      </button>

                      <button
                        type="button"
                        disabled={saving || uploading}
                        onClick={() =>
                          removeImage(
                            image.clientId,
                          )
                        }
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-400/25 bg-red-400/[.06] px-4 text-sm font-black text-red-200 disabled:opacity-40"
                      >
                        <Trash2
                          size={16}
                        />
                        حذف الصورة
                      </button>
                    </div>
                  </div>
                </article>
              ),
            )}
          </div>
        )}
      </section>

      <section className="sticky bottom-4 z-20 rounded-2xl border border-lime-300/20 bg-[#0b1a0e]/95 p-4 shadow-2xl backdrop-blur">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <strong className="block font-black">
              {hasChanges
                ? "توجد تغييرات لم يتم حفظها"
                : "لا توجد تغييرات جديدة"}
            </strong>

            <p className="mt-1 text-sm text-white/45">
              سيتم تحديث بيانات المنتج ومعرض الصور وحالة مزامنة Doctor.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={`/admin/products/${product.id}`}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-5 font-bold text-white/65 transition hover:border-lime-300/30 hover:text-white"
            >
              <ArrowRight
                size={18}
              />
              إلغاء
            </Link>

            <button
              type="button"
              onClick={resetForm}
              disabled={
                saving || uploading || !hasChanges
              }
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-5 font-bold text-white/65 transition hover:border-amber-300/30 hover:text-amber-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RotateCcw
                size={18}
              />
              استرجاع البيانات
            </button>

            <button
              type="submit"
              disabled={
                saving || uploading || !hasChanges
              }
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-lime-300 px-6 font-black text-[#071109] transition hover:bg-lime-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving || uploading ? (
                <Loader2
                  size={19}
                  className="animate-spin"
                />
              ) : (
                <Save size={19} />
              )}

              {uploading
                ? "جاري رفع الصور..."
                : saving
                  ? "جاري حفظ التعديلات..."
                  : "حفظ التعديلات"}
            </button>
          </div>
        </div>
      </section>
    </form>
  );
}

function SectionHeading({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Package;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-white/10 pb-5">
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-lime-300/10 text-lime-300">
        <Icon size={22} />
      </div>

      <div>
        <h2 className="text-xl font-black">
          {title}
        </h2>
        <p className="mt-1 text-sm text-white/45">
          {description}
        </p>
      </div>
    </div>
  );
}

function TextField({
  label,
  value,
  disabled,
  maxLength,
  dir,
  onChange,
  onBlur,
}: {
  label: string;
  value: string;
  disabled: boolean;
  maxLength: number;
  dir?: "rtl" | "ltr";
  onChange: (value: string) => void;
  onBlur?: () => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-white/75">
        {label}
      </span>

      <input
        required={label.includes("*")}
        value={value}
        disabled={disabled}
        maxLength={maxLength}
        dir={dir}
        onBlur={onBlur}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="h-12 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 outline-none transition focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10 disabled:opacity-60"
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  disabled,
  rows,
  maxLength,
  onChange,
}: {
  label: string;
  value: string;
  disabled: boolean;
  rows: number;
  maxLength: number;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-white/75">
        {label}
      </span>

      <textarea
        required={label.includes("*")}
        rows={rows}
        value={value}
        disabled={disabled}
        maxLength={maxLength}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full resize-y rounded-xl border border-white/10 bg-white/[.04] p-4 leading-8 outline-none transition focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10 disabled:opacity-60"
      />
    </label>
  );
}

function ListTextArea({
  icon: Icon,
  title,
  value,
  count,
  disabled,
  required,
  onChange,
}: {
  icon: typeof Sparkles;
  title: string;
  value: string;
  count: number;
  disabled: boolean;
  required?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-[#0b1a0e] p-5 shadow-2xl sm:p-7">
      <h2 className="flex items-center gap-2 text-xl font-black">
        <Icon
          size={21}
          className="text-lime-300"
        />
        {title}
      </h2>

      <textarea
        required={required}
        rows={10}
        value={value}
        disabled={disabled}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="mt-5 w-full resize-y rounded-xl border border-white/10 bg-white/[.04] p-4 leading-8 outline-none transition focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10 disabled:opacity-60"
      />

      <p className="mt-3 text-xs text-white/40">
        العدد:{" "}
        <strong className="text-lime-300">
          {count.toLocaleString("ar-EG")}
        </strong>
      </p>
    </section>
  );
}

function RangeField({
  label,
  value,
  minimum,
  maximum,
  suffix,
  disabled,
  icon: Icon,
  onChange,
}: {
  label: string;
  value: number;
  minimum: number;
  maximum: number;
  suffix: string;
  disabled: boolean;
  icon?: typeof ZoomIn;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center justify-between gap-3 text-xs font-bold text-white/55">
        <span className="inline-flex items-center gap-2">
          {Icon ? <Icon size={14} /> : null}
          {label}
        </span>

        <strong className="text-lime-300">
          {value}
          {suffix}
        </strong>
      </span>

      <input
        type="range"
        min={minimum}
        max={maximum}
        step={1}
        value={value}
        disabled={disabled}
        onChange={(event) =>
          onChange(
            Number(event.target.value),
          )
        }
        className="w-full accent-lime-300"
      />
    </label>
  );
}
