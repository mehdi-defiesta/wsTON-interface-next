'use client';

import { getDefaultWallets } from '@rainbow-me/rainbowkit';
import { configureChains, createConfig } from 'wagmi';
import { sepolia, mainnet } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { alchemyProvider } from 'wagmi/providers/alchemy';

const providers = [publicProvider()];

// Only add Alchemy if API key is provided
if (process.env.NEXT_PUBLIC_ALCHEMY_ID) {
  providers.unshift(alchemyProvider({ apiKey: process.env.NEXT_PUBLIC_ALCHEMY_ID }));
}

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [sepolia, mainnet],
  providers
);

const { connectors } = getDefaultWallets({
  appName: 'WSTON Interface',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo',
  chains,
});

export const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
});

export { chains };