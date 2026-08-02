const problems = [
  {
    icon: "🍂",
    title: "اصفرار الأوراق",
    text: "قد يكون بسبب نقص العناصر أو زيادة الري أو مشاكل الجذور.",
    treatment:
      "فحص الري والتربة، واستخدام برنامج تغذية مناسب يحتوي على العناصر الصغرى."
  },

  {
    icon: "💧",
    title: "ذبول النبات",
    text: "غالبًا بسبب مشاكل الجذور أو نقص المياه أو حرارة زائدة.",
    treatment:
      "فحص الجذور وتقليل الإجهاد وتحسين التهوية واستخدام منشطات جذور."
  },

  {
    icon: "🐛",
    title: "إصابات الحشرات",
    text: "مثل المن والذبابة البيضاء والعناكب.",
    treatment:
      "تحديد نوع الحشرة واختيار المبيد المناسب حسب الإصابة."
  },

  {
    icon: "🟤",
    title: "بقع على الأوراق",
    text: "قد تكون إصابة فطرية أو نقص عنصر غذائي.",
    treatment:
      "تشخيص السبب أولاً ثم استخدام المعاملة المناسبة."
  },

  {
    icon: "🌱",
    title: "ضعف النمو",
    text: "النبات لا ينمو بشكل طبيعي أو الأوراق صغيرة.",
    treatment:
      "تحسين التغذية واستخدام منشطات النمو والعناصر المطلوبة."
  },

  {
    icon: "🪴",
    title: "مشاكل نباتات المنزل",
    text: "مثل سقوط الأوراق وضعف النباتات الداخلية.",
    treatment:
      "ضبط الإضاءة والري واستخدام التغذية المناسبة للنباتات المنزلية."
  }
];


export default function PlantCarePage() {


  return (

    <main className="min-h-screen bg-[#f7faf7] py-20">


      <div className="mx-auto max-w-7xl px-6">


        {/* العنوان */}

        <section className="text-center">


          <h1 className="text-5xl font-black">
            تشخيص مشاكل النبات 🌿
          </h1>


          <p className="mx-auto mt-6 max-w-3xl text-lg leading-9 text-gray-600">

            تعرف على أشهر مشاكل النباتات وأسبابها
            وطرق العلاج المناسبة مع فريق ArtVert.

          </p>


        </section>






        {/* المشاكل */}


        <section className="mt-16 grid gap-8 md:grid-cols-3">


          {problems.map((problem,index)=>(


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
                {problem.icon}
              </div>


              <h2 className="mt-5 text-2xl font-black">

                {problem.title}

              </h2>



              <p className="mt-4 leading-8 text-gray-600">

                {problem.text}

              </p>



              <div className="mt-5 rounded-2xl bg-green-50 p-4">

                <h3 className="font-bold text-green-700">
                  العلاج:
                </h3>


                <p className="mt-2 text-gray-700">
                  {problem.treatment}
                </p>


              </div>



            </div>


          ))}


        </section>









        {/* التواصل */}


        <section className="mt-20 rounded-3xl bg-green-700 p-12 text-center text-white">


          <h2 className="text-4xl font-black">

            عندك مشكلة في نباتك؟

          </h2>


          <p className="mt-5 text-lg">

            ابعت صورة النبات لفريق ArtVert واحصل على التشخيص المناسب.

          </p>



          <a

            href="https://wa.me/201080040408"

            target="_blank"

            rel="noopener noreferrer"

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

            📸 ابعت صورة النبات

          </a>


        </section>




      </div>


    </main>

  );

}
