"use client";

import { useState } from "react";
import { Check, Minus, Plus, ShoppingCart } from "lucide-react";

import {
  type CartProduct,
  useCart,
} from "@/components/cart/CartProvider";
import { useLanguage } from "@/components/i18n/LanguageProvider";

type AddToCartButtonProps = {
  product: CartProduct;
};

export default function AddToCartButton({
  product,
}: AddToCartButtonProps) {
  const { addItem, getProductQuantity } = useCart();
  const { locale } = useLanguage();

  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const currentQuantity = getProductQuantity(product.slug);

  const t =
    locale === "AR"
      ? {
          increase: "زيادة الكمية",
          decrease: "تقليل الكمية",
          added: "تمت الإضافة للسلة",
          add: "أضف إلى السلة",
          current: "موجود حاليًا في السلة:",
        }
      : {
          increase: "Increase quantity",
          decrease: "Decrease quantity",
          added: "Added to Cart",
          add: "Add to Cart",
          current: "Currently in cart:",
        };

  function decreaseQuantity() {
    setQuantity((current) => Math.max(1, current - 1));
  }

  function increaseQuantity() {
    setQuantity((current) => current + 1);
  }

  function handleAddToCart() {
    addItem(product, quantity);
    setAdded(true);

    window.setTimeout(() => {
      setAdded(false);
    }, 1800);
  }

  return (
    <section>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex h-12 items-center overflow-hidden rounded-xl border border-white/10 bg-white/[.04]">
          <button
            type="button"
            onClick={increaseQuantity}
            className="grid h-12 w-12 place-items-center text-lime-300 transition hover:bg-white/[.06]"
            aria-label={t.increase}
          >
            <Plus aria-hidden="true" size={18} />
          </button>

          <span
            className="min-w-12 text-center text-base font-black text-white"
            aria-live="polite"
          >
            {quantity}
          </span>

          <button
            type="button"
            onClick={decreaseQuantity}
            disabled={quantity <= 1}
            className="grid h-12 w-12 place-items-center text-lime-300 transition hover:bg-white/[.06] disabled:cursor-not-allowed disabled:opacity-35"
            aria-label={t.decrease}
          >
            <Minus aria-hidden="true" size={18} />
          </button>
        </div>

        <button
          type="button"
          onClick={handleAddToCart}
          className={[
            "flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl px-6 font-black transition",
            added
              ? "bg-emerald-400 text-[#071109]"
              : "bg-lime-300 text-[#071109] hover:bg-lime-200",
          ].join(" ")}
        >
          {added ? (
            <>
              <Check aria-hidden="true" size={19} />
              {t.added}
            </>
          ) : (
            <>
              <ShoppingCart aria-hidden="true" size={19} />
              {t.add}
            </>
          )}
        </button>
      </div>

      {currentQuantity > 0 && (
        <p className="mt-3 text-sm font-bold text-lime-300">
          {t.current} {currentQuantity}
        </p>
      )}
    </section>
  );
}