"use client";

import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "@/src/context/AuthContext";
import { CartProvider } from "@/src/context/CartContext";
import { LanguageProvider } from "@/src/context/LanguageContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider basePath="/api/auth">
      <LanguageProvider>
        <AuthProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </AuthProvider>
      </LanguageProvider>
    </SessionProvider>
  );
}
