'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { StakingIndex } from '@/components/StakingIndex';
import { DepositForm } from '@/components/DepositForm';
import { WithdrawalForm } from '@/components/WithdrawalForm';
import { TransactionHistory } from '@/components/TransactionHistory';
import { ClientOnly } from '@/components/ClientOnly';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Coins, TrendingUp, ArrowUpRight, Wallet } from 'lucide-react';

export default function HomePage() {
  const { isConnected } = useAccount();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ClientOnly fallback={<div className="h-10 w-10 rounded-lg bg-gradient-main"></div>}>
                <div className="h-10 w-10 rounded-lg bg-gradient-main flex items-center justify-center">
                  <Coins className="h-6 w-6 text-white" />
                </div>
              </ClientOnly>
              <div>
                <h1 className="text-xl font-bold gradient-text">WSTON Interface</h1>
                <p className="text-sm text-gray-600">Wrapped Staked TON Protocol</p>
              </div>
            </div>
            <ClientOnly fallback={<div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse"></div>}>
              <ConnectButton />
            </ClientOnly>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {!isConnected ? (
          /* Not Connected State */
          <div className="max-w-2xl mx-auto text-center py-16">
            <div className="mb-8">
              <ClientOnly fallback={<div className="mx-auto h-24 w-24 rounded-full bg-gradient-main mb-6"></div>}>
                <div className="mx-auto h-24 w-24 rounded-full bg-gradient-main flex items-center justify-center mb-6">
                  <Wallet className="h-12 w-12 text-white" />
                </div>
              </ClientOnly>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Welcome to WSTON Interface
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Connect your wallet to start depositing, withdrawing, and managing your Wrapped Staked TON tokens.
              </p>
            </div>
            
            <Card className="mb-8 bg-gradient-to-r from-primary-50 to-primary-100 border-primary-200">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <ClientOnly fallback={<div className="h-12 w-12 rounded-lg bg-primary-100 mx-auto mb-3"></div>}>
                      <div className="h-12 w-12 rounded-lg bg-primary-100 flex items-center justify-center mx-auto mb-3">
                        <Coins className="h-6 w-6 text-primary-600" />
                      </div>
                    </ClientOnly>
                    <h3 className="font-semibold text-gray-900 mb-2">Deposit Assets</h3>
                    <p className="text-sm text-gray-600">
                      Deposit TON or WTON to receive WSTON tokens
                    </p>
                  </div>
                  <div className="text-center">
                    <ClientOnly fallback={<div className="h-12 w-12 rounded-lg bg-green-100 mx-auto mb-3"></div>}>
                      <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center mx-auto mb-3">
                        <TrendingUp className="h-6 w-6 text-green-600" />
                      </div>
                    </ClientOnly>
                    <h3 className="font-semibold text-gray-900 mb-2">Earn Rewards</h3>
                    <p className="text-sm text-gray-600">
                      Benefit from staking rewards through the staking index
                    </p>
                  </div>
                  <div className="text-center">
                    <ClientOnly fallback={<div className="h-12 w-12 rounded-lg bg-orange-100 mx-auto mb-3"></div>}>
                      <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center mx-auto mb-3">
                        <ArrowUpRight className="h-6 w-6 text-orange-600" />
                      </div>
                    </ClientOnly>
                    <h3 className="font-semibold text-gray-900 mb-2">Withdraw</h3>
                    <p className="text-sm text-gray-600">
                      Request withdrawals and claim your TON tokens
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <ClientOnly fallback={<div className="h-10 w-32 bg-primary-500 text-white rounded-lg flex items-center justify-center">Connect Wallet</div>}>
              <ConnectButton />
            </ClientOnly>
          </div>
        ) : (
          /* Connected State */
          <ClientOnly
            fallback={
              <div className="max-w-2xl mx-auto text-center py-16">
                <div className="animate-pulse space-y-4">
                  <div className="h-8 bg-gray-200 rounded w-48 mx-auto"></div>
                  <div className="h-4 bg-gray-200 rounded w-64 mx-auto"></div>
                </div>
              </div>
            }
          >
            <div className="space-y-8">
              {/* Stats Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StakingIndex />
                
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-green-700">Protocol Status</CardTitle>
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-900">Active</div>
                    <p className="text-xs text-green-600 mt-1">
                      Contract deployed on Sepolia
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-purple-700">Network</CardTitle>
                    <div className="h-4 w-4 rounded-full bg-purple-500"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-900">Sepolia</div>
                    <p className="text-xs text-purple-600 mt-1">
                      Ethereum testnet
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Main Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Deposit Section */}
                <DepositForm />

                {/* Withdrawal Section */}
                <WithdrawalForm />
              </div>

              {/* Transaction History */}
              <TransactionHistory />

              {/* Contract Information */}
              <Card className="bg-gray-50 border-gray-200">
                <CardHeader>
                  <CardTitle className="text-gray-900">Contract Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">WSTON Proxy:</span>
                    <code className="text-xs bg-gray-200 px-2 py-1 rounded font-mono">
                    0x4e1e3e6De6F9aE2C0D8a21626082Ef70dBa87e6D
                    </code>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Network:</span>
                    <span className="text-gray-900">Sepolia Testnet</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Chain ID:</span>
                    <span className="text-gray-900">11155111</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ClientOnly>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white/80 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-600">
            <p className="text-sm">
              Tokamak Network ecosystem
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}