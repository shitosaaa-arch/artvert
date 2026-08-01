import Link from "next/link";


const articles = [

  {
    title: "طريقة العناية بالنباتات المنزلية",
    icon: "🪴",
    description:
      "أهم النصائح للحفاظ على نباتات المنزل قوية وصحية من حيث الإضاءة والري والتغذية."
  },


  {
    title: "أسباب اصفرار أوراق النباتات وعلاجها",
    icon: "🍂",
    description:
      "تعرف على أسباب اصفرار الأوراق وكيفية تحديد المشكلة واختيار العلاج المناسب."
  },


  {
    title: "برنامج تغذية النبات للحصول على نمو قوي",
    icon: "🌱",
    description:
      "أهمية العناصر الكبرى والصغرى ومراحل استخدام الأسمدة والمنشطات."
  },


  {
    title: "مشاكل زيادة الري وطرق علاجها",
    icon: "💧",
    description:
      "كيف تؤثر زيادة المياه على الجذور وكيف تحافظ على توازن الري."
  },


  {
    title: "أفضل وقت لرش النباتات",
    icon: "☀️",
    description:
      "تعرف على الوقت المناسب للرش لتحقيق أفضل امتصاص وتقليل الإجهاد."
  },


  {
    title: "العناية بالنباتات في فصل الصيف",
    icon: "🌞",
    description:
      "طرق حماية النباتات من الحرارة والجفاف وتحسين مقاومتها."
  }

];



export default function BlogPage() {


  return (

    <main className="min-h-screen bg-[#f7faf7] py-20">


      <div className="mx-auto max-w-7xl px-6">


        <section className="text-center">


          <h1 className="text-5xl font-black">
            الإرشادات الزراعية 🌿
          </h1>


          <p className="mx-auto mt-6 max-w-3xl text-lg leading-9 text-gray-600">

            معلومات ونصائح زراعية تساعدك على العناية بالنباتات
            وتحقيق أفضل نمو وإنتاج.

          </p>


        </section>







        <section className="mt-16 grid gap-8 md:grid-cols-3">


          {articles.map((article,index)=>(


            <div

              key={index}

              className="
              rounded-3xl
              bg-white
              p-8
              shadow-lg
              transition
              hover:-translate-y-2
              "

            >


              <div className="text-5xl">
                {article.icon}
              </div>


              <h2 className="mt-5 text-2xl font-black">

                {article.title}

              </h2>



              <p className="mt-4 leading-8 text-gray-600">

                {article.description}

              </p>



              <button

                className="
                mt-6
                rounded-xl
                bg-green-700
                px-6
                py-3
                font-bold
                text-white
                "

              >

                اقرأ المزيد

              </button>



            </div>


          ))}


        </section>







        <section className="mt-20 rounded-3xl bg-green-700 p-12 text-center text-white">


          <h2 className="text-4xl font-black">

            تحتاج استشارة لنباتك؟

          </h2>


          <p className="mt-5 text-lg">

            تواصل معنا واحصل على نصيحة زراعية مناسبة.

          </p>



          <Link

            href="/plant-care"

            className="
            mt-8
            inline-block
            rounded-xl
            bg-white
            px-10
            py-4
            font-black
            text-green-700
            "

          >

            تشخيص النبات

          </Link>


        </section>



      </div>


    </main>

  );

}