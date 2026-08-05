"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type CartProduct = {
  id: number | string;
  slug: string;
  nameAr: string;
  nameEn: string;
  image: string;
  category?: string;
};

export type CartItem = CartProduct & {
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  totalItems: number;
  isReady: boolean;
  addItem: (product: CartProduct, quantity?: number) => void;
  removeItem: (slug: string) => void;
  increaseQuantity: (slug: string) => void;
  decreaseQuantity: (slug: string) => void;
  setQuantity: (slug: string, quantity: number) => void;
  clearCart: () => void;
  containsProduct: (slug: string) => boolean;
  getProductQuantity: (slug: string) => number;
};

const STORAGE_KEY = "artvert-cart-v1";

const CartContext = createContext<CartContextValue | null>(null);

function normalizeQuantity(quantity: number) {
  if (!Number.isFinite(quantity)) {
    return 1;
  }

  return Math.max(1, Math.floor(quantity));
}

function isValidStoredItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const item = value as Partial<CartItem>;

  return (
    (typeof item.id === "number" || typeof item.id === "string") &&
    typeof item.slug === "string" &&
    typeof item.nameAr === "string" &&
    typeof item.nameEn === "string" &&
    typeof item.image === "string" &&
    typeof item.quantity === "number" &&
    Number.isFinite(item.quantity) &&
    item.quantity > 0
  );
}

export function CartProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const storedCart = window.localStorage.getItem(STORAGE_KEY);

      if (!storedCart) {
        setIsReady(true);
        return;
      }

      const parsedCart: unknown = JSON.parse(storedCart);

      if (Array.isArray(parsedCart)) {
        setItems(
          parsedCart
            .filter(isValidStoredItem)
            .map((item) => ({
              ...item,
              quantity: normalizeQuantity(item.quantity),
            })),
        );
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
      setItems([]);
    } finally {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(items),
    );
  }, [items, isReady]);

  function addItem(
    product: CartProduct,
    quantity = 1,
  ) {
    const safeQuantity = normalizeQuantity(quantity);

    setItems((currentItems) => {
      const existingItem = currentItems.find(
        (item) => item.slug === product.slug,
      );

      if (existingItem) {
        return currentItems.map((item) =>
          item.slug === product.slug
            ? {
                ...item,
                quantity:
                  item.quantity + safeQuantity,
              }
            : item,
        );
      }

      return [
        ...currentItems,
        {
          ...product,
          quantity: safeQuantity,
        },
      ];
    });
  }

  function removeItem(slug: string) {
    setItems((currentItems) =>
      currentItems.filter(
        (item) => item.slug !== slug,
      ),
    );
  }

  function increaseQuantity(slug: string) {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.slug === slug
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item,
      ),
    );
  }

  function decreaseQuantity(slug: string) {
    setItems((currentItems) =>
      currentItems
        .map((item) =>
          item.slug === slug
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  function setQuantity(
    slug: string,
    quantity: number,
  ) {
    if (!Number.isFinite(quantity)) {
      return;
    }

    const safeQuantity = Math.floor(quantity);

    if (safeQuantity <= 0) {
      removeItem(slug);
      return;
    }

    setItems((currentItems) =>
      currentItems.map((item) =>
        item.slug === slug
          ? {
              ...item,
              quantity: safeQuantity,
            }
          : item,
      ),
    );
  }

  function clearCart() {
    setItems([]);
  }

  function containsProduct(slug: string) {
    return items.some(
      (item) => item.slug === slug,
    );
  }

  function getProductQuantity(slug: string) {
    return (
      items.find(
        (item) => item.slug === slug,
      )?.quantity ?? 0
    );
  }

  const totalItems = useMemo(
    () =>
      items.reduce(
        (total, item) =>
          total + item.quantity,
        0,
      ),
    [items],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      totalItems,
      isReady,
      addItem,
      removeItem,
      increaseQuantity,
      decreaseQuantity,
      setQuantity,
      clearCart,
      containsProduct,
      getProductQuantity,
    }),
    [items, totalItems, isReady],
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart must be used inside CartProvider.",
    );
  }

  return context;
}