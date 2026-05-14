import { arcTestnet as arcChain } from 'viem/chains';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http, fallback } from 'wagmi';

export const arcTestnet = arcChain;

export const config = getDefaultConfig({
  appName: 'ArcPay',
  projectId: '3a8170812b1c5b7311fcc0693afdc4d1', // Standard public project ID
  chains: [arcTestnet],
  ssr: true,
  transports: {
    [arcTestnet.id]: fallback([
      http('https://rpc.testnet.arc.network'),
      http('https://5042002.rpc.thirdweb.com')
    ])
  }
});

export const USDC_ADDRESS = '0x3600000000000000000000000000000000000000';
export const USDC_DECIMALS = 6;
