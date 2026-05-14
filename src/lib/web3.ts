import { arcTestnet as arcChain } from 'viem/chains';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http, fallback, getAddress } from 'viem';

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

// Using getAddress forces the correct checksum format so wallets don't error out
export const USDC_ADDRESS = getAddress('0x170abccca8976ea643501a40348700244747b576');
export const USDC_DECIMALS = 6;
