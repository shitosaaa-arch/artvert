import Image from "next/image";
import Link from "next/link";

import GoldBranch from "@/components/GoldBranch";
import AnimatedSection from "@/components/AnimatedSection";


export const metadata = {

  title: "دكتور ArtVert | الاستشارات الزراعية",

  description:
    "اسأل دكتور ArtVert عن مشاكل النباتات والمحاصيل واحصل على التشخيص والحل المناسب",

};




export default function DoctorPage() {


  const services = [

    "تشخيص مشاكل النباتات من الصور",

    "برامج تسميد حسب المحصول والعمر",

    "حل مشاكل نقص العناصر الغذائية",

    "برامج مكافحة الآفات والأمراض",

    "إرشادات النباتات المنزلية والتريريات",

    "متابعة برامج التغذية الزراعية"

  ];





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


          <section className="
          rounded-3xl
          border
          border-green-800
          bg-[#181818]
          p-10
          text-center
          ">


            <h1 className="
            text-5xl
            font-black
            text-green-400
            md:text-6xl
            ">

              👨‍🌾 دكتور ArtVert

            </h1>



            <p className="
            mx-auto
            mt-6
            max-w-3xl
            text-xl
            leading-10
            text-gray-300
            ">

              خدمة الاستشارات الزراعية من ArtVert،
              أرسل مشكلة نباتك واحصل على التشخيص
              والحل المناسب.

            </p>



            <a

              href="https://wa.me/201080040408"

              target="_blank"

              className="
              mt-8
              inline-block
              rounded-xl
              bg-green-700
              px-10
              py-4
              text-xl
              font-black
              "

            >

              🟢 اسأل دكتور ArtVert

            </a>



          </section>


        </AnimatedSection>









        <AnimatedSection>


          <section className="
          mt-16
          grid
          gap-10
          lg:grid-cols-2
          ">


            <div className="
            relative
            h-[450px]
            overflow-hidden
            rounded-3xl
            ">


              <Image

                src="/images/farm.jpg"

                alt="ArtVert Doctor"

                fill

                className="object-cover"

              />


            </div>







            <div>


              <h2 className="
              text-4xl
              font-black
              text-green-400
              ">

                ماذا يقدم لك دكتور ArtVert؟

              </h2>



              <div className="
              mt-8
              space-y-4
              ">


                {services.map((service)=>(


                  <div

                    key={service}

                    className="
                    rounded-xl
                    border
                    border-green-800
                    bg-[#181818]
                    p-5
                    "

                  >

                    🌿 {service}

                  </div>


                ))}


              </div>


            </div>


          </section>


        </AnimatedSection>









        <AnimatedSection>


          <section className="
          mt-16
          rounded-3xl
          bg-green-900/40
          p-10
          text-center
          ">


            <h2 className="
            text-4xl
            font-black
            ">

              عندك مشكلة في نباتك؟

            </h2>



            <p className="
            mt-5
            text-lg
            text-gray-200
            ">

              صوّر النبات وأرسل الصورة،
              وفريق ArtVert يساعدك في التشخيص.

            </p>




            <Link

              href="/contact"

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

              تواصل معنا

            </Link>



          </section>


        </AnimatedSection>





      </div>


    </main>


  );

}