"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAppContext } from "@/src/context/AppContext";
import { useLanguage } from "@/src/context/LanguageContext";
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
  const { t, language } = useLanguage();

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
      whatsapp: "text-[#25D366]",
      facebook: "text-[#1877F2]",
      instagram: "text-[#E4405F]",
      twitter: "text-[#1DA1F2]",
      linkedin: "text-[#0077B5]",
      youtube: "text-[#FF0000]",
      tiktok: "text-[#000000]",
      snapchat: "text-[#FFFC00]",
      telegram: "text-[#0088CC]",
      pinterest: "text-[#BD081C]",
      reddit: "text-[#FF4500]",
      discord: "text-[#5865F2]",
      email: "text-[#EA4335]",
      phone: "text-[#34C759]",
    };
    return colors[key.toLowerCase()] || "text-slate-600";
  };

  // ✅ روابط ثابتة بدون API calls
  const importantLinks = [
    { title: t('about_us'), href: "/about" },
    { title: t('terms_conditions'), href: "/terms" },
    { title: t('delivery'), href: "/delivery" },
    { title: t('privacy_policy'), href: "/policy" },
    { title: t('refund_policy'), href: "/returnsPolicy" },
    { title: t('team'), href: "/team" }
  ];

  const helpLinks = [
    // { title: t('privacy_policy'), href: "/policy" },
    // { title: t('refund_policy'), href: "/returnsPolicy" },
    // { title: t('warranty'), href: "/warranty" },
    { title: t('contact_us'), href: "/contactUs" }
  ];

  // ✅ بيانات ثابتة للتواصل
  const staticContactInfo = {
    phone: "+201040006424",
    // whatsapp: "+201234567890",
    // email: "info@example.com",
    address: language === 'ar' ? 'مصر ,  محافظة الشرقية' : 'Elsharkia , Egypt'
  };

  // ✅ استخدام البيانات من API أو البيانات الثابتة كـ fallback
  // const email = socials.find((s) => s.key === "email")?.value || staticContactInfo.email;
  // const phone = socials.find((s) => s.key === "phone")?.value || staticContactInfo.phone;
  // const whatsapp = socials.find((s) => s.key === "whatsapp")?.value || staticContactInfo.whatsapp;
  // const address = socials.find((s) => s.key === "address")?.value || staticContactInfo.address;

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
        <div className="py-8 sm:py-10 lg:py-12">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-10">
            {/* Categories - First Section */}
            <div className="col-span-2 lg:col-span-1 order-1 lg:order-1">
              <h4 className="text-base sm:text-lg font-extrabold tracking-wide">{t('categories')}</h4>
              {/* Small screen: inline-block, Large screen: two columns */}
              <div className="mt-4">  
                {categories.length > 0 ? (
                  <>
                    {/* Small screen: all categories inline-block */}
                    <div className="lg:hidden">
                      {categories.map((category: any) => (
                        <Link
                          key={category.id}
                          href={`/category/${category.id}`}
                          className="inline-block text-sm sm:text-base text-white/50 hover:text-white transition underline-offset-4 hover:underline mr-4 mb-3"
                        >
                          {category.name}
                        </Link>
                      ))}
                    </div>
                    {/* Large screen: two columns */}
                    <div className="hidden lg:grid lg:grid-cols-2 lg:gap-3">
                      <div className="flex flex-col gap-3">
                        {firstSectionCategories.map((category: any) => (
                          <Link
                            key={category.id}
                            href={`/category/${category.id}`}
                            className="text-sm sm:text-base text-white/50 hover:text-white transition underline-offset-4 hover:underline"
                          >
                            {category.name}
                          </Link>
                        ))}
                      </div>
                      <div className="flex flex-col gap-3">
                        {secondSectionCategories.map((category: any) => (
                          <Link
                            key={category.id}
                            href={`/category/${category.id}`}
                            className="text-sm sm:text-base text-white/50 hover:text-white transition underline-offset-4 hover:underline"
                          >
                            {category.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <span className="text-white/70 text-sm">{t('no_categories')}</span>
                )}
              </div>
            </div>

            {/* Important Links */}
            <div className="order-2 lg:order-2">
              <h4 className="text-base sm:text-lg font-extrabold tracking-wide">{t('important_links')}</h4>
              <div className="mt-4 flex flex-col gap-3">
                {importantLinks.slice(0, 5).map((link, index) => (
                  <Link
                    key={index}
                    href={link.href}
                    className="text-sm sm:text-base text-white/50 hover:text-white transition underline-offset-4 hover:underline"
                  >
                    {link.title}
                  </Link>
                ))}
              </div>
            </div>

            {/* Contact Info & Help Links */}
            <div className="space-y-4 order-3 lg:order-3">
              <h4 className="text-base sm:text-lg font-extrabold tracking-wide">{t('need_help')}</h4>
              
              {/* Contact Info */}
              <div className="flex flex-col gap-2">
                {staticContactInfo.phone && (
                  <Link
                    href={`#`}
                    className="flex items-center gap-2 text-sm sm:text-base
                     text-white/50 hover:text-white transition underline-offset-4 hover:underline"
                  >
                    <FaPhone className="text-white/70" size={14} />
                    <span dir="ltr">{staticContactInfo.phone}</span>
                  </Link>
                )}
                  {staticContactInfo.address && (
                  <Link
                    href={`#`}
                    className="flex items-center gap-2 text-sm sm:text-base
                     text-white/50 hover:text-white transition underline-offset-4 hover:underline"
                  >
                    <FaMapMarkerAlt className="text-white/70" size={14} />
                    <span dir="ltr">{staticContactInfo.address}</span>
                  </Link>
                )}
             
              </div>

              {/* Help Links */}
              <div className="flex flex-col gap-2">
                {helpLinks.map((link, index) => (
                  <Link
                    key={index}
                    href={link.href}
                    className="text-sm sm:text-base text-white/50 hover:text-white transition underline-offset-4 hover:underline"
                  >
                    {link.title}
                  </Link>
                ))}
              </div>
              
              {/* FAQ Link */}
              <div className="flex flex-col gap-2">
                <Link
                  href="/FAQ"
                  className="text-sm sm:text-base text-white/50 hover:text-white transition underline-offset-4 hover:underline"
                >
                  {t('faq')}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* divider */}
        <div className="h-px w-full bg-white/10" />

        {/* bottom */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-10 py-6 sm:py-8">
          {/* payments */}
          <div className="space-y-2 lg:col-span-3">
            <p className="text-base sm:text-lg font-extrabold">{t('we_accept')}</p>

            {activePayments.length === 0 ? (
              <span className="text-white/70 text-xs sm:text-sm">{t('no_payment_methods')}</span>
            ) : (
              <div className="flex flex-wrap gap-2 sm:gap-3 mt-2">
                <Image
                  src="/images/visa.svg"
                  alt="Visa"
                  width={20}
                  height={20}
                  className="w-[45px] sm:w-[50px] h-[27px] sm:h-[30px]"
                />
                <Image
                  src="/images/fawry.svg"
                  alt="Fawry"
                  width={20}
                  height={20}
                  className="w-[45px] sm:w-[50px] h-[27px] sm:h-[30px]"
                />
              </div>
            )}
          </div>

          {/* socials */}
          <div className="space-y-2">
            <p className="text-base sm:text-lg font-extrabold">{t('follow_us')}</p>

            <div className="flex items-center gap-2 sm:gap-3 flex-wrap mt-2">
              {socialButtons.length === 0 ? (
                <span className="text-white/70 text-xs">{t('no_social_links')}</span>
              ) : (
                socialButtons.map((social, idx) => {
                  const Icon = socialIcons[social.key];
                  if (!Icon) return null;

                  const href = normalizeSocialHref(social.key, String(social.value));
                  const isExternal = href.startsWith("http");
                  const target = isExternal ? "_blank" : undefined;

                  const socialColor = getSocialColor(social.key);

                  return (
                    <Link
                      key={`${social.key}-${idx}`}
                      href={href || "#"}
                      target={target}
                      rel={isExternal ? "noreferrer" : undefined}
                      className="group relative inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white hover:bg-white/90 transition-all duration-200 hover:scale-110 active:scale-95 shadow-md hover:shadow-lg"
                      aria-label={social.key}
                      title={social.key}
                    >
                      <Icon className={`${socialColor} group-hover:scale-110 transition-all duration-200`} size={24} />
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* copyright */}
        <p className="text-center text-white/70 text-xs sm:text-sm pb-6 sm:pb-8 lg:pb-10">Ⓒ {t('all_rights_reserved')} {year}</p>
      </div>
    </footer>
  );
}