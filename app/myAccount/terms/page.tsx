'use client';

import Link from 'next/link';
import { MdKeyboardArrowLeft } from 'react-icons/md';
import { FaAward } from 'react-icons/fa';

export default function TermsPage() {
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
					الشروط والأحكام
				</h1>
			</div>

			{/* Content */}
			<div className='bg-white rounded-xl border border-slate-200 shadow-sm p-6'>
				<div className='flex items-center gap-3 mb-6'>
					<div className='w-12 h-12 rounded-xl bg-pro/10 flex items-center justify-center'>
						<FaAward className='text-pro-max' size={22} />
					</div>
					<div>
						<h2 className='text-lg font-semibold text-slate-900'>الشروط والأحكام</h2>
						<p className='text-sm text-slate-500'>قراءة الشروط والأحكام الخاصة بالخدمة</p>
					</div>
				</div>

				<div className='prose max-w-none'>
					<div className='space-y-4 text-slate-700'>
						<section>
							<h3 className='text-lg font-semibold text-slate-900 mb-2'>1. الشروط العامة</h3>
							<p className='text-sm leading-relaxed'>
								هذه الشروط والأحكام تحكم استخدامك لخدماتنا. باستخدام الموقع، فإنك توافق على الالتزام بهذه الشروط.
							</p>
						</section>
						<section>
							<h3 className='text-lg font-semibold text-slate-900 mb-2'>2. الحساب والمعلومات</h3>
							<p className='text-sm leading-relaxed'>
								أنت مسؤول عن الحفاظ على سرية معلومات حسابك وكلمة المرور. يجب عليك إبلاغنا فوراً بأي استخدام غير مصرح به.
							</p>
						</section>
						<section>
							<h3 className='text-lg font-semibold text-slate-900 mb-2'>3. المكافآت والنقاط</h3>
							<p className='text-sm leading-relaxed'>
								المكافآت والنقاط قابلة للاستبدال وفقاً للشروط المحددة. نحتفظ بالحق في تعديل أو إلغاء برنامج المكافآت في أي وقت.
							</p>
						</section>
					</div>
				</div>
			</div>
		</div>
	);
}

