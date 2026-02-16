'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { MdKeyboardArrowLeft } from 'react-icons/md';
import { 
	FaTicketAlt, 
	FaUser, 
	FaEnvelope, 
	FaPhone, 
	FaMapMarkerAlt,
	FaClock,
	FaReply,
	FaPaperPlane
} from 'react-icons/fa';
import { FiMessageSquare, FiPaperclip } from 'react-icons/fi';
import { useState } from 'react';

// واجهة بيانات التذكرة
interface Ticket {
	id: number;
	title: string;
	status: 'open' | 'closed' | 'pending';
	date: string;
	lastReply: string;
	type: string;
	full_name: string;
	email: string;
	phone: string;
	address: string;
	message: string;
}

// واجهة بيانات الردود
interface Reply {
	id: number;
	user: string;
	message: string;
	date: string;
	isSupport: boolean;
}

export default function TicketDetails() {
	const params = useParams();
	const router = useRouter();
	const ticketId = params.id;
	
	const [newReply, setNewReply] = useState('');
	const [replies, setReplies] = useState<Reply[]>([
		{
			id: 1,
			user: 'أحمد محمد',
			message: 'شكراً لتواصلكم، سنقوم بمراجعة استفسارك والرد عليه في أقرب وقت',
			date: '2024-03-16 10:30 AM',
			isSupport: true
		},
		{
			id: 2,
			user: 'أنت',
			message: 'لدي استفسار عن الخدمات المتاحة',
			date: '2024-03-15 02:15 PM',
			isSupport: false
		}
	]);

	// بيانات تجريبية للتذكرة - يمكن جلبها من API باستخدام ticketId
	const [ticket] = useState<Ticket>({
		id: Number(ticketId),
		title: 'استفسار عن خدمة',
		status: 'open',
		date: '2024-03-15',
		lastReply: '2024-03-16',
		type: 'استفسار',
		full_name: 'أحمد محمد',
		email: 'ahmed@example.com',
		phone: '01012345678',
		address: 'القاهرة، مصر',
		message: 'أود الاستفسار عن الخدمات المتاحة وكيفية الاشتراك فيها'
	});

	// دالة الحصول على لون الحالة
	const getStatusColor = (status: string) => {
		switch(status) {
			case 'open':
				return 'bg-green-100 text-green-700 border-green-200';
			case 'closed':
				return 'bg-slate-100 text-slate-600 border-slate-200';
			case 'pending':
				return 'bg-yellow-100 text-yellow-700 border-yellow-200';
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
			default:
				return status;
		}
	};

	const handleSendReply = () => {
		if (!newReply.trim()) return;
		
		// إضافة الرد الجديد
		const newReplyObj: Reply = {
			id: replies.length + 1,
			user: 'أنت',
			message: newReply,
			date: new Date().toLocaleString('ar-EG'),
			isSupport: false
		};
		
		setReplies([newReplyObj, ...replies]);
		setNewReply('');
	};

	return (
		<div>
			{/* Header */}
			<div className='mb-6'>
				<button 
					onClick={() => router.back()}
					className='inline-flex items-center gap-2 text-sm text-slate-600 hover:text-pro transition-colors mb-4'
				>
					<MdKeyboardArrowLeft size={20} />
					<span>العودة</span>
				</button>
				<h1 className='text-2xl md:text-3xl text-pro font-semibold'>
					تفاصيل التذكرة #{ticketId}
				</h1>
			</div>

			{/* Content */}
			<div className='space-y-6'>
				{/* بطاقة التذكرة الرئيسية */}
				<div className='bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden'>
					{/* Header */}
					<div className='bg-slate-50 px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4'>
						<div className='flex items-center gap-3'>
							<div className='w-10 h-10 rounded-lg bg-pro/10 flex items-center justify-center'>
								<FaTicketAlt className='text-pro-max' size={18} />
							</div>
							<div>
								<h2 className='text-lg font-semibold text-slate-900'>{ticket.title}</h2>
								<p className='text-sm text-slate-500'>تم الإنشاء: {ticket.date}</p>
							</div>
						</div>
						<div className='flex items-center gap-3'>
							<span className={`inline-block px-3 py-1.5 text-xs font-semibold rounded-full border ${getStatusColor(ticket.status)}`}>
								{getStatusText(ticket.status)}
							</span>
							<span className='text-sm text-slate-500'>آخر رد: {ticket.lastReply}</span>
						</div>
					</div>

					{/* محتوى التذكرة */}
					<div className='p-6'>
						{/* معلومات العميل */}
						<div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-slate-50 rounded-xl'>
							<div className='flex items-center gap-3'>
								<FaUser className='text-slate-400' size={16} />
								<span className='text-sm text-slate-600'>الاسم:</span>
								<span className='text-sm font-semibold text-slate-900'>{ticket.full_name}</span>
							</div>
							<div className='flex items-center gap-3'>
								<FaEnvelope className='text-slate-400' size={16} />
								<span className='text-sm text-slate-600'>البريد:</span>
								<span className='text-sm font-semibold text-slate-900'>{ticket.email}</span>
							</div>
							<div className='flex items-center gap-3'>
								<FaPhone className='text-slate-400' size={16} />
								<span className='text-sm text-slate-600'>الجوال:</span>
								<span className='text-sm font-semibold text-slate-900' dir='ltr'>{ticket.phone}</span>
							</div>
							<div className='flex items-center gap-3'>
								<FaMapMarkerAlt className='text-slate-400' size={16} />
								<span className='text-sm text-slate-600'>العنوان:</span>
								<span className='text-sm font-semibold text-slate-900'>{ticket.address}</span>
							</div>
						</div>

						{/* الرسالة الأصلية */}
						<div className='mb-6'>
							<h3 className='text-sm font-semibold text-slate-900 mb-3'>الرسالة:</h3>
							<div className='bg-pro/5 p-4 rounded-xl border border-pro/10'>
								<p className='text-slate-700 leading-relaxed'>{ticket.message}</p>
							</div>
						</div>

						{/* الردود */}
						<div className='space-y-4'>
							<h3 className='text-sm font-semibold text-slate-900 flex items-center gap-2'>
								<FaReply className='text-pro' />
								الردود ({replies.length})
							</h3>
							
							<div className='space-y-3'>
								{replies.map((reply) => (
									<div 
										key={reply.id} 
										className={`p-4 rounded-xl border ${
											reply.isSupport 
												? 'bg-green-50 border-green-200 mr-0 md:mr-12' 
												: 'bg-blue-50 border-blue-200 ml-0 md:ml-12'
										}`}
									>
										<div className='flex items-center justify-between mb-2'>
											<div className='flex items-center gap-2'>
												<span className='font-semibold text-sm text-slate-900'>{reply.user}</span>
												{reply.isSupport && (
													<span className='text-xs bg-green-200 text-green-700 px-2 py-0.5 rounded-full'>
														الدعم
													</span>
												)}
											</div>
											<span className='text-xs text-slate-500 flex items-center gap-1'>
												<FaClock size={10} />
												{reply.date}
											</span>
										</div>
										<p className='text-sm text-slate-700'>{reply.message}</p>
									</div>
								))}
							</div>
						</div>

						{/* إضافة رد جديد - يظهر فقط إذا كانت التذكرة مفتوحة */}
						{/* {ticket.status !== 'closed' && (
							<div className='mt-6 pt-6 border-t border-slate-200'>
								<h3 className='text-sm font-semibold text-slate-900 mb-3'>إضافة رد:</h3>
								<div className='flex gap-3'>
									<textarea
										value={newReply}
										onChange={(e) => setNewReply(e.target.value)}
										placeholder='اكتب ردك هنا...'
										className='flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-pro focus:ring-2 focus:ring-pro/20 outline-none resize-none'
										rows={3}
									/>
									<div className='flex flex-col gap-2'>
										<button
											onClick={handleSendReply}
											disabled={!newReply.trim()}
											className='p-3 bg-pro hover:bg-pro-max text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
											title='إرسال'
										>
											<FaPaperPlane size={18} />
										</button>
										<button
											className='p-3 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-colors'
											title='إرفاق ملف'
										>
											<FiPaperclip size={18} />
										</button>
									</div>
								</div>
							</div>
						)} */}
					</div>
				</div>
			</div>
		</div>
	);
}