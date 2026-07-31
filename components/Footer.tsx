import Link from "next/link";
import GoldBranch from "./GoldBranch";


export default function Footer() {


  return (

    <footer className="relative overflow-hidden border-t border-green-900 bg-[#0b0b0b] text-white">


      <GoldBranch
        className="right-0 top-0 opacity-10"
      />



      <div className="relative z-10 mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-4">



        <div>


          <h2 className="text-3xl font-black text-green-400">
            ArtVert Egypt
          </h2>


          <p className="mt-5 leading-8 text-gray-300">

            حلول زراعية متكاملة للتغذية والحماية
            وتحسين نمو النبات بأحدث التقنيات.

          </p>


        </div>







        <div>


          <h3 className="text-xl font-black text-green-400">
            روابط سريعة
          </h3>


          <div className="mt-5 flex flex-col gap-3 text-gray-300">


            <Link href="/">
              الرئيسية
            </Link>


            <Link href="/products">
              المنتجات
            </Link>


            <Link href="/about">
              من نحن
            </Link>


            <Link href="/contact">
              تواصل معنا
            </Link>


          </div>


        </div>








        <div>


          <h3 className="text-xl font-black text-green-400">
            منتجاتنا
          </h3>


          <div className="mt-5 flex flex-col gap-3 text-gray-300">


            <span>
              الأسمدة والمغذيات
            </span>


            <span>
              المنشطات الحيوية
            </span>


            <span>
              حماية النبات
            </span>


            <span>
              الزراعة المنزلية
            </span>


          </div>


        </div>








        <div>


          <h3 className="text-xl font-black text-green-400">
            تواصل معنا
          </h3>


          <div className="mt-5 space-y-3 text-gray-300">


            <p>
              📞 01080040408
            </p>


            <p>
              📍 Egypt
            </p>


            <p>
              🌿 ArtVert Egypt
            </p>


          </div>


        </div>



      </div>







      <div className="border-t border-green-900 py-5 text-center text-gray-400">


        © {new Date().getFullYear()} ArtVert Egypt - All Rights Reserved


      </div>




    </footer>

  );

}