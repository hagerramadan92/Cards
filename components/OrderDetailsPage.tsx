"use client";

import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/src/context/LanguageContext";
import Image from "next/image";
import Loading from "@/app/loading";
import OrderProgress from "./OrderProgress";
import * as XLSX from 'xlsx';
import Swal from "sweetalert2";
import { GoChecklist } from "react-icons/go";
import { IoWalletOutline } from "react-icons/io5";
import { SlLocationPin } from "react-icons/sl";
import { FiDownload } from "react-icons/fi";

import { FiAlertTriangle } from "react-icons/fi";
import { CheckCircle2, Clock3, Truck, Ban, User2, Mail } from "lucide-react";

import { ProductI } from "@/Types/ProductsI";

interface Props {
  orderId: string;
}

/** API TYPES (based on your response) */
type OrderStatus = "pending" | "processing" | "delivering" | "completed" | "cancelled" | string;
type PaymentStatus = "pending" | "paid" | "failed" | string;

type ApiUser = {
  id: number;
  name: string;
  email: string;
  image: string | null;
  created_at: string;
};

type ApiFullAddress = {
  id: number;
  full_name: string | null;
  phone: string | null;
  label: string | null;
  building: string | null;
  floor: string | null;
  apartment_number: string | null;
  details: string | null;
  city: string | null;
  area: string | null;
  type: "home" | "work" | string;
};

type ParsedOption =
  | { option_name?: string; option_value?: string }
  | { name?: string; value?: string }
  | string;

// New type for serial items
interface SerialItem {
  id: string;
  serial_number: string;
  serial_code: string;
  voucher_code: string;
}

interface OrderItem {
  product_name: string;
  quantity: number;
  price: string; // "0.0000"
  options: string | ParsedOption[]; // API returns string JSON like "[]"
  product: ProductI;
  serials?: SerialItem[]; // Add serials array to OrderItem
}

interface OrderData {
  id: number;
  order_number: string;
  status: OrderStatus;
  status_label: string; // e.g. "order.status.pending"
  total_amount: string; // "0.00"
  formatted_total: string; // "0.00 ر.س"
  customer_name: string;
  customer_phone: string | null;
  shipping_address: string | null;
  notes: string | null;

  status_payment: PaymentStatus;
  user: ApiUser | null;

  created_at: string;
  payment_method_label: string;
  payment_reference?: string;
  management_fees?: string;
  total_rewards?: number;
  order_rating?: number;

  full_address: ApiFullAddress | null;

  items: OrderItem[];
}

function safeJsonParseOptions(raw: any): ParsedOption[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;

  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return raw.trim() ? [raw.trim()] : [];
    }
  }

  return [];
}

function toNumber(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function calcItemSubtotal(price: any, qty: any) {
  const p = toNumber(price);
  const q = toNumber(qty);
  if (p === null || q === null) return null;
  return p * q;
}

// Update statusUi to use translation keys
function getStatusUi(status: string) {
  switch (status) {
    case "pending":
      return {
        labelKey: "order_pending",
        badge: "bg-amber-50 text-amber-800 border-amber-200",
        icon: <Clock3 className="w-4 h-4" />,
      };
    case "processing":
      return {
        labelKey: "order_processing",
        badge: "bg-blue-50 text-blue-800 border-blue-200",
        icon: <Clock3 className="w-4 h-4" />,
      };
    case "completed":
      return {
        labelKey: "order_completed",
        badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
        icon: <CheckCircle2 className="w-4 h-4" />,
      };
    case "cancelled":
      return {
        labelKey: "order_cancelled",
        badge: "bg-rose-50 text-rose-800 border-rose-200",
        icon: <Ban className="w-4 h-4" />,
      };
    default:
      return {
        labelKey: status,
        badge: "bg-slate-50 text-slate-800 border-slate-200",
        icon: <Clock3 className="w-4 h-4" />,
      };
  }
}

// Update paymentUi to use translation keys
function getPaymentUi(status_payment: string) {
  switch (status_payment) {
    case "paid":
      return { labelKey: "payment_paid", cls: "bg-emerald-50 text-emerald-800 border-emerald-200" };
    case "pending":
      return { labelKey: "payment_pending", cls: "bg-amber-50 text-amber-800 border-amber-200" };
    case "failed":
      return { labelKey: "payment_failed", cls: "bg-rose-50 text-rose-800 border-rose-200" };
    default:
      return { labelKey: "payment_" + status_payment, cls: "bg-slate-50 text-slate-800 border-slate-200" };
  }
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[12px] font-extrabold text-slate-700">
      {children}
    </span>
  );
}

