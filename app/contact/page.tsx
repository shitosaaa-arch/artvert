import Link from "next/link";
import GoldBranch from "@/components/GoldBranch";


export const metadata = {
  title: "تواصل معنا | ArtVert Egypt",
  description: "تواصل مع ArtVert Egypt للحصول على أفضل الحلول الزراعية",
};



export default function ContactPage() {


  return (

    <main className="relative min-h-screen overflow-hidden bg-[#111111] text-white py-20">


      <GoldBranch
        className="right-0 top-20 opacity-20"
      />

      <GoldBranch
        rotate
        className="bottom-0 left-0 opacity-20"
      />




      <div className="relative z-10 mx-auto max-w-7xl px-6">



        <section className="text-center">


          <h1 className="text-6xl font-black text-green-400">
            تواصل معنا
          </h1>


          <p className="mx-auto mt-8 max-w-3xl text-xl leading-10 text-gray-300">

            نحن هنا لمساعدتك في اختيار أفضل الحلول الزراعية
            المناسبة لنباتاتك ومحاصيلك.

          </p>


        </section>








        <section className="mt-16 grid gap-10 lg:grid-cols-2">






          <div className="
          rounded-3xl
          border
          border-green-800
          bg-[#181818]
          p-10
          ">



            <h2 className="
            text-4xl
            font-black
            text-green-400
            ">

              بيانات التواصل

            </h2>





            <div className="mt-8 space-y-6 text-xl text-gray-300">


              <p>
                📞 الهاتف:
                <br />
                01080040408
              </p>



              <p>
                🌿 الشركة:
                <br />
                ArtVert Egypt
              </p>




              <p>
                📍 الموقع:
                <br />
                Egypt
              </p>



              <p>
                ⏰ خدمة العملاء:
                <br />
                طوال أيام الأسبوع
              </p>



            </div>






            <a

              href="https://wa.me/201080040408"

              target="_blank"

              className="
              mt-10
              block
              rounded-xl
              bg-green-700
              py-4
              text-center
              text-xl
              font-black
              hover:bg-green-600
              "

            >

              🟢 تواصل واتساب

            </a>



          </div>









          <div className="
          rounded-3xl
          border
          border-green-800
          bg-[#181818]
          p-10
          ">



            <h2 className="
            text-4xl
            font-black
            text-green-400
            ">

              أرسل رسالة

            </h2>





            <form className="mt-8 space-y-5">


              <input

                type="text"

                placeholder="الاسم"

                className="
                w-full
                rounded-xl
                border
                border-green-800
                bg-[#111111]
                px-5
                py-4
                outline-none
                "

              />





              <input

                type="tel"

                placeholder="رقم الهاتف"

                className="
                w-full
                rounded-xl
                border
                border-green-800
                bg-[#111111]
                px-5
                py-4
                outline-none
                "

              />







              <textarea

                placeholder="رسالتك"

                rows={5}

                className="
                w-full
                rounded-xl
                border
                border-green-800
                bg-[#111111]
                px-5
                py-4
                outline-none
                "

              />







              <button

                type="submit"

                className="
                w-full
                rounded-xl
                bg-green-700
                py-4
                text-xl
                font-black
                "

              >

                إرسال

              </button>



            </form>



          </div>





        </section>









        <section className="
        mt-16
        rounded-3xl
        bg-green-900/40
        p-10
        text-center
        ">


          <h2 className="text-4xl font-black">

            هل تحتاج استشارة زراعية؟

          </h2>


          <p className="mt-5 text-lg text-gray-200">

            فريق ArtVert جاهز لمساعدتك في اختيار البرنامج المناسب.

          </p>


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





      </div>


    </main>

  );

}