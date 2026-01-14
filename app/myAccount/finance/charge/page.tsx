'use client';

import Link from 'next/link';
import { MdKeyboardArrowLeft } from 'react-icons/md';
import { FaWallet } from 'react-icons/fa';
import { useState } from 'react';

export default function ChargePage() {
	const [amount, setAmount] = useState('');

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
			</div>

			{/* Content */}
			<div className='bg-white rounded-xl border border-slate-200 shadow-sm p-6'>
				<div className='flex items-center gap-3 mb-6'>
					<div className='w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center'>
						<FaWallet className='text-pro-max' size={22} />
					</div>
					<div>
						<h2 className='text-lg font-semibold text-slate-900'>شحن المحفظة</h2>
						<p className='text-sm text-slate-500'>أضف رصيداً إلى محفظتك</p>
					</div>
				</div>

				{/* Charge Form */}
				<div className='max-w-md'>
					<div className='mb-4'>
						<label className='block text-sm font-medium text-slate-700 mb-2'>
							المبلغ (ج.م)
						</label>
						<input
							type='number'
							value={amount}
							onChange={(e) => setAmount(e.target.value)}
							placeholder='أدخل المبلغ'
							className='w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pro focus:border-transparent'
						/>
					</div>

					{/* Quick Amount Buttons */}
					<div className='grid grid-cols-4 gap-2 mb-6'>
						{[50, 100, 200, 500].map((value) => (
							<button
								key={value}
								onClick={() => setAmount(value.toString())}
								className='px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-pro transition-colors text-sm font-medium'
							>
								{value}
							</button>
						))}
					</div>

					<button className='w-full bg-pro text-white py-3 rounded-lg font-semibold hover:bg-pro-max transition-colors'>
						شحن الرصيد
					</button>
				</div>
			</div>
		</div>
	);
}

