import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import User from "@/models/User"
import { generateTokens } from "@/lib/jwt"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get("code")
    const error = searchParams.get("error")

    if (error) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}?error=google_oauth_failed`)
    }

    if (!code) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}?error=no_code`)
    }

    // Fast token exchange
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: "http://localhost:3000/api/auth/callback/google",
        grant_type: "authorization_code",
      }),
    })

    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}?error=token_exchange_failed`)
    }

    // Fast user info fetch
    const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })

    const userData = await userResponse.json()

    if (!userResponse.ok) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}?error=user_info_failed`)
    }

    // Connect to database
    await connectDB()

    // Fast user lookup
    let user = await User.findOne({ email: userData.email })

    if (!user) {
      // Create new user automatically for Google signups (no OTP needed)
      user = new User({
        name: userData.name,
        email: userData.email,
        googleId: userData.id,
        isVerified: true,
        authProvider: "google",
      })
      await user.save()
    } else {
      // Update existing user with Google info
      user.googleId = userData.id
      user.authProvider = "google"
      user.isVerified = true
      await user.save()
    }

    // Generate tokens and redirect to dashboard
    const { accessToken } = generateTokens({ userId: user._id, email: user.email })

    const redirectUrl = new URL("/dashboard", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000")
    redirectUrl.searchParams.set("token", accessToken)
    redirectUrl.searchParams.set("user", JSON.stringify({
      id: user._id,
      name: user.name,
      email: user.email,
      authProvider: "google",
    }))

    return NextResponse.redirect(redirectUrl.toString())
  } catch (error) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}?error=oauth_callback_failed`)
  }
} 