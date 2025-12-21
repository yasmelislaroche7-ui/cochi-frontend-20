import { claim } from "../services/staking.service"

export default function ClaimCard({ address }: { address: `0x${string}` }) {
  return (
    <div>
      <h4>Claim</h4>
      <button onClick={() => claim(address)}>Claim rewards</button>
    </div>
  )
}