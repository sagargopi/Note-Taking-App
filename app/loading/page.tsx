"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function LoadingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const redirectUrl = searchParams.get("redirect")
    
    if (redirectUrl) {
      // Redirect to Google OAuth after a short delay
      setTimeout(() => {
        window.location.href = decodeURIComponent(redirectUrl)
      }, 1000) // 1 second delay to show loading
    } else {
      // No redirect URL, go back to home
      router.push("/")
    }

    // Auto-redirect back to home if loading takes too long
    const timeout = setTimeout(() => {
      router.push("/?error=oauth_timeout")
    }, 20000) // 20 second timeout

    return () => clearTimeout(timeout)
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Connecting to Google</h2>
        <p className="text-gray-600 mb-4">Please wait while we authenticate with Google...</p>
        <div className="space-y-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mx-auto"></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mx-auto animation-delay-200"></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mx-auto animation-delay-400"></div>
        </div>
        <p className="text-sm text-gray-500 mt-6">
          This may take a few moments depending on your connection
        </p>
      </div>
    </div>
  )
} 