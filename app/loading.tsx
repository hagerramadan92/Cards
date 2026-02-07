"use client";

export default function Loading() {
	return (
		<div className="!mt-8 !mb-8 animate-in fade-in duration-200">
			<div className="flex flex-col gap-8">
				{/* Hero skeleton */}
				<div className="relative rounded-3xl overflow-hidden border border-gray-100 bg-white shadow-sm">
					<div className="w-full h-[200px] md:h-[420px] bg-gray-100 animate-pulse" />
				</div>
				{/* Categories strip skeleton */}
				<div className="container py-4">
					<div className="flex gap-4 overflow-hidden">
						{Array.from({ length: 8 }).map((_, i) => (
							<div key={i} className="flex-shrink-0 w-14 h-14 md:w-[92px] md:h-[92px] rounded-full bg-gray-100 animate-pulse" />
						))}
					</div>
				</div>
				{/* Section skeletons */}
				<div className="container flex flex-col gap-10 mt-8">
					{[1, 2].map((i) => (
						<div key={i} className="rounded-3xl border border-gray-100 overflow-hidden bg-gray-50/50">
							<div className="h-[120px] md:h-[160px] bg-gray-200 animate-pulse" />
							<div className="p-4 md:p-6 flex gap-4">
								{Array.from({ length: 4 }).map((_, j) => (
									<div key={j} className="flex-1 h-[180px] md:h-[220px] rounded-2xl bg-gray-100 animate-pulse" />
								))}
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
