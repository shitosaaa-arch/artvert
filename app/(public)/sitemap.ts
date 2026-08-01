import { MetadataRoute } from "next";
import { products } from "@/data/products";


export default function sitemap(): MetadataRoute.Sitemap {


  const productPages = products.map((product) => ({

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