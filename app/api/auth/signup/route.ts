import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import User from "@/models/User"
import { sendOTPEmail } from "@/lib/email"
import { validateEmail, validateName, generateOTP } from "@/lib/utils"

interface SignupData {
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  dateOfBirth?: string;
  googleId?: string;
  isGoogleSignup?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const { name, firstName, lastName, email, dateOfBirth, googleId, isGoogleSignup }: SignupData = await request.json()
    
    // Handle both name formats (single name field or firstName/lastName)
    const fullName = name?.trim() || `${firstName || ''} ${lastName || ''}`.trim();
    const emailAddress = email?.toLowerCase().trim();

    // Validate required fields
    if (!fullName) {
      return NextResponse.json(
        { error: "Name is required" }, 
        { status: 400 }
      )
    }

    if (!emailAddress) {
      return NextResponse.json(
        { error: "Email is required" }, 
        { status: 400 }
      )
    }

    // Validate name
    if (!validateName(fullName)) {
      return NextResponse.json(
        { error: "Name must be 2-50 characters long and contain only letters, spaces, hyphens, and apostrophes" }, 
        { status: 400 }
      )
    }

    // Validate email format
    if (!validateEmail(emailAddress)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" }, 
        { status: 400 }
      )
    }

    await connectDB()

    // Check if user already exists
    const existingUser = await User.findOne({ email: emailAddress })
    if (existingUser && existingUser.isVerified) {
      return NextResponse.json(
        { error: "User already exists with this email" }, 
        { status: 400 }
      )
    }

    // Generate OTP
    const otp = generateOTP()
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    if (existingUser && !existingUser.isVerified) {
      // Update existing unverified user
      existingUser.name = fullName;
      if (googleId) {
        existingUser.googleId = googleId;
        existingUser.authProvider = "google";
      }
      existingUser.otp = otp;
      existingUser.otpExpires = otpExpires;
      await existingUser.save()
    } else {
      // Create new user
      const newUser = new User({
        name: fullName,
        email: emailAddress,
        otp,
        otpExpires,
        isVerified: false,
        authProvider: googleId ? "google" : "email",
        googleId: googleId || undefined,
      })
      await newUser.save()
    }

    // Define the email result type
    type EmailResult = {
      success: boolean;
      messageId?: string;
      error?: string | Error;
    };

    // Send OTP email
    const emailResult = await sendOTPEmail(emailAddress, otp, fullName.split(' ')[0]) as EmailResult;

    if (!emailResult?.success) {
      const errorMessage = emailResult?.error 
        ? `Failed to send verification email: ${emailResult.error}`
        : 'Failed to send verification email. Please try again later.';
      
      console.error("❌ OTP email error:", errorMessage);
      return NextResponse.json(
        { error: "Failed to send verification email. Please try again later." }, 
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully to your email",
      email: emailAddress,
    })
  } catch (error: any) {
    console.error("❌ Signup error:", error)
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { error: errors.join(', ') }, 
        { status: 400 }
      )
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "Email already in use" }, 
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." }, 
      { status: 500 }
    )
  }
}
