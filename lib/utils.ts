import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatUnits, parseUnits } from "ethers";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBalance(balance: string | bigint, decimals: number = 18, precision: number = 4): string {
  try {
    const formatted = formatUnits(balance.toString(), decimals);
    const num = parseFloat(formatted);
    
    if (num === 0) return '0';
    if (num < 0.0001) return '< 0.0001';
    
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: precision
    });
  } catch (error) {
    return '0';
  }
}

export function parseInputAmount(amount: string, decimals: number = 18): bigint {
  try {
    if (!amount || amount === '') return BigInt(0);
    return parseUnits(amount, decimals);
  } catch (error) {
    return BigInt(0);
  }
}

export function shortenAddress(address: string, chars = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function formatStakingIndex(index: string | bigint): string {
  try {
    // WSTON uses 27 decimals
    const formatted = formatUnits(index.toString(), 27);
    const num = parseFloat(formatted);
    return num.toFixed(6);
  } catch (error) {
    return '1.000000';
  }
}

export function isValidAmount(amount: string): boolean {
  if (!amount || amount === '') return false;
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0;
}