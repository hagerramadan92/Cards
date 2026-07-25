"use client";

import { useEffect } from "react";
import type { CategoryI } from "@/Types/CategoriesI";
import {
  type HomeData,
  useAppContext,
} from "@/src/context/AppContext";

type HomeDataHydratorProps = {
  homeData: HomeData | null;
  parentCategories: CategoryI[];
  shouldRetry: boolean;
  language: string;
};

export default function HomeDataHydrator({
  homeData,
  parentCategories,
  shouldRetry,
  language,
}: HomeDataHydratorProps) {
  const { hydrateInitialData, refreshAppData } = useAppContext();

  useEffect(() => {
    hydrateInitialData(homeData, parentCategories);

    if (shouldRetry) {
      void refreshAppData(language);
    }
  }, [
    homeData,
    hydrateInitialData,
    language,
    parentCategories,
    refreshAppData,
    shouldRetry,
  ]);

  return null;
}
