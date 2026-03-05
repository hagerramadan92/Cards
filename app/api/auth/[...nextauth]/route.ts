import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  debug: process.env.NODE_ENV === "development", // شغل الـ debug في التطوير فقط
  secret: process.env.NEXTAUTH_SECRET,

  session: {
    strategy: "jwt",
  },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      authorization: {
        params: {
          scope: "openid email profile",
          prompt: "consent select_account",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],

  pages: {
    signIn: "/login",
    error: "/login",
  },

  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production", // مهم جداً للإنتاج
      },
    },
  },

  callbacks: {
    async jwt({ token, account, profile }) {
      console.log("JWT Callback - Account:", account?.provider);
      
      if (account?.provider === "google") {
        token.provider = account.provider;
        token.provider_id = account.providerAccountId;

        const payload = {
          provider: "google",
          provider_id: String(account.providerAccountId),
          email: (token.email as string) || (profile as any)?.email || "",
          name: (token.name as string) || (profile as any)?.name || "User",
        };

        console.log("Sending to API:", payload);

        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL;
          console.log("API URL:", apiUrl);

          const res = await fetch(`${apiUrl}/auth/social-login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify(payload),
            cache: "no-store",
          });

          console.log("API Response Status:", res.status);

          if (!res.ok) {
            const errorText = await res.text();
            console.error("API Error Response:", errorText);
            token.apiError = `HTTP ${res.status}: ${errorText}`;
          } else {
            const data = await res.json();
            console.log("API Success Response:", data);

            if (data?.status && data?.data?.token) {
              (token as any).apiToken = data.data.token;
              (token as any).apiUser = data.data.user;
            } else {
              token.apiError = data?.message || "social-login failed";
            }
          }
        } catch (e: any) {
          console.error("API Call Error:", e.message);
          (token as any).apiToken = null;
          (token as any).apiUser = null;
          (token as any).apiError = e?.message || "social-login error";
        }
      }
      return token;
    },

    async session({ session, token }) {
      console.log("Session Callback - User:", session.user?.email);
      
      (session.user as any).provider = (token as any).provider;
      (session.user as any).provider_id = (token as any).provider_id;

      (session as any).apiToken = (token as any).apiToken ?? null;
      (session as any).apiUser = (token as any).apiUser ?? null;
      (session as any).apiError = (token as any).apiError ?? null;

      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };