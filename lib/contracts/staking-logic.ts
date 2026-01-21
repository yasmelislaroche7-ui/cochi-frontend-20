import { erc20Abi } from "viem";
import stakingAbi from "./staking-abi.json";
import { MiniKit } from "@worldcoin/minikit-js";

export const createStakeTransaction = (tokenAddress: string, stakingAddress: string, amount: string, allowance: bigint) => {
  const transactions: any[] = [];
  const amountBigInt = BigInt(amount);

  if (allowance < amountBigInt) {
    transactions.push({
      address: tokenAddress as `0x${string}`,
      abi: erc20Abi,
      functionName: "approve",
      args: [stakingAddress as `0x${string}`, amount],
    });
  }

  transactions.push({
    address: stakingAddress as `0x${string}`,
    abi: stakingAbi,
    functionName: "stake",
    args: [amount],
  });

  return transactions;
};

export const createUnstakeTransaction = (stakingAddress: string, amount: string) => {
  return [
    {
      address: stakingAddress as `0x${string}`,
      abi: stakingAbi,
      functionName: "unstake",
      args: [amount],
    },
  ];
};

export const createClaimTransaction = (stakingAddress: string) => {
  return [
    {
      address: stakingAddress as `0x${string}`,
      abi: stakingAbi,
      functionName: "claim",
      args: [],
    },
  ];
};
