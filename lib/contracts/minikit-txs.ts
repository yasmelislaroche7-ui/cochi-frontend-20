import { MiniKit } from "@worldcoin/minikit-js"
import { 
  STAKING_CONTRACT_ADDRESS, 
  TOKEN_CONTRACT_ADDRESS 
} from "./config"
import STAKING_ABI from "./staking-abi.json"
import ERC20_ABI from "./erc20-abi.json"

export const minikitTransactions = {
  /**
   * Generates the approve transaction object for MTXs token
   * @param amountWei The amount in wei as a string
   */
  approve: (amountWei: string) => ({
    address: TOKEN_CONTRACT_ADDRESS,
    abi: ERC20_ABI,
    functionName: "approve",
    args: [STAKING_CONTRACT_ADDRESS, amountWei],
  }),

  /**
   * Generates the stake transaction object
   * @param amountWei The amount in wei as a string
   */
  stake: (amountWei: string) => ({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI,
    functionName: "stake",
    args: [amountWei],
  }),

  /**
   * Generates the unstake transaction object
   * @param amountWei The amount in wei as a string
   */
  unstake: (amountWei: string) => ({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI,
    functionName: "unstake",
    args: [amountWei],
  }),

  /**
   * Generates the claim rewards transaction object
   */
  claim: () => ({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI,
    functionName: "claim",
    args: [],
  }),

  /**
   * Executes a list of transactions via MiniKit
   * @param transactions Array of transaction objects
   */
  execute: async (transactions: any[]) => {
    if (!MiniKit.isInstalled()) {
      throw new Error("MiniKit is not installed")
    }

    const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
      transaction: transactions
    })

    return finalPayload
  }
}
