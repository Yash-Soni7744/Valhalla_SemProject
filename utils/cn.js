import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * This function helps combine multiple Tailwind CSS classes easily.
 * It's a standard way to handle dynamic styles in modern React apps!
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
