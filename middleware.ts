import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const adminToken = request.cookies.get('admin_token')?.value

  // Protect the dashboard route
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (adminToken !== 'authenticated') {
      return NextResponse.redirect(new URL('/adminlogin', request.url))
    }
  }

  return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: '/dashboard/:path*',
}
