// hooks/useSiteMetadata.ts
import { useData } from "@/src/context/DataContext";

export function useSiteMetadata() {
  const { settings, loading } = useData();

  const getMetadata = () => {
    if (!settings || loading) {
      return {
        title: "LikeCard",
        description: "أكبر منصة بطاقات شحن رقمية",
        keywords: ["بطاقات شحن", "LikeCard"],
      };
    }

    return {
      title: settings.translated_settings.site_title || settings.all_settings.title_website || "LikeCard",
      description: settings.translated_settings.site_description || "أكبر منصة بطاقات شحن رقمية",
      keywords: settings.translated_settings.site_keywords || "بطاقات شحن, LikeCard",
    };
  };

  return getMetadata;
}