function buildFullAddress(a: ApiFullAddress | null, fallback: string | null) {
  if (!a) return fallback;

  const parts = [
    a.city && `المدينة: ${a.city}`,
    a.area && `المنطقة: ${a.area}`,
    a.label && `الوصف: ${a.label}`,
    a.building && `المبنى: ${a.building}`,
    a.floor && `الدور: ${a.floor}`,
    a.apartment_number && `شقة: ${a.apartment_number}`,
    a.details && `تفاصيل: ${a.details}`,
  ].filter(Boolean);

  return parts.length ? parts.join(" • ") : fallback;
}

function OrderDetailsSkeleton() {
  return (
    <div className="mb-16 w-full space-y-6" dir="rtl">
      {/* Header Card Skeleton */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between mb-6">
          <div className="space-y-2">
            <div className="h-7 w-48 bg-slate-200 rounded animate-pulse"></div>
            <div className="h-4 w-56 bg-slate-200 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Order Info Grid Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-200">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-24 bg-slate-200 rounded animate-pulse"></div>
              <div className="h-4 w-32 bg-slate-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Items Card Skeleton */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="h-6 w-32 bg-slate-200 rounded animate-pulse mb-4"></div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4 p-4 rounded-lg border border-slate-100">
              <div className="w-20 h-20 rounded-lg bg-slate-200 animate-pulse"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-slate-200 rounded animate-pulse"></div>
                <div className="h-3 w-1/2 bg-slate-200 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Skeleton */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="h-6 w-32 bg-slate-200 rounded animate-pulse mb-4"></div>
        <div className="space-y-3">
          <div className="flex justify-between">
            <div className="h-4 w-20 bg-slate-200 rounded animate-pulse"></div>
            <div className="h-4 w-24 bg-slate-200 rounded animate-pulse"></div>
          </div>
          <div className="h-px bg-slate-200"></div>
          <div className="flex justify-between">
            <div className="h-5 w-32 bg-slate-200 rounded animate-pulse"></div>
            <div className="h-5 w-28 bg-slate-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderDetailsPage({ orderId }: Props) {
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const { t, language } = useLanguage();
  const [apiToken, setApiToken] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const [currentStep, setCurrentStep] = useState(0);

  const steps = [t("order_placed"), t("order_processing")];
  const statusSteps: Record<string, number> = {
    pending: 0,
    processing: 1,
    delivering: 2,
    completed: 3,
    cancelled: 0,
  };

  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (typeof window !== "undefined") {
      setApiToken(localStorage.getItem("auth_token"));
    }
  }, []);

  useEffect(() => {
    if (!apiToken || !baseUrl) return;

    const fetchOrderDetails = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${baseUrl}/order/${orderId}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiToken}`,
            "Accept-Language": language,
            Accept: "application/json"
          },
          cache: "no-store",
        });

        const json = await res.json();

        if (json?.status && json?.data) {
          const orderData: OrderData = json.data;

          // progress step
          setCurrentStep(statusSteps[orderData.status] ?? 0);

          // parse options (string -> array)
          orderData.items = (orderData.items || []).map((item: any) => ({
            ...item,
            options: safeJsonParseOptions(item.options),
            // serials is already an array from the API response
          }));

          setOrder(orderData);
        } else {
          setOrder(null);
        }
      } catch (e) {
        console.error("Error fetching order details:", e);
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [apiToken, orderId, baseUrl, language]);

  // Use useMemo with t function to get translated status
  const status = useMemo(() => {
    const ui = getStatusUi(order?.status || "");
    return {
      ...ui,
      label: t(ui.labelKey as any)
    };
  }, [order?.status, t]);

  const pay = useMemo(() => {
    const ui = getPaymentUi(order?.status_payment || "");
    return {
      ...ui,
      label: t(ui.labelKey as any)
    };
  }, [order?.status_payment, t]);

  // Format date based on language
  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return "—";
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return dateString;
      }

      if (language === 'ar') {
        // Arabic date formatting
        const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        
        const dayIndex = date.getDay();
        const monthIndex = date.getMonth();
        const day = date.getDate();
        const year = date.getFullYear();
        const hours = date.getHours();
        const minutes = date.getMinutes();
        
        // Format time in Arabic
        const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        const ampm = hours >= 12 ? 'م' : 'ص';
        
        return `${days[dayIndex]}، ${day} ${months[monthIndex]} ${year} - ${timeStr} ${ampm}`;
      } else {
        // English date formatting
        const options: Intl.DateTimeFormatOptions = {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        };
        
        return date.toLocaleDateString('en-US', options);
      }
    } catch (error) {
      return dateString || "—";
    }
  };

  // دالة تصدير المنتجات والسيريالات فقط إلى Excel
  const exportToExcel = () => {
    if (!order || !order.items || order.items.length === 0) return;
    
    setExporting(true);
    
    try {
      // تجهيز بيانات المنتجات والسيريالات فقط
      const productsData = [];
      
      // إضافة رؤوس الأعمدة (بالعربية)
      productsData.push({
        'اسم المنتج': 'اسم المنتج',
        'الكمية': 'الكمية',
        'السعر': 'السعر',
        'الإجمالي': 'الإجمالي',
        'الرقم التسلسلي': 'الرقم التسلسلي',
        'الكود': 'الكود',
        'قسيمة الشراء': 'قسيمة الشراء',
      });

      // إضافة بيانات كل منتج وسيريالاته
      order.items.forEach((item) => {
        const subtotal = calcItemSubtotal(item.price, item.quantity);
        const subtotalFormatted = subtotal !== null ? subtotal.toFixed(2) : '—';
        
        if (item.serials && item.serials.length > 0) {
          // إذا كان للمنتج سيريالات، نعرض كل سيريال في سطر منفصل
          item.serials.forEach((serial, idx) => {
            if (idx === 0) {
              // أول سيريال نعرض معه معلومات المنتج
              productsData.push({
                'اسم المنتج': item.product_name,
                'الكمية': item.quantity,
                'السعر': item.price,
                'الإجمالي': subtotalFormatted,
                'الرقم التسلسلي': serial.serial_number,
                'الكود': serial.serial_code || '',
                'قسيمة الشراء': serial.voucher_code || '',
              });
            } else {
              // باقي السيريالات نعرضها بدون تكرار معلومات المنتج
              productsData.push({
                'اسم المنتج': '',
                'الكمية': '',
                'السعر': '',
                'الإجمالي': '',
                'الرقم التسلسلي': serial.serial_number,
                'الكود': serial.serial_code || '',
                'قسيمة الشراء': serial.voucher_code || '',
              });
            }
          });
        } else {
          // إذا لم يكن للمنتج سيريالات، نعرض سطر واحد فقط
          productsData.push({
            'اسم المنتج': item.product_name,
            'الكمية': item.quantity,
            'السعر': item.price,
            'الإجمالي': subtotalFormatted,
            'الرقم التسلسلي': '—',
            'الكود': '—',
            'قسيمة الشراء': '—',
          });
        }
      });

      // إنشاء ورقة العمل
      const wb = XLSX.utils.book_new();
      
      // تحويل البيانات إلى صيغة ورقة عمل (نتخطى الصف الأول لأنه رؤوس الأعمدة)
      const ws = XLSX.utils.json_to_sheet(productsData, { skipHeader: false });
      
      // ضبط عرض الأعمدة
      const colWidths = [
        { wch: 30 }, // اسم المنتج
        { wch: 10 }, // الكمية
        { wch: 15 }, // السعر
        { wch: 15 }, // الإجمالي
        { wch: 40 }, // الرقم التسلسلي
        { wch: 40 }, // الكود
        { wch: 40 }, // قسيمة الشراء
      ];
      ws['!cols'] = colWidths;

      // إضافة الورقة إلى المصنف
      XLSX.utils.book_append_sheet(wb, ws, `منتجات الطلب ${order.order_number}`);
      
      // تصدير الملف
      XLSX.writeFile(wb, `products_${order.order_number}_${new Date().toISOString().split('T')[0]}.xlsx`);
        Swal.fire({
              icon: "success",
              title: t('export_success') || "تم التصدير بنجاح",
              text: t('export_to_excel') || "تم تصدير الرموز التسلسلية بنجاح",
              timer: 2000,
              showConfirmButton: false,
            });
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert(t('export_error') || 'حدث خطأ أثناء تصدير البيانات');
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <OrderDetailsSkeleton />;

  if (!order) {
    return (
      <div className="min-h-[55vh] flex items-center justify-center px-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="max-w-md w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-50 flex items-center justify-center">
              <FiAlertTriangle className="text-rose-600" size={22} />
            </div>
            <div>
              <p className="font-extrabold text-slate-900">{t("order_not_found")}</p>
              <p className="text-sm text-slate-600 mt-1">{t("check_order_number")}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const addressText = buildFullAddress(order.full_address, order.shipping_address);

  return (
    <div className="mb-16 w-full space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header Card with Export Button */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-slate-900 mb-1">
              {t("order_number")} #{order.order_number}
            </h3>
            <p className="text-sm text-slate-500">
              {formatDate(order.created_at)}
            </p>
          </div>
          
       
        </div>

        {/* Order Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-200">
          <div>
            <p className="text-xs text-slate-500 mb-1">{t("order_number")}</p>
            <p className="text-sm font-semibold text-slate-900">{order.order_number}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">{t("payment_method")}</p>
            <p className="text-sm font-semibold text-slate-900">{order.payment_method_label || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">{t("total_rewards")}</p>
            <p className="text-sm font-semibold text-slate-900">
              {order.total_rewards ? `${order.total_rewards} ${t("points")}` : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">{t("status")}</p>
            <span className={`inline-flex items-center rounded-lg border px-3 py-1 text-xs font-semibold ${pay.cls}`}>
              {pay.label}
            </span>
          </div>
          {order.management_fees && (
            <div>
              <p className="text-xs text-slate-500 mb-1">{t("management_fees")}</p>
              <p className="text-sm font-semibold text-slate-900">{order.management_fees} EGP</p>
            </div>
          )}
          <div>
            <p className="text-xs text-slate-500 mb-1">{t("total_paid")}</p>
            <p className="text-sm font-bold text-pro-max">{order.formatted_total}</p>
          </div>
          {order.order_rating && (
            <div>
              <p className="text-xs text-slate-500 mb-1">{t("order_rating")}</p>
              <p className="text-sm font-semibold text-slate-900">{order.order_rating}/5</p>
            </div>
          )}
          {order.payment_method_label?.toLowerCase().includes('fawry') && order.payment_reference && (
            <div>
              <p className="text-xs text-slate-500 mb-1">{t("fawry_reference")}</p>
              <p className="text-sm font-semibold text-slate-900">{order.payment_reference}</p>
            </div>
          )}
        </div>

        {/* Cancel banner */}
        {order.status === "cancelled" && (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3">
            <p className="text-sm font-semibold text-rose-800">{t("order_cancelled")}</p>
          </div>
        )}
      </div>

      {/* Items Card */}
        
      {order.items && order.items.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
               <h4 className="text-lg font-semibold text-slate-900 mb-4">{t("order_items")}</h4>
           {/* زر التصدير إلى Excel - للمنتجات والسيريالات فقط */}
          <button
            onClick={exportToExcel}
            disabled={exporting || !order.items || order.items.length === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200 ${
              exporting || !order.items || order.items.length === 0
                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300'
            }`}
          >
            <FiDownload className={`w-4 h-4 ${exporting ? 'animate-bounce' : ''}`} />
            <span className="text-sm font-semibold">
              {exporting ? t("exporting") : t("export_to_excel")}
            </span>
          </button>
          </div>
          <div className="space-y-3">
            {order.items.map((item, index) => {
              const subtotal = calcItemSubtotal(item.price, item.quantity);
              const img = item?.product?.image || "/images/noimg.png";
              
              return (
                <div key={index} className="flex flex-col gap-4 p-4 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors">
                  {/* Main item info */}
                  <div className="flex gap-4">
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                      <Image src={img} alt={item.product_name} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 mb-1 line-clamp-2">{item.product_name}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-600">
                        <span>{t("quantity")}: {item.quantity}</span>
                        {subtotal !== null && (
                          <span>{t("total")}: {subtotal.toFixed(2)}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Serials section - Display if serials exist */}
                  {item.serials && item.serials.length > 0 && (
                    <div className="mt-2 mr-4 border-r-2 border-pro-max/20 pr-4">
                      <h5 className="text-xs font-semibold text-slate-700 mb-2">{t("serial_numbers_and_codes")}</h5>
                      <div className="space-y-2">
                        {item.serials.map((serial, serialIndex) => (
                          <div key={serial.id || serialIndex} className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-slate-500">{t("serial_number")}:</span>
                                <span className="mr-2 font-mono text-slate-800 font-medium">{serial.serial_number}</span>
                              </div>
                              <div>
                                <span className="text-slate-500">{t("serial_code")}:</span>
                                <span className="mr-2 font-mono text-slate-800 font-medium">{serial.serial_code || ''}</span>
                              </div>
                              <div>
                                <span className="text-slate-500">{t("voucher_code")}:</span>
                                <span className="mr-2 font-mono text-slate-800 font-medium">{serial.voucher_code || ''}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h4 className="text-lg font-semibold text-slate-900 mb-4">{t("order_summary")}</h4>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">{t("subtotal")}</span>
            <span className="font-semibold text-slate-900">{order.total_amount}</span>
          </div>
          {order.management_fees && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">{t("management_fees")}</span>
              <span className="font-semibold text-slate-900">{order.management_fees} EGP</span>
            </div>
          )}
          <div className="h-px bg-slate-200"></div>
          <div className="flex justify-between">
            <span className="text-base font-semibold text-slate-900">{t("final_total")}</span>
            <span className="text-lg font-bold text-pro-max">{order.formatted_total}</span>
          </div>
        </div>
      </div>
    </div>
  );
}