"use client";

import React from "react";
import { usePathname } from "next/navigation";
import SideBar from "@/components/SideBar";


export default function MyAccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = pathname.split("/").pop() || "account";

  return (
    <div className="container flex flex-col lg:flex-row gap-4 py-6 min-h-[50vh]">
 
      <div className="lg:h-fit lg:sticky lg:top-[160px] lg:max-w-[300px] lg:w-full z-9 ">
        <SideBar active={active} />
      </div>

      <div className="w-full transition-all duration-300">
        {children}
      </div>
    </div>
  );
}
