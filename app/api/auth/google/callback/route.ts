import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { connectDB } from "@/lib/mongodb"
import User from "@/models/User"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")

    if (!code) {
      return NextResponse.redirect(new URL("/?error=auth_failed", request.url))
    }

    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code,
        grant_type: "authorization_code",
        redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
      }),
    })

    const tokens = await tokenResponse.json()

    if (!tokens.access_token) {
      return NextResponse.redirect(new URL("/?error=auth_failed", request.url))
    }

    // Get user info from Google
    const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    })

    const googleUser = await userResponse.json()

    await connectDB()

    // Find or create user
    let user = await User.findOne({ email: googleUser.email })

    if (!user) {
      user = new User({
        firstName: googleUser.given_name || googleUser.name?.split(" ")[0] || "User",
        lastName: googleUser.family_name || googleUser.name?.split(" ").slice(1).join(" ") || "",
        email: googleUser.email,
        googleId: googleUser.id,
        avatar: googleUser.picture,
        isVerified: true,
        authProvider: "google",
      })
      await user.save()
    } else {
      // Update existing user
      user.googleId = googleUser.id
      user.avatar = googleUser.picture
      user.isVerified = true
      user.authProvider = "google"
      await user.save()
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET!, { expiresIn: "7d" })

    // Redirect to dashboard with token
    const dashboardURL = new URL("/dashboard", request.url)
    const response = NextResponse.redirect(dashboardURL)

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })

    return response
  } catch (error) {
    console.error("❌ Google auth callback error:", error)
    return NextResponse.redirect(new URL("/?error=auth_failed", request.url))
  }
}
