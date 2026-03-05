// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions = {
  debug: true,
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      authorization: {
        params: {
          scope: "openid email profile",
          prompt: "consent select_account",
        },
      },
    }),
  ],

  pages: {
    signIn: "/login",
    error: "/login",
  },

  callbacks: {
    async jwt({ token, account, profile }: any) {
      // أول مرة بس (وقت الرجوع من جوجل)
      if (account?.provider === "google") {
        token.provider = account.provider;
        token.provider_id = account.providerAccountId;

        // بيانات من جوجل
        const payload = {
          provider: "google",
          provider_id: String(account.providerAccountId),
          email: token.email || profile?.email || "",
          name: token.name || profile?.name || "User",
        };

        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/social-login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify(payload),
            // مهم: no-store عشان مايمسكش كاش في سيرفر نكست
            cache: "no-store",
          });

          const data = await res.json();

          if (res.ok && data?.status && data?.data?.token) {
            token.apiToken = data.data.token; // ✅ توكن الـ API بتاعك
            token.apiUser = data.data.user;   // ✅ يوزر الـ API بتاعك
          } else {
            // خليه واضح في اللوجز
            token.apiToken = null;
            token.apiUser = null;
            token.apiError = data?.message || "social-login failed";
          }
        } catch (e: any) {
          token.apiToken = null;
          token.apiUser = null;
          token.apiError = e?.message || "social-login error";
        }
      }

      return token;
    },

    async session({ session, token }: any) {
      // Session من NextAuth + نزود عليها توكن الـ API
      session.user = {
        ...session.user,
        provider: token.provider,
        provider_id: token.provider_id,
      };

      session.apiToken = token.apiToken ?? null;
      session.apiUser = token.apiUser ?? null;
      session.apiError = token.apiError ?? null;

      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };