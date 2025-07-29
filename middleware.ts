import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Add CORS headers for API routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const response = NextResponse.next()

    response.headers.set("Access-Control-Allow-Origin", "*")
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization")

    return response
  }

  // Handle Google OAuth callback with tokens
  if (request.nextUrl.pathname === "/dashboard" && request.nextUrl.searchParams.has("token")) {
    const response = NextResponse.next()

    // Set tokens in localStorage via client-side script
    const token = request.nextUrl.searchParams.get("token")
    const user = request.nextUrl.searchParams.get("user")

    if (token && user) {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Redirecting...</title>
        </head>
        <body>
          <script>
            localStorage.setItem('token', '${token}');
            localStorage.setItem('user', '${user}');
            window.location.href = '/dashboard';
          </script>
        </body>
        </html>
      `

      return new NextResponse(html, {
        headers: { "content-type": "text/html" },
      })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard", "/api/:path*"],
}
