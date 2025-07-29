"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Star, Eye, EyeOff } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface SignInFormProps {
  onToggleMode: () => void
}

export function SignInForm({ onToggleMode }: SignInFormProps) {
  const [step, setStep] = useState<"email" | "otp">("email")
  const [formData, setFormData] = useState({
    email: "jonas_kahnwald@gmail.com",
    otp: "",
    keepLoggedIn: false,
  })
  const [showOtp, setShowOtp] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const router = useRouter()
  const { toast } = useToast()

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.email.trim()) {
      setErrors({ email: "Email is required" })
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setErrors({ email: "Please enter a valid email address" })
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      })

      const data = await response.json()

      if (response.ok) {
        setStep("otp")
        toast({
          title: "OTP Sent",
          description: "Please check your email for the verification code",
        })
      } else {
        setErrors({ email: data.error || "Failed to send OTP" })
      }
    } catch (error) {
      setErrors({ email: "Network error. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.otp.trim()) {
      setErrors({ otp: "Please enter the OTP" })
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          otp: formData.otp,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem("token", data.token)
        localStorage.setItem("user", JSON.stringify(data.user))
        toast({
          title: "Welcome Back",
          description: "You have successfully signed in",
        })
        router.push("/dashboard")
      } else {
        setErrors({ otp: data.error || "Invalid OTP" })
      }
    } catch (error) {
      setErrors({ otp: "Network error. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = () => {
    setIsGoogleLoading(true)
    
    // Show immediate feedback
    toast({
      title: "Connecting to Google",
      description: "Please wait while we redirect you to Google...",
    })
    
    // Add a timeout to prevent infinite loading
    setTimeout(() => {
      if (isGoogleLoading) {
        setIsGoogleLoading(false)
        toast({
          title: "Connection Timeout",
          description: "Google is taking too long. Please try again.",
          variant: "destructive",
        })
      }
    }, 15000) // 15 second timeout
    
    // Redirect to Google OAuth
    window.location.href = "/api/auth/google"
  }

  return (
    <div className="space-y-8">
      {/* Logo */}
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
          <Star className="w-5 h-5 text-white fill-white" />
        </div>
        <span className="text-xl font-bold text-gray-900">HD</span>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Sign In</h1>
        <p className="text-gray-600">Please login to continue to your account.</p>
      </div>

      {step === "email" ? (
        <form onSubmit={handleSendOTP} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-blue-600">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-gray-900"
              placeholder="jonas_kahnwald@gmail.com"
              required
            />
            {errors.email && <div className="text-red-500 text-sm">{errors.email}</div>}
          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg"
            disabled={isLoading}
          >
            {isLoading ? "Sending..." : "Send OTP"}
          </Button>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-12 border-gray-300 text-gray-700 hover:bg-gray-50 bg-white"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
          >
            {isGoogleLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-3"></div>
                Connecting to Google...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </>
            )}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleSignIn} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="otp" className="text-sm font-medium text-gray-600">
              OTP
            </Label>
            <div className="relative">
              <Input
                id="otp"
                type={showOtp ? "text" : "password"}
                value={formData.otp}
                onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
                className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-gray-900 pr-12"
                placeholder="Enter 6-digit code"
                maxLength={6}
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                onClick={() => setShowOtp(!showOtp)}
              >
                {showOtp ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.otp && <div className="text-red-500 text-sm">{errors.otp}</div>}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="keepLoggedIn"
              checked={formData.keepLoggedIn}
              onCheckedChange={(checked) => setFormData({ ...formData, keepLoggedIn: checked as boolean })}
              className="border-gray-300"
            />
            <Label htmlFor="keepLoggedIn" className="text-sm text-gray-600">
              Keep me logged in
            </Label>
          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full text-blue-600 hover:text-blue-700"
            onClick={() => setStep("email")}
          >
            Back to Email
          </Button>
        </form>
      )}

      <div className="text-center pt-4">
        <span className="text-sm text-gray-500">Need an account? </span>
        <button type="button" onClick={onToggleMode} className="text-sm text-blue-600 hover:text-blue-700 font-medium underline">
          Create one
        </button>
      </div>
    </div>
  )
}
