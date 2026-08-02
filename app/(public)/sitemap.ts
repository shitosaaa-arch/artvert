import { MetadataRoute } from "next";
import { getProductCatalog } from "@/lib/products/product-catalog";


export default async function sitemap(): Promise<MetadataRoute.Sitemap> {


  const productPages = (await getProductCatalog().list()).map((product) => ({

    url: `https://www.artvert.com/products/${product.slug}`,

    lastModified: new Date(),

  }));



  return [

    {
      url: "https://www.artvert.com",
      lastModified: new Date(),
    },


    {
      url: "https://www.artvert.com/products",
      lastModified: new Date(),
    },


    {
      url: "https://www.artvert.com/about",
      lastModified: new Date(),
    },


    {
      url: "https://www.artvert.com/contact",
      lastModified: new Date(),
    },


    {
      url: "https://www.artvert.com/plant-care",
      lastModified: new Date(),
    },


    {
      url: "https://www.artvert.com/blog",
      lastModified: new Date(),
    },


    ...productPages,


  ];

}
