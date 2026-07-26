import type { Metadata } from "next";
import type { ReactNode } from "react";

type CategoryMetadata = {
	id?: number;
	name?: string;
	description?: string;
	children?: CategoryMetadata[];
};

async function getCategory(identifier: string): Promise<CategoryMetadata | null> {
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
			result.data.flatMap((category: CategoryMetadata) => category.children || [])
				.find((category: CategoryMetadata) => category.id === id) ||
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
	params: Promise<{ id: string }>;
}): Promise<Metadata> {
	const { id } = await params;
	const category = await getCategory(id);
	const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://flashicard.renix4tech.com";
	const title = category?.name ? `${category.name} | فلاشي كارد` : "القسم | فلاشي كارد";
	const description =
		plainText(category?.description) ||
		(category?.name ? `تصفح ${category.name} والخدمات المتاحة في فلاشي كارد.` : "تصفح أقسام فلاشي كارد.");

	return {
		title: { absolute: title },
		description,
		alternates: {
			canonical: new URL(`/category/${id}`, siteUrl).toString(),
		},
		openGraph: {
			title,
			description,
			type: "website",
		},
	};
}

export default function CategoryLayout({ children }: { children: ReactNode }) {
	return children;
}
