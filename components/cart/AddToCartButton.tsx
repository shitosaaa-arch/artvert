"use client";

import { useState } from "react";
import { Check, Minus, Plus, ShoppingCart } from "lucide-react";

import {
  type CartProduct,
  useCart,
} from "@/components/cart/CartProvider";

type AddToCartButtonProps = {
  product: CartProduct;
};

export default function AddToCartButton({
  product,
}: AddToCartButtonProps) {
  const { addItem, getProductQuantity } = useCart();

  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const currentQuantity = getProductQuantity(product.slug);

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
    <section
      className="mt-8 rounded-3xl border border-lime-300/20 bg-[#0b1a0e]/95 p-5 shadow-2xl"
      dir="rtl"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex h-12 items-center justify-between rounded-xl border border-white/10 bg-white/[.04]">
          <button
            type="button"
            onClick={increaseQuantity}
            className="grid h-12 w-12 place-items-center text-lime-300 transition hover:bg-white/[.06]"
            aria-label="زيادة الكمية"
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
            aria-label="تقليل الكمية"
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
              تمت الإضافة للسلة
            </>
          ) : (
            <>
              <ShoppingCart aria-hidden="true" size={19} />
              أضف إلى السلة
            </>
          )}
        </button>
      </div>

      {currentQuantity > 0 && (
        <p className="mt-3 text-sm font-bold text-lime-300">
          موجود حاليًا في السلة: {currentQuantity}
        </p>
      )}
    </section>
  );
}