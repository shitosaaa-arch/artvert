import Image from "next/image";
import Link from "next/link";

import GoldBranch from "@/components/GoldBranch";
import AnimatedSection from "@/components/AnimatedSection";


export const metadata = {

  title: "من نحن | ArtVert Egypt",

  description:
    "تعرف على ArtVert Egypt وحلولنا الزراعية المتكاملة",

};




export default function AboutPage() {



  const values = [

    {
      icon:"🏆",
      title:"الجودة",
      text:"منتجات عالية الجودة لتحقيق أفضل نمو وإنتاج للنبات."
    },

    {
      icon:"💡",
      title:"الابتكار",
      text:"نطور حلول زراعية حديثة تناسب احتياجات السوق."
    },

    {
      icon:"🤝",
      title:"الثقة",
      text:"شراكة ودعم فني مستمر مع عملائنا."
    },

    {
      icon:"🌱",
      title:"الاستدامة",
      text:"حلول زراعية تحافظ على النبات والبيئة."
    }

  ];





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

          src="/images/about-hero.jpg"

          alt="ArtVert"

          fill

          className="object-cover"

        />



        <div className="absolute inset-0 bg-black/70" />



        <AnimatedSection className="
        relative
        z-10
        flex
        h-full
        items-center
        justify-center
        px-6
        text-center
        ">


          <div>


            <h1 className="
            text-6xl
            font-black
            text-green-400
            ">

              ArtVert Egypt

            </h1>



            <p className="
            mt-8
            text-2xl
            text-gray-200
            ">

              حلول زراعية متكاملة لمستقبل أفضل

            </p>


          </div>


        </AnimatedSection>


      </section>









      {/* الارقام */}



      <AnimatedSection>


        <section className="
        mx-auto
        grid
        max-w-7xl
        gap-6
        px-6
        py-20
        md:grid-cols-4
        ">



          {[
            ["50+","منتج"],
            ["10+","حلول زراعية"],
            ["1000+","عميل"],
            ["24/7","دعم فني"]

          ].map((item)=>(


            <div

              key={item[1]}

              className="
              rounded-3xl
              border
              border-green-800
              bg-[#181818]
              p-8
              text-center
              "

            >

              <h2 className="
              text-5xl
              font-black
              text-green-400
              ">

                {item[0]}

              </h2>


              <p className="mt-4 text-xl">

                {item[1]}

              </p>


            </div>


          ))}



        </section>


      </AnimatedSection>









      {/* القصة */}



      <AnimatedSection>


        <section className="
        mx-auto
        grid
        max-w-7xl
        gap-10
        px-6
        py-10
        lg:grid-cols-2
        ">



          <div>


            <h2 className="
            text-5xl
            font-black
            text-green-400
            ">

              قصتنا

            </h2>



            <p className="
            mt-8
            text-lg
            leading-10
            text-gray-300
            ">

              بدأت ArtVert Egypt بهدف تقديم حلول زراعية
              تجمع بين جودة المنتج والخبرة الفنية،
              لمساعدة المزارعين ومحبي النباتات على
              تحقيق أفضل النتائج.


            </p>


          </div>





          <div className="
          relative
          h-[400px]
          overflow-hidden
          rounded-3xl
          ">


            <Image

              src="/images/farm.jpg"

              alt="farm"

              fill

              className="object-cover"

            />


          </div>



        </section>


      </AnimatedSection>









      {/* القيم */}



      <AnimatedSection>


        <section className="
        mx-auto
        max-w-7xl
        px-6
        py-20
        ">


          <h2 className="
          text-center
          text-5xl
          font-black
          text-green-400
          ">

            قيمنا

          </h2>





          <div className="
          mt-12
          grid
          gap-8
          md:grid-cols-4
          ">


            {values.map((item)=>(


              <div

                key={item.title}

                className="
                rounded-3xl
                border
                border-green-800
                bg-[#181818]
                p-8
                text-center
                "

              >

                <div className="text-5xl">

                  {item.icon}

                </div>


                <h3 className="
                mt-5
                text-2xl
                font-black
                text-green-400
                ">

                  {item.title}

                </h3>


                <p className="
                mt-4
                text-gray-300
                ">

                  {item.text}

                </p>


              </div>


            ))}



          </div>



        </section>


      </AnimatedSection>








      <AnimatedSection>


        <section className="
        mx-auto
        mb-20
        max-w-7xl
        rounded-3xl
        bg-green-900/40
        p-12
        text-center
        ">


          <h2 className="
          text-5xl
          font-black
          ">

            ابدأ رحلتك مع ArtVert

          </h2>



          <Link

            href="/products"

            className="
            mt-8
            inline-block
            rounded-xl
            bg-green-700
            px-10
            py-4
            font-black
            "

          >

            تصفح المنتجات

          </Link>



        </section>


      </AnimatedSection>



    </main>


  );

}