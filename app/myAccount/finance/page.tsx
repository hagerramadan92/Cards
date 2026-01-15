'use client';

import Link from 'next/link';
import { MdKeyboardArrowLeft } from 'react-icons/md';
import { FaList, FaWallet, FaCreditCard } from 'react-icons/fa';

export default function FinancePage() {
	return (
		<div>
			{/* Header */}
			<div className='mb-6'>
				<Link 
					href="/myAccount"
					className='inline-flex items-center gap-2 text-sm text-slate-600 hover:text-pro transition-colors mb-4'
				>
					<MdKeyboardArrowLeft size={20} />
					<span>العودة</span>
				</Link>
				<h1 className='text-2xl md:text-3xl text-pro font-semibold'>
					المعاملات المالية
				</h1>
			</div>

			{/* Balance Card */}
			<div className='bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6'>
				<div className='px-5 py-4 border-b border-slate-100'>
					<div className='flex items-center justify-between mb-4'>
						<h2 className='text-base font-semibold text-slate-500'>رصيد لايك كارد</h2>
					</div>
					<div className='flex items-baseline gap-2'>
						<p className='text-3xl font-bold text-slate-900'>0.00</p>
						<p className='text-sm text-slate-500 font-medium'>ج.م</p>
					</div>
				</div>

				{/* Three Sections */}
				<div className='grid grid-cols-3 gap-px bg-slate-100'>
					<Link 
						href="/myAccount/finance/categories"
						className='p-5 flex flex-col items-center gap-3 bg-white hover:bg-slate-50 transition-all duration-200 group'
					>
						<div className='w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center group-hover:bg-orange-100 transition-colors'>
							<FaList className='text-pro-max' size={22} />
						</div>
						<span className='text-sm font-semibold text-slate-700 group-hover:text-pro-max transition-colors'>القسائم</span>
					</Link>

					<Link 
						href="/myAccount/finance/charge"
						className='p-5 flex flex-col items-center gap-3 bg-white hover:bg-slate-50 transition-all duration-200 group'
					>
						<div className='w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center group-hover:bg-orange-100 transition-colors'>
							<FaWallet className='text-pro-max' size={22} />
						</div>
						<span className='text-sm font-semibold text-slate-700 group-hover:text-pro-max transition-colors'>تعبئة الرصيد</span>
					</Link>

					<Link 
						href="/myAccount/finance/pay"
						className='p-5 flex flex-col items-center gap-3 bg-white hover:bg-slate-50 transition-all duration-200 group'
					>
						<div className='w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center group-hover:bg-orange-100 transition-colors'>
							<FaCreditCard className='text-pro-max' size={22} />
						</div>
						<span className='text-sm font-semibold text-slate-700 group-hover:text-pro-max transition-colors'>رابط الدفع</span>
					</Link>
				</div>
			</div>

			{/* Transactions List */}
			<div className='bg-white rounded-xl border border-slate-200 shadow-sm p-6'>
				<h2 className='text-lg font-semibold text-slate-900 mb-4'>سجل المعاملات</h2>
				<div className='text-center py-12'>
					<p className='text-slate-500'>لا توجد معاملات حتى الآن</p>
				</div>
			</div>
		</div>
	);
}

