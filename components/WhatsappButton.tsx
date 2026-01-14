"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { AiOutlineClose } from "react-icons/ai";
import { FiSend } from "react-icons/fi";
import { createPortal } from "react-dom";

interface Message {
	id: number;
	text: string;
	isBot: boolean;
	timestamp: Date;
}

interface Question {
	id: string;
	question: string;
	answer: string;
}

const questions: Question[] = [
	{
		id: "1",
		question: "ما هي طرق الدفع المتاحة؟",
		answer: "نحن نقبل جميع طرق الدفع: الدفع عند الاستلام، البطاقات الائتمانية (فيزا، ماستركارد)، والتحويل البنكي. كما يمكنك الدفع عبر PayPal.",
	},
	{
		id: "2",
		question: "كم مدة التوصيل؟",
		answer: "مدة التوصيل تتراوح بين 3-7 أيام عمل حسب المنطقة. للطلبات السريعة، نقدم خدمة التوصيل السريع خلال 24 ساعة داخل المدينة.",
	},
	{
		id: "3",
		question: "هل يمكن إرجاع المنتج؟",
		answer: "نعم، يمكنك إرجاع المنتج خلال 14 يوم من تاريخ الاستلام بشرط أن يكون بحالته الأصلية وبدون استخدام. سنقوم بإرجاع المبلغ خلال 5-7 أيام عمل.",
	},
	{
		id: "4",
		question: "كيف أتتبع طلبي؟",
		answer: "يمكنك تتبع طلبك من خلال حسابك في الموقع، أو سنرسل لك رقم التتبع عبر البريد الإلكتروني والرسائل النصية عند شحن الطلب.",
	},
	{
		id: "5",
		question: "هل تقدمون خصومات؟",
		answer: "نعم، نقدم خصومات وعروض خاصة بشكل دوري. يمكنك متابعة صفحتنا على وسائل التواصل الاجتماعي للحصول على آخر العروض، أو الاشتراك في النشرة الإخبارية.",
	},
];

