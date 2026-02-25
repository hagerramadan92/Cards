'use client';

import Link from 'next/link';
import { MdKeyboardArrowLeft } from 'react-icons/md';
import { FaTicketAlt, FaPlus } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import TicketForm from './TicketForm'; 
import { useLanguage } from '@/src/context/LanguageContext';

// واجهة بيانات التذكرة من API
interface ContactMessage {
	id: number;
	first_name: string;
	last_name: string;
	phone: string;
	email: string;
	company: string | null;
	message: string;
	status: string;
	created_at: string;
}

// واجهة بيانات التذكرة المعروضة في الجدول
interface Ticket {
	id: number;
	title: string;
	status: 'open' | 'closed' | 'pending' | 'replied';
	date: string;
	lastReply: string;
	type: string;
}

export default function SupportPage() {
	const { t } = useLanguage();
	const [showTicketForm, setShowTicketForm] = useState(false);
	const [tickets, setTickets] = useState<Ticket[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// دالة لجلب البيانات من API
	const fetchContactMessages = async () => {
		try {
			setLoading(true);
			const response = await fetch('https://flashicard.renix4tech.com/api/v1/user/contact-us', {
				headers: {
					'Accept-Language': 'ar', 
					'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
				},
			});

			if (!response.ok) {
				throw new Error('فشل في جلب البيانات');
			}

			const result = await response.json();
			
			// تحويل البيانات من API إلى هيكل التذاكر المطلوب
			const formattedTickets: Ticket[] = result.data.map((item: ContactMessage) => ({
				id: item.id,
				title: item.message.substring(0, 50) + (item.message.length > 50 ? '...' : ''), // استخدام أول 50 حرف من الرسالة كعنوان
				status: mapStatus(item.status), // تحويل الحالة
				date: item.created_at.split(' ')[0], // أخذ التاريخ فقط
				lastReply: item.created_at.split(' ')[0], // استخدام نفس التاريخ كآخر رد
				type: getMessageType(item.message), // تحديد نوع الرسالة
			}));

			setTickets(formattedTickets);
			setError(null);
		} catch (err) {
			console.error('خطأ في جلب البيانات:', err);
			setError('حدث خطأ أثناء تحميل البيانات');
		} finally {
			setLoading(false);
		}
	};

	// دالة لتحويل حالة الرسالة
	const mapStatus = (status: string): 'open' | 'closed' | 'pending' | 'replied' => {
		switch(status) {
			case 'معلق':
				return 'pending';
			case 'مقروء':
				return 'replied';
			case 'مغلق':
				return 'closed';
			default:
				return 'open';
		}
	};

	// دالة لتحديد نوع الرسالة بناءً على محتواها
	const getMessageType = (message: string): string => {
		if (message.includes('مشروع')) {
			return t('support.types.inquiry');
		} else if (message.includes('شكوى') || message.includes('مشكلة')) {
			return t('support.types.complaint');
		} else if (message.includes('اقتراح')) {
			return t('support.types.suggestion');
		} else {
			return t('support.types.inquiry');
		}
	};

	// جلب البيانات عند تحميل المكون
	useEffect(() => {
		fetchContactMessages();
	}, []);

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
				return t('support.status.open');
			case 'closed':
				return t('support.status.closed');
			case 'pending':
				return t('support.status.pending');
			case 'replied':
				return t('support.status.replied');
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
					<span>{t('common.back')}</span>
				</Link>
				<h1 className='text-2xl md:text-3xl text-pro font-semibold'>
					{t('support.title')}
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
							<h2 className='md:text-lg text-sm font-semibold text-slate-900'>{t('support.tickets.title')}</h2>
							<p className='md:text-sm text-xs text-slate-500'>{t('support.tickets.subtitle')}</p>
						</div>
					</div>
					
					{/* زر إنشاء تذكرة جديدة */}
					<button
						onClick={() => setShowTicketForm(!showTicketForm)}
						className='inline-flex items-center md:gap-2 bg-pro hover:bg-pro-max text-white md:px-4 md:py-2 p-1 rounded md:rounded-xl transition-colors shadow-sm hover:shadow-md'
					>
						<FaPlus size={16} />
						<span className='text-[12px] md:text-sm whitespace-nowrap'>{t('support.create_ticket')}</span>
					</button>
				</div>

				{/* نموذج إنشاء تذكرة جديدة */}
				{showTicketForm && (
					<div className='mb-8 border border-slate-200 rounded-xl overflow-hidden'>
						<div className='bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center'>
							<h3 className='font-semibold text-slate-900'>{t('support.new_ticket')}</h3>
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
								// تحديث قائمة التذاكر بعد إضافة تذكرة جديدة
								fetchContactMessages();
							}}
						/>
					</div>
				)}

				{/* عرض حالة التحميل */}
				{loading && (
					<div className='text-center py-12'>
						<div className='inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pro'></div>
						<p className='text-slate-500 mt-2'>جاري تحميل البيانات...</p>
					</div>
				)}

				{/* عرض الخطأ */}
				{error && !loading && (
					<div className='text-center py-12'>
						<p className='text-red-500 mb-2'>{error}</p>
						<button 
							onClick={fetchContactMessages}
							className='text-pro hover:text-pro-max text-sm'
						>
							إعادة المحاولة
						</button>
					</div>
				)}

				{/* جدول التذاكر */}
				{!loading && !error && tickets.length > 0 ? (
					<div className='overflow-x-auto'>
						<table className='w-full'>
							<thead>
								<tr className='border-b border-slate-200'>
									<th className='text-start py-3 px-4 text-sm font-semibold text-slate-600'>#</th>
									<th className='text-start py-3 px-4 text-sm font-semibold text-slate-600'>{t('support.table.title')}</th>
									<th className='text-start py-3 px-4 text-sm font-semibold text-slate-600'>{t('support.table.type')}</th>
									<th className='text-start py-3 px-4 text-sm font-semibold text-slate-600'>{t('support.table.status')}</th>
									<th className='text-start py-3 px-4 text-sm font-semibold text-slate-600'>{t('support.table.created_date')}</th>
									<th className='text-start py-3 px-4 text-sm font-semibold text-slate-600'>{t('support.table.last_reply')}</th>
									<th className='text-start py-3 px-4 text-sm font-semibold text-slate-600'>{t('support.table.actions')}</th>
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
												{t('support.view_details')}
											</Link>
											<p 
												
												className='inline-flex items-center gap-1 text-sm text-pro hover:text-pro-max transition-colors'
											>
												{t('support.view_details')}
											</p>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				) : !loading && !error && tickets.length === 0 ? (
					<div className='text-center py-12'>
						<p className='text-slate-500 mb-2'>{t('support.no_tickets')}</p>
						<p className='text-sm text-slate-400'>{t('support.create_first_ticket')}</p>
					</div>
				) : null}
			</div>
		</div>
	);
}