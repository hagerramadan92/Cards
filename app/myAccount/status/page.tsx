"use client";

import { useAuth } from "@/src/context/AuthContext";
import { useEffect, useState } from "react";
import { useLanguage } from "@/src/context/LanguageContext";

export default function StatusPage() {
	const { authToken } = useAuth();
	const { t, language } = useLanguage();
	const [status, setStatus] = useState<any>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchStatus = async () => {
			if (!authToken) {
				setLoading(false);
				return;
			}

			try {
				const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile`, {
					headers: { 
						Authorization: `Bearer ${authToken}`,
						"Accept-Language": language,
						Accept: "application/json"
					},
					cache: "no-store",
				});

				const data = await res.json();
				if (data?.status) {
					setStatus(data.data);
				}
			} catch (error) {
				console.error("Error fetching status:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchStatus();
	}, [authToken, language]);

	// دالة للحصول على نص الحالة المترجم
	const getStatusText = (status: string) => {
		switch(status?.toLowerCase()) {
			case 'active':
				return t('status.active');
			case 'inactive':
				return t('status.inactive');
			case 'pending':
				return t('status.pending');
			case 'approved':
				return t('status.approved');
			case 'rejected':
				return t('status.rejected');
			case 'suspended':
				return t('status.suspended');
			default:
				return status || t('common.active');
		}
	};

	return (
		<div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 md:mt-0 mt-5">
			<h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-6">{t('status.title')}</h1>
			
			{loading ? (
				<div className="text-center py-12">
					<div className="inline-block w-8 h-8 border-4 border-pro border-t-transparent rounded-full animate-spin"></div>
					<p className="mt-4 text-slate-600">{t('common.loading')}</p>
				</div>
			) : status ? (
				<div className="space-y-4">
					<div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
						<p className="text-sm text-slate-600 mb-1">{t('profile.status')}</p>
						<p className="text-lg font-bold text-slate-900">
							{getStatusText(status.status)}
						</p>
					</div>
					
					{status.email && (
						<div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
							<p className="text-sm text-slate-600 mb-1">{t('profile.email')}</p>
							<p className="text-lg font-semibold text-slate-900">{status.email}</p>
						</div>
					)}
					
					{status.name && (
						<div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
							<p className="text-sm text-slate-600 mb-1">{t('profile.name')}</p>
							<p className="text-lg font-semibold text-slate-900">{status.name}</p>
						</div>
					)}
					
					{/* يمكن إضافة المزيد من الحقول حسب الحاجة */}
					{status.phone && (
						<div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
							<p className="text-sm text-slate-600 mb-1">{t('profile.phone')}</p>
							<p className="text-lg font-semibold text-slate-900">{status.phone}</p>
						</div>
					)}
					
					{status.address && (
						<div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
							<p className="text-sm text-slate-600 mb-1">{t('profile.address')}</p>
							<p className="text-lg font-semibold text-slate-900">{status.address}</p>
						</div>
					)}
					
					{status.membership_date && (
						<div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
							<p className="text-sm text-slate-600 mb-1">{t('profile.membership_date')}</p>
							<p className="text-lg font-semibold text-slate-900">{status.membership_date}</p>
						</div>
					)}
					
					{status.last_login && (
						<div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
							<p className="text-sm text-slate-600 mb-1">{t('profile.last_login')}</p>
							<p className="text-lg font-semibold text-slate-900">{status.last_login}</p>
						</div>
					)}
				</div>
			) : (
				<div className="text-center py-12">
					<p className="text-slate-600 text-lg">{t('status.no_info')}</p>
				</div>
			)}
		</div>
	);
}