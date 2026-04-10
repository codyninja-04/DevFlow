import NextAuth from "next-auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { authConfig } from "@/auth.config"

const { auth } = NextAuth(authConfig)

const PUBLIC_PATHS = ["/sign-in"]

export const proxy = auth((req: NextRequest & { auth: unknown }) => {
  const { pathname } = req.nextUrl

  if (pathname.startsWith("/api/auth")) return NextResponse.next()

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))
  const session = (req as { auth?: { user?: unknown } }).auth

  if (!session && !isPublic) {
    return NextResponse.redirect(new URL("/sign-in", req.nextUrl))
  }

  if (session && isPublic) {
    return NextResponse.redirect(new URL("/", req.nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
}
