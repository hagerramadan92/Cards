'use client';

import Link from 'next/link';
import { MdKeyboardArrowLeft } from 'react-icons/md';
import { FaTicketAlt, FaPlus } from 'react-icons/fa';
import { useState } from 'react';
import TicketForm from './TicketForm'; 

// واجهة بيانات التذكرة
interface Ticket {
	id: number;
	title: string;
	status: 'open' | 'closed' | 'pending' | 'replied';
	date: string;
	lastReply: string;
	type: string;
}

export default function SupportPage() {
	const [showTicketForm, setShowTicketForm] = useState(false);
	
	// بيانات تجريبية للتذاكر - يمكن استبدالها ببيانات حقيقية من API
	const [tickets, setTickets] = useState<Ticket[]>([
		{
			id: 1,
			title: 'استفسار عن خدمة',
			status: 'open',
			date: '2024-03-15',
			lastReply: '2024-03-16',
			type: 'استفسار'
		},
		{
			id: 2,
			title: 'مشكلة في الدفع',
			status: 'pending',
			date: '2024-03-10',
			lastReply: '2024-03-12',
			type: 'شكوى'
		},
		{
			id: 3,
			title: 'مشكلة في الدفع',
			status: 'replied',
			date: '2024-03-10',
			lastReply: '2024-03-12',
			type: 'شكوى'
		},
		{
			
			id: 4,
			title: 'اقتراح لتطوير الموقع',
			status: 'closed',
			date: '2024-03-01',
			lastReply: '2024-03-05',
			type: 'اقتراح'
		}
	]);

	// دالة الحصول على لون الحالة
	const getStatusColor = (status: string) => {
		switch(status) {
			case 'open':
				return 'bg-green-100 text-green-700 border-green-200';
			case 'closed':
				return 'bg-slate-100 text-slate-600 border-slate-200';
			case 'pending':
				return 'bg-yellow-100 text-yellow-700 border-yellow-200';
			case 'replied':
				return 'bg-blue-100 text-blue-700 border-blue-200';
			default:
				return 'bg-slate-100 text-slate-600 border-slate-200';
		}
	};

	// دالة الحصول على نص الحالة
	const getStatusText = (status: string) => {
		switch(status) {
			case 'open':
				return 'مفتوحة';
			case 'closed':
				return 'مغلقة';
			case 'pending':
				return 'قيد المراجعة';
			case 'replied':
				return 'تم الرد';
			default:
				return status;
		}
	};

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
					دعم العملاء
				</h1>
			</div>

			{/* Content */}
			<div className='bg-white rounded-xl border border-slate-200 shadow-sm md:p-6 p-2'>
				<div className='flex items-center justify-between mb-6'>
					<div className='flex md:items-center md:gap-3'>
						<div className='w-12 h-12 rounded-xl bg-pro/10 flex items-center justify-center'>
							<FaTicketAlt className='text-pro-max' size={22} />
						</div>
						<div>
							<h2 className='md:text-lg text-sm font-semibold text-slate-900'>تذاكر الدعم</h2>
							<p className='md:text-sm text-xs text-slate-500'>عرض وإدارة تذاكر الدعم الخاصة بك</p>
						</div>
					</div>
					
					{/* زر إنشاء تذكرة جديدة */}
					<button
						onClick={() => setShowTicketForm(!showTicketForm)}
						className='inline-flex items-center md:gap-2 bg-pro hover:bg-pro-max text-white md:px-4 md:py-2 p-1 rounded md:rounded-xl transition-colors shadow-sm hover:shadow-md'
					>
						<FaPlus size={16} />
						<span className='text-[12px] md:text-sm whitespace-nowrap'>إنشاء تذكرة </span>
					</button>
				</div>

				{/* نموذج إنشاء تذكرة جديدة */}
				{showTicketForm && (
	<div className='mb-8 border border-slate-200 rounded-xl overflow-hidden'>
		<div className='bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center'>
			<h3 className='font-semibold text-slate-900'>تذكرة دعم جديدة</h3>
			<button 
				onClick={() => setShowTicketForm(false)}
				className='text-slate-400 hover:text-slate-600'
			>
				✕
			</button>
		</div>
		<TicketForm
			onClose={() => setShowTicketForm(false)}
			onSuccess={() => {
				// تحديث قائمة التذاكر هنا
				console.log('تم إرسال التذكرة بنجاح');
			}}
		/>
	</div>
)}

				{/* جدول التذاكر */}
				{tickets.length > 0 ? (
					<div className='overflow-x-auto'>
						<table className='w-full'>
							<thead>
								<tr className='border-b border-slate-200'>
									<th className='text-right py-3 px-4 text-sm font-semibold text-slate-600'>#</th>
									<th className='text-right py-3 px-4 text-sm font-semibold text-slate-600'>العنوان</th>
									<th className='text-right py-3 px-4 text-sm font-semibold text-slate-600'>النوع</th>
									<th className='text-right py-3 px-4 text-sm font-semibold text-slate-600'>الحالة</th>
									<th className='text-right py-3 px-4 text-sm font-semibold text-slate-600'>تاريخ الإنشاء</th>
									<th className='text-right py-3 px-4 text-sm font-semibold text-slate-600'>آخر رد</th>
									<th className='text-right py-3 px-4 text-sm font-semibold text-slate-600'>الإجراءات</th>
								</tr>
							</thead>
							<tbody>
								{tickets.map((ticket) => (
									<tr key={ticket.id} className='border-b border-slate-100 hover:bg-slate-50 transition-colors'>
										<td className='py-3 px-4 text-sm text-slate-600'>#{ticket.id}</td>
										<td className='py-3 px-4 text-sm font-medium text-slate-900'>{ticket.title}</td>
										<td className='py-3 px-4 text-sm text-slate-600'>{ticket.type}</td>
										<td className='py-3 px-4'>
											<span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full border ${getStatusColor(ticket.status)}`}>
												{getStatusText(ticket.status)}
											</span>
										</td>
										<td className='py-3 px-4 text-sm text-slate-600'>{ticket.date}</td>
										<td className='py-3 px-4 text-sm text-slate-600'>{ticket.lastReply}</td>
										<td className='py-3 px-4'>
											<Link 
												href={`/myAccount/support/tickets/${ticket.id}`}
												className='inline-flex items-center gap-1 text-sm text-pro hover:text-pro-max transition-colors'
											>
												عرض التفاصيل
											</Link>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				) : (
					<div className='text-center py-12'>
						<p className='text-slate-500 mb-2'>لا توجد تذاكر دعم حالياً</p>
						<p className='text-sm text-slate-400'>يمكنك إنشاء تذكرة دعم جديدة من هنا</p>
					</div>
				)}
			</div>
		</div>
	);
}