"use client";

import dynamic from "next/dynamic";
import type { CategoryI } from "@/Types/CategoriesI";

const FastBuy = dynamic(() => import("./FastBuy"), { ssr: false });

export default function LazyFastBuy({
  categories,
}: {
  categories: CategoryI[];
}) {
  return <FastBuy categories={categories} />;
}
