/** Cache tags are intentionally public-content-only; never tag staff or customer data. */
export const publicCacheTags = { products: "public-products", plants: "public-plants", knowledge: "public-knowledge" } as const;
export async function invalidatePublicCache(...tags: string[]) { const { revalidateTag } = await import("next/cache"); for (const tag of tags) revalidateTag(tag, "max"); }
