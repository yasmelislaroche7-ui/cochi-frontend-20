import { useEffect, useState } from "react"
import { getUserStake } from "../services/staking.service"

export default function ContractStats({
  address,
}: {
  address: `0x${string}`
}) {
  const [stake, setStake] = useState<any>(null)

  useEffect(() => {
    getUserStake(address).then(setStake)
  }, [address])

  if (!stake) return null

  return (
    <div>
      <h4>Tu stake</h4>
      <p>Cantidad: {stake.amount.toString()}</p>
    </div>
  )
}