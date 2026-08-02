import { NextResponse } from "next/server"; import { getProductCatalog } from "@/lib/products/product-catalog";
export async function GET(){try{return NextResponse.json(await getProductCatalog().list());}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Product catalog unavailable"},{status:503});}}
