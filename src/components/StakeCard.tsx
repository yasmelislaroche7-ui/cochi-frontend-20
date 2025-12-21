import { useState } from "react"
import { stake } from "../services/staking.service"

export default function StakeCard({ address }: { address: `0x${string}` }) {
  const [amount, setAmount] = useState("")

  async function submit() {
    const value = BigInt(amount)
    await stake(value, address)
  }

  return (
    <div>
      <h4>Stake</h4>
      <input
        placeholder="Cantidad"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button onClick={submit}>Stake</button>
    </div>
  )
}