export default function FloatingChatButton() {
	const pathname = usePathname();
	const [isOpen, setIsOpen] = useState(false);
	const [messages, setMessages] = useState<Message[]>([
		{
			id: 0,
			text: "مرحباً! 👋 كيف يمكنني مساعدتك اليوم؟",
			isBot: true,
			timestamp: new Date(),
		},
	]);
	const [mounted, setMounted] = useState(false);
	const [inputMessage, setInputMessage] = useState("");
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const isProductPage = useMemo(() => {
		return /^\/product\/[^\/]+$/.test(pathname || "") || /^\/products\/[^\/]+$/.test(pathname || "");
	}, [pathname]);

	useEffect(() => setMounted(true), []);

	useEffect(() => {
		if (isOpen && mounted) {
			const prev = document.body.style.overflow;
			document.body.style.overflow = "hidden";
			return () => {
				document.body.style.overflow = prev;
			};
		}
	}, [isOpen, mounted]);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	const handleQuestionClick = (question: Question) => {
		// Add user question
		const userMessage: Message = {
			id: Date.now(),
			text: question.question,
			isBot: false,
			timestamp: new Date(),
		};

		setMessages((prev) => [...prev, userMessage]);

		// Add bot answer after a short delay
		setTimeout(() => {
			const botMessage: Message = {
				id: Date.now() + 1,
				text: question.answer,
				isBot: true,
				timestamp: new Date(),
			};
			setMessages((prev) => [...prev, botMessage]);
		}, 500);
	};

	const handleSendMessage = () => {
		if (!inputMessage.trim()) return;

		// Add user message
		const userMessage: Message = {
			id: Date.now(),
			text: inputMessage.trim(),
			isBot: false,
			timestamp: new Date(),
		};

		setMessages((prev) => [...prev, userMessage]);
		setInputMessage("");

		// Simulate bot response after a short delay
		setTimeout(() => {
			const botMessage: Message = {
				id: Date.now() + 1,
				text: "شكراً لك على رسالتك! سأقوم بالرد عليك قريباً. في الوقت الحالي، يمكنك اختيار أحد الأسئلة الشائعة أدناه أو التواصل معنا عبر الواتساب.",
				isBot: true,
				timestamp: new Date(),
			};
			setMessages((prev) => [...prev, botMessage]);
		}, 800);
	};

	const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSendMessage();
		}
	};


	if (!mounted) return null;

	const chatWindow = isOpen && mounted && createPortal(
		<AnimatePresence>
			{isOpen && (
				<>
					{/* Backdrop */}
					<motion.div
						className="fixed inset-0 z-[9998] bg-black/50"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={() => setIsOpen(false)}
					/>

					{/* Chat Window */}
					<motion.div
						className="fixed bottom-4 right-4 sm:bottom-20 sm:right-5 z-[9999] w-[320px] h-[500px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-6rem)] sm:w-[380px] sm:h-[600px] bg-white rounded-xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
						initial={{ opacity: 0, y: 20, scale: 0.95 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: 20, scale: 0.95 }}
						transition={{ type: "spring", stiffness: 300, damping: 30 }}
						dir="rtl"
					>
						{/* Header */}
						<div className="bg-pro text-white px-2.5 sm:px-4 py-2 sm:py-3 flex items-center justify-between">
							<div className="flex items-center gap-1.5 sm:gap-3">
								<div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
									<Image src="/images/chat.png" alt="chat" width={24} height={24} className="w-4 h-4 sm:w-6 sm:h-6" />
								</div>
								<div className="min-w-0">
									<h3 className="font-bold text-[11px] sm:text-sm truncate">مركز المساعدة</h3>
									<p className="text-[10px] sm:text-xs text-white/80 truncate">نحن هنا للمساعدة</p>
								</div>
							</div>
							<button
								onClick={() => setIsOpen(false)}
								className="w-6 h-6 sm:w-8 sm:h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition flex-shrink-0"
								aria-label="Close"
							>
								<AiOutlineClose size={14} className="sm:w-[18px] sm:h-[18px]" />
							</button>
						</div>

						{/* Messages */}
						<div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-2 sm:space-y-4 bg-gray-50">
							{messages.map((message) => (
								<div
									key={message.id}
									className={`flex ${message.isBot ? "justify-start" : "justify-end"}`}
								>
									<div
										className={`max-w-[80%] sm:max-w-[75%] rounded-xl sm:rounded-2xl px-2.5 py-1.5 sm:px-4 sm:py-2 ${
											message.isBot
												? "bg-white text-gray-800 rounded-tl-sm"
												: "bg-pro text-white rounded-tr-sm"
										}`}
									>
										<p className="text-[11px] sm:text-sm leading-relaxed break-words">{message.text}</p>
										<p
											className={`text-[9px] sm:text-xs mt-0.5 sm:mt-1 ${
												message.isBot ? "text-gray-400" : "text-white/70"
											}`}
										>
											{message.timestamp.toLocaleTimeString("ar", {
												hour: "2-digit",
												minute: "2-digit",
											})}
										</p>
									</div>
								</div>
							))}
							<div ref={messagesEndRef} />
						</div>

						{/* Input Area */}
						<div className="p-2 sm:p-3 bg-white border-t border-gray-200">
							<div className="flex items-center gap-2">
								<input
									ref={inputRef}
									type="text"
									value={inputMessage}
									onChange={(e) => setInputMessage(e.target.value)}
									onKeyPress={handleKeyPress}
									placeholder="اكتب رسالتك هنا..."
									className="flex-1 px-3 py-2 text-[12px] sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pro focus:border-transparent"
									dir="rtl"
								/>
								<button
									onClick={handleSendMessage}
									disabled={!inputMessage.trim()}
									className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-pro text-white rounded-lg hover:bg-pro/90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex-shrink-0"
									aria-label="إرسال"
								>
									<FiSend size={16} className="sm:w-5 sm:h-5" />
								</button>
							</div>
						</div>

						{/* Questions */}
						<div className="p-2 sm:p-3 bg-white border-t border-gray-200">
							<p className="text-[10px] sm:text-xs text-gray-500 mb-1.5 sm:mb-2">أسئلة شائعة:</p>
							<div className="space-y-1 sm:space-y-2 max-h-[60px] sm:max-h-[80px] overflow-y-auto">
								{questions.map((q) => (
									<button
										key={q.id}
										onClick={() => handleQuestionClick(q)}
										className="w-full text-right text-[11px] sm:text-sm text-pro hover:bg-gray-100 px-2 sm:px-3 py-1 sm:py-2 rounded-md sm:rounded-lg transition text-start"
									>
										{q.question}
									</button>
								))}
							</div>
						</div>

					</motion.div>
				</>
			)}
		</AnimatePresence>,
		document.body
	);

	return (
		<>
			{/* Chat Button */}
			<motion.button
				onClick={() => setIsOpen(true)}
				aria-label="فتح المحادثة"
				initial={{ opacity: 0, scale: 0.6, y: 40 }}
				animate={{ opacity: 1, scale: 1, y: 0 }}
				transition={{ type: "spring", stiffness: 260, damping: 20 }}
				whileHover={{ scale: 1.1 }}
				whileTap={{ scale: 0.95 }}
				className={[
					"fixed right-4 sm:right-5 z-[9997] w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-xl hover:shadow-2xl",
					"bottom-[15px] sm:bottom-5",
					isProductPage ? "max-sm:bottom-[15px] !right-3" : "",
				].join(" ")}
			>
				<Image
					src="/images/chat.png"
					alt="chat"
					width={24}
					height={24}
					className="w-12 h-12 sm:w-14 sm:h-14"
				/>
			</motion.button>

			{chatWindow}
		</>
	);
}
