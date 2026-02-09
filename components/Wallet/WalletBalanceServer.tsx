
import React from 'react'

async function getWalletData(): Promise<any> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/wallet`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        'Accept-Language': `${navigator.language || 'en-US'}`
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error('Failed to fetch wallet data');
      return null;
    }

    const data = await response.json();
    return data.status ? data.data : null;
  } catch (error) {
    console.error('Error fetching wallet:', error);
    return null;
  }
}

export default async function WalletBalanceServer() {
  const walletData = await getWalletData();
  const balance = walletData?.balance || "0.00";
  const currency = walletData?.currency || "ج.م";

  return (
    <div className='mt-6 md:mt-8 bg-white rounded-xl pb-3 border border-slate-200 shadow-sm overflow-hidden'>
      <div className='px-4 py-3 md:px-5 md:py-4 border-b border-slate-100'>
        <div className='flex items-center justify-between mb-3 md:mb-4'>
          <h2 className='text-sm md:text-base font-semibold text-slate-500'>رصيد لايك كارد</h2>
        </div>
        
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
      </div>
    </div>
  );
}