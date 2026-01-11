import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

const fastBuyItems = [
    { name: 'فلاش سيل', image: '/images/flash.svg' },
    { name: 'New Year 2026', image: '/images/2026.svg' },
    { name: 'جديد لايك كارد', image: '/images/1140.svg' },
    { name: 'متاجر التطبيقات', image: '/images/app.svg' },
    { name: 'بطاقات الألعاب', image: '/images/play.svg' },
    { name: 'تسوق', image: '/images/shopping.svg' },
    { name: 'بطاقات الشحن', image: '/images/creadit.svg' },
    { name: 'خدمات', image: '/images/service.svg' },
    { name: 'موسيقي', image: '/images/music.svg' },
    { name: 'فديو', image: '/images/video.svg' },
    { name: 'لايك كارد', image: '/images/like.svg' },
    { name: 'السفر و التجارب', image: '/images/travel.svg' },
]

export default function FastBuy() {
    return (
        <>
            <div className='p-3  fast_buy absolute z-[9999] 
             md:top-[28rem] lg:top-[33rem] xl:top-[34rem] max-w-[1400px] w-10/12 mx-auto '>
                <div className='flex items-center gap-1'>
                    <h1 className='lg:text-2xl text-xl font-bold text-pro-max mb-2'>الشراء السريع</h1>
                    <Image src="/images/tap.svg" alt="fast-buy" width={50} height={50} className='w-[32px] h-[32px]' />
                </div>
                <div id="all_cate" className="flex overflow-x-auto gap-2 scrollbar-light">
                    {fastBuyItems.map((item, index) => (
                        <div key={index}>
                            <Link href="#" className='fast-buy-item py-0'>
                                <Image src={item.image} alt={item.name} width={50} height={50} className='w-[24px] h-[24px]' />
                                <p className='text-sm font-bold text-dark-gray'>{item.name}</p>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </>
    )
}
