import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Routes that employees are allowed to access (read-only view of most pages)
const EMPLOYEE_ALLOWED_PREFIXES = [
  '/pos',
  '/employee',
  '/receipt',
  '/sales',
  '/inventory',
  '/contacts',
  '/reports',
  '/expenses',
];

// Routes that require ADMIN role (destructive/config operations)
const ADMIN_ONLY_PREFIXES = [
  '/settings',
  '/inventory/add',
  '/inventory/price-update',
];

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    const role = token.role;

    // Admin has full access
    if (role === 'ADMIN') {
      return NextResponse.next();
    }

    // Employee access restrictions
    if (role === 'EMPLOYEE') {
      // Block admin-only routes
      const isAdminOnly = ADMIN_ONLY_PREFIXES.some(prefix => path.startsWith(prefix));
      if (isAdminOnly) {
        return NextResponse.redirect(new URL('/employee', req.url));
      }

      // Allow whitelisted routes
      const isAllowed = path === '/' || EMPLOYEE_ALLOWED_PREFIXES.some(prefix => path.startsWith(prefix));
      if (!isAllowed) {
        return NextResponse.redirect(new URL('/employee', req.url));
      }
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
    '/((?!api/auth|_next/static|_next/image|favicon.ico|login).*)',
  ],
};
