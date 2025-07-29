import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { connectDB } from "@/lib/mongodb"
import User from "@/models/User"

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json()

    if (!email || !otp) {
      return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 })
    }

    await connectDB()

    // Find user with matching email and OTP
    const user = await User.findOne({
      email: email.toLowerCase(),
      otp: otp.toString(),
      otpExpires: { $gt: new Date() },
    })

    if (!user) {
      return NextResponse.json({ error: "Invalid or expired OTP. Please try again." }, { status: 400 })
    }

    // Verify user and clear OTP
    user.isVerified = true
    user.otp = undefined
    user.otpExpires = undefined
    await user.save()

    // Generate JWT token
    const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET!, { expiresIn: "7d" })

    // Return user data and token
    const userData = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      avatar: user.avatar,
      isVerified: user.isVerified,
      authProvider: user.authProvider,
    }

    const response = NextResponse.json({
      message: "Email verified successfully",
      user: userData,
      token,
    })

    // Set HTTP-only cookie
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })

    return response
  } catch (error) {
    console.error("❌ OTP verification error:", error)
    return NextResponse.json({ error: "Internal server error. Please try again." }, { status: 500 })
  }
}
