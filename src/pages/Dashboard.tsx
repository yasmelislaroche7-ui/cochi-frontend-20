import { useWallet } from "../hooks/useWallet"
import { useWorldId } from "../hooks/useWorldId"
import WalletStatus from "../components/WalletStatus"
import WorldIdGate from "../components/WorldIdGate"
import StakeCard from "../components/StakeCard"
import ClaimCard from "../components/ClaimCard"
import UnstakeCard from "../components/UnstakeCard"
import ContractStats from "../components/ContractStats"

export default function Dashboard() {
  const wallet = useWallet()
  const worldId = useWorldId()

  return (
    <div style={{ padding: 24, maxWidth: 520, margin: "0 auto" }}>
      <h2>Matrix Staking</h2>

      <WalletStatus wallet={wallet} />

      {wallet.connected && (
        <WorldIdGate worldId={worldId}>
          <ContractStats address={wallet.address!} />
          <StakeCard address={wallet.address!} />
          <ClaimCard address={wallet.address!} />
          <UnstakeCard address={wallet.address!} />
        </WorldIdGate>
      )}
    </div>
  )
}