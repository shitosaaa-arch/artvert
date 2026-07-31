import Link from "next/link";
import GoldBranch from "@/components/GoldBranch";


export default function NotFound() {


  return (

    <main className="
    relative
    flex
    min-h-screen
    items-center
    justify-center
    overflow-hidden
    bg-[#111111]
    px-6
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
      text-center
      ">


        <h1 className="
        text-9xl
        font-black
        text-green-400
        ">

          404

        </h1>




        <h2 className="
        mt-6
        text-4xl
        font-black
        ">

          الصفحة غير موجودة

        </h2>




        <p className="
        mt-5
        text-xl
        text-gray-300
        ">

          عذرًا، الصفحة التي تبحث عنها غير متاحة.

        </p>





        <Link

          href="/"

          className="
          mt-10
          inline-block
          rounded-xl
          bg-green-700
          px-10
          py-4
          font-black
          transition
          hover:bg-green-600
          "

        >

          العودة للرئيسية

        </Link>



      </div>



    </main>

  );

}