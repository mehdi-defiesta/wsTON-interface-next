'use client';

import { useEffect, useState } from 'react';
import { useContractRead } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { WSTON_CONTRACT_ADDRESS, WSTON_ABI } from '@/lib/contracts';
import { formatStakingIndex } from '@/lib/utils';
import { TrendingUp } from 'lucide-react';

export function StakingIndex() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: stakingIndex, isLoading, error } = useContractRead({
    address: WSTON_CONTRACT_ADDRESS,
    abi: WSTON_ABI,
    functionName: 'getStakingIndex',
    watch: true,
    cacheTime: 0,
    onError: (error) => {
      console.error('StakingIndex error:', error);
    },
  });

  const { data: totalStake } = useContractRead({
    address: WSTON_CONTRACT_ADDRESS,
    abi: WSTON_ABI,
    functionName: 'stakeOf',
    watch: true,
    cacheTime: 30_000,
  });

  if (!mounted) {
    return (
      <Card className="bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-primary-700">Staking Index</CardTitle>
          <TrendingUp className="h-4 w-4 text-primary-600" />
        </CardHeader>
        <CardContent>
          <div className="animate-pulse bg-primary-200 h-8 w-24 rounded"></div>
          <p className="text-xs text-primary-600 mt-1">
            Loading...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200 animate-fade-in">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-primary-700">Staking Index</CardTitle>
        <TrendingUp className="h-4 w-4 text-primary-600 animate-bounce-soft" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-primary-900">
          {isLoading ? (
            <div className="animate-pulse bg-primary-200 h-8 w-24 rounded"></div>
          ) : error ? (
            <div className="text-red-500 text-sm">
              <div>Error loading</div>
              <div className="text-xs mt-1">Check console & network</div>
            </div>
          ) : (
            formatStakingIndex(stakingIndex?.toString() || '0')
          )}
        </div>
        <p className="text-xs text-primary-600 mt-1">
          Current exchange rate (WSTON → WTON)
        </p>
        {totalStake && (
          <p className="text-xs text-primary-500 mt-2">
            Total Stake: {formatStakingIndex(totalStake.toString())} WTON
          </p>
        )}
      </CardContent>
    </Card>
  );
}