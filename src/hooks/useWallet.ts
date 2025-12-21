// src/hooks/useWallet.ts
import { useEffect, useState } from "react";
import { walletClient, publicClient } from "../world/wallet";
import { WORLDCHAIN } from "../config/world";

export function useWallet() {
  const [address, setAddress] = useState<`0x${string}` | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    async function loadWallet() {
      try {
        const accounts = await walletClient.getAddresses();
        if (accounts.length === 0) return;

        setAddress(accounts[0]);
        setConnected(true);

        const chain = await publicClient.getChainId();
        setChainId(chain);
      } catch {
        setConnected(false);
      }
    }

    loadWallet();
  }, []);

  const isCorrectNetwork = chainId === WORLDCHAIN.chainId;

  return {
    address,
    chainId,
    connected,
    isCorrectNetwork,
  };
}