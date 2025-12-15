"use client";

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { IoCloseSharp } from "react-icons/io5";
import { motion, AnimatePresence } from "framer-motion";
import { AddressI } from "@/Types/AddressI";

interface AddressFormProps {
  open: boolean;
  onClose: () => void;
  initialData?: AddressI;
  onSuccess?: (newAddress: AddressI) => void;
}

interface AddressFormInputs {
  id?: number;
  firstName: string;
  lastName: string;
  building?: string;
  floor: string;
  apartment: string;
  details: string;
  nickname: string;
  phone: string;
  city: string;
  area: string;
  addressType: string;
}

const schema = yup.object().shape({
  firstName: yup.string().required("الإسم الأول مطلوب"),
  lastName: yup.string().required("الإسم الأخير مطلوب"),
  floor: yup.string().required("الدور مطلوب"),
  apartment: yup.string().required("رقم الشقة مطلوب"),
  nickname: yup.string().required("العنوان مختصر مطلوب"),
  details: yup.string().required("تفاصيل العنوان مطلوبة"),
  phone: yup
    .string()
    .matches(/^01[0-9]{9}$/, "رقم الهاتف غير صحيح")
    .required("رقم الهاتف مطلوب"),
  city: yup.string().required("المدينة مطلوبة"),
  area: yup.string().required("المنطقة مطلوبة"),
  addressType: yup.string().required("نوع العنوان مطلوب"),
});

