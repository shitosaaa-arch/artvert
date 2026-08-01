import Image from "next/image";
import Link from "next/link";

import { products } from "@/data/products";

import GoldBranch from "@/components/GoldBranch";
import AnimatedSection from "@/components/AnimatedSection";



export default function Home() {



  const featuredProducts = [

    products.find(
      (item) => item.slug === "plant-grow"
    ),

    ...products
      .filter(
        (item) => item.slug !== "plant-grow"
      )
      .slice(0,3)

  ].filter(Boolean);







  return (


    <main className="
    relative
    min-h-screen
    overflow-hidden
    bg-[#111111]
    text-white
    ">



      <GoldBranch
        className="right-0 top-20 opacity-20"
      />


      <GoldBranch
        rotate
        className="bottom-0 left-0 opacity-20"
      />









      {/* Hero */}


      <section className="relative h-[650px]">


        <Image

          src="/hero.jpeg"

          alt="ArtVert Egypt"

          fill

          priority

          className="object-cover"

        />



        <div className="
        absolute
        inset-0
        bg-black/70
        " />





        <AnimatedSection className="
        relative
        z-10
        flex
        h-full
        items-center
        px-6
        ">


          <div className="
          mx-auto
          w-full
          max-w-7xl
          ">



            <h1 className="
            text-6xl
            font-black
            text-green-400
            ">

              ArtVert Egypt

            </h1>





            <p className="
            mt-8
            max-w-3xl
            text-2xl
            leading-10
            text-gray-200
            ">


              حلول زراعية متكاملة لتغذية وحماية النبات
              وتحقيق أفضل نمو وإنتاج.


            </p>





            <Link

              href="/products"

              className="
              mt-10
              inline-block
              rounded-xl
              bg-green-700
              px-10
              py-4
              text-xl
              font-black
              "

            >

              اكتشف المنتجات

            </Link>



          </div>



        </AnimatedSection>


      </section>









      {/* المنتج المميز */}



      <AnimatedSection>


        <section className="
        mx-auto
        max-w-7xl
        px-6
        py-20
        ">


          <div className="
          rounded-3xl
          border
          border-green-700
          bg-[#181818]
          p-8
          ">



            <h2 className="
            text-center
            text-4xl
            font-black
            text-green-400
            ">

              ⭐ المنتج المميز

            </h2>



            <div className="
            mt-8
            grid
            gap-8
            lg:grid-cols-2
            ">


              {products
                .filter(
                  (item)=>item.slug==="plant-grow"
                )
                .map((product)=>(


                <div
                  key={product.id}
                  className="relative h-[450px]"
                >

                  <Image

                    src={product.image}

                    alt={product.nameAr}

                    fill

                    className="object-contain"

                  />

                </div>


              ))}




              <div className="
              flex
              flex-col
              justify-center
              ">



                <h3 className="
                text-5xl
                font-black
                text-green-400
                ">

                  Plant Grow

                </h3>



                <p className="
                mt-6
                text-xl
                leading-10
                text-gray-300
                ">

                  تغذية متكاملة للنبات،
                  دعم قوي للجذور والنمو،
                  وحل مثالي للنباتات المنزلية والزراعية.

                </p>



                <Link

                  href="/products/plant-grow"

                  className="
                  mt-8
                  rounded-xl
                  bg-green-700
                  py-4
                  text-center
                  font-black
                  "

                >

                  تفاصيل المنتج

                </Link>



              </div>



            </div>


          </div>



        </section>


      </AnimatedSection>







{/* Doctor ArtVert */}

<AnimatedSection>

<section className="
mx-auto
max-w-7xl
px-6
pb-20
">

<div className="
rounded-3xl
border
border-green-700
bg-[#181818]
p-10
text-center
">

<h2 className="
text-4xl
font-black
text-green-400
">

👨‍🌾 دكتور ArtVert

</h2>


<p className="
mx-auto
mt-6
max-w-3xl
text-xl
leading-10
text-gray-300
">

عندك مشكلة في نباتك؟
أرسل صورة النبات واحصل على تشخيص
وحل مناسب من خبراء ArtVert.

</p>


<div className="
mt-8
flex
flex-wrap
justify-center
gap-4
">


<Link

href="/doctor"

className="
rounded-xl
bg-green-700
px-10
py-4
font-black
"

>

اسأل دكتور ArtVert

</Link>


<a

href="https://wa.me/201080040408"

target="_blank"

className="
rounded-xl
border
border-green-700
px-10
py-4
font-black
text-green-400
"

>

🟢 أرسل صورة نباتك

</a>


</div>

</div>

</section>

</AnimatedSection>

      {/* باقي المنتجات */}



      <AnimatedSection>


        <section className="
        mx-auto
        max-w-7xl
        px-6
        pb-20
        ">


          <h2 className="
          text-center
          text-5xl
          font-black
          text-green-400
          ">

            منتجات مختارة

          </h2>





          <div className="
          mt-12
          grid
          gap-8
          sm:grid-cols-2
          lg:grid-cols-4
          ">


            {featuredProducts.map((product:any)=>(


              <Link

                key={product.id}

                href={`/products/${product.slug}`}

                className="
                rounded-3xl
                border
                border-green-800
                bg-[#181818]
                p-4
                transition
                hover:-translate-y-3
                "

              >



                <div className="
                relative
                h-[420px]
                ">


                  <Image

                    src={product.image}

                    alt={product.nameAr}

                    fill

                    sizes="25vw"

                    className="object-contain"

                  />


                </div>




                <h3 className="
                mt-5
                text-center
                text-2xl
                font-black
                text-green-400
                ">

                  {product.nameAr}

                </h3>



              </Link>


            ))}


          </div>



        </section>


      </AnimatedSection>





    </main>


  );

}