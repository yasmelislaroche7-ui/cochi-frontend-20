// src/utils/errors.ts

export enum ErrorCode {
  WALLET_NOT_CONNECTED = "WALLET_NOT_CONNECTED",
  WRONG_NETWORK = "WRONG_NETWORK",
  NOT_VERIFIED = "NOT_VERIFIED",
  LOCKED = "LOCKED",
  NO_REWARDS = "NO_REWARDS",
  INSUFFICIENT_BALANCE = "INSUFFICIENT_BALANCE",
  NOT_OWNER = "NOT_OWNER",
  TX_REJECTED = "TX_REJECTED",
  UNKNOWN = "UNKNOWN",
}

/**
 * Traduce errores crudos (ethers / viem / rpc) a mensajes claros
 */
export function parseError(error: any): string {
  if (!error) return "Unknown error";

  const message =
    error?.reason ||
    error?.shortMessage ||
    error?.message ||
    error?.toString();

  if (!message) return "Transaction failed";

  // 🔒 Unstake locked (24h)
  if (
    message.includes("LOCKED") ||
    message.includes("unlock") ||
    message.includes("locked")
  ) {
    return "Unstake is locked. Please wait 24 hours.";
  }

  // 💰 No rewards available
  if (
    message.includes("NO_REWARDS") ||
    message.includes("no rewards") ||
    message.includes("Nothing to claim")
  ) {
    return "No rewards available to claim.";
  }

  // 🧾 Balance insuficiente
  if (
    message.includes("insufficient") ||
    message.includes("balance")
  ) {
    return "Insufficient token balance.";
  }

  // 👑 Only owner
  if (
    message.includes("Ownable") ||
    message.includes("owner")
  ) {
    return "Only the contract owner can perform this action.";
  }

  // ❌ Usuario rechazó tx
  if (
    message.includes("rejected") ||
    message.includes("denied")
  ) {
    return "Transaction rejected by user.";
  }

  return "Transaction failed. Please try again.";
}