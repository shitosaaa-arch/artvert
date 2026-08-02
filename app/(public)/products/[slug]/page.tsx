import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { getProductCatalog } from "@/lib/products/product-catalog";

import GoldBranch from "@/components/GoldBranch";
import AnimatedSection from "@/components/AnimatedSection";


type Props = {
  params: Promise<{
    slug:string;
  }>;
};





export async function generateMetadata(
  {params}:Props
):Promise<Metadata>{


  const {slug}=await params;


  const product = await getProductCatalog().findBySlug(slug);


  return {

    title: product
      ? `${product.nameAr} | ArtVert Egypt`
      : "ArtVert Egypt",


    description:
      product?.description || "حلول زراعية متكاملة"

  };


}








export default async function ProductPage({params}:Props){



  const {slug}=await params;



  const product = await getProductCatalog().findBySlug(slug);



  if(!product){

    notFound();

  }






  return (


    <main className="
    relative
    min-h-screen
    overflow-hidden
    bg-[#111111]
    py-16
    text-white
    ">



      <GoldBranch
        className="right-0 top-20 opacity-20"
      />


      <GoldBranch
        rotate
        className="bottom-0 left-0 opacity-20"
      />







      <div className="
      relative
      z-10
      mx-auto
      max-w-7xl
      px-6
      ">





        <Link

          href="/products"

          className="
          rounded-xl
          bg-green-700
          px-6
          py-3
          font-black
          "

        >

          ← كل المنتجات

        </Link>








        <div className="
        mt-12
        grid
        gap-12
        lg:grid-cols-2
        ">







          {/* صورة المنتج */}


          <AnimatedSection>


            <div className="
            rounded-3xl
            border
            border-green-800
            bg-[#181818]
            p-6
            ">



              <div className="
              relative
              h-[650px]
              ">


                <Image

                  src={product.image}

                  alt={product.nameAr}

                  fill

                  priority

                  sizes="50vw"

                  className="
                  object-contain
                  "

                />


              </div>


            </div>


          </AnimatedSection>









          {/* بيانات المنتج */}


          <AnimatedSection>


            <div>



              <span className="
              rounded-full
              bg-green-900
              px-5
              py-2
              text-green-300
              ">

                {product.category}

              </span>






              <h1 className="
              mt-8
              text-5xl
              font-black
              text-green-400
              ">

                {product.nameAr}

              </h1>






              <h2 className="
              mt-3
              text-2xl
              text-gray-400
              ">

                {product.nameEn}

              </h2>







              <p className="
              mt-8
              text-lg
              leading-10
              text-gray-300
              ">

                {product.description}

              </p>









              <section className="mt-10">


                <h3 className="
                text-3xl
                font-black
                text-green-400
                ">

                  مميزات المنتج

                </h3>





                <div className="
                mt-5
                grid
                gap-4
                ">


                  {product.benefits.map((item,index)=>(


                    <div

                      key={index}

                      className="
                      rounded-xl
                      border
                      border-green-800
                      bg-[#181818]
                      p-5
                      "

                    >

                      🌿 {item}

                    </div>


                  ))}


                </div>


              </section>









              <section className="mt-10">


                <h3 className="
                text-3xl
                font-black
                text-green-400
                ">

                  التركيب

                </h3>




                <div className="
                mt-5
                rounded-2xl
                border
                border-green-800
                bg-[#181818]
                p-6
                ">


                  <p className="
                  whitespace-pre-line
                  leading-10
                  text-gray-300
                  ">

                    {product.composition}

                  </p>


                </div>


              </section>









              <section className="mt-10">


                <h3 className="
                text-3xl
                font-black
                text-green-400
                ">

                  طريقة الاستخدام

                </h3>



                <p className="
                mt-5
                whitespace-pre-line
                leading-10
                text-gray-300
                ">

                  {product.dosage}

                </p>


              </section>









              <a

                href="https://wa.me/201080040408"

                target="_blank"

                rel="noopener noreferrer"

                className="
                mt-10
                block
                rounded-xl
                bg-green-700
                py-4
                text-center
                text-xl
                font-black
                transition
                hover:bg-green-600
                "

              >

                🟢 اطلب المنتج عبر واتساب

              </a>




            </div>


          </AnimatedSection>







        </div>




      </div>



    </main>


  );

}
