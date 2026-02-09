'use client';

import Link from 'next/link'
import React from 'react'
import { FaWallet, FaCreditCard, FaList } from 'react-icons/fa';

export default function Finance() {
  return (
    <div className='bg-white rounded-xl pb-3 border border-slate-200 shadow-sm overflow-hidden'>
      <div 
        className='grid grid-cols-3 gap-px bg-slate-100'
        style={{ backgroundColor: 'rgb(255, 250, 246)' }}
      >
        <Link 
          href="/myAccount/finance/categories"
          className='p-2 flex flex-col items-center gap-2 md:gap-3 bg-white hover:bg-slate-50 transition-all duration-200 group'
        >
          <div className='w-6 h-6 md:w-7 md:h-7 rounded-xl bg-orange-50 flex items-center justify-center group-hover:bg-orange-100 transition-colors'>
            <FaList className='text-pro-max w-3 h-3 md:w-4 md:h-4' />
          </div>
          <span className='text-xs md:text-sm font-semibold text-pro-max group-hover:text-pro-max transition-colors'>القسائم</span>
        </Link>

        <Link 
          href="/myAccount/finance/charge"
          className='p-2 flex flex-col items-center gap-2 md:gap-3 bg-white hover:bg-slate-50 transition-all duration-200 group'
        >
          <div className='w-6 h-6 md:w-7 md:h-7 rounded-xl bg-orange-50 flex items-center justify-center group-hover:bg-orange-100 transition-colors'>
            <FaWallet className='text-pro-max w-3 h-3 md:w-4 md:h-4' />
          </div>
          <span className='text-xs md:text-sm font-semibold text-pro-max group-hover:text-pro-max transition-colors'>تعبئة الرصيد</span>
        </Link>

        <Link 
          href="/myAccount/finance/pay"
          className='p-2 flex flex-col items-center gap-2 md:gap-3 bg-white hover:bg-slate-50 transition-all duration-200 group'
        >
          <div className='w-6 h-6 md:w-7 md:h-7 rounded-xl bg-orange-50 flex items-center justify-center group-hover:bg-orange-100 transition-colors'>
            <FaCreditCard className='text-pro-max w-3 h-3 md:w-4 md:h-4' />
          </div>
          <span className='text-xs md:text-sm font-semibold text-pro-max group-hover:text-pro-max transition-colors'>رابط الدفع</span>
        </Link>
      </div>
    </div>
  )
}