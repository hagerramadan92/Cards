"use client"
import { CategoryI } from '@/Types/CategoriesI';
import Image from 'next/image'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { useLanguage } from '@/src/context/LanguageContext';

interface Product {
    id: number;
    name: string;
    slug: string;
    image: string;
}

interface SubCategory {
    id: number;
    name: string;
    slug: string;
    image: string;
    sub_image: string;
    products: Product[];
}
interface CategoriesSliderProps {
	categories: CategoryI[];
	title?: string;
	subtitle?: string;
	inSlide?: any;
}
export default function FastBuy({
	categories,
	inSlide,
	title,
	subtitle,
}: CategoriesSliderProps) {
    const { t } = useLanguage();
    // const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
    // const [loading, setLoading] = useState(true);

    // useEffect(() => {
    //     const fetchCategories = async () => {
    //         try {
    //             const apiURL = process.env.NEXT_PUBLIC_API_URL;
    //             const lang = typeof window !== 'undefined' ? localStorage.getItem("language") || "ar" : "ar";
                
    //             const response = await fetch(`https://flash-cardy.renix4tech.com/api/v1/home?categories_limit=15`, {
    //                 headers: {
    //                     "Accept": "application/json",
    //                     "Accept-Language": lang
    //                 }
    //             });
                
    //             if (!response.ok) throw new Error("Failed to fetch data");
                
    //             const json = await response.json();
             
                
    //             if (json.status && json.data?.sub_categories) {
    //                 setSubCategories(json.data.sub_categories);
    //                 console.log("SubCategories (FastBuy):", json.data.sub_categories); 
    //             }
    //         } catch (error) {
    //             console.error("Error fetching fast buy data:", error);
    //         } finally {
    //             setLoading(false);
    //         }
    //     };

    //     fetchCategories();
    // }, []);

    // if (loading) {
    //     return (
    //         <div className='p-3 fast_buy absolute z-[9999] 
    //          md:top-[28rem] lg:top-[33rem] xl:top-[34rem] xl:left-[15%] xl:right-[15%] lg:left-[10%] lg:right-[10%] md:left-[7%] md:right-[7%]'>
    //              <div className="flex animate-pulse gap-2 overflow-hidden">
    //                  {[1,2,3,4,5,6,7,8].map(i => (
    //                      <div key={i} className="flex-shrink-0 w-32 h-10 bg-gray-100 rounded-full"></div>
    //                  ))}
    //              </div>
    //         </div>
    //     );
    // }

    // if (!subCategories.length) return null;

    return (
        <>
            <div className='p-3 fast_buy absolute z-[9999] 
             md:top-[36rem] lg:top-[42rem] xl:top-[40rem] xl:left-[15%] xl:right-[15%] lg:left-[10%] lg:right-[10%] md:left-[7%] md:right-[7%] '>
                <div className='flex items-center gap-1'>
                    <h1 className='lg:text-2xl text-xl font-bold text-pro-max mb-2'>{t('fast_buy')}</h1>
                    <Image src="/images/tap.svg" alt="fast-buy" width={50} height={50} className='w-[32px] h-[32px]' />
                </div>
                {/* Ensure flex-nowrap and overflow-x-auto for proper X scrolling */}
                <div id="all_cate" className="flex flex-nowrap overflow-x-auto gap-2 scrollbar-light w-full">
                    {categories.map((item) => (
                        <div key={item.id} className="flex-shrink-0">
                            <Link href={`/category/${item.id}`} className='fast-buy-item py-0 whitespace-nowrap'>
                                <Image 
                                    src={item.image || "/images/placeholder.png"} 
                                    alt={item.name} 
                                    width={50} 
                                    height={50} 
                                    className='w-[24px] h-[24px] object-contain' 
                                />
                                <p className='text-sm font-bold text-dark-gray'>{item.name}</p>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </>
    )
}




