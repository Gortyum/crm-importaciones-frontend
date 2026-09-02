import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCLP(value: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  CLP: "$",
  USD: "US$",
  BRL: "R$",
};

const CURRENCY_DECIMALS: Record<string, number> = {
  CLP: 0,
  USD: 2,
  BRL: 2,
};

export function formatMoney(value: number, currency: string, decimals?: number): string {
  const cur = (currency || "CLP").toUpperCase();
  const digits = decimals ?? CURRENCY_DECIMALS[cur] ?? 0;
  const symbol = CURRENCY_SYMBOLS[cur] ?? `${cur} `;
  const num = new Intl.NumberFormat("es-CL", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value || 0);
  return `${symbol}${num} ${cur}`;
}

export function moneyParts(value: number, currency: string, decimals?: number) {
  const cur = (currency || "CLP").toUpperCase();
  const digits = decimals ?? CURRENCY_DECIMALS[cur] ?? 0;
  const symbol = CURRENCY_SYMBOLS[cur] ?? cur;
  const num = new Intl.NumberFormat("es-CL", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value || 0);
  return { symbol, num, cur };
}

export function divisaNombre(divisa: string): string {
  const nombres: Record<string, string> = {
    USD: "Dólar estadounidense",
    BRL: "Real brasileño",
    CLP: "Peso chileno",
  };
  return nombres[(divisa || "USD").toUpperCase()] || (divisa || "USD").toUpperCase();
}
