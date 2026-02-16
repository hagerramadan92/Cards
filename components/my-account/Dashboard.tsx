'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { 
	FaChessQueen, 
	FaGift, 
	FaTicketAlt, 
	FaStar, 
	FaCrown, 
	FaTrophy, 
	FaCoins, 
	FaAward,
	FaTimes,
	FaCheck,
	FaLock
} from 'react-icons/fa';
import { MdKeyboardArrowLeft } from "react-icons/md";
import type { IconType } from 'react-icons';
import { FaWallet, FaCreditCard, FaList } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { GoStarFill } from 'react-icons/go';

interface DashboardItem {
	icon: IconType;
	label: string;
	href: string;
}

// تعريف واجهة بيانات المحفظة
interface WalletData {
  wallet_id: number;
  balance: string;
  currency: string;
  daily_limit: string;
  total_deposits_today: string;
}

const DASHBOARD_ITEMS: DashboardItem[] = [
	// { icon: FaChessQueen, label: ' لاكي كود  ', href: '/myAccount/lucky-code' },
	// { icon: FaGift, label: ' تصفح المكافآت ', href: '/myAccount/rewards' },
	{ icon: FaTicketAlt, label: ' دعم العملاء ', href: '/myAccount/support' },
	// { icon: FaStar, label: ' مكافآتي ', href: '/myAccount/my-rewards' },
	// { icon: FaCrown, label: ' سحوباتي ', href: '/myAccount/draws' },
	// { icon: FaTrophy, label: ' سجل النقاط  ', href: '/myAccount/points-log' },
	// { icon: FaCoins, label: ' أسعار خاصة ', href: '/myAccount/special-prices' },
	// { icon: FaAward, label: ' الشروط والأحكام ', href: '/myAccount/terms' },
];

function DashboardItemCard({ item }: { item: DashboardItem }) {
	const Icon = item.icon;
	
	return (
		<Link 
			href={item.href} 
			className='bg-white rounded-xl border border-slate-200 p-3 md:p-4 flex flex-col items-center justify-center gap-2 shadow-sm hover:shadow-md hover:border-pro transition-all duration-300 group'
		>
		<Icon 
			className='text-pro-max group-hover:scale-110 transition-transform duration-300 w-5 h-5 md:w-6 md:h-6' 
		/>
			<span className='text-xs md:text-sm font-semibold text-slate-700 group-hover:text-pro transition-colors text-center'>
				{item.label}
			</span>
		</Link>
	);
}

interface LevelCard {
	name: string;
	diamond: string;
	starsImage: string;
	bgColor: string;
	textColor: string;
	themeColor: string;
	borderColor: string;
	gradient: string;
	textGradient: string;
	purchaseAmount?: string;
	features: string[];
	isCurrent?: boolean;
	isLocked?: boolean;
}

