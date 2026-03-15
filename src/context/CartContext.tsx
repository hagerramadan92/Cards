"use client";

import {
	createContext,
	useContext,
	useState,
	useEffect,
	ReactNode,
	useCallback,
	useRef,
} from "react";
import toast from "react-hot-toast";
import { useAuth } from "./AuthContext";
import { useLanguage } from "./LanguageContext";

interface AddToCartPayload {
	product_id: number;
	quantity?: number;
}

interface CartItem {
	cart_item_id: number;
	product: any;
	quantity: number;
}

interface CartContextType {
	cart: CartItem[];
	cartCount: number;
	subtotal: number;
	total: number;
	loading: boolean;
	apiSubtotal?: number;
	apiTotal?: number;
	apiItemsCount?: number;
	
	addToCart: (
		productId: number,
		options?: Partial<Omit<AddToCartPayload, "product_id">>
	) => Promise<boolean>;

	removeFromCart: (cartItemId: number) => Promise<void>;
	updateQuantity: (cartItemId: number, quantity: number) => Promise<void>;
	updateCartItem: (cartItemId: number, updates: any) => Promise<boolean>;
	clearCart: () => Promise<void>;
	refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
	const [cart, setCart] = useState<CartItem[]>([]);
	const [loading, setLoading] = useState(true);
	const { authToken: token } = useAuth();
	const { language, t } = useLanguage();
	const API_URL = process.env.NEXT_PUBLIC_API_URL;

	const [apiSubtotal, setApiSubtotal] = useState<number>(0);
	const [apiTotal, setApiTotal] = useState<number>(0);
	const [apiItemsCount, setApiItemsCount] = useState<number>(0);

	// ✅ Ref لمنع الـ concurrent calls - مع قيمة افتراضية
	const isRefreshing = useRef<boolean>(false);
	const lastRefreshTime = useRef<number>(0);
	const refreshTimeout = useRef<NodeJS.Timeout | undefined>(undefined);

	const parseSelectedOptions = (selectedOptionsStr: string): any[] => {
		if (!selectedOptionsStr) return [];
		try {
			const parsed = JSON.parse(selectedOptionsStr);
			if (Array.isArray(parsed)) {
				return parsed;
			}
			return [];
		} catch (error) {
			console.error("Error parsing selected_options:", error);
			return [];
		}
	};

	const fetchCart = async (skipLoading = false) => {
		if (!token) {
			setCart([]);
			setApiSubtotal(0);
			setApiTotal(0);
			setApiItemsCount(0);
			setLoading(false);
			return;
		}

		// ✅ منع الـ concurrent calls
		if (isRefreshing.current) {
			console.log("Refresh already in progress, skipping...");
			return;
		}

		try {
			isRefreshing.current = true;
			if (!skipLoading) setLoading(true);
			
			const res = await fetch(`${API_URL}/cart`, {
				headers: {
					Authorization: `Bearer ${token}`,
					Accept: "application/json",
					"Accept-Language": language,
				},
			});

			if (res.status === 401) {
				localStorage.removeItem("auth_token");
				localStorage.removeItem("fullName");
				localStorage.removeItem("userName");
				localStorage.removeItem("userEmail");
				setCart([]);
				setApiSubtotal(0);
				setApiTotal(0);
				setApiItemsCount(0);
				return;
			}

			const data = await res.json();

			if (res.ok && data.status && data.data?.items) {
				const items = data.data.items.map((item: any) => ({
					cart_item_id: item.id,
					product: item.product,
					quantity: item.quantity,
				}));
				
				setCart(items);
				setApiSubtotal(parseFloat(data.data.subtotal || "0"));
				setApiTotal(parseFloat(data.data.total || "0"));
				setApiItemsCount(data.data.items_count || 0);
				
			} else {
				setCart([]);
				setApiSubtotal(0);
				setApiTotal(0);
				setApiItemsCount(0);
			}
		} catch (err) {
			console.error("Failed to fetch cart:", err);
			toast.error(t("fetch_cart_error"));
			setCart([]);
			setApiSubtotal(0);
			setApiTotal(0);
			setApiItemsCount(0);
		} finally {
			isRefreshing.current = false;
			if (!skipLoading) setLoading(false);
			lastRefreshTime.current = Date.now();
		}
	};

