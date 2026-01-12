"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAppContext } from "@/src/context/AppContext";
import {
  FaPhone,
  FaWhatsapp,
  FaFacebook,
  FaTwitter,
  FaLinkedin,
  FaEnvelope,
  FaMapMarkerAlt,
  FaInstagram,
  FaSnapchat,
  FaTelegram,
  FaYoutube,
  FaPinterest,
  FaTiktok,
  FaReddit,
  FaDiscord,
  FaCcVisa,
  FaCcMastercard,
  FaCcPaypal,
  FaCcApplePay,
  FaCcAmex,
  FaCcDiscover,
  FaCcStripe,
  FaCreditCard,
  FaMoneyBill,
} from "react-icons/fa";
import Image from "next/image";

type SocialItem = { key: string; value: any; icon?: string };
type PaymentMethod = { id: number; name: string; icon?: string; is_active: boolean };

function isEmptyValue(v: any) {
  if (v === null || v === undefined) return true;
  if (typeof v !== "string") return false;
  return v.trim().length === 0;
}

function normalizeSocialHref(key: string, value: string) {
  const v = value.trim();

  if (key === "phone") return v.startsWith("tel:") ? v : `tel:${v}`;

  if (key === "email") return v.startsWith("mailto:") ? v : `mailto:${v}`;

  if (key === "whatsapp") {
    if (v.startsWith("http")) return v;
    const digits = v.replace(/[^\d+]/g, "");
    const wa = digits.startsWith("+") ? digits.slice(1) : digits;
    return `https://wa.me/${wa}`;
  }

  if (key === "address") return "";

  if (v.startsWith("http")) return v;
  return `https://${v}`;
}

// Map payment method names/identifiers to React Icons
const paymentIconsMap: Record<string, any> = {
  visa: FaCcVisa,
  "credit-card": FaCreditCard,
  mastercard: FaCcMastercard,
  paypal: FaCcPaypal,
  "apple-pay": FaCcApplePay,
  amex: FaCcAmex,
  discover: FaCcDiscover,
  stripe: FaCcStripe,
  cash: FaMoneyBill,
  money: FaMoneyBill,
};

function getPaymentIcon(iconName: string | undefined, paymentName: string) {
  if (!iconName) {
    const lowerName = paymentName.toLowerCase();
    if (lowerName.includes("visa")) return FaCcVisa;
    if (lowerName.includes("mastercard")) return FaCcMastercard;
    if (lowerName.includes("paypal")) return FaCcPaypal;
    if (lowerName.includes("apple")) return FaCcApplePay;
    if (lowerName.includes("amex") || lowerName.includes("american express")) return FaCcAmex;
    if (lowerName.includes("discover")) return FaCcDiscover;
    if (lowerName.includes("stripe")) return FaCcStripe;
    return FaCreditCard;
  }

  const lowerIcon = iconName.toLowerCase().replace(/[^a-z0-9-]/g, "");
  return paymentIconsMap[lowerIcon] || FaCreditCard;
}

