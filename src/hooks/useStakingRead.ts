// src/hooks/useStakingRead.ts
import { useEffect, useState } from "react";
import { publicClient } from "../world/wallet";
import { STAKING_CONTRACT } from "../config/contracts";
import stakingAbi from "../abi/MatrixStaking.json";
import { REFRESH_INTERVAL } from "../config/constants";

export function useStakingRead(user?: `0x${string}`) {
  const [loading, setLoading] = useState(true);
  const [contractInfo, setContractInfo] = useState<any>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [pending, setPending] = useState<bigint>(0n);

  async function fetchData() {
    try {
      setLoading(true);

      const info = await publicClient.readContract({
        address: STAKING_CONTRACT,
        abi: stakingAbi,
        functionName: "getContractInfo",
      });

      setContractInfo(info);

      if (user) {
        const userData = await publicClient.readContract({
          address: STAKING_CONTRACT,
          abi: stakingAbi,
          functionName: "getUserInfo",
          args: [user],
        });

        const rewards = await publicClient.readContract({
          address: STAKING_CONTRACT,
          abi: stakingAbi,
          functionName: "pendingRewards",
          args: [user],
        });

        setUserInfo(userData);
        setPending(rewards);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [user]);

  return {
    loading,
    contractInfo,
    userInfo,
    pendingRewards: pending,
    refresh: fetchData,
  };
}