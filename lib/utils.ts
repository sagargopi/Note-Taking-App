import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export function isOTPExpired(otpExpires: Date | null): boolean {
  if (!otpExpires) return true
  return new Date() > otpExpires
}

export function formatDate(date: Date | string | null | undefined): string {
  // Handle null/undefined or invalid date
  if (!date || (date instanceof Date && isNaN(date.getTime()))) {
    return 'N/A';
  }
  
  // Convert string dates to Date objects
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Check if the date is valid after conversion
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }
  
  try {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    }).format(dateObj);
  } catch (error) {
    console.error("Error formatting date:", error);
    return 'Date Error';
  }
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + "..."
}

export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function validateName(name: string): boolean {
  // Check if name is at least 2 characters long and contains only letters, spaces, and hyphens
  const re = /^[a-zA-Z\s-']{2,50}$/;
  return re.test(name.trim());
}
