import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  debug: process.env.NODE_ENV === "development",
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
    // signIn: "/login",
    error: "/login",
  },

  callbacks: {
    async jwt({ token, account, profile }) {
      if (account?.provider === "google") {
        token.provider = account.provider;
        token.provider_id = account.providerAccountId;

        const payload = {
          provider: "google",
          provider_id: String(account.providerAccountId),
          email: (token.email as string) || (profile as any)?.email || "",
          name: (token.name as string) || (profile as any)?.name || "User",
        };

        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL;
          
          const res = await fetch(`${apiUrl}/auth/social-login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify(payload),
            cache: "no-store",
          });

          if (res.ok) {
            const data = await res.json();
            if (data?.status && data?.data?.token) {
              (token as any).apiToken = data.data.token;
              (token as any).apiUser = data.data.user;
            }
          }
        } catch (e: any) {
          console.error("API Call Error:", e.message);
        }
      }
      return token;
    },

    async session({ session, token }) {
      (session.user as any).provider = (token as any).provider;
      (session.user as any).provider_id = (token as any).provider_id;
      (session as any).apiToken = (token as any).apiToken ?? null;
      (session as any).apiUser = (token as any).apiUser ?? null;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };