import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      const isOnUpload = nextUrl.pathname.startsWith("/upload");
      const isOnProfile = nextUrl.pathname.startsWith("/profile");
      const isOnStudyPacks = nextUrl.pathname.startsWith("/study-packs");
      const isProtected = isOnDashboard || isOnUpload || isOnProfile || isOnStudyPacks;

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
