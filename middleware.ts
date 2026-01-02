import { NextRequest, NextResponse } from 'next/server'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (!pathname.startsWith('/admin')) return NextResponse.next()
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
