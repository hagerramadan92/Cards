'use client';

import Link from 'next/link';
import { MdKeyboardArrowLeft } from 'react-icons/md';
import { FaCreditCard } from 'react-icons/fa';

export default function PayPage() {
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
					رابط الدفع
				</h1>
			</div>

			{/* Content */}
			<div className='bg-white rounded-xl border border-slate-200 shadow-sm p-6'>
				<div className='flex items-center gap-3 mb-6'>
					<div className='w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center'>
						<FaCreditCard className='text-pro-max' size={22} />
					</div>
					<div>
						<h2 className='text-lg font-semibold text-slate-900'>رابط الدفع</h2>
						<p className='text-sm text-slate-500'>إنشاء رابط دفع للمعاملات</p>
					</div>
				</div>

				<div className='max-w-md'>
					<div className='bg-slate-50 rounded-lg p-4 mb-4'>
						<p className='text-sm text-slate-600 mb-2'>رابط الدفع الخاص بك:</p>
						<div className='flex items-center gap-2 bg-white p-3 rounded border border-slate-200'>
							<input
								type='text'
								value='https://example.com/pay/...'
								readOnly
								className='flex-1 text-sm text-slate-600 bg-transparent outline-none'
							/>
							<button className='text-pro hover:text-pro-max transition-colors text-sm font-medium'>
								نسخ
							</button>
						</div>
					</div>

					<button className='w-full bg-pro text-white py-3 rounded-lg font-semibold hover:bg-pro-max transition-colors'>
						إنشاء رابط دفع جديد
					</button>
				</div>
			</div>
		</div>
	);
}

