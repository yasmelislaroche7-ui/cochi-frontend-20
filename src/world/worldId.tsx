// src/world/worldId.tsx

import { IDKitWidget, VerificationLevel } from "@worldcoin/idkit"

export const WORLD_ID_APP_ID =
  "app_f84357b08826b22ace9ea93d03aef932"

export const WORLD_ID_ACTION =
  "matrix-staking-verification"

type Props = {
  onSuccess: (proof: any) => void
}

export function WorldIdWidget({ onSuccess }: Props) {
  return (
    <IDKitWidget
      app_id={WORLD_ID_APP_ID}
      action={WORLD_ID_ACTION}
      verification_level={VerificationLevel.Orb}
      onSuccess={onSuccess}
    >
      {({ open }) => (
        <button onClick={open}>
          Verificar con World ID
        </button>
      )}
    </IDKitWidget>
  )
}