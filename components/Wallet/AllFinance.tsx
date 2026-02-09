'use client';
import React from 'react'
import WalletBalanceServer from './WalletBalanceServer'
import Finance from './Finance'


// هذا مكون Server Component يمكن أن يستخدم async
export default async function AllFinance() {
  // يمكنك إضافة جلب بيانات إضافية هنا إذا احتجت
  
  return (
    <div className="space-y-4">
      {/* Wallet Balance - Server Component يجلب البيانات */}
      <WalletBalanceServer />
      
      {/* Finance Actions - Client Component للتفاعل */}
      <Finance />
    </div>
  )
}