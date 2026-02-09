'use client';

import Link from 'next/link';
import { MdKeyboardArrowLeft } from 'react-icons/md';
import { FaWallet, FaCreditCard, FaBuilding, FaMobileAlt, FaQrcode } from 'react-icons/fa';
import { SiVisa, SiMastercard, SiPaypal } from 'react-icons/si';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

// واجهات البيانات
interface PaymentMethod {
  id: number;
  name: string;
  type: 'credit_card' | 'wallet' | 'bank_transfer' | 'mobile_wallet' | 'qr_code' | 'cash' | 'installments';
  icon?: string;
  description?: string;
  is_active: boolean;
  min_amount?: number;
  max_amount?: number;
  fees?: number;
  processing_time?: string;
  logo_url?: string;
}

interface PaymentMethodsResponse {
  status: boolean;
  message: string;
  data: PaymentMethod[];
}

interface DepositResponse {
  status: boolean;
  message: string;
  data?: {
    payment_url: string;
    transaction_id: string;
    amount: number;
    currency: string;
    payment_method: string;
  };
}

export default function ChargePage() {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(false);
  const [methodsLoading, setMethodsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // جلب طرق الدفع المتاحة
  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      setMethodsLoading(true);
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      
      // إضافة المعلمات إلى URL
      const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/payment-methods`);
      url.searchParams.append('is_payment', 'true');
      url.searchParams.append('lang', navigator.language || 'ar');
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'accept-language': navigator.language || 'ar',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      const result: PaymentMethodsResponse = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'حدث خطأ في جلب طرق الدفع');
      }

      if (result.status) {
        // تصفية الطرق النشطة فقط
        const activeMethods = result.data.filter(method => method.is_active);
        setPaymentMethods(activeMethods);
        
        // اختيار أول طريقة دفع نشطة بشكل افتراضي
        if (activeMethods.length > 0) {
          setSelectedMethod(activeMethods[0]);
        }
      } else {
        setError('لا توجد طرق دفع متاحة حالياً');
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      setError('حدث خطأ في جلب طرق الدفع');
      
     
    } finally {
      setMethodsLoading(false);
    }
  };

 

  // الحصول على أيقونة طريقة الدفع
  const getPaymentMethodIcon = (method: PaymentMethod) => {
    // إذا كان هناك رابط لوجو، استخدمه
    if (method.logo_url) {
      return (
        <div className="relative w-10 h-10">
          <Image
            src={method.logo_url}
            alt={method.name}
            fill
            className="object-contain"
            onError={(e) => {
              // إذا فشل تحميل الصورة، استخدم الأيقونة الافتراضية
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        </div>
      );
    }

    // إذا لم يكن هناك logo، استخدم الأيقونات الافتراضية
    switch (method.type) {
      case 'credit_card':
      case 'installments':
        return <FaCreditCard className="w-6 h-6" />;
      case 'wallet':
        return <FaWallet className="w-6 h-6" />;
      case 'bank_transfer':
        return <FaBuilding className="w-6 h-6" />;
      case 'mobile_wallet':
        return <FaMobileAlt className="w-6 h-6" />;
      case 'qr_code':
        return <FaQrcode className="w-6 h-6" />;
      case 'cash':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return <FaWallet className="w-6 h-6" />;
    }
  };

  // الحصول على لون طريقة الدفع
  const getPaymentMethodColor = (method: PaymentMethod) => {
    switch (method.type) {
      case 'credit_card':
      case 'installments':
        return 'from-blue-500 to-indigo-600';
      case 'wallet':
        return 'from-orange-500 to-red-500';
      case 'bank_transfer':
        return 'from-green-500 to-emerald-600';
      case 'mobile_wallet':
        return 'from-purple-500 to-pink-500';
      case 'qr_code':
        return 'from-yellow-500 to-amber-600';
      case 'cash':
        return 'from-gray-500 to-slate-600';
      default:
        return 'from-gray-500 to-slate-600';
    }
  };

  // التحقق من المبلغ بناءً على طريقة الدفع المختارة
  const validateAmount = () => {
    if (!amount || parseFloat(amount) <= 0) {
      return 'يرجى إدخال مبلغ صحيح';
    }

    const amountValue = parseFloat(amount);
    
    if (!selectedMethod) {
      return 'يرجى اختيار طريقة دفع';
    }

    // التحقق من الحد الأدنى
    if (selectedMethod.min_amount && amountValue < selectedMethod.min_amount) {
      return `الحد الأدنى للدفع بهذه الطريقة هو ${selectedMethod.min_amount} ج.م`;
    }

    // التحقق من الحد الأقصى
    if (selectedMethod.max_amount && amountValue > selectedMethod.max_amount) {
      return `الحد الأقصى للدفع بهذه الطريقة هو ${selectedMethod.max_amount} ج.م`;
    }

    return null;
  };

  // معالجة عملية الشحن
  const handleCharge = async () => {
    const validationError = validateAmount();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    const amountValue = parseFloat(amount);

    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      
      if (!token) {
        setError('يرجى تسجيل الدخول أولاً');
        router.push('/login');
        return;
      }

      if (!selectedMethod) {
        setError('يرجى اختيار طريقة دفع');
        return;
      }

      const depositData = {
        amount: amountValue,
        payment_method: selectedMethod.type,
        payment_method_id: selectedMethod.id,
        currency: 'EGP'
      };

      // استخدام الـ URL مع المعلمات
      const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/user/wallet/deposit`);
      
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'accept-language': navigator.language || 'ar',
        },
        body: JSON.stringify(depositData),
      });

      const result: DepositResponse = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'حدث خطأ أثناء عملية الشحن');
      }

      if (result.status) {
        if (result.data?.payment_url) {
          setSuccess('جاري التوجيه إلى صفحة الدفع...');
          setTimeout(() => {
            window.location.href = result.data!.payment_url;
          }, 1500);
        } else {
          setSuccess(`تم إرسال طلب الشحن بنجاح! رقم العملية: ${result.data?.transaction_id}`);
          
          setTimeout(() => {
            router.push('/myAccount/finance');
          }, 3000);
        }
      } else {
        setError(result.message || 'حدث خطأ أثناء عملية الشحن');
      }
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  // معالجة اختيار مبلغ سريع
  const handleQuickAmount = (value: number) => {
    setAmount(value.toString());
    setError(null);
  };

  // الأزرار السريعة للمبالغ مع التحقق من حدود طريقة الدفع
  const getQuickAmounts = () => {
    if (!selectedMethod) return [50, 100, 200, 500];
    
    const amounts = [50, 100, 200, 500, 1000, 2000];
    const { min_amount = 10, max_amount = 5000 } = selectedMethod;
    
    return amounts.filter(amount => amount >= min_amount && amount <= max_amount);
  };

  // تحديث المبلغ تلقائياً إذا كان خارج الحدود
  useEffect(() => {
    if (!selectedMethod || !amount) return;
    
    const amountValue = parseFloat(amount);
    if (isNaN(amountValue)) return;

    if (selectedMethod.min_amount && amountValue < selectedMethod.min_amount) {
      setAmount(selectedMethod.min_amount.toString());
    } else if (selectedMethod.max_amount && amountValue > selectedMethod.max_amount) {
      setAmount(selectedMethod.max_amount.toString());
    }
  }, [selectedMethod, amount]);

  return (
    <div>
      {/* Header */}
      <div className='mb-6'>
        <Link 
          href="/myAccount/finance"
          className='inline-flex items-center gap-2 text-sm text-slate-600 hover:text-pro transition-colors mb-4'
        >
          <MdKeyboardArrowLeft size={20} />
          <span>العودة</span>
        </Link>
        <h1 className='text-2xl md:text-3xl text-pro font-semibold'>
          تعبئة الرصيد
        </h1>
        <p className='text-slate-600 mt-2'>اختر طريقة الدفع المناسبة وأدخل المبلغ</p>
      </div>

      {/* Content */}
      <div className='bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6'>
        <div className='flex items-center gap-3 mb-6'>
          <div className='w-12 h-12 rounded-xl bg-gradient-to-r from-orange-400 to-red-500 flex items-center justify-center'>
            <FaWallet className='text-white' size={22} />
          </div>
          <div>
            <h2 className='text-lg font-semibold text-slate-900'>شحن المحفظة</h2>
            <p className='text-sm text-slate-500'>أضف رصيداً إلى محفظتك</p>
          </div>
        </div>

        {/* رسائل النجاح والخطأ */}
        {error && (
          <div className='mb-4 p-4 bg-red-50 border border-red-200 rounded-lg'>
            <div className='flex items-center gap-3'>
              <div className='w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0'>
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className='font-semibold text-red-900'>خطأ</h3>
                <p className='text-red-700 text-sm mt-1'>{error}</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className='mb-4 p-4 bg-green-50 border border-green-200 rounded-lg'>
            <div className='flex items-center gap-3'>
              <div className='w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0'>
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className='font-semibold text-green-900'>تم بنجاح</h3>
                <p className='text-green-700 text-sm mt-1'>{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Charge Form */}
        <div className='max-w-2xl'>
          {/* Section 1: طرق الدفع */}
          <div className='mb-8'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold text-slate-900'>اختر طريقة الدفع</h3>
              <span className='text-sm text-slate-500'>
                {paymentMethods.length} طريقة متاحة
              </span>
            </div>

            {methodsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pro"></div>
              </div>
            ) : paymentMethods.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <svg className="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>لا توجد طرق دفع متاحة حالياً</p>
              </div>
            ) : (
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4'>
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => {
                      setSelectedMethod(method);
                      setError(null);
                    }}
                    className={`p-4 border rounded-xl transition-all duration-300 text-start ${
                      selectedMethod?.id === method.id
                        ? 'border-pro bg-pro/5 ring-2 ring-pro/20'
                        : 'border-slate-300 hover:border-pro hover:bg-slate-50'
                    }`}
                  >
                    <div className='flex items-center gap-3 mb-2'>
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${getPaymentMethodColor(method)} flex items-center justify-center`}>
                        {getPaymentMethodIcon(method)}
                      </div>
                      <div className='flex-1'>
                        <h4 className='font-semibold text-slate-900'>{method.name}</h4>
                        {method.fees !== undefined && (
                          <span className='text-xs text-slate-500'>رسوم: {method.fees}%</span>
                        )}
                      </div>
                      {selectedMethod?.id === method.id && (
                        <div className='w-5 h-5 rounded-full bg-pro flex items-center justify-center flex-shrink-0'>
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    
                    {method.description && (
                      <p className='text-xs text-slate-600 mt-2'>{method.description}</p>
                    )}
                    
                    <div className='flex items-center justify-between mt-3 pt-3 border-t border-slate-100'>
                      {method.processing_time && (
                        <span className='text-xs text-slate-500 flex items-center gap-1'>
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          {method.processing_time}
                        </span>
                      )}
                      <div className='text-xs text-slate-500'>
                        {method.min_amount && <span>من {method.min_amount} ج.م</span>}
                        {method.max_amount && <span> إلى {method.max_amount} ج.م</span>}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* معلومات طريقة الدفع المختارة */}
            {selectedMethod && (
              <div className='p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg border border-slate-200'>
                <div className='flex items-center gap-3 mb-3'>
                  <div className='w-8 h-8 rounded-lg bg-gradient-to-r from-pro to-pro-max flex items-center justify-center'>
                    {getPaymentMethodIcon(selectedMethod)}
                  </div>
                  <div>
                    <h4 className='font-semibold text-slate-900'>{selectedMethod.name}</h4>
                    <p className='text-sm text-slate-600'>طريقة الدفع المختارة</p>
                  </div>
                </div>
                
                <div className='grid grid-cols-2 md:grid-cols-4 gap-3 text-sm'>
                  {selectedMethod.min_amount && (
                    <div className='text-center p-2 bg-white rounded-lg'>
                      <div className='text-slate-500'>الحد الأدنى</div>
                      <div className='font-semibold text-slate-900'>{selectedMethod.min_amount} ج.م</div>
                    </div>
                  )}
                  
                  {selectedMethod.max_amount && (
                    <div className='text-center p-2 bg-white rounded-lg'>
                      <div className='text-slate-500'>الحد الأقصى</div>
                      <div className='font-semibold text-slate-900'>{selectedMethod.max_amount} ج.م</div>
                    </div>
                  )}
                  
                  {selectedMethod.fees !== undefined && (
                    <div className='text-center p-2 bg-white rounded-lg'>
                      <div className='text-slate-500'>الرسوم</div>
                      <div className='font-semibold text-slate-900'>{selectedMethod.fees}%</div>
                    </div>
                  )}
                  
                  {selectedMethod.processing_time && (
                    <div className='text-center p-2 bg-white rounded-lg'>
                      <div className='text-slate-500'>مدة المعالجة</div>
                      <div className='font-semibold text-slate-900'>{selectedMethod.processing_time}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Section 2: المبلغ */}
          <div className='mb-8'>
            <h3 className='text-lg font-semibold text-slate-900 mb-4'>المبلغ المطلوب</h3>
            
            <div className='relative mb-4'>
              <div className='flex items-center border border-slate-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-pro focus-within:border-transparent'>
                <span className='px-4 py-3 bg-slate-100 border-r border-slate-300 text-slate-700 font-medium'>
                  ج.م
                </span>
                <input
                  type='number'
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setError(null);
                  }}
                  placeholder='أدخل المبلغ'
                  min={selectedMethod?.min_amount || 10}
                  max={selectedMethod?.max_amount || 5000}
                  step="0.01"
                  className='flex-1 px-4 py-3 focus:outline-none text-lg font-medium'
                />
                <div className='px-4 text-slate-400'>
                  ≈ <span className='font-medium'>{amount ? (parseFloat(amount) * 0.033).toFixed(2) : '0.00'}</span> $
                </div>
              </div>
              
              {selectedMethod && (
                <div className='mt-2 text-xs text-slate-500 flex justify-between'>
                  {selectedMethod.min_amount && (
                    <span>الحد الأدنى: {selectedMethod.min_amount} ج.م</span>
                  )}
                  {selectedMethod.max_amount && (
                    <span>الحد الأقصى: {selectedMethod.max_amount} ج.م</span>
                  )}
                </div>
              )}
            </div>

            {/* الأزرار السريعة للمبالغ */}
            <div>
              <p className='text-sm text-slate-600 mb-3'>مبالغ سريعة:</p>
              <div className='grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6'>
                {getQuickAmounts().map((value) => (
                  <button
                    key={value}
                    type='button'
                    onClick={() => handleQuickAmount(value)}
                    className={`px-4 py-3 border rounded-lg transition-all duration-200 text-sm font-medium ${
                      amount === value.toString() 
                        ? 'bg-gradient-to-r from-pro to-pro-max  border-transparent shadow-md scale-105' 
                        : 'border-slate-300 hover:border-pro hover:text-pro hover:bg-slate-50'
                    }`}
                  >
                    {value} ج.م
                  </button>
                ))}
                
                {/* زر مخصص */}
                <button
                  type='button'
                 
                  className='px-4 py-3 border border-dashed border-slate-300 rounded-lg hover:border-pro hover:text-pro transition-colors text-sm font-medium'
                >
                  مبلغ آخر
                </button>
              </div>
            </div>

            {/* ملخص الرسوم */}
            {selectedMethod && amount && parseFloat(amount) > 0 && selectedMethod.fees !== undefined && selectedMethod.fees > 0 && (
              <div className='p-4 bg-slate-50 rounded-lg border border-slate-200 mb-6'>
                <h4 className='font-semibold text-slate-900 mb-3'>ملخص الرسوم</h4>
                <div className='space-y-2'>
                  <div className='flex justify-between'>
                    <span className='text-slate-600'>المبلغ الأساسي</span>
                    <span className='font-medium'>{parseFloat(amount).toFixed(2)} ج.م</span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-slate-600'>رسوم الخدمة ({selectedMethod.fees}%)</span>
                    <span className='font-medium text-red-600'>
                      {(parseFloat(amount) * (selectedMethod.fees / 100)).toFixed(2)} ج.م
                    </span>
                  </div>
                  <div className='pt-2 border-t border-slate-300'>
                    <div className='flex justify-between'>
                      <span className='font-semibold text-slate-900'>المبلغ الإجمالي</span>
                      <span className='font-bold text-lg text-pro'>
                        {(parseFloat(amount) + (parseFloat(amount) * (selectedMethod.fees / 100))).toFixed(2)} ج.م
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* زر الشحن */}
          <button
            onClick={handleCharge}
            disabled={loading || !amount || !selectedMethod}
            className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center justify-center gap-3 ${
              loading || !amount || !selectedMethod
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-pro to-pro-max  hover:shadow-lg hover:scale-[1.02]'
            }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 " xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                جاري المعالجة...
              </>
            ) : (
              <>
                <FaWallet />
                شحن الرصيد
                {selectedMethod?.fees !== undefined && selectedMethod.fees > 0 && amount && (
                  <span className='text-sm opacity-90'>
                    (شامل الرسوم)
                  </span>
                )}
              </>
            )}
          </button>

          {/* شروط وأحكام */}
          <div className='mt-6 text-center'>
            <p className='text-xs text-slate-500'>
              بالضغط على زر "شحن الرصيد" فإنك توافق على{' '}
              <Link href="/terms" className='text-pro hover:underline font-medium'>الشروط والأحكام</Link>
              {' '}و{' '}
              <Link href="/privacy" className='text-pro hover:underline font-medium'>سياسة الخصوصية</Link>
            </p>
            <div className='flex items-center justify-center gap-4 mt-4'>
              <SiVisa className='w-12 h-8 text-[#1A1F71]' />
              <SiMastercard className='w-12 h-8 text-[#EB001B]' />
              <div className='relative w-12 h-8'>
                <div className="text-xs font-bold text-gray-800 border border-gray-300 rounded px-2 py-1">مدى</div>
              </div>
              <SiPaypal className='w-12 h-8 text-[#003087]' />
            </div>
          </div>
        </div>
      </div>

      {/* معلومات إضافية */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-8'>
        <div className='bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-5'>
          <div className='flex items-center gap-3 mb-3'>
            <div className='w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center'>
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className='font-bold text-blue-900 text-lg'>آمن 100%</h3>
          </div>
          <p className='text-blue-800 text-sm leading-relaxed'>
            جميع عمليات الدفع مشفرة باستخدام أحدث تقنيات الحماية والتشفير المتقدمة
          </p>
        </div>

        <div className='bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-5'>
          <div className='flex items-center gap-3 mb-3'>
            <div className='w-12 h-12 rounded-xl bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center'>
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className='font-bold text-green-900 text-lg'>فوري</h3>
          </div>
          <p className='text-green-800 text-sm leading-relaxed'>
            يتم إضافة الرصيد فوراً بعد إتمام عملية الدفع في معظم طرق الدفع
          </p>
        </div>

        <div className='bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-5'>
          <div className='flex items-center gap-3 mb-3'>
            <div className='w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center'>
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-2 0c0 .993-.241 1.929-.668 2.754l-1.524-1.525a3.997 3.997 0 00.078-2.183l1.562-1.562C15.802 8.249 16 9.1 16 10zm-5.165 3.913l1.58 1.58A5.98 5.98 0 0110 16a5.976 5.976 0 01-2.516-.552l1.562-1.562a4.006 4.006 0 001.789.027zm-4.677-2.796a4.002 4.002 0 01-.041-2.08l-.08.08-1.53-1.533A5.98 5.98 0 004 10c0 .954.223 1.856.619 2.657l1.54-1.54zm1.088-6.45A5.974 5.974 0 0110 4c.954 0 1.856.223 2.657.619l-1.54 1.54a4.002 4.002 0 00-2.346.033L7.246 4.668zM12 10a2 2 0 11-4 0 2 2 0 014 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className='font-bold text-purple-900 text-lg'>دعم فني</h3>
          </div>
          <p className='text-purple-800 text-sm leading-relaxed'>
            فريق الدعم الفني متاح على مدار الساعة للمساعدة في أي استفسار أو مشكلة
          </p>
        </div>
      </div>

      
    </div>
  );
}