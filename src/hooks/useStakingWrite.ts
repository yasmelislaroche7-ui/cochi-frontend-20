// src/hooks/useStakingWrite.ts
import { walletClient, publicClient } from "../world/wallet";
import { STAKING_CONTRACT, TOKEN_CONTRACT } from "../config/contracts";
import stakingAbi from "../abi/MatrixStaking.json";
import erc20Abi from "../abi/ERC20.json";
import { parseError } from "../utils/errors";

export function useStakingWrite(user: `0x${string}`) {
  async function approve(amount: bigint) {
    try {
      const hash = await walletClient.writeContract({
        address: TOKEN_CONTRACT,
        abi: erc20Abi,
        functionName: "approve",
        args: [STAKING_CONTRACT, amount],
        account: user,
      });

      await publicClient.waitForTransactionReceipt({ hash });
    } catch (e) {
      throw new Error(parseError(e));
    }
  }

  async function stake(amount: bigint) {
    try {
      const hash = await walletClient.writeContract({
        address: STAKING_CONTRACT,
        abi: stakingAbi,
        functionName: "stake",
        args: [amount],
        account: user,
      });

      await publicClient.waitForTransactionReceipt({ hash });
    } catch (e) {
      throw new Error(parseError(e));
    }
  }

  async function claim() {
    try {
      const hash = await walletClient.writeContract({
        address: STAKING_CONTRACT,
        abi: stakingAbi,
        functionName: "claim",
        account: user,
      });

      await publicClient.waitForTransactionReceipt({ hash });
    } catch (e) {
      throw new Error(parseError(e));
    }
  }

  async function unstake(amount: bigint) {
    try {
      const hash = await walletClient.writeContract({
        address: STAKING_CONTRACT,
        abi: stakingAbi,
        functionName: "unstake",
        args: [amount],
        account: user,
      });

      await publicClient.waitForTransactionReceipt({ hash });
    } catch (e) {
      throw new Error(parseError(e));
    }
  }

  async function fundRewards(amount: bigint) {
    try {
      const hash = await walletClient.writeContract({
        address: STAKING_CONTRACT,
        abi: stakingAbi,
        functionName: "fundRewards",
        args: [amount],
        account: user,
      });

      await publicClient.waitForTransactionReceipt({ hash });
    } catch (e) {
      throw new Error(parseError(e));
    }
  }

  return {
    approve,
    stake,
    claim,
    unstake,
    fundRewards,
  };
}