import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

function makeSafeId(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt"
  },
  providers: [
    CredentialsProvider({
      name: "Demo username",
      credentials: {
        username: {
          label: "Username",
          type: "text",
          placeholder: "ashwin"
        }
      },
      async authorize(credentials) {
        const rawName = credentials?.username?.trim();
        if (!rawName || rawName.length < 2) return null;

        const id = makeSafeId(rawName);
        return {
          id,
          name: rawName.slice(0, 32),
          email: `${id}@hot-take.local`
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id ?? session.user.email ?? "guest");
      }
      return session;
    }
  },
  pages: {
    signIn: "/"
  },
  secret: process.env.NEXTAUTH_SECRET
};
