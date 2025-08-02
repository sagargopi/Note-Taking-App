import { type NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

interface JWTPayload {
  userId: string;
  email: string;
}

export async function GET(request: NextRequest) {
  try {
    // Extract token from cookie or Authorization header
    const token =
      request.cookies.get("token")?.value ||
      request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized access: No token provided" }, { status: 401 });
    }

    // Safely verify token
    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    } catch (err) {
      console.error("❌ JWT verification error:", err);
      return NextResponse.json({ error: "Unauthorized access: Invalid or expired token" }, { status: 401 });
    }

    // Connect to DB
    await connectDB();

    // Fetch user
    const user = await User.findById(decoded.userId).select("-password -otp -otpExpires");

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Return user details
    return NextResponse.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      isVerified: user.isVerified,
      authProvider: user.authProvider,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error("❌ Get user error:", error);
    return NextResponse.json({ error: "Failed to fetch user data" }, { status: 500 });
  }
}