	// ✅ Throttled refresh - متعملش refresh أكتر من مرة كل 2 ثانية
	const refreshCart = useCallback(async () => {
		// لو في refresh already scheduled، نلغيه
		if (refreshTimeout.current) {
			clearTimeout(refreshTimeout.current);
			refreshTimeout.current = undefined;
		}

		// لو آخر refresh كان من أقل من 2 ثانية، نأجله
		const timeSinceLastRefresh = Date.now() - lastRefreshTime.current;
		if (timeSinceLastRefresh < 2000) {
			refreshTimeout.current = setTimeout(() => {
				fetchCart(true);
				refreshTimeout.current = undefined;
			}, 2000 - timeSinceLastRefresh);
			return;
		}

		// Otherwise, refresh immediately
		await fetchCart(true);
	}, [token, language]);

	const fetchCartItemOptions = useCallback(async (cartItemId: number) => {
		if (!token) return null;

		try {
			const res = await fetch(`${API_URL}/cart`, {
				headers: {
					Authorization: `Bearer ${token}`,
					Accept: "application/json",
					"Accept-Language": language,
				},
			});

			const data = await res.json();

			if (res.ok && data.status && data.data?.items) {
				const cartItem = data.data.items.find((item: any) => item.id === cartItemId);
				if (cartItem) {
					const selectedOptions = parseSelectedOptions(cartItem.selected_options);

					return {
						selected_options: selectedOptions,
						size: cartItem.size,
						color: cartItem.color,
						material: cartItem.material,
						size_id: cartItem.size_id,
						color_id: cartItem.color_id,
						material_id: cartItem.material_id,
					};
				}
			}
			return null;
		} catch (err) {
			console.error("Failed to fetch cart item options:", err);
			return null;
		}
	}, [token, API_URL, language]);

	const loadItemOptions = useCallback(async (cartItemId: number) => {
		if (!token) return;

		try {
			const options = await fetchCartItemOptions(cartItemId);
			if (options) {
				setCart(prevCart =>
					prevCart.map(item =>
						item.cart_item_id === cartItemId
							? {
								...item,
								selected_options: options.selected_options || [],
								size: options.size || null,
								color: options.color || null,
								material: options.material || null,
								size_id: options.size_id || null,
								color_id: options.color_id || null,
								material_id: options.material_id || null,
							}
							: item
					)
				);
			}
		} catch (err) {
			console.error("Failed to load item options:", err);
		}
	}, [token, fetchCartItemOptions]);

	const updateLocalQuantity = (cartItemId: number, quantity: number) => {
		setCart((prevCart) =>
			prevCart.map((item) =>
				item.cart_item_id === cartItemId
					? { ...item, quantity }
					: item
			)
		);
	};

	const addToCart = async (
		productId: number,
		options: Partial<Omit<AddToCartPayload, "product_id">> = {}
	): Promise<boolean> => {
		if (!token) {
			toast.error(t("login_required"));
			return false;
		}

		if (!productId || productId <= 0) {
			toast.error(t("invalid_product_id"));
			return false;
		}

		const payload: AddToCartPayload = {
			product_id: productId,
			quantity: 1,
		};

		try {
			const res = await fetch(`${API_URL}/cart/add`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
					"Accept-Language": language,
				},
				body: JSON.stringify(payload),
			});

			const data = await res.json();

