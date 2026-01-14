'use client';

import Link from 'next/link';
import { MdKeyboardArrowLeft } from 'react-icons/md';
import { FaList } from 'react-icons/fa';

export default function CategoriesPage() {
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
					القسائم
				</h1>
			</div>

			{/* Content */}
			<div className='bg-white rounded-xl border border-slate-200 shadow-sm p-6'>
				<div className='flex items-center gap-3 mb-6'>
					<div className='w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center'>
						<FaList className='text-pro-max' size={22} />
					</div>
					<div>
						<h2 className='text-lg font-semibold text-slate-900'>قسائمي</h2>
						<p className='text-sm text-slate-500'>عرض وإدارة القسائم المتاحة</p>
					</div>
				</div>

				<div className='text-center py-12'>
					<p className='text-slate-500 mb-2'>لا توجد قسائم متاحة حالياً</p>
					<p className='text-sm text-slate-400'>ستظهر قسائمك هنا عند توفرها</p>
				</div>
			</div>
		</div>
	);
}

