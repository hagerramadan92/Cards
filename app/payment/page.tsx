"use client";
import BankPayment from "@/components/BankPayment";
import { useState, useEffect, useMemo, useRef } from "react";
import Button from "@mui/material/Button";
import { useRouter } from "next/navigation";
import KeyboardBackspaceIcon from "@mui/icons-material/KeyboardBackspace";
import Swal from "sweetalert2";
import { MdKeyboardArrowLeft } from "react-icons/md";
import { useAppContext } from "../../src/context/AppContext";
import LoadingOverlay from "../../components/LoadingOverlay";
import { useLanguage } from "@/src/context/LanguageContext";
import Image from "next/image";
import { MdDelete, MdUpload } from "react-icons/md";

function n(v: any) {
  const x = typeof v === "string" ? Number(v) : typeof v === "number" ? v : Number(v ?? 0);
  return Number.isFinite(x) ? x : 0;
}

function money(v: any) {
  return n(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

type CheckoutSummaryV1 = {
  version?: string;
  created_at?: string;
  items_count?: number;
  items_length?: number;
  subtotal?: number;
  total?: number;
  coupon_discount?: number;
  coupon_name?: string;
  coupon_new_total?: number | null;
  shipping_fee?: number;
  tax_rate?: number;
  total_after_coupon?: number;
  total_with_shipping?: number;
  tax_amount?: number;
  total_without_tax?: number;
  coupon_value?: number;
};

function readSessionJSON<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function readLocalJSON<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

// الطرق اللي محتاجة إيصال
const PAYMENT_NEEDS_RECEIPT = [4, 5, 8, 10];

function SummaryBlock({ summary }: { summary: CheckoutSummaryV1 | null }) {
  const shippingFree = n(summary?.shipping_fee) <= 0;
  const shippingFee = n(summary?.shipping_fee);
  const hasCoupon = n(summary?.coupon_discount) > 0 || summary?.coupon_new_total !== null;

  return (
    <div className="my-2 gap-2 flex flex-col">
      <div className="flex text-sm items-center justify-between text-black">
        <p className="font-semibold">المجموع ({n(summary?.items_length)} عناصر)</p>
        {/* <p>
          {money(summary?.subtotal)}
          <span className="text-sm ms-1">جنية</span>
        </p> */}
      </div>

      {hasCoupon && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-emerald-800 font-semibold">خصم الكوبون</p>
          <p className="font-extrabold text-emerald-700">
            - {money(summary?.coupon_discount)}
            <span className="text-sm ms-1">جنية</span>
          </p>
        </div>
      )}

      <div className="flex items-center justify-between pb-3 pt-2">
        <div className="flex gap-1 items-center">
          <p className=" text-nowrap text-md text-pro font-semibold">الإجمالي :</p>
        </div>
        <p className="text-[15px] text-pro font-bold">
          {money(summary?.total_with_shipping)}
          <span> جنية</span>
        </p>
      </div>
    </div>
  );
}

function UploadPaymentProof({
  paymentMethod,
  onFileChange,
  onRemove,
  currentFile,
}: {
  paymentMethod: string;
  onFileChange: (file: File) => void;
  onRemove: () => void;
  currentFile: File | null;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (currentFile) {
      const url = URL.createObjectURL(currentFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [currentFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
      if (!validTypes.includes(file.type)) {
        Swal.fire("خطأ", "يرجى رفع صورة بصيغة JPG, PNG أو WebP فقط", "error");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire("خطأ", "حجم الصورة يجب أن لا يتجاوز 5 ميجابايت", "error");
        return;
      }
      onFileChange(file);
    }
  };

  const handleUploadClick = () => fileInputRef.current?.click();

  return (
    <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-slate-800">رفع إثبات الدفع</h3>
        <span className="text-sm text-slate-600 bg-blue-100 px-3 py-1 rounded-full">
          {paymentMethod}
        </span>
      </div>

      <p className="text-sm text-slate-600 mb-4">
        يرجى رفع صورة إثبات الدفع بعد إتمام عملية الدفع
      </p>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/jpg,image/webp"
        className="hidden"
      />

      {!currentFile ? (
        <div
          onClick={handleUploadClick}
          className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center cursor-pointer hover:border-blue-500 transition-colors"
        >
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <MdUpload className="text-blue-600 text-xl" />
            </div>
            <div>
              <p className="font-semibold text-slate-700">اضغط لرفع صورة الدفع</p>
              <p className="text-sm text-slate-500 mt-1">JPG, PNG أو WebP (حد أقصى 5MB)</p>
            </div>
            <button
              type="button"
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              اختيار ملف
            </button>
          </div>
        </div>
      ) : (
        <div className="relative border border-slate-200 rounded-xl p-4 bg-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-slate-800">{currentFile.name}</p>
                <p className="text-sm text-slate-500">{(currentFile.size / 1024).toFixed(0)} كيلوبايت</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onRemove}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              حذف
            </button>
          </div>

          {previewUrl && (
            <div className="mt-3 relative w-full h-48 rounded-lg overflow-hidden border border-slate-200">
              <Image src={previewUrl} alt="معاينة صورة الدفع" fill className="object-contain" />
            </div>
          )}

          <div className="flex gap-3 mt-4">
            <button
              type="button"
              onClick={handleUploadClick}
              className="flex-1 py-2 border border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
            >
              تغيير الصورة
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="flex-1 py-2 border border-red-600 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors"
            >
              حذف الصورة
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PaymentPage() {
  const { language } = useLanguage();
  const { paymentMethods } = useAppContext() as any;
  const [redirecting, setRedirecting] = useState(false);
  const [redirectMessage, setRedirectMessage] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [checkoutSummary, setCheckoutSummary] = useState<CheckoutSummaryV1 | null>(null);
  const [couponCode, setCouponCode] = useState<string>("");
  const [paymentProof, setPaymentProof] = useState<File | null>(null);

  const router = useRouter();
  const base_url = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const s = readSessionJSON<CheckoutSummaryV1>("checkout_summary_v1");
    const l = readLocalJSON<CheckoutSummaryV1>("checkout_summary_v1");
    const summary = s || l || null;
    setCheckoutSummary(summary);

    const codeFromSession = (typeof window !== "undefined" ? sessionStorage.getItem("coupon_code") : "") || "";
    const normalized = String(codeFromSession || "").trim();
    const codeFallback = String(summary?.coupon_name || "").trim();
    setCouponCode(normalized || codeFallback || "");
  }, []);

  useEffect(() => {
    const t = localStorage.getItem("auth_token");
    setToken(t);

    if (!t) {
      Swal.fire("تنبيه", "يرجى تسجيل الدخول لإتمام الدفع", "warning");
      router.push("/login");
    }
  }, [router]);

  // مسح الصورة لو طريقة الدفع لا تحتاج إيصال
  useEffect(() => {
    if (!PAYMENT_NEEDS_RECEIPT.includes(Number(paymentMethod))) {
      setPaymentProof(null);
    }
  }, [paymentMethod]);

  const handleFileChange = (file: File) => setPaymentProof(file);
  const handleRemoveFile = () => setPaymentProof(null);

  const handleCompletePurchase = async () => {
    if (loading) return;

    if (!paymentMethod) {
      Swal.fire("تنبيه", "يرجى اختيار طريقة الدفع", "warning");
      return;
    }

    const requiresProof = PAYMENT_NEEDS_RECEIPT.includes(Number(paymentMethod));
    if (requiresProof && !paymentProof) {
      Swal.fire("تنبيه", "يرجى رفع صورة إثبات الدفع لإتمام العملية", "warning");
      return;
    }

    if (!token) {
      Swal.fire("تنبيه", "يرجى تسجيل الدخول", "warning");
      router.push("/login");
      return;
    }

    if (!checkoutSummary) {
      Swal.fire("تنبيه", "لا توجد بيانات ملخص الطلب.", "warning");
      return;
    }

    setLoading(true);

    try {
      const codeFromSession = (typeof window !== "undefined" ? sessionStorage.getItem("coupon_code") : "") || "";
      const normalizedCoupon = String(codeFromSession || couponCode || checkoutSummary?.coupon_name || "").trim();

      const formData = new FormData();
      formData.append("payment_method", paymentMethod);
      formData.append("notes", notes?.trim() || "");
      formData.append("coupon_code", normalizedCoupon || "");
      if (paymentProof) formData.append("image", paymentProof);

      const response = await fetch(`${base_url}/order`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Accept-Language": language,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result?.status) {
        throw new Error(result?.message || "حدث خطأ أثناء إنشاء الطلب");
      }

      setRedirectMessage(result?.data?.message || "جاري توجيهك...");
      setRedirecting(true);
      setTimeout(() => {
        router.push(`/ordercomplete?orderId=${result.data.id}`);
      }, 500);
    } catch (error: any) {
      console.error(error);
      Swal.fire("خطأ", error?.message || "حدث خطأ أثناء إنشاء الطلب", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container pb-10 pt-6">
      <div className="flex items-center gap-2 text-sm mb-4">
        <button onClick={() => router.back()} className="text-pro-max font-bold flex items-center gap-1">
          <MdKeyboardArrowLeft size={18} />
          رجوع
        </button>
        <span className="text-slate-400">/</span>
        <span className="text-slate-600 font-semibold">الدفع</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="col-span-1 lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200">
              <h2 className="text-xl font-extrabold text-slate-900">اختر طريقة الدفع</h2>
              <p className="text-sm text-slate-500 mt-1">اختر الطريقة الأنسب لإتمام الطلب.</p>
            </div>
            <div className="p-5">
              <BankPayment paymentMethods={paymentMethods} onPaymentMethodChange={setPaymentMethod} />
              
              {PAYMENT_NEEDS_RECEIPT.includes(Number(paymentMethod)) && (
                <UploadPaymentProof
                  paymentMethod={paymentMethod}
                  onFileChange={handleFileChange}
                  onRemove={handleRemoveFile}
                  currentFile={paymentProof}
                />
              )}
            </div>
          </div>
        </div>

        <div className="col-span-1 space-y-4 lg:sticky lg:top-[150px] h-fit">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-5">
            <div className="mt-4">
              <h4 className="text-md font-extrabold text-pro mb-3">ملخص الطلب</h4>
              {checkoutSummary ? <SummaryBlock summary={checkoutSummary} /> : <p>لا يوجد ملخص للطلب</p>}
            </div>

            <div className="mt-4">
              <Button
                variant="contained"
                disabled={loading || !paymentMethod || !checkoutSummary}
                sx={{
                  fontSize: "1.1rem",
                  backgroundColor: loading ? "#9ca3af" : "#14213d",
                  "&:hover": { backgroundColor: loading ? "#9ca3af" : "#0f1a31" },
                  color: "#fff",
                  gap: "10px",
                  px: "20px",
                  py: "12px",
                  borderRadius: "16px",
                  textTransform: "none",
                  width: "100%",
                  fontWeight: 900,
                }}
                endIcon={<KeyboardBackspaceIcon />}
                onClick={handleCompletePurchase}
              >
                {loading ? "جاري المعالجة..." : "إتمام الشراء"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <LoadingOverlay show={redirecting} message={redirectMessage} />
    </div>
  );
}
