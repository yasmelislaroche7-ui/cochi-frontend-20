import stakingAbi from "./staking-abi.json";
import { MiniKit } from "@worldcoin/minikit-js";

// Standard ERC20 ABI for allowance/approve as MiniKit doesn't export them directly as a constant
const erc20MinimalAbi = [
  {
    "inputs": [
      { "internalType": "address", "name": "spender", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "approve",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

export const createStakeTransaction = (tokenAddress: string, stakingAddress: string, amount: string, allowance: bigint) => {
  const transactions: any[] = [];
  const amountBigInt = BigInt(amount);

  if (allowance < amountBigInt) {
    transactions.push({
      address: tokenAddress as `0x${string}`,
      abi: erc20MinimalAbi,
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