function Field({
  label,
  error,
  children,
  hint,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-extrabold text-slate-800">{label}</label>
        {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
      </div>
      {children}
      {error ? <p className="text-xs font-bold text-rose-600">{error}</p> : null}
    </div>
  );
}

function Sk({ className = "" }: { className?: string }) {
  return (
    <div
      className={[
        "relative overflow-hidden rounded-xl bg-gray-200 ring-1 ring-black/5",
        "sk-shimmer",
        className,
      ].join(" ")}
    />
  );
}

export default function AddressForm({
  open,
  onClose,
  initialData,
  onSuccess,
}: AddressFormProps) {
  const base_url = process.env.NEXT_PUBLIC_API_URL;
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AddressFormInputs>({
    resolver: yupResolver(schema),
    mode: "onTouched",
    defaultValues: {
      addressType: "home",
    },
  });

  const selectedType = watch("addressType");
  const isEdit = Boolean(initialData?.id);

  const title = useMemo(
    () => (isEdit ? "تعديل العنوان" : "إضافة عنوان جديد"),
    [isEdit]
  );

  useEffect(() => {
    if (initialData) {
      const parts = (initialData.full_name || "").split(" ");
      setValue("firstName", parts[0] || "");
      setValue("lastName", parts.slice(1).join(" ") || "");
      setValue("building", initialData.building || "");
      setValue("floor", initialData.floor || "");
      setValue("apartment", initialData.apartment_number || "");
      setValue("details", initialData.details || "");
      setValue("nickname", initialData.label || "");
      setValue("phone", initialData.phone || "");
      setValue("city", initialData.city || "");
      setValue("area", initialData.area || "");
      setValue("addressType", initialData.type || "home");
    } else {
      reset({ addressType: "home" });
    }
  }, [initialData, reset, setValue]);

  const handleAddAddress = async (data: AddressFormInputs) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("auth_token");

      const payload = {
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone,
        city: data.city,
        area: data.area,
        address_details: data.details,
        label: data.nickname || `${data.firstName} ${data.lastName}`,
        type: data.addressType,
        building: data.building || null,
        floor: data.floor,
        apartment_number: data.apartment,
      };

      let url = `${base_url}/addresses`;
      let method: "POST" | "PUT" = "POST";

      if (initialData?.id) {
        url = `${base_url}/addresses/${initialData.id}`;
        method = "PUT";
      }

      const res = await fetch(url, {
        method,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json().catch(() => null);

      if (!res.ok || !result?.status) {
        throw new Error(result?.message || "حدث خطأ");
      }

      toast.success(isEdit ? "تم تعديل العنوان بنجاح" : "تم إضافة العنوان بنجاح", {
        duration: 1200,
      });

      onSuccess?.(result.data);
      reset({ addressType: "home" });

      // close nicely
      setTimeout(() => onClose(), 150);
    } catch (err: any) {
      toast.error(err?.message || "حدث خطأ أثناء حفظ العنوان");
    } finally {
      setLoading(false);
    }
  };

  if (!open || !mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          dir="rtl"
          className="fixed inset-0 z-50 grid place-items-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          {/* overlay */}
          <motion.div
            className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* dialog */}
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ y: 18, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 18, scale: 0.98, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
            className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden"
          >
            {/* Sticky header */}
            <div className="sticky top-0 z-10 border-b border-slate-200 bg-gradient-to-b from-slate-50 to-white p-4 md:p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl md:text-2xl font-extrabold text-slate-900">
                    {title}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    املأ البيانات بدقة لتسهيل التوصيل.
                  </p>
                </div>

                <button
                  onClick={onClose}
                  aria-label="close"
                  className="grid h-10 w-10 place-items-center rounded-xl bg-slate-50 text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100 transition"
                >
                  <IoCloseSharp size={22} />
                </button>
              </div>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit(handleAddAddress)}>
              <div className="max-h-[70vh] overflow-y-auto p-4 md:p-6 space-y-6">
                {/* Section: Personal */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base md:text-lg font-extrabold text-slate-900">
                      بيانات المستلم
                    </h3>
                    <span className="text-xs font-bold text-slate-500">
                      (مطلوب)
                    </span>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 md:gap-5">
                    <Field label="الإسم الأول" error={errors.firstName?.message}>
                      <input
                        {...register("firstName")}
                        className={`w-full rounded-xl border px-4 py-3 text-sm font-semibold outline-none transition
                          ${
                            errors.firstName
                              ? "border-rose-300 focus:ring-4 focus:ring-rose-100"
                              : "border-slate-200 focus:border-pro focus:ring-2 focus:ring-pro/20  duration-200"
                          }`}
                        placeholder="مثال: أحمد"
                      />
                    </Field>

                    <Field label="الإسم الأخير" error={errors.lastName?.message}>
                      <input
                        {...register("lastName")}
                        className={`w-full rounded-xl border px-4 py-3 text-sm font-semibold outline-none transition
                          ${
                            errors.lastName
                              ? "border-rose-300 focus:ring-4 focus:ring-rose-100"
                              : "border-slate-200 focus:border-pro focus:ring-2 focus:ring-pro/20  duration-200"
                          }`}
                        placeholder="مثال: محمد"
                      />
                    </Field>
                  </div>

                  <div className="mt-4">
                    <Field label="رقم الهاتف" error={errors.phone?.message} hint="مثال: 01xxxxxxxxx">
                      <input
                        {...register("phone")}
                        inputMode="numeric"
                        className={`w-full rounded-xl border px-4 py-3 text-sm font-semibold outline-none transition
                          ${
                            errors.phone
                              ? "border-rose-300 focus:ring-4 focus:ring-rose-100"
                              : "border-slate-200 focus:border-pro focus:ring-2 focus:ring-pro/20  duration-200"
                          }`}
                        placeholder="01xxxxxxxxx"
                      />
                    </Field>
                  </div>
                </div>

                {/* Section: Address */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm">
                  <h3 className="text-base md:text-lg font-extrabold text-slate-900 mb-4">
                    تفاصيل العنوان
                  </h3>

                  <div className="grid md:grid-cols-3 gap-4 md:gap-5">
                    <Field label="المبنى (اختياري)">
                      <input
                        {...register("building")}
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none transition
                                   focus:border-pro focus:ring-2 focus:ring-pro/20  duration-200"
                        placeholder="مثال: 12"
                      />
                    </Field>

                    <Field label="الدور" error={errors.floor?.message}>
                      <input
                        {...register("floor")}
                        className={`w-full rounded-xl border px-4 py-3 text-sm font-semibold outline-none transition
                          ${
                            errors.floor
                              ? "border-rose-300 focus:ring-4 focus:ring-rose-100"
                              : "border-slate-200 focus:border-pro focus:ring-2 focus:ring-pro/20  duration-200"
                          }`}
                        placeholder="مثال: 3"
                      />
                    </Field>

                    <Field label="رقم الشقة" error={errors.apartment?.message}>
                      <input
                        {...register("apartment")}
                        className={`w-full rounded-xl border px-4 py-3 text-sm font-semibold outline-none transition
                          ${
                            errors.apartment
                              ? "border-rose-300 focus:ring-4 focus:ring-rose-100"
                              : "border-slate-200 focus:border-pro focus:ring-2 focus:ring-pro/20  duration-200"
                          }`}
                        placeholder="مثال: 12"
                      />
                    </Field>
                  </div>

                  <div className="mt-4">
                    <Field label="تفاصيل العنوان" error={errors.details?.message}>
                      <textarea
                        {...register("details")}
                        rows={3}
                        className={`w-full rounded-xl border px-4 py-3 text-sm font-semibold outline-none transition resize-none
                          ${
                            errors.details
                              ? "border-rose-300 focus:ring-4 focus:ring-rose-100"
                              : "border-slate-200 focus:border-pro focus:ring-2 focus:ring-pro/20  duration-200"
                          }`}
                        placeholder="شارع… علامة مميزة…"
                      />
                    </Field>
                  </div>

                  <div className="mt-4">
                    <Field label="اسم مختصر" error={errors.nickname?.message} hint="مثال: البيت / الشغل">
                      <input
                        {...register("nickname")}
                        className={`w-full rounded-xl border px-4 py-3 text-sm font-semibold outline-none transition
                          ${
                            errors.nickname
                              ? "border-rose-300 focus:ring-4 focus:ring-rose-100"
                              : "border-slate-200 focus:border-pro focus:ring-2 focus:ring-pro/20  duration-200"
                          }`}
                        placeholder="مثال: البيت"
                      />
                    </Field>
                  </div>
                </div>

                {/* Section: Location */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm">
                  <h3 className="text-base md:text-lg font-extrabold text-slate-900 mb-4">
                    المدينة والمنطقة
                  </h3>

                  <div className="grid md:grid-cols-2 gap-4 md:gap-5">
                    <Field label="المدينة" error={errors.city?.message}>
                      <select
                        {...register("city")}
                        className={`w-full rounded-xl border px-4 py-3 text-sm font-semibold outline-none transition bg-white
                          ${
                            errors.city
                              ? "border-rose-300 focus:ring-4 focus:ring-rose-100"
                              : "border-slate-200 focus:border-pro focus:ring-2 focus:ring-pro/20  duration-200"
                          }`}
                      >
                        <option value="">اختر المدينة</option>
                        <option value="القاهرة">القاهرة</option>
                        <option value="الإسكندرية">الإسكندرية</option>
                        <option value="الجيزة">الجيزة</option>
                      </select>
                    </Field>

                    <Field label="المنطقة" error={errors.area?.message}>
                      <select
                        {...register("area")}
                        className={`w-full rounded-xl border px-4 py-3 text-sm font-semibold outline-none transition bg-white
                          ${
                            errors.area
                              ? "border-rose-300 focus:ring-4 focus:ring-rose-100"
                              : "border-slate-200 focus:border-pro focus:ring-2 focus:ring-pro/20  duration-200"
                          }`}
                      >
                        <option value="">اختر المنطقة</option>
                        <option value="مدينة نصر">مدينة نصر</option>
                        <option value="الدقي">الدقي</option>
                        <option value="المهندسين">المهندسين</option>
                      </select>
                    </Field>
                  </div>

                  <div className="mt-5">
                    <Field label="نوع العنوان" error={errors.addressType?.message}>
                      <div className="flex gap-3">
                        {[
                          { value: "home", label: "منزل" },
                          { value: "work", label: "عمل" },
                        ].map((btn) => (
                          <button
                            key={btn.value}
                            type="button"
                            onClick={() => setValue("addressType", btn.value, { shouldValidate: true })}
                            className={`px-5 py-2.5 rounded-xl font-extrabold border transition
                              ${
                                selectedType === btn.value
                                  ? "bg-pro text-white border-pro shadow-sm"
                                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                              }`}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    </Field>
                  </div>
                </div>
              </div>

              {/* Sticky footer */}
              <div className="sticky bottom-0 z-10 border-t border-slate-200 bg-white/90 backdrop-blur p-4 md:p-5 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl px-5 py-3 text-sm font-extrabold text-slate-700 bg-slate-50 ring-1 ring-slate-200 hover:bg-slate-100 transition"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  disabled={loading || isSubmitting}
                  className={`rounded-xl px-7 py-3 text-sm font-extrabold text-white transition
                    ${loading || isSubmitting ? "bg-slate-400 cursor-not-allowed" : "bg-pro hover:opacity-95 active:scale-[0.99]"}
                  `}
                >
                  {loading || isSubmitting ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-5 w-5 rounded-full border-2 border-white/80 border-t-transparent animate-spin" />
                      جارٍ الحفظ...
                    </span>
                  ) : (
                    "حفظ العنوان"
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
