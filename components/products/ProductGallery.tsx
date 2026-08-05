"use client";

import {
  useMemo,
  useState,
} from "react";

import type {
  CatalogImageFit,
  CatalogImagePosition,
  CatalogProductImage,
} from "@/lib/products/product-catalog";

/* =========================================================
   إعدادات صور صفحة المنتج الداخلية

   غيّر القيم دي فقط للتحكم في حجم الصورة داخل صفحة المنتج:

   PRODUCT_DETAIL_IMAGE_HEIGHT
   ارتفاع مساحة الصورة الرئيسية.

   PRODUCT_DETAIL_EXTRA_SCALE
   تكبير أو تصغير الصورة الرئيسية:
   0.75 = أصغر
   0.90 = أصغر قليلًا
   1.00 = الحجم الطبيعي
   1.10 = أكبر
   1.20 = أكبر بوضوح

   PRODUCT_THUMBNAIL_EXTRA_SCALE
   حجم الصور المصغرة أسفل الصورة الرئيسية.
   ========================================================= */

const PRODUCT_DETAIL_IMAGE_HEIGHT =
  "h-[430px] sm:h-[560px] lg:h-[650px]";

const PRODUCT_DETAIL_EXTRA_SCALE =
  1;

const PRODUCT_THUMBNAIL_EXTRA_SCALE =
  1;

type ProductGalleryProps = {
  images: CatalogProductImage[];
  productName: string;
};

function getObjectFit(
  value: CatalogImageFit,
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
  value: CatalogImagePosition,
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

function imageTransform(
  image: CatalogProductImage,
  extraScale: number,
) {
  const savedScale =
    image.zoom / 100;

  return `translate(${image.cropX}%, ${image.cropY}%) scale(${
    savedScale * extraScale
  }) rotate(${image.rotation}deg)`;
}

export default function ProductGallery({
  images,
  productName,
}: ProductGalleryProps) {
  const orderedImages =
    useMemo(
      () =>
        [...images].sort(
          (a, b) => {
            if (
              a.isPrimary !==
              b.isPrimary
            ) {
              return a.isPrimary
                ? -1
                : 1;
            }

            return (
              a.sortOrder -
              b.sortOrder
            );
          },
        ),
      [images],
    );

  const [
    selectedId,
    setSelectedId,
  ] = useState(
    orderedImages[0]?.id ??
      "",
  );

  const selectedImage =
    orderedImages.find(
      (image) =>
        image.id ===
        selectedId,
    ) ?? orderedImages[0];

  if (!selectedImage) {
    return (
      <div
        className={[
          "grid place-items-center rounded-[32px] border border-dashed border-lime-300/20 bg-[#0b1a0e]/80 p-6 shadow-[0_0_40px_rgba(200,243,63,0.15)] backdrop-blur-xl",
          PRODUCT_DETAIL_IMAGE_HEIGHT,
        ].join(" ")}
      >
        <p className="text-sm font-bold text-white/50">
          لا توجد صورة للمنتج
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="rounded-[32px] border border-lime-300/15 bg-[#0b1a0e]/80 p-4 shadow-[0_0_40px_rgba(200,243,63,0.15)] backdrop-blur-xl sm:p-5">
        <div
          className={[
            "relative overflow-hidden rounded-[24px]",
            "border border-white/5",
            "bg-[radial-gradient(circle_at_center,rgba(200,243,63,.1),transparent_60%),rgba(255,255,255,.02)]",
            PRODUCT_DETAIL_IMAGE_HEIGHT,
          ].join(" ")}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={
              selectedImage.id
            }
            src={
              selectedImage.url
            }
            alt={
              selectedImage.alt ||
              productName
            }
            className="absolute inset-0 h-full w-full transition-transform duration-300"
            style={{
              objectFit:
                getObjectFit(
                  selectedImage.objectFit,
                ),

              objectPosition:
                getObjectPosition(
                  selectedImage.objectPosition,
                ),

              transform:
                imageTransform(
                  selectedImage,
                  PRODUCT_DETAIL_EXTRA_SCALE,
                ),

              transformOrigin:
                "center",
            }}
          />
        </div>
      </div>

      {orderedImages.length >
      1 ? (
        <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-5 lg:grid-cols-6">
          {orderedImages.map(
            (image) => {
              const active =
                image.id ===
                selectedImage.id;

              return (
                <button
                  key={image.id}
                  type="button"
                  onClick={() =>
                    setSelectedId(
                      image.id,
                    )
                  }
                  className={[
                    "relative aspect-square overflow-hidden rounded-xl border bg-white/[.02] transition duration-300",
                    active
                      ? "border-lime-300 ring-2 ring-lime-300/30 shadow-[0_0_15px_rgba(200,243,63,0.3)]"
                      : "border-white/10 hover:border-lime-300/40 hover:bg-lime-300/10",
                  ].join(" ")}
                  aria-label={`عرض ${
                    image.alt ||
                    productName
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      image.thumbnailUrl ??
                      image.url
                    }
                    alt=""
                    className="absolute inset-0 h-full w-full transition-transform duration-300"
                    style={{
                      objectFit:
                        getObjectFit(
                          image.objectFit,
                        ),

                      objectPosition:
                        getObjectPosition(
                          image.objectPosition,
                        ),

                      transform:
                        imageTransform(
                          image,
                          PRODUCT_THUMBNAIL_EXTRA_SCALE,
                        ),

                      transformOrigin:
                        "center",
                    }}
                  />
                </button>
              );
            },
          )}
        </div>
      ) : null}
    </div>
  );
}