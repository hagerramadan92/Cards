// app/Providers.tsx
"use client";

import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "@/src/context/AuthContext";
import { CartProvider } from "@/src/context/CartContext";
import { SearchHistoryProvider } from "@/src/context/SearchHistoryContext"; 
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { FirebaseAuthProvider } from "../src/context/FirebaseAuthContext";

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
    <SessionProvider refetchInterval={0} refetchOnWindowFocus={false}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider> 
          <FirebaseAuthProvider> 
            <CartProvider>
              <SearchHistoryProvider> 
                {children}
              </SearchHistoryProvider>
            </CartProvider>
          </FirebaseAuthProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}