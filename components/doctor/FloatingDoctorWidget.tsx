"use client";

import { useState } from "react";
import Link from "next/link";
import { DoctorAvatarAsset } from "./DoctorAvatarAsset";

export function FloatingDoctorWidget() {
  const [open, setOpen] = useState(false);
  return <div className="fixed bottom-4 left-4 z-50" data-doctor-ui>
    {open && <div className="mb-3 w-72 rounded-3xl border border-lime-300/30 bg-[#0c1b11]/95 p-4 text-right text-white shadow-2xl backdrop-blur" role="dialog" aria-label="مساعد دكتور ArtVert">
      <div className="flex items-center gap-3"><DoctorAvatarAsset compact state="WELCOME"/><div><b className="text-lime-300">دكتور ArtVert</b><p className="mt-1 text-sm text-white/75">جاهز لمساعدتك في فهم حالة نباتك.</p></div></div>
      <Link href="/doctor" className="mt-3 block rounded-xl bg-lime-400 px-4 py-3 text-center text-sm font-black text-[#0b1a10]">ابدأ التشخيص</Link>
    </div>}
    <button onClick={() => setOpen(!open)} aria-expanded={open} aria-label="فتح محادثة دكتور ArtVert" className="flex min-h-11 items-center gap-2 rounded-full border border-lime-300/50 bg-[#112818] py-1 pl-3 pr-1 text-sm font-bold text-white shadow-xl transition hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300">
      <span>اسأل الدكتور</span><DoctorAvatarAsset compact state={open ? "WAVING" : "IDLE"}/>
    </button>
  </div>;
}
