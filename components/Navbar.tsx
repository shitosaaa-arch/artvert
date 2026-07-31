"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";


export default function Navbar() {


  const [open, setOpen] = useState(false);



  return (

    <nav className="sticky top-0 z-50 border-b border-green-900 bg-[#050505]/95 text-white backdrop-blur">


      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">


        <Link
          href="/"
          className="flex items-center gap-3"
          onClick={() => setOpen(false)}
        >

          <Image

            src="/images/logo.jpeg"

            alt="ArtVert Egypt"

            width={55}

            height={55}

            style={{
              width:"55px",
              height:"55px"
            }}

            className="rounded-full object-cover"

          />


          <span className="text-2xl font-black text-green-400 md:text-3xl">

            ArtVert Egypt

          </span>


        </Link>





        <div className="hidden items-center gap-8 text-lg font-bold md:flex">


          <Link href="/" className="hover:text-green-400">
            الرئيسية
          </Link>


          <Link href="/products" className="hover:text-green-400">
            المنتجات
          </Link>


          <Link href="/about" className="hover:text-green-400">
            من نحن
          </Link>


          <Link href="/contact" className="hover:text-green-400">
            تواصل معنا
          </Link>


        </div>






        <a
          href="https://wa.me/201080040408"
          target="_blank"
          className="hidden rounded-xl bg-green-700 px-5 py-3 font-black hover:bg-green-600 md:block"
        >

          واتساب 🟢

        </a>







        <button

          onClick={() => setOpen(!open)}

          className="text-3xl text-green-400 md:hidden"

        >

          ☰

        </button>


      </div>







      {open && (

        <div className="border-t border-green-900 bg-[#0b0b0b] px-6 py-6 md:hidden">


          <div className="flex flex-col gap-5 text-lg font-bold">


            <Link href="/" onClick={()=>setOpen(false)}>
              الرئيسية
            </Link>


            <Link href="/products" onClick={()=>setOpen(false)}>
              المنتجات
            </Link>


            <Link href="/about" onClick={()=>setOpen(false)}>
              من نحن
            </Link>


            <Link href="/contact" onClick={()=>setOpen(false)}>
              تواصل معنا
            </Link>


            <a
              href="https://wa.me/201080040408"
              target="_blank"
              className="rounded-xl bg-green-700 py-3 text-center"
            >
              واتساب 🟢
            </a>


          </div>


        </div>

      )}



    </nav>

  );

}