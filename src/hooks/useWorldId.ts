// src/hooks/useWorldId.ts
import { useState, useEffect } from "react";

const STORAGE_KEY = "worldid_verified";

export function useWorldId() {
  const [verified, setVerified] = useState(false);
  const [proof, setProof] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "true") {
      setVerified(true);
    }
  }, []);

  function onSuccess(result: any) {
    setVerified(true);
    setProof(result);
    localStorage.setItem(STORAGE_KEY, "true");
  }

  function reset() {
    setVerified(false);
    setProof(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  return {
    verified,
    proof,
    onSuccess,
    reset,
  };
}