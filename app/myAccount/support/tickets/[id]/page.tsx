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
import { useState, useEffect } from 'react';

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

// واجهة الرد من API للردود
interface ReplyResponse {
	data?: {
		id: number;
		message: string;
		sender_type: string;
		created_at: string;
		user?: {
			name: string;
		};
	} | any;
}

// واجهة الرد من API للتذكرة
interface ApiResponse {
	data: {
		id: number;
		first_name: string;
		last_name: string;
		full_name: string;
		phone: string;
		email: string;
		message: string;
		status: string;
		status_label: string;
		created_at: string;
		replies_count: number;
		company: null | any;
		last_reply: {
			message: string | null;
			sender_type: string | null;
			created_at: string | null;
		};
	};
}

export default function TicketDetails() {
	const params = useParams();
	const router = useRouter();
	const ticketId = params.id;
	
	const [loading, setLoading] = useState(true);
	const [sendingReply, setSendingReply] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [newReply, setNewReply] = useState('');
	const [ticket, setTicket] = useState<Ticket | null>(null);
	const [replies, setReplies] = useState<Reply[]>([]);

	// جلب بيانات التذكرة
	useEffect(() => {
		const fetchTicketDetails = async () => {
			try {
				setLoading(true);
				setError(null);
				
				const response = await fetch(`https://flashicard.renix4tech.com/api/v1/user/contact-us/${ticketId}`, {
					headers: {
						'Accept-Language': 'ar', 
						'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
					},
				});

				if (!response.ok) {
					throw new Error('فشل في جلب بيانات التذكرة');
				}

				const responseData: ApiResponse = await response.json();
				const data = responseData.data;
				
				// تحويل البيانات من API إلى الشكل المطلوب
				setTicket({
					id: data.id,
					title: `تذكرة من ${data.full_name}`,
					status: mapStatus(data.status),
					date: formatDate(data.created_at),
					lastReply: data.last_reply?.created_at ? formatDate(data.last_reply.created_at) : 'لا يوجد ردود',
					type: 'استفسار',
					full_name: data.full_name,
					email: data.email,
					phone: data.phone,
					address: 'غير محدد',
					message: data.message
				});

				// جلب الردود إذا كان هناك ردود
				if (data.replies_count > 0) {
					await fetchReplies();
				} else {
					// إذا كان هناك آخر رد، نضيفه كرد
					if (data.last_reply?.message && data.last_reply?.created_at) {
						setReplies([{
							id: 1,
							user: data.last_reply.sender_type === 'support' ? 'فريق الدعم' : data.full_name,
							message: data.last_reply.message,
							date: formatDate(data.last_reply.created_at),
							isSupport: data.last_reply.sender_type === 'support'
						}]);
					}
				}
				
			} catch (err) {
				setError(err instanceof Error ? err.message : 'حدث خطأ ما');
				console.error('Error fetching ticket:', err);
			} finally {
				setLoading(false);
			}
		};

		// جلب جميع الردود
		const fetchReplies = async () => {
			try {
				const response = await fetch(`https://flashicard.renix4tech.com/api/v1/user/contact-us/${ticketId}/replies`, {
					headers: {
						'Accept-Language': 'ar',
						'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
					},
				});

				if (response.ok) {
					const repliesData = await response.json();
					
					// تنسيق الردود
					if (repliesData.data && Array.isArray(repliesData.data)) {
						const formattedReplies = repliesData.data.map((reply: any, index: number) => ({
							id: reply.id || index + 1,
							user: reply.sender_type === 'support' ? 'فريق الدعم' : (ticket?.full_name || 'المستخدم'),
							message: reply.message,
							date: formatDate(reply.created_at),
							isSupport: reply.sender_type === 'support'
						}));
						
						setReplies(formattedReplies);
					}
				}
			} catch (error) {
				console.error('Error fetching replies:', error);
			}
		};

		if (ticketId) {
			fetchTicketDetails();
		}
	}, [ticketId]);

	// دالة تحويل الحالة
	const mapStatus = (apiStatus: string): 'open' | 'closed' | 'pending' => {
		switch(apiStatus.toLowerCase()) {
			case 'open':
				return 'open';
			case 'closed':
				return 'closed';
			case 'pending':
				return 'pending';
			default:
				return 'pending';
		}
	};

	// دالة تنسيق التاريخ
	const formatDate = (dateString: string): string => {
		try {
			return new Date(dateString).toLocaleString('ar-EG', {
				year: 'numeric',
				month: 'numeric',
				day: 'numeric',
				hour: '2-digit',
				minute: '2-digit'
			});
		} catch {
			return dateString;
		}
	};

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

	const handleSendReply = async () => {
		if (!newReply.trim()) return;
		
		setSendingReply(true);
		
		try {
			// إرسال الرد إلى API باستخدام المسار الصحيح
			const response = await fetch(`https://flashicard.renix4tech.com/api/v1/user/contact-us/${ticketId}/replies`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Accept-Language': 'ar',
					'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
				},
				body: JSON.stringify({
					message: newReply
				})
			});

			const responseData: ReplyResponse = await response.json();

			if (!response.ok) {
				throw new Error(responseData.message || 'فشل في إرسال الرد');
			}

			// إضافة الرد الجديد محلياً
			const newReplyObj: Reply = {
				id: responseData.data?.id || Date.now(),
				user: 'أنت',
				message: newReply,
				date: formatDate(new Date().toISOString()),
				isSupport: false
			};
			
			setReplies(prev => [newReplyObj, ...prev]);
			setNewReply('');
			
		} catch (err) {
			console.error('Error sending reply:', err);
			alert(err instanceof Error ? err.message : 'حدث خطأ في إرسال الرد');
		} finally {
			setSendingReply(false);
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<div className="text-center">
					<div className="w-16 h-16 border-4 border-pro border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
					<p className="text-slate-600">جاري تحميل بيانات التذكرة...</p>
				</div>
			</div>
		);
	}

	if (error || !ticket) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<div className="text-center">
					<div className="text-red-500 text-4xl mb-4">✗</div>
					<p className="text-slate-600 mb-4">{error || 'لم يتم العثور على التذكرة'}</p>
					<button 
						onClick={() => router.back()}
						className="px-4 py-2 bg-pro text-white rounded-lg hover:bg-pro/90 transition-colors"
					>
						العودة
					</button>
				</div>
			</div>
		);
	}

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
						{/* معلومات المرسل */}
						<div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-slate-50 rounded-xl'>
							<div className='flex items-center gap-3'>
								<FaUser className='text-pro' size={16} />
								<span className='text-sm text-slate-600'>{ticket.full_name}</span>
							</div>
							<div className='flex items-center gap-3'>
								<FaEnvelope className='text-pro' size={16} />
								<span className='text-sm text-slate-600'>{ticket.email}</span>
							</div>
							<div className='flex items-center gap-3'>
								<FaPhone className='text-pro' size={16} />
								<span className='text-sm text-slate-600'>{ticket.phone}</span>
							</div>
							<div className='flex items-center gap-3'>
								<FaMapMarkerAlt className='text-pro' size={16} />
								<span className='text-sm text-slate-600'>{ticket.address}</span>
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
							
							{replies.length === 0 ? (
								<p className='text-center text-slate-500 py-8 bg-slate-50 rounded-xl'>
									لا توجد ردود حتى الآن
								</p>
							) : (
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
							)}
						</div>

						{/* إضافة رد جديد - يظهر فقط إذا كانت التذكرة مفتوحة */}
						{ticket.status !== 'closed' && (
							<div className='mt-6 border-t border-slate-200 pt-6'>
								<div className='flex gap-3'>
									<input
										type='text'
										value={newReply}
										onChange={(e) => setNewReply(e.target.value)}
										placeholder='اكتب ردك هنا...'
										className='flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-pro transition-colors'
										onKeyPress={(e) => e.key === 'Enter' && !sendingReply && handleSendReply()}
										disabled={sendingReply}
									/>
									<button
										onClick={handleSendReply}
										disabled={!newReply.trim() || sendingReply}
										className='px-6 py-3 bg-pro text-white rounded-xl hover:bg-pro/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
									>
										{sendingReply ? (
											<>
												<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
												جاري الإرسال...
											</>
										) : (
											<>
												<FaPaperPlane size={16} />
												إرسال
											</>
										)}
									</button>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}