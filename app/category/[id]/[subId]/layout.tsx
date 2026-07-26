import type { Metadata } from "next";
import type { ReactNode } from "react";

async function getSubCategory(identifier: string) {
	const apiUrl = process.env.NEXT_PUBLIC_API_URL;
	if (!apiUrl) return null;

	try {
		const response = await fetch(`${apiUrl}/categories`, {
			headers: { "Accept-Language": "ar", Accept: "application/json" },
			next: { revalidate: 300 },
		});
		if (!response.ok) return null;

		const result = await response.json();
		if (!result?.status || !Array.isArray(result.data)) return null;

		const id = Number(identifier);
		return (
			result.data.find((category: { id: number }) => category.id === id) ||
			result.data.flatMap((category: { children?: { id: number }[] }) => category.children || [])
				.find((category: { id: number }) => category.id === id) ||
			null
		);
	} catch {
		return null;
	}
}

function plainText(value?: string) {
	return value?.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ id: string; subId: string }>;
}): Promise<Metadata> {
	const { id, subId } = await params;
	const category = await getSubCategory(subId);
	const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://flashicard.renix4tech.com";
	const title = category?.name ? `${category.name} | فلاشي كارد` : "منتجات القسم | فلاشي كارد";
	const description =
		plainText(category?.description) ||
		(category?.name ? `تسوق منتجات ${category.name} المتاحة في فلاشي كارد.` : "تسوق منتجات فلاشي كارد.");

	return {
		title: { absolute: title },
		description,
		alternates: {
			canonical: new URL(`/category/${id}/${subId}`, siteUrl).toString(),
		},
		openGraph: {
			title,
			description,
			type: "website",
		},
	};
}

export default function SubCategoryLayout({ children }: { children: ReactNode }) {
	return children;
}
