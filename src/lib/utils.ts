import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function effectiveDeposit(total: number, method: string, custom: number) {
  if (total <= 0) return 0;
  if (custom > 0) return Math.min(Math.round(custom), Math.round(total));
  const mobile = method === "mtn_momo" || method === "airtel_money";
  return Math.round(total * (mobile ? 1 : 0.5));
}
