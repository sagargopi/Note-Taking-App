"use client"

import { useState, useEffect } from "react"
import { SignUpForm } from "@/components/auth/signup-form"
import { SignInForm } from "@/components/auth/signin-form"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export default function Home() {
  const [mode, setMode] = useState<"signin" | "signup">("signin")
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Check for OAuth errors
    const urlParams = new URLSearchParams(window.location.search)
    const error = urlParams.get('error')
    
    if (error) {
      // Handle OAuth errors
      toast({
        title: "Authentication Error",
        description: "There was an issue with Google authentication. Please try again.",
        variant: "destructive",
      })
      // Clean up URL
      window.history.replaceState({}, document.title, "/")
      setIsLoading(false)
      return
    }
    
    // Check if user is already logged in
    const token = localStorage.getItem("token")
    const user = localStorage.getItem("user")

    if (token && user) {
      router.push("/dashboard")
    } else {
      setIsLoading(false)
    }
  }, [router, toast])

  const toggleMode = () => {
    setMode(mode === "signin" ? "signup" : "signin")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Column - Form */}
      <div className="w-full lg:w-2/3 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {mode === "signin" ? (
            <SignInForm onToggleMode={toggleMode} />
          ) : (
            <SignUpForm onToggleMode={toggleMode} />
          )}
        </div>
      </div>

      {/* Right Column - Background Image */}
      <div className="hidden lg:block lg:w-1/3 relative">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/images/images.PNG')`
          }}
        />
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
      </div>
    </div>
  )
}
