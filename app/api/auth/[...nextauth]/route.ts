import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  debug: true,
  secret: process.env.NEXTAUTH_SECRET,

  session: {
    strategy: "jwt", // ✅ مش string
  },

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
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/social-login` ,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
              },
              body: JSON.stringify(payload),
              cache: "no-store",
            }
          );

          const data = await res.json();

          if (res.ok && data?.status && data?.data?.token) {
            (token as any).apiToken = data.data.token;
            (token as any).apiUser = data.data.user;
          } else {
            (token as any).apiToken = null;
            (token as any).apiUser = null;
            (token as any).apiError = data?.message || "social-login failed";
          }
        } catch (e: any) {
          (token as any).apiToken = null;
          (token as any).apiUser = null;
          (token as any).apiError = e?.message || "social-login error";
        }
      }
      return token;
    },

    async session({ session, token }) {
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