const LEVELS: LevelCard[] = [
	{
		name: ' الأزرق',
		diamond: '/images/diamond.svg',
		starsImage: '/images/blue-stars.png',
		bgColor: 'bg-blue-50',
		textColor: 'text-white',
		themeColor: 'text-blue-600',
		borderColor: 'border-blue-300',
		gradient: 'linear-gradient(180deg, #345195 0%, #12234B 100%)',
		textGradient: '-webkit-linear-gradient(rgb(52, 81, 149), rgb(18, 35, 75))',
		features: [
			'1 لاكي كود مع كل عملية شراء بقيمة 100 ر.س أو أكثر',
			'الدعم الفني القياسي'
		],
		isLocked: true,
	},
	{
		name: ' الفضي',
		diamond: '/images/silver-diamond.svg',
		starsImage: '/images/grey-stars.png',
		bgColor: 'bg-slate-100',
		textColor: 'text-white',
		themeColor: 'text-slate-600',
		borderColor: 'border-slate-300',
		gradient: 'linear-gradient(180deg, #A5A5A5 0%, #525252 100%)',
		textGradient: '-webkit-linear-gradient(rgb(230, 230, 230), rgb(131, 131, 131))',
		purchaseAmount: '25,000',
		features: [
			'3 لاكي كود لكل عملية شراء تزيد عن 1,289 EGP',
			'احصل على 1 لاكي كود أسبوعياً',
			'5% نقاط إضافية',
			'أسعار خاصة على 3 منتجات شهرياً',
			'الدعم الفني القياسي'
		],
		isLocked: true,
	},
	{
		name: ' الذهبي',
		diamond: '/images/gold-star.png',
		starsImage: '/images/gold-stars.png',
		bgColor: 'bg-yellow-50',
		textColor: 'text-white',
		themeColor: 'text-yellow-600',
		borderColor: 'border-yellow-300',
		gradient: 'linear-gradient(180deg, #E2C16D 0%, #A57D30 100%)',
		textGradient: '-webkit-linear-gradient(rgb(241, 221, 112), rgb(197, 148, 45))',
		purchaseAmount: '128,000',
		features: [
			'5 لاكي كود لكل عملية شراء تزيد عن 1,289 EGP',
			'احصل على 1 لاكي كود يومياً',
			'10% نقاط إضافية',
			'أسعار خاصة على 5 منتجات شهرياً',
			'دعم العملاء المميز'
		],
		isLocked: true,
	},
	{
		name: ' التيتانيوم',
		diamond: '/images/red-diamonds.png',
		starsImage: '/images/red-stars.png',
		bgColor: 'bg-red-50',
		textColor: 'text-white',
		themeColor: 'text-red-600',
		borderColor: 'border-red-300',
		gradient: 'linear-gradient(180deg, #B12B2A 0%, #6F0A0A 100%)',
		textGradient: '-webkit-linear-gradient(rgb(228, 116, 115), rgb(111, 10, 10))',
		purchaseAmount: '322,000',
		features: [
			'7 لاكي كود لكل عملية شراء تزيد عن 1,289 EGP',
			'احصل على 2 لاكي كود يومياً',
			'15% نقاط إضافية',
			'أسعار خاصة على 10 منتجات شهرياً',
			'دعم العملاء ذو الأولوية'
		],
		isLocked: true,
	},
	{
		name: ' الماسي',
		diamond: '/images/black-diamonds.svg',
		starsImage: '/images/black-stars.png',
		bgColor: 'bg-slate-900',
		textColor: 'text-white',
		themeColor: 'text-slate-900',
		borderColor: 'border-slate-700',
		gradient: 'linear-gradient(180deg, rgb(64, 66, 78) 0%, rgb(18, 20, 31) 100%)',
		textGradient: '-webkit-linear-gradient(rgb(179, 179, 179), rgb(42, 42, 42))',
		purchaseAmount: '644,500',
		features: [
			'10 لاكي كود لكل عملية شراء تزيد عن 1,289 EGP',
			'احصل على 3 لاكي كود يومياً',
			'20% نقاط إضافية',
			'أسعار خاصة على 20 منتج شهرياً',
			'دعم خاص عبر الواتساب لعملاء النخبة',
			'إدارة خاصة للحساب المميز',
			'قسيمة لايك كارد مجانية',
			'فرصة للفوز بجهاز iPhone كل شهر'
		],
		isLocked: true,
	},
];

function LevelModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
	return (
		<AnimatePresence>
			{isOpen && (
				<>
					{/* Backdrop */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={onClose}
						className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
					/>
					{/* Modal */}
					<div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
						<motion.div
							initial={{ opacity: 0, scale: 0.95, y: 20 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.95, y: 20 }}
							className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-4xl w-full overflow-y-auto"
							style={{ height: '70dvh', marginTop: '10%' }}
							onClick={(e) => e.stopPropagation()}
						>
							{/* Header */}
							<div className="sticky top-0 bg-white border-b border-slate-200 px-3 sm:px-6 py-3 sm:py-4 z-20">
								<div className="flex items-start justify-between gap-2 sm:gap-4">
									<div className="flex-1">
										<h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 mb-1 sm:mb-2">افتح مكافآتك</h2>
										<p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
											اكسب نقاطًا مع كل عملية شراء واستمتع بمكافآت رائعة! ارتقِ عبر المستويات واحتفظ بجميع مزاياك. ابدأ الاستكشاف الآن
										</p>
									</div>
									<button
										onClick={onClose}
										className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors flex-shrink-0"
									>
										<FaTimes className="text-slate-600" size={14} />
									</button>
								</div>
							</div>

							{/* Content */}
							<div className="p-3 sm:p-4 md:p-6">
								<div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
									{LEVELS.map((level, index) => (
										<div key={index} className="flex flex-col items-center flex-shrink-0 mx-2">
											{/* Current Badge */}
											{level.isCurrent && (
												<div className="bg-pro text-white text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl rounded-br-none rounded-bl-none flex items-center gap-1 sm:gap-1.5">
													<FaCheck size={10} className="sm:w-3 sm:h-3" />
													<span>المستوى الحالي</span>
												</div>
											)}

											{/* Locked Badge */}
											{level.isLocked && (
												<div 
													className="text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl rounded-br-none rounded-bl-none flex items-center gap-1 sm:gap-1.5"
													style={{
														color: 'rgb(103, 103, 103)',
														backgroundColor: 'rgb(229, 229, 229)',
													}}
												>
													<FaLock size={10} className="sm:w-3 sm:h-3" />
													<span>مقفل</span>
												</div>
											)}

											{/* Card */}
											<div
												style={{ background: level.gradient }}
												className="rounded-xl p-3 sm:p-4 md:p-5 relative overflow-hidden w-[200px] sm:w-[220px] md:w-[240px] min-h-[350px] sm:min-h-[380px] md:min-h-[400px]"
											>
												{/* Stars Image */}
												<div className="absolute top-0 start-0 w-full z-0">
													<Image
														src={level.starsImage}
														alt={`${level.name} stars`}
														width={240}
														height={100}
														className="w-full h-auto"
													/>
												</div>

											{/* Diamond Icon and Level Name in one row */}
											<div className="bg-white w-fit rounded-full px-1.5 sm:px-2 py-0.5 flex items-center relative z-20 mb-2 sm:mb-3 md:mb-4">
												<Image
													src={level.diamond}
													alt={level.name}
													width={24}
													height={24}
													className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6"
												/>
												<h3 
													className="text-xs sm:text-sm md:text-lg font-bold"
													style={{
														background: level.textGradient,
														WebkitBackgroundClip: 'text',
														WebkitTextFillColor: 'transparent',
														backgroundClip: 'text',
													}}
												>
													{level.name}
												</h3>
											</div>

											{/* Level Message */}
											{level.isCurrent && (
												<div className={`text-start my-1 sm:my-2 ${level.textColor}`}>
													<p className="text-[10px] sm:text-xs leading-relaxed">
														ابدأ بالمستوى الأزرق بعد أول عملية شراء
													</p>
													<div className="w-full h-px bg-white/20 mt-2 sm:mt-3"></div>
												</div>
											)}
											{level.purchaseAmount && (
												<div className={`text-start my-1 sm:my-2 ${level.textColor}`}>
													<p className="text-[10px] sm:text-xs leading-relaxed">
														انتقل للمستوى{level.name} لما بتتعدى مشترياتك قيمة {level.purchaseAmount} EGP
													</p>
													<div className="w-full h-px bg-white/20 mt-2 sm:mt-3"></div>
												</div>
											)}

											{/* Features */}
											<div className="space-y-2 sm:space-y-3 ps-0 ms-0">
												{level.features.map((feature, idx) => (
													<div key={idx} className={`flex gap-1 sm:gap-1.5 ${level.textColor} text-[10px] sm:text-xs text-start`}>
													  <div className='w-fit h-fit bg-white border border-white rounded-full p-0.5 flex-shrink-0'>
													  <GoStarFill  className={`w-2 h-2 sm:w-2.5 sm:h-2.5 flex-shrink-0 ${level.themeColor}`} />
													  </div>
														<span className="leading-relaxed">{feature}</span>
													</div>
												))}
											</div>
											</div>
										</div>
									))}
								</div>
							</div>
						</motion.div>
					</div>
				</>
			)}
		</AnimatePresence>
	);
}

