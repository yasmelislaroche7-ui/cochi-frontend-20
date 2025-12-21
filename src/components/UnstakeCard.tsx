import { unstake } from "../services/staking.service"

export default function UnstakeCard({ address }: { address: `0x${string}` }) {
  return (
    <div>
      <h4>Unstake</h4>
      <button onClick={() => unstake(address)}>Unstake</button>
    </div>
  )
}