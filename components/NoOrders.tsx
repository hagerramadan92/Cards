'use client'
import ButtonComponent from "./ButtonComponent";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/src/context/LanguageContext";

interface TitleProps {
	title: string
}
export default function NoOrders({ title }: TitleProps) {
	const { t } = useLanguage();
	const router = useRouter();
	return (
		<>
			<div className="py-5">
				<p className="text-center text-gray-900 font-semibold mt-5 text-2xl">
					{title}
				</p>
				<div className="w-36 mx-auto mt-5">
					<ButtonComponent
						className="text-nowrap"
						title={t('continue_shopping')}
						onClick={() => router.push("/")}
					/>
				</div>
			</div>
		</>
	)
}
