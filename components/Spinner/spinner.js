// components/Spinner.jsx
export default function Spinner({ size = "md" }) {
	const sizeClasses = {
		sm: "w-4 h-4",
		md: "w-6 h-6",
		lg: "w-8 h-8",
		xl: "w-12 h-12"
	};

	return (
		<div className=" max-w-7xl mx-auto flex items-center justify-center ">
		<div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]}`}></div>

		</div>
	);
}