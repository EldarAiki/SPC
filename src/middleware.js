import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        if (
            req.nextUrl.pathname === "/admin" &&
            req.nextauth.token?.role !== "MANAGER"
        ) {
            return NextResponse.rewrite(new URL("/dashboard", req.url));
        }
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token,
        },
    }
);

export const config = { matcher: ["/dashboard/:path*", "/admin/:path*"] };