export default function Footer() {
  const { socialMedia, paymentMethods, parentCategories } = useAppContext() as any;

  const socials: SocialItem[] = Array.isArray(socialMedia) ? socialMedia : [];
  const payments: PaymentMethod[] = Array.isArray(paymentMethods) ? paymentMethods : [];
  
  // Split categories into two sections (first 10 only)
  const categories = Array.isArray(parentCategories) ? parentCategories.slice(0, 10) : [];
  const midPoint = Math.ceil(categories.length / 2);
  const firstSectionCategories = categories.slice(0, midPoint);
  const secondSectionCategories = categories.slice(midPoint);

  const socialIcons: Record<string, any> = {
    phone: FaPhone,
    whatsapp: FaWhatsapp,
    facebook: FaFacebook,
    twitter: FaTwitter,
    linkedin: FaLinkedin,
    instagram: FaInstagram,
    snapchat: FaSnapchat,
    telegram: FaTelegram,
    email: FaEnvelope,
    tiktok: FaTiktok,
    youtube: FaYoutube,
    pinterest: FaPinterest,
    reddit: FaReddit,
    discord: FaDiscord,
    address: FaMapMarkerAlt,
  };

  // Social media brand colors
  const getSocialColor = (key: string) => {
    const colors: Record<string, string> = {
      whatsapp: "bg-[#25D366] hover:bg-[#20BA5A] border-[#25D366]/20",
      facebook: "bg-[#1877F2] hover:bg-[#166FE5] border-[#1877F2]/20",
      instagram: "bg-gradient-to-br from-[#E4405F] via-[#C13584] to-[#833AB4] hover:from-[#D12E4D] hover:via-[#B02A73] hover:to-[#7230A3] border-[#C13584]/20",
      twitter: "bg-[#1DA1F2] hover:bg-[#1A91DA] border-[#1DA1F2]/20",
      linkedin: "bg-[#0077B5] hover:bg-[#006BA3] border-[#0077B5]/20",
      youtube: "bg-[#FF0000] hover:bg-[#E60000] border-[#FF0000]/20",
      tiktok: "bg-[#000000] hover:bg-[#1A1A1A] border-[#000000]/20",
      snapchat: "bg-[#FFFC00] hover:bg-[#E6E300] border-[#FFFC00]/20 text-black",
      telegram: "bg-[#0088CC] hover:bg-[#0077B3] border-[#0088CC]/20",
      pinterest: "bg-[#BD081C] hover:bg-[#A50718] border-[#BD081C]/20",
      reddit: "bg-[#FF4500] hover:bg-[#E63D00] border-[#FF4500]/20",
      discord: "bg-[#5865F2] hover:bg-[#4752C4] border-[#5865F2]/20",
      email: "bg-[#EA4335] hover:bg-[#D33B2C] border-[#EA4335]/20",
      phone: "bg-[#34C759] hover:bg-[#2FB350] border-[#34C759]/20",
    };
    return colors[key.toLowerCase()] || "bg-white/8 hover:bg-white/20 border-white/10";
  };

  const Links = [
    { title: "المدونة", href: "/blogs" },
    { title: "معلومات عنا", href: "/about" },
    { title: "الشروط و الأحكام", href: "/terms" },
    { title: "سياسة الإسترجاع", href: "/returnsPolicy" },
    { title: "سياسة الخصوصية", href: "/policy" },
    { title: "الضمان", href: "/warranty" },
    { title: "أنضم كشريك", href: "/partner" },
    { title: "الفريق", href: "/team" },
    { title: "اتصل بنا", href: "/contactUs" },
  ];

 
  const importantLinks = Links.slice(0, 3);
  const helpLinks = Links.slice(8,9);

  const email = socials.find((s) => s.key === "email")?.value;
  const phone = socials.find((s) => s.key === "phone")?.value;
  const address = socials.find((s) => s.key === "address")?.value;

  // ✅ tax_id_number extracted separately
  const taxNumber = socials.find((s) => s.key === "tax_id_number")?.value;

  // ✅ show socials with value, except address + tax_id_number
  const socialButtons = useMemo(() => {
    return socials
      .filter((s) => !isEmptyValue(s.value))
      .filter((s) => s.key !== "address")
      .filter((s) => s.key !== "tax_id_number");
  }, [socials]);

  // ✅ active payments only
  const activePayments = useMemo(() => {
    return payments.filter((p) => p?.is_active);
  }, [payments]);

  const year = new Date().getFullYear();

  return (
    <footer className="bg-pro text-white">
      <div className="container max-md:!px-6 px-5">
        {/* top */}
        <div className=" max-md:w-fit max-md:mx-auto grid grid-cols-2 lg:grid-cols-4 gap-10 py-12">
         

          {/* Categories - First Section */}
          <div className="col-span-2">
            <h4 className="text-sm font-extrabold tracking-wide">الأقسام</h4>
            <div className="grid grid-cols-2 gap-3">  
            <div className="mt-4 flex flex-col gap-3">
              {firstSectionCategories.length > 0 ? (
                firstSectionCategories.map((category: any) => (
                  <Link
                    key={category.id}
                    href={`/category/${category.id}`}
                    className="text-white/85 hover:text-white transition underline-offset-4 hover:underline"
                  >
                    {category.name}
                  </Link>
                ))
              ) : (
                <span className="text-white/70 text-sm">لا توجد أقسام متاحة</span>
              )}
            </div>
            <div className="mt-4 flex flex-col gap-3">
              {secondSectionCategories.length > 0 ? (
                secondSectionCategories.map((category: any) => (
                  <Link
                    key={category.id}
                    href={`/category/${category.id}`}
                    className="text-white/85 hover:text-white transition underline-offset-4 hover:underline"
                  >
                    {category.name}
                  </Link>
                ))
              ) : (
                <span className="text-white/70 text-sm">لا توجد أقسام متاحة</span>
              )}
            </div>
            </div>
           
          </div>

    

          {/* Important */}
          <div>
            <h4 className="text-sm font-extrabold tracking-wide">روابط مهمة</h4>
            <div className="mt-4 flex flex-col gap-3">
              {importantLinks.map((link, index) => (
                <Link
                  key={index}
                  href={link.href}
                  className="text-white/85 hover:text-white transition underline-offset-4 hover:underline"
                >
                  {link.title}
                </Link>
              ))}
            </div>
          </div>

          {/* Help / Address */}
          <div className="space-y-4">
            <h4 className="text-sm font-extrabold tracking-wide">تريد مساعدة؟</h4>

            <div className="flex flex-col gap-3">
              {helpLinks.map((link, index) => (
                <Link
                  key={index}
                  href={link.href}
                  className="text-white/85 hover:text-white transition underline-offset-4 hover:underline"
                >
                  {link.title}
                </Link>
              ))}
            </div>
            <div className="flex flex-col gap-3">
              {helpLinks.map((link, index) => (
                <Link
                  key={index}
                  href="/FAQ"
                  className="text-white/85 hover:text-white transition underline-offset-4 hover:underline"
                >
                  الاسئلة الشائعة
                </Link>
              ))}
            </div>

          
          </div>
        </div>

        {/* divider */}
        <div className="h-px w-full bg-white/10" />

        {/* bottom */}
        <div className="grid max-md:w-fit max-md:mx-auto grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 py-8">
          {/* payments */}
          <div className="space-y-2 lg:col-span-3">
            <p className="text-sm font-extrabold">نحن نقبل</p>

            {activePayments.length === 0 ? (
              <span className="text-white/70 text-sm">طرق الدفع غير متاحة حالياً</span>
            ) : (
              <div className="flex flex-wrap gap-2 md:gap-3">
                {/* {activePayments.map((p) => {
                  const PaymentIcon = getPaymentIcon(p.icon, p.name);
                  return (
                    <span
                      key={p.id}
                      className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-bold ring-1 ring-white/10 hover:bg-white/15 transition"
                      title={p.name}
                    >
                      <PaymentIcon className="text-sm opacity-90" />
                      <span>{p.name}</span>
                     
                    </span>
                  );
                })} */}
                 <Image
                        src="/images/visa.svg"
                        alt="p.name"
                        width={20}
                        height={20}
                        className="w-[50px] h-[30px]"
                      />
                       <Image
                        src="/images/fawry.svg"
                        alt="p.name"
                        width={20}
                        height={20}
                         className="w-[50px] h-[30px]"
                      />
              </div>
            )}

      
         
          </div>

          {/* socials */}
          <div className="space-y-2">
            <p className="text-sm font-extrabold">تابعنا</p>

            <div className="flex items-center gap-1.5 flex-wrap">
              {socialButtons.length === 0 ? (
                <span className="text-white/70 text-xs">لا توجد روابط اجتماعية حالياً</span>
              ) : (
                socialButtons.map((social, idx) => {
                  const Icon = socialIcons[social.key];
                  if (!Icon) return null;

                  const href = normalizeSocialHref(social.key, String(social.value));
                  const isExternal = href.startsWith("http");
                  const target = isExternal ? "_blank" : undefined;

                  const socialColor = getSocialColor(social.key);
                  const isGradient = socialColor.includes("gradient");
                  
                  return (
                    <Link
                      key={`${social.key}-${idx}`}
                      href={href || "#"}
                      target={target}
                      rel={isExternal ? "noreferrer" : undefined}
                      className={`group relative inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 border hover:scale-105 active:scale-95 ${socialColor} ${isGradient ? "" : "hover:shadow-lg"}`}
                      aria-label={social.key}
                      title={social.key}
                    >
                      <Icon className={`${social.key.toLowerCase() === "snapchat" ? "text-black" : "text-white"} group-hover:scale-110 transition-transform duration-200`} size={14} />
                      {isGradient && (
                        <span className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                      )}
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* copyright */}
        <p className="text-center text-white/70 text-sm pb-10">Ⓒ جميع الحقوق محفوظة {year}</p>
      </div>
    </footer>
  );
}
