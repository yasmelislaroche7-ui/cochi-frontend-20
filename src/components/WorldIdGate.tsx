import { IDKitWidget } from "@worldcoin/idkit"

type Props = {
  worldId: {
    verified: boolean
    onSuccess: (res: any) => void
  }
  children: React.ReactNode
}

export default function WorldIdGate({ worldId, children }: Props) {
  if (worldId.verified) return <>{children}</>

  return (
    <IDKitWidget
      app_id="app_f84357b08826b22ace9ea93d03aef932"
      action="matrix-staking-verification"
      signal="staking"
      onSuccess={worldId.onSuccess}
    >
      {({ open }) => <button onClick={open}>Verificar con World ID</button>}
    </IDKitWidget>
  )
}