			if (res.ok && data.status) {
				toast.success(t("add_to_cart_success"));
				await refreshCart();
				return true;
			} else {
				toast.error(data.message || t("add_to_cart_error"));
				return false;
			}
		} catch (err) {
			console.error("Add to cart error:", err);
			toast.error(t("send_error"));
			return false;
		}
	};

	const removeFromCart = async (cartItemId: number) => {
		if (!token) return;

		setCart((prevCart) =>
			prevCart.filter((item) => item.cart_item_id !== cartItemId)
		);

		try {
			await fetch(`${API_URL}/cart/items/${cartItemId}`, {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${token}`,
					Accept: "application/json",
					"Accept-Language": language,
				},
			});
			await refreshCart();
			toast.success(t("remove_from_cart_success"));
		} catch (err) {
			await refreshCart();
			toast.error(t("remove_from_cart_error"));
		}
	};

	const updateQuantity = async (cartItemId: number, quantity: number) => {
		if (!token || quantity < 1) return;

		if (quantity > 10) {
			toast.error(t("max_quantity_reached", { qty: 10 }), { duration: 4000 });
			return;
		}

		updateLocalQuantity(cartItemId, quantity);

		try {
			const response = await fetch(`${API_URL}/cart/items/${cartItemId}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
					Accept: "application/json",
					"Accept-Language": language,
				},
				body: JSON.stringify({ quantity }),
			});

			const data = await response.json();

			if (!response.ok || !data.status) {
				await refreshCart();
				toast.error(t("update_quantity_error"));
			} else {
				await refreshCart();
				toast.success(t("update_quantity_success", { quantity }));
			}
		} catch (err) {
			await refreshCart();
			toast.error("فشل تحديث الكمية");
		}
	};

	const updateCartItem = async (
		cartItemId: number,
		updates: any
	): Promise<boolean> => {
		if (!token) return false;

		try {
			const response = await fetch(`${API_URL}/cart/items/${cartItemId}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
					Accept: "application/json",
					"Accept-Language": language,
				},
				body: JSON.stringify(updates),
			});

			const data = await response.json();

			if (response.ok && data.status) {
				await loadItemOptions(cartItemId);
				await refreshCart();
				return true;
			} else {
				await refreshCart();
				toast.error(data.message || t("update_item_error"));
				return false;
			}
		} catch (err) {
			await refreshCart();
			toast.error(t("send_error"));
			return false;
		}
	};

	const clearCart = async () => {
		if (!token || cart.length === 0) return;

		setCart([]);

		try {
			await fetch(`${API_URL}/cart/clear`, {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${token}`,
					Accept: "application/json",
					"Accept-Language": language,
				},
			});
			await refreshCart();
			toast.success(t("clear_cart_success"));
		} catch (err) {
			await refreshCart();
			toast.error(t("clear_cart_error"));
		}
	};

	useEffect(() => {
		fetchCart();

		const handleLanguageChange = (e: any) => {
			if (e.detail?.language) {
				fetchCart();
			}
		};

		if (typeof window !== "undefined") {
			window.addEventListener("languageChanged", handleLanguageChange as any);
			return () => {
				window.removeEventListener("languageChanged", handleLanguageChange as any);
				if (refreshTimeout.current) {
					clearTimeout(refreshTimeout.current);
				}
			};
		}
	}, [token, language]);

	const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
	const subtotal = apiSubtotal;
	const total = apiTotal;

	const validateStickerForm = (fields: any) => {
		if (!fields) return false;
		if (!fields.size || !fields.color || !fields.material) return false;
		if (fields.selectedFeatures) {
			for (const key in fields.selectedFeatures) {
				const value = fields.selectedFeatures[key];
				if (!value || value.trim() === "") return false;
			}
		}
		return true;
	};

	return (
		<CartContext.Provider
			value={{
				cart,
				cartCount,
				subtotal,
				total,
				loading,
				apiSubtotal,
				apiTotal,
				apiItemsCount,
				addToCart,
				removeFromCart,
				updateQuantity,
				updateCartItem,
				clearCart,
				refreshCart,
			}}
		>
			{children}
		</CartContext.Provider>
	);
};

export const useCart = () => {
	const context = useContext(CartContext);
	if (!context) throw new Error("useCart must be used within CartProvider");
	return context;
};