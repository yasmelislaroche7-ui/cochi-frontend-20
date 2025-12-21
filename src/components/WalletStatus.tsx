type Props = {
  wallet: {
    connected: boolean
    address: string | null
    connect: () => void
  }
}

export default function WalletStatus({ wallet }: Props) {
  if (!wallet.connected) {
    return <button onClick={wallet.connect}>Conectar Wallet</button>
  }

  return (
    <p>
      Wallet: {wallet.address?.slice(0, 6)}...
      {wallet.address?.slice(-4)}
    </p>
  )
}