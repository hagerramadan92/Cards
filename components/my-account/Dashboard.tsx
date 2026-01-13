import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import { 
	FaChessQueen, 
	FaGift, 
	FaTicketAlt, 
	FaStar, 
	FaCrown, 
	FaTrophy, 
	FaCoins, 
	FaAward 
} from 'react-icons/fa';
import { MdKeyboardArrowLeft } from "react-icons/md";
import type { IconType } from 'react-icons';
import { FaMoneyBill, FaWallet, FaCreditCard, FaList } from 'react-icons/fa';

interface DashboardItem {
	icon: IconType;
	label: string;
	href: string;
}

const DASHBOARD_ITEMS: DashboardItem[] = [
	{ icon: FaChessQueen, label: ' لاكي كود  ', href: '/myAccount' },
	{ icon: FaGift, label: ' تصفح المكافآت ', href: '/myAccount' },
	{ icon: FaTicketAlt, label: ' دعم العملاء ', href: '/myAccount' },
	{ icon: FaStar, label: ' مكافآتي ', href: '/myAccount' },
	{ icon: FaCrown, label: ' سحوباتي ', href: '/myAccount' },
	{ icon: FaTrophy, label: ' سجل النقاط  ', href: '/myAccount' },
	{ icon: FaCoins, label: ' أسعار خاصة ', href: '/myAccount' },
	{ icon: FaAward, label: ' الشروط والأحكام ', href: '/myAccount' },
];

function DashboardItemCard({ item }: { item: DashboardItem }) {
	const Icon = item.icon;
	
	return (
		<Link 
			href={item.href} 
			className='bg-white rounded-xl border border-slate-200 p-4 flex flex-col items-center justify-center gap-2 shadow-sm hover:shadow-md hover:border-pro transition-all duration-300 group'
		>
		<Icon 
			size={24} 
			className='text-pro-max group-hover:scale-110 transition-transform duration-300' 
		/>
			<span className='text-sm font-semibold text-slate-700 group-hover:text-pro transition-colors'>
				{item.label}
			</span>
		</Link>
	);
}

export default function Dashboard() {
	return (
		<div>
			<h1 className='text-2xl md:text-3xl text-pro font-semibold mb-4'>
				لوحة التحكم الخاصة بي
			</h1>

			{/* Points Card */}
			<div className='relative gradient-blue-background text-white rounded-lg flex flex-col gap-2 py-4'>
				<div className='flex items-end gap-0.5 px-2 md:px-6'>
					<h1 className='text-2xl md:text-3xl font-bold'>0</h1>
					<span>نقاط</span>
				</div>

				<div className='flex items-center px-2 md:px-6 gap-2'>
					<div className='flex items-center gap-0.5 mt-2 bg-white rounded-full px-1 py-0.5 w-fit'>
						<Image
							src='/images/diamond.svg'
							alt='blue-points'
							width={18}
							height={18}
							className='w-[18px] h-[18px]'
						/>
						<p className='text-xs text-pro font-bold me-1'>الأزرق</p>
					</div>
					<div className='flex items-center gap-0 mt-2 rounded-full px-1 py-0.5 w-fit'>
						<p className='text-xs md:text-sm'>تعرف على المميزات</p>
						<MdKeyboardArrowLeft size={26} />
					</div>
				</div>

				{/* Level Progress Bar */}
				<div className='flex items-center gap-0.5 px-2'>
					<Image
						src='/images/diamond.svg'
						alt='blue-diamond'
						width={18}
						height={16}
						className='w-[18px] h-[16px]'
					/>
					<div className='bg-[#0000001c] w-full h-[4px]'></div>
					<Image
						src='/images/silver-diamond.svg'
						alt='silver-diamond'
						width={18}
						height={21}
						className='w-[18px] h-[21px]'
					/>
				</div>

				{/* Buy and Level Up */}
				<div className='flex items-center gap-0.5 px-2 md:px-6'>
					<p className='text-xs md:text-sm opacity-50 me-1'>
						اشتري بقيمة 25793 ج.م و وارتقي لـ
					</p>
					<p className='text-xs md:text-sm font-bold'>المستوى الفضي</p>
					<MdKeyboardArrowLeft size={23} />
				</div>

				{/* Decorative Diamond */}
				<div className='absolute top-[-28px] end-[28px]'>
					<Image 
						src="/images/blue-diamond.svg" 
						alt="level-up" 
						width={115} 
						height={105}
						className='w-[115px] h-[105px]' 
					/>
				</div>
			</div>

			{/* Dashboard Items Grid */}
			<div className='grid grid-cols-2 md:grid-cols-4 gap-4 mt-6'>
				{DASHBOARD_ITEMS.map((item, index) => (
					<DashboardItemCard key={index} item={item} />
				))}
			</div>
			{/* Finance Section */}
			<div className='mt-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden'>
				{/* Header */}
				<div className='p-2'>
					<div className='flex items-center justify-between flex-wrap gap-4 px-2'>
						
						
								<h2 className='text-sm text-gray-500'>رصيد لايك كارد</h2>
						
						<Link 
							href="/myAccount/finance"
							className='text-sm font-semibold text-pro hover:text-pro-max transition-colors flex items-center gap-1'
						>
							عرض المعاملات
							<MdKeyboardArrowLeft size={20} />
						</Link>
					</div>
				</div>

				{/* Current Balance */}
				<div className=''>
					<div className='flex items-center px-4'>
						
						<p className='text-2xl md:text-3xl font-bold text-pro-max'>0.00</p>
						<p className='text-xs text-slate-500 mt-0.5'>ج.م</p>
					</div>
				</div>

				{/* Three Sections */}
				<div 
					className='grid grid-cols-1 md:grid-cols-3 gap-3 p-2 rounded-lg m-2'
					style={{ backgroundColor: 'rgb(255, 250, 246)' }}
				>
					{/* Categories Section */}
					<Link 
						href="/myAccount/finance/categories"
						className='p-4 flex flex-col items-center gap-2 hover:opacity-80 transition-all duration-300 group'
					>
						<FaList className='text-pro-max' size={20} />
						<span className='text-sm font-semibold text-pro-max'>الفئات</span>
					</Link>

					{/* Charge Wallet Section */}
					<Link 
						href="/myAccount/finance/charge"
						className='p-4 flex flex-col items-center gap-2 hover:opacity-80 transition-all duration-300 group'
					>
						<FaWallet className='text-pro-max' size={20} />
						<span className='text-sm font-semibold text-pro-max'>شحن المحفظة</span>
					</Link>

					{/* Pay Section */}
					<Link 
						href="/myAccount/finance/pay"
						className='p-4 flex flex-col items-center gap-2 hover:opacity-80 transition-all duration-300 group'
					>
						<FaCreditCard className='text-pro-max' size={20} />
						<span className='text-sm font-semibold text-pro-max'>الدفع</span>
					</Link>
				</div>
			</div>
		</div>
	);
}