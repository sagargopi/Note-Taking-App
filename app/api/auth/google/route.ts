import { NextResponse } from "next/server"

export async function GET() {
  // Direct Google OAuth URL with minimal parameters for fastest response
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=http://localhost:3000/api/auth/callback/google&response_type=code&scope=openid email profile&access_type=offline`

  // Immediate redirect without any processing
  return NextResponse.redirect(googleAuthUrl)
}
