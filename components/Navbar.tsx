"use client";

import Link from "next/link";
import Image from "next/image";



export default function Navbar() {



  const links = [

    {
      name: "الرئيسية",
      href: "/"
    },

    {
      name: "المنتجات",
      href: "/products"
    },

    {
      name: "دكتور ArtVert",
      href: "/doctor"
    },

    {
      name: "العناية بالنبات",
      href: "/plant-care"
    },

    {
      name: "من نحن",
      href: "/about"
    },

    {
      name: "تواصل معنا",
      href: "/contact"
    },

  ];




  return (


    <nav className="
    sticky
    top-0
    z-50
    border-b
    border-green-900
    bg-[#111111]/90
    backdrop-blur
    ">


      <div className="
      mx-auto
      flex
      max-w-7xl
      items-center
      justify-between
      px-6
      py-4
      ">



        <Link

          href="/"

          className="
          flex
          items-center
          gap-3
          "

        >

          <Image

            src="/images/logo.jpeg"

            alt="ArtVert Egypt"

            width={55}

            height={55}

            className="rounded-full"

          />


          <span className="
          text-2xl
          font-black
          text-green-400
          ">

            ArtVert

          </span>


        </Link>







        <div className="
        hidden
        items-center
        gap-6
        lg:flex
        ">


          {links.map((link)=>(


            <Link

              key={link.href}

              href={link.href}

              className="
              font-bold
              text-gray-200
              transition
              hover:text-green-400
              "

            >

              {link.name}

            </Link>


          ))}


        </div>






        <a

          href="https://wa.me/201080040408"

          target="_blank"

          className="
          rounded-xl
          bg-green-700
          px-5
          py-3
          font-black
          "

        >

          واتساب

        </a>




      </div>


    </nav>


  );

}