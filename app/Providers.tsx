// app/Providers.tsx
"use client";

import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "@/src/context/AuthContext";
import { CartProvider } from "@/src/context/CartContext";
import { LanguageProvider } from "@/src/context/LanguageContext";
import { SearchHistoryProvider } from "@/src/context/SearchHistoryContext"; // ✅ جديد
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            gcTime: 10 * 60 * 1000,
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            refetchOnReconnect: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <SessionProvider basePath="/api/auth">
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <AuthProvider>
            <CartProvider>
              <SearchHistoryProvider> 
                {children}
              </SearchHistoryProvider>
            </CartProvider>
          </AuthProvider>
        </LanguageProvider>
       
      </QueryClientProvider>
    </SessionProvider>
  );
}