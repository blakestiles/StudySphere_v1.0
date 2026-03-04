import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const protectedPrefixes = [
        "/dashboard", "/upload", "/profile", "/study-packs", "/focus",
        "/calendar", "/analytics", "/practice-essay", "/documents",
        "/knowledge-graph", "/history", "/chat", "/study-plan",
        "/exam-simulator", "/doubt-resolver", "/notebooks", "/goals",
        "/matching-game", "/fill-in-blank", "/audio-study", "/weekly-report",
      ];
      const isProtected = protectedPrefixes.some((p) => nextUrl.pathname.startsWith(p));

      if (isProtected) {
        if (isLoggedIn) return true;
        return false; // Redirect to login
      } else if (isLoggedIn) {
        if (nextUrl.pathname === "/login" || nextUrl.pathname === "/register") {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
      }
      return true;
    },
  },
  providers: [], // Added in auth.ts
};
