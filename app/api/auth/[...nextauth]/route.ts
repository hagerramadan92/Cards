import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

if (!process.env.GOOGLE_CLIENT_ID) {
  console.error("GOOGLE_CLIENT_ID is not set in environment variables");
}
if (!process.env.GOOGLE_CLIENT_SECRET) {
  console.error("GOOGLE_CLIENT_SECRET is not set in environment variables");
}
if (!process.env.NEXTAUTH_SECRET) {
  console.error("NEXTAUTH_SECRET is not set in environment variables");
}

// 👈 تعريف authOptions هنا
export const authOptions = {
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
      
      checks: ["none"],
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  debug: true,
  callbacks: {
    async jwt({ token, account }: { token: any; account: any }) {
      if (account) {
        token.provider = account.provider;
        token.provider_id = account.providerAccountId;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      session.user = {
        name: token.name,
        email: token.email,
        image: token.picture ?? token.image ?? null,
        provider: token.provider as string,
        provider_id: token.provider_id,
      };
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };