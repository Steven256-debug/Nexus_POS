import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // Role-based Access Rules
    const role = token.role;

    // Admin can access everything
    if (role === 'ADMIN') {
      return NextResponse.next();
    }

    // Employee access restrictions
    if (role === 'EMPLOYEE') {
      // Allow pos, employee, receipt
      if (path.startsWith('/pos') || path.startsWith('/employee') || path.startsWith('/receipt')) {
        return NextResponse.next();
      }
      
      // Redirect everything else to their dashboard
      return NextResponse.redirect(new URL('/employee', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login (login page)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|login).*)',
  ],
};
