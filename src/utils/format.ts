// src/utils/format.ts

import { formatUnits } from "viem";

/**
 * Formatea un uint256 a token con decimales (18 por defecto)
 */
export function formatToken(
  value: bigint | undefined,
  decimals = 18,
  precision = 4
): string {
  if (!value) return "0";

  const formatted = formatUnits(value, decimals);
  const [int, dec] = formatted.split(".");

  if (!dec) return int;

  return `${int}.${dec.slice(0, precision)}`;
}

/**
 * Convierte timestamp (segundos) a fecha legible
 */
export function formatDate(timestamp: bigint | number | undefined): string {
  if (!timestamp) return "-";

  const time =
    typeof timestamp === "bigint"
      ? Number(timestamp) * 1000
      : timestamp * 1000;

  const date = new Date(time);

  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Devuelve tiempo restante hasta unlock (ej: 3h 12m)
 */
export function formatRemainingTime(
  unlockTime: bigint | number | undefined
): string {
  if (!unlockTime) return "-";

  const now = Date.now();
  const unlock =
    typeof unlockTime === "bigint"
      ? Number(unlockTime) * 1000
      : unlockTime * 1000;

  const diff = unlock - now;

  if (diff <= 0) return "Unlocked";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(
    (diff % (1000 * 60 * 60)) / (1000 * 60)
  );

  return `${hours}h ${minutes}m`;
}

/**
 * Formatea APR (ej: 500 -> 500%)
 */
export function formatAPR(apr: bigint | number | undefined): string {
  if (!apr) return "0%";
  return `${apr.toString()}%`;
}