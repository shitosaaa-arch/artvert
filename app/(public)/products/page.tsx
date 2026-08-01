"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { products } from "@/data/products";

import GoldBranch from "@/components/GoldBranch";
import AnimatedSection from "@/components/AnimatedSection";


export default function ProductsPage() {


  const [search, setSearch] = useState("");

  const [category, setCategory] = useState("الكل");



  const categories = [

    "الكل",

    "المنشطات الحيوية",

    "الأحماض الأمينية",

    "المبيدات الحشرية",

    "الأسمدة المتخصصة",

    "محسنات التربة",

    "الزراعة المنزلية",

    "العناصر الصغرى",

    "الأسمدة العضوية",

    "أسمدة الكالسيوم",

    "محسنات الامتصاص",

    "العناصر الكبرى والصغرى",

    "الأسمدة المركبة",

    "منشطات الجذور",

    "منظمات النمو"

  ];




  const filteredProducts = products.filter((product)=>{


    const searchMatch =

      product.nameAr.includes(search) ||

      product.nameEn
      .toLowerCase()
      .includes(search.toLowerCase());



    const categoryMatch =

      category === "الكل" ||

      product.category === category;



    return searchMatch && categoryMatch;


  });





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


        <AnimatedSection>


          <section className="text-center">


            <h1 className="
            text-6xl
            font-black
            text-green-400
            ">

              منتجات ArtVert Egypt

            </h1>



            <p className="
            mt-6
            text-xl
            text-gray-300
            ">

              حلول زراعية متخصصة لتغذية وحماية النبات

            </p>


          </section>


        </AnimatedSection>
                <AnimatedSection>


          <input


            type="text"


            placeholder="ابحث عن المنتج..."


            value={search}


            onChange={(e)=>setSearch(e.target.value)}


            className="
            mt-12
            w-full
            rounded-2xl
            border
            border-green-800
            bg-[#181818]
            px-6
            py-4
            text-lg
            text-white
            outline-none
            "


          />


        </AnimatedSection>





        <AnimatedSection>


          <div className="
          mt-8
          flex
          flex-wrap
          justify-center
          gap-3
          ">


            {categories.map((item)=>(


              <button


                key={item}


                onClick={()=>setCategory(item)}


                className={`

                rounded-full

                px-6

                py-3

                font-bold


                ${
                  category===item

                  ?

                  "bg-green-700 text-white"

                  :

                  "border border-green-800 bg-[#181818] text-green-300"

                }

                `}


              >

                {item}


              </button>


            ))}


          </div>


        </AnimatedSection>






        <p className="
        mt-12
        text-xl
        font-bold
        text-green-400
        ">

          عدد المنتجات: {filteredProducts.length}

        </p>





        <div className="
        mt-10
        grid
        gap-8
        sm:grid-cols-2
        lg:grid-cols-4
        ">



          {filteredProducts.map((product)=>(



            <AnimatedSection


              key={product.id}


              className="
              rounded-3xl
              border
              border-green-800
              bg-[#181818]
              overflow-hidden
              transition
              hover:-translate-y-3
              "


            >



              <Link href={`/products/${product.slug}`}>



                <div className="
                relative
                h-[430px]
                ">


                  <Image


                    src={product.image}


                    alt={product.nameAr}


                    fill


                    sizes="25vw"


                    className="
                    object-contain
                    p-5
                    "


                  />


                </div>






                <div className="p-6">



                  <span className="
                  text-sm
                  text-green-400
                  ">

                    {product.category}

                  </span>





                  <h2 className="
                  mt-3
                  text-2xl
                  font-black
                  ">

                    {product.nameAr}

                  </h2>





                  <p className="
                  mt-3
                  line-clamp-2
                  text-gray-300
                  ">

                    {product.shortDescription}

                  </p>





                  <div className="
                  mt-5
                  rounded-xl
                  bg-green-700
                  py-3
                  text-center
                  font-black
                  ">

                    تفاصيل المنتج

                  </div>



                </div>



              </Link>



            </AnimatedSection>



          ))}



        </div>




      </div>



    </main>


  );


}