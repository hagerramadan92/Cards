"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { MdKeyboardArrowDown } from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";

interface BankPaymentProps {
  onPaymentMethodChange?: (method: string) => void;
}

export default function BankPayment({ onPaymentMethodChange }: BankPaymentProps) {
  const [open, setOpen] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const methods = useMemo(
    () => [
      { id: 1, name: "Apple Pay", desc: "الدفع من خلال Apple Pay", img: "/images/applepay.png", method: "applePay", group: "online" },
      { id: 2, name: "STC Pay", desc: "الدفع من خلال محفظة STC Pay", img: "/images/Stc_pay.svg.png", method: "stcPay", group: "online" },
      { id: 3, name: "Tamara", desc: "قسم فاتورتك على دفعات مع تمارا", img: "/images/tamara-logo1.png", method: "tamara", group: "online" },
      { id: 4, name: "Tabby", desc: "قسم فاتورتك على دفعات مع تابي", img: "/images/tabby.jpeg", method: "tabby", group: "online" },
      { id: 6, name: "كروت فيزا / مدى", desc: "ادفع باستخدام البطاقة البنكية", img: "/images/visa.png", method: "credit_card", group: "cards" },
      { id: 5, name: "الدفع عند الاستلام", desc: "قد يتم تطبيق رسوم إضافية حسب السياسة", img: "/images/money .png", method: "cash_on_delivery", group: "cod" },
    ],
    []
  );

  const selected = methods.find((m) => m.id === selectedId) || null;

  useEffect(() => {
    if (selected?.method && onPaymentMethodChange) onPaymentMethodChange(selected.method);
  }, [selected?.method, onPaymentMethodChange]);

  return (
    <div className="  ">
 

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="p-4 pt-0"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {methods.map((m) => {
                const active = selectedId === m.id;
                return (
                  <label
                    key={m.id}
                    className={`flex items-center gap-3 p-4 rounded-3xl border cursor-pointer transition ${
                      active ? "border-pro-max bg-blue-50" : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={active}
                      onChange={() => setSelectedId(m.id)}
                      className="w-5 h-5 accent-[#14213d] cursor-pointer"
                    />

                    <div className="w-12 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden">
                      <Image src={m.img} alt={m.name} width={40} height={28} className="object-contain" />
                    </div>

                    <div className="flex flex-col gap-1">
                      <p className="font-extrabold text-slate-900">{m.name}</p>
                      <p className="text-sm text-slate-600 font-semibold">{m.desc}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
