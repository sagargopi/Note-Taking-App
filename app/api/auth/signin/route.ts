import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import User from "@/models/User"
import { sendOTPEmail } from "@/lib/email"
import { validateEmail, generateOTP } from "@/lib/utils"

export async function POST(request: NextRequest) {
  try {
    // Debug: Log environment variables (remove in production)
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Resend API Key exists:', !!process.env.RESEND_API_KEY);

    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Validate email format
    if (!validateEmail(email)) {
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 })
    }

    await connectDB()

    // Find verified user
    const user = await User.findOne({
      email: email.toLowerCase(),
      isVerified: true,
    })

    if (!user) {
      return NextResponse.json({ error: "No verified account found with this email address" }, { status: 404 })
    }

    // Generate OTP
    const otp = generateOTP()
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Update user with new OTP
    user.otp = otp
    user.otpExpires = otpExpires
    await user.save()

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otp, user.firstName)

    if (!emailResult.success) {
      console.error("Failed to send OTP email:", emailResult.error)
      return NextResponse.json({ error: "Failed to send verification email. Please try again." }, { status: 500 })
    }

    return NextResponse.json({
      message: "OTP sent successfully to your email",
      email: email.toLowerCase(),
    })
  } catch (error) {
    console.error("❌ Signin error:", error)
    return NextResponse.json({ error: "Internal server error. Please try again." }, { status: 500 })
  }
}
