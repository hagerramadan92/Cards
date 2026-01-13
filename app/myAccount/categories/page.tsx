"use client";

export default function CategoriesPage() {
	return (
		<div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
			<h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-6">قسائمي</h1>
			
			<div className="text-center py-12">
				<p className="text-slate-600 text-lg mb-2">لا توجد قسائم متاحة حالياً</p>
				<p className="text-slate-500 text-sm">سيتم عرض القسائم المتاحة هنا عند توفرها</p>
			</div>
		</div>
	);
}

