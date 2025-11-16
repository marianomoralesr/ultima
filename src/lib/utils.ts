import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility function for merging Tailwind CSS classes with proper precedence
 * This is the standard shadcn/ui cn() function
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