// مكون قسم المالية
function FinanceSection() {
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWalletData() {
      try {
        setLoading(true);
        const token = localStorage.getItem('auth_token');
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/user/wallet`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
			'accept-language': `${navigator.language || 'en-US'}`,
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch wallet data');
        }

        const result = await response.json();
        
        if (result.status) {
          setWalletData(result.data);
        } else {
          console.error('API Error:', result.message);
        }
      } catch (error) {
        console.error('Error fetching wallet:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchWalletData();
  }, []);

  const balance = walletData?.balance || "0.00";
  const currency = walletData?.currency || "ج.م";

  return (
    <div className="mt-4 md:mt-6 space-y-4">
      {/* Wallet Balance Card */}
      <div className='bg-white rounded-xl pb-3 border border-slate-200 shadow-sm overflow-hidden'>
        <div className='px-4 py-3 md:px-5 md:py-4 border-b border-slate-100'>
          <div className='flex items-center justify-between mb-3 md:mb-4'>
            <h2 className='text-sm md:text-base font-semibold text-slate-500'>رصيد لايك كارد</h2>
            <Link 
              href="/myAccount/finance/transactions"
              className='text-xs md:text-sm font-medium text-pro-max hover:text-pro-max transition-colors flex items-center gap-1.5'
            >
              عرض المعاملات
              <MdKeyboardArrowLeft size={18} className='hidden sm:block'/>
            </Link>
          </div>
          
          {loading ? (
            <div className="flex items-baseline gap-2">
              <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-8 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ) : (
            <>
              <div className='flex items-baseline gap-2'>
                <p className='text-2xl md:text-3xl font-bold text-slate-900'>{balance}</p>
                <p className='text-xs md:text-sm text-slate-500 font-medium'>{currency}</p>
              </div>
              
              {walletData && (
                <div className='mt-3 text-xs text-slate-500'>
                  <div className='flex justify-between'>
                    <span>الحد اليومي:</span>
                    <span className='font-medium'>{walletData.daily_limit} {currency}</span>
                  </div>
                  <div className='flex justify-between mt-1'>
                    <span>المودوع اليوم:</span>
                    <span className='font-medium'>{walletData.total_deposits_today} {currency}</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Finance Actions */}
        <div 
          className='grid grid-cols-3 gap-px bg-slate-100'
          style={{ backgroundColor: 'rgb(255, 250, 246)' }}
        >
          <Link 
            href="/myAccount/finance/categories"
            className='p-2 flex flex-col items-center gap-2 md:gap-3 bg-white hover:bg-slate-50 transition-all duration-200 group'
          >
            <div className='w-6 h-6 md:w-7 md:h-7 rounded-xl bg-orange-50 flex items-center justify-center group-hover:bg-orange-100 transition-colors'>
              <FaList className='text-pro-max w-3 h-3 md:w-4 md:h-4' />
            </div>
            <span className='text-xs md:text-sm font-semibold text-pro-max group-hover:text-pro-max transition-colors'>القسائم</span>
          </Link>

          <Link 
            href="/myAccount/finance/charge"
            className='p-2 flex flex-col items-center gap-2 md:gap-3 bg-white hover:bg-slate-50 transition-all duration-200 group'
          >
            <div className='w-6 h-6 md:w-7 md:h-7 rounded-xl bg-orange-50 flex items-center justify-center group-hover:bg-orange-100 transition-colors'>
              <FaWallet className='text-pro-max w-3 h-3 md:w-4 md:h-4' />
            </div>
            <span className='text-xs md:text-sm font-semibold text-pro-max group-hover:text-pro-max transition-colors'>تعبئة الرصيد</span>
          </Link>

          <Link 
            href="/myAccount/finance/pay"
            className='p-2 flex flex-col items-center gap-2 md:gap-3 bg-white hover:bg-slate-50 transition-all duration-200 group'
          >
            <div className='w-6 h-6 md:w-7 md:h-7 rounded-xl bg-orange-50 flex items-center justify-center group-hover:bg-orange-100 transition-colors'>
              <FaCreditCard className='text-pro-max w-3 h-3 md:w-4 md:h-4' />
            </div>
            <span className='text-xs md:text-sm font-semibold text-pro-max group-hover:text-pro-max transition-colors'>رابط الدفع</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
	const [showLevelModal, setShowLevelModal] = useState(false);

	return (
		<div className=" md:mt-0 mt-5">
			<div className='bg-white border border-slate-200 rounded-xl shadow-sm'>
			<h1 className='text-lg md:text-3xl text-pro font-semibold mb-3 md:mb-4 ps-3 md:ps-4 pt-3 md:pt-4'>
				لوحة التحكم الخاصة بي
			</h1>

			{/* Points Card */}
			<div className='relative gradient-blue-background text-white rounded-lg flex flex-col gap-2 py-3 md:py-4 mx-3 md:mx-4 mb-3 md:mb-4'>
				<div className='flex items-end gap-0.5 px-3 md:px-6'>
					<h1 className='text-xl md:text-3xl font-bold'>0</h1>
					<span className='text-xs md:text-base'>نقاط</span>
				</div>

				<div className='flex items-center px-3 md:px-6 gap-2'>
					<div className='flex items-center gap-0.5 mt-1 md:mt-2 bg-white rounded-full px-1 py-0.5 w-fit'>
						<Image
							src='/images/diamond.svg'
							alt='blue-points'
							width={16}
							height={16}
							className='w-[14px] h-[14px] md:w-[18px] md:h-[18px]'
						/>
						<p className='text-[10px] md:text-xs text-pro font-bold me-1'>الأزرق</p>
					</div>
					<button
						onClick={() => setShowLevelModal(true)}
						className='flex items-center gap-0 mt-1 md:mt-2 rounded-full px-1 py-0.5 w-fit hover:opacity-80 transition-opacity cursor-pointer'
					>
						<p className='text-[10px] md:text-sm'>تعرف على المميزات</p>
						<MdKeyboardArrowLeft className='w-4 h-4 md:w-6 md:h-6' />
					</button>
				</div>

				{/* Level Progress Bar */}
				<div className='flex items-center gap-0.5 px-3 md:px-4 mt-1'>
					<Image
						src='/images/diamond.svg'
						alt='blue-diamond'
						width={16}
						height={14}
						className='w-[14px] h-[12px] md:w-[18px] md:h-[16px]'
					/>
					<div className='bg-[#0000001c] w-full h-[3px] md:h-[4px]'></div>
					<Image
						src='/images/silver-diamond.svg'
						alt='silver-diamond'
						width={16}
						height={18}
						className='w-[14px] h-[16px] md:w-[18px] md:h-[21px]'
					/>
				</div>

				{/* Buy and Level Up */}
				<div className='flex items-center gap-0.5 px-3 md:px-6 mt-1'>
					<p className='text-[10px] md:text-sm opacity-50 me-1 line-clamp-1'>
						اشتري بقيمة 25793 ج.م لترتقي لـ
					</p>
					<button
						onClick={() => setShowLevelModal(true)}
						className='flex items-center md:gap-0.5 hover:opacity-80 transition-opacity cursor-pointer flex-shrink-0'
					>
						<p className='text-[10px] md:text-sm font-bold whitespace-nowrap'>المستوى الفضي</p>
						<MdKeyboardArrowLeft size={18} className='hidden sm:block'/>
					</button>
				</div>

				{/* Decorative Diamond */}
				<div className='absolute top-[-15px] end-[15px] md:top-[-28px] md:end-[28px]'>
					<Image 
						src="/images/blue-diamond.svg" 
						alt="level-up" 
						width={80} 
						height={70}
						className='w-[60px] h-[55px] md:w-[115px] md:h-[105px]' 
					/>
				</div>
			</div>
			</div>

			{/* Dashboard Items Grid */}
			<div className='grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mt-4 md:mt-6'>
				{DASHBOARD_ITEMS.map((item, index) => (
					<DashboardItemCard key={index} item={item} />
				))}
			</div>

			{/* Finance Section */}
			<FinanceSection />

			{/* Level Modal */}
			<LevelModal isOpen={showLevelModal} onClose={() => setShowLevelModal(false)} />
		</div>
	);
}