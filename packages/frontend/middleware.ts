import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Auth is handled client-side by Privy in each protected page.
// This middleware just passes all requests through.
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
