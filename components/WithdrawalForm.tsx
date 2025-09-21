'use client';

import { useState } from 'react';
import { useAccount, useContractWrite, useContractRead, usePrepareContractWrite, useWaitForTransaction } from 'wagmi';
import { formatUnits } from 'ethers';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { WSTON_CONTRACT_ADDRESS, WSTON_ABI } from '@/lib/contracts';
import { formatBalance, parseInputAmount, isValidAmount } from '@/lib/utils';
import { ArrowUpRight, Clock, Loader2, AlertCircle } from 'lucide-react';

export function WithdrawalForm() {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { address } = useAccount();

  // Get user WSTON balance
  const { data: wstonBalance } = useContractRead({
    address: WSTON_CONTRACT_ADDRESS,
    abi: WSTON_ABI,
    functionName: 'balanceOf',
    args: [address],
    enabled: !!address,
    watch: true,
    onError: (error) => {
      setError('Unable to fetch WSTON balance. Please check your wallet connection.');
    },
  });

  // Get withdrawal request index
  const { data: withdrawalIndex } = useContractRead({
    address: WSTON_CONTRACT_ADDRESS,
    abi: WSTON_ABI,
    functionName: 'getWithdrawalRequestIndex',
    args: [address],
    enabled: !!address,
    watch: true,
    onError: (error) => {
      setError('Unable to fetch withdrawal information. Please try again later.');
    },
  });

  // Get total claimable amount
  const { data: claimableAmount } = useContractRead({
    address: WSTON_CONTRACT_ADDRESS,
    abi: WSTON_ABI,
    functionName: 'getTotalClaimableAmountByUser',
    args: [address],
    enabled: !!address,
    watch: true,
    onError: (error) => {
      setError('Unable to fetch claimable amount. Please check your connection.');
    },
  });

  // Prepare withdrawal request transaction
  const { config: requestConfig } = usePrepareContractWrite({
    address: WSTON_CONTRACT_ADDRESS,
    abi: WSTON_ABI,
    functionName: 'requestWithdrawal',
    args: [parseInputAmount(amount, 27)],
    enabled: isValidAmount(amount),
    onError: (error) => {
      // Silently handle preparation errors for better UX
      console.debug('Withdrawal preparation error (expected):', error.message);
    },
  });

  const { write: requestWithdrawal, data: requestData } = useContractWrite(requestConfig);
  const { isLoading: isRequesting } = useWaitForTransaction({ hash: requestData?.hash });

  // Prepare claim transaction
  const { config: claimConfig } = usePrepareContractWrite({
    address: WSTON_CONTRACT_ADDRESS,
    abi: WSTON_ABI,
    functionName: 'claimWithdrawalTotal',
    enabled: claimableAmount && claimableAmount > 0n,
    onError: (error) => {
      setError('Unable to prepare claim transaction. Please try again later.');
    },
  });

  const { write: claimWithdrawal, data: claimData } = useContractWrite(claimConfig);
  const { isLoading: isClaiming } = useWaitForTransaction({ hash: claimData?.hash });

  // Prepare process request transaction
  const { config: processConfig } = usePrepareContractWrite({
    address: WSTON_CONTRACT_ADDRESS,
    abi: WSTON_ABI,
    functionName: 'processWithdrawalRequest',
    args: [1n], // Process 1 request at a time
    enabled: false, // Only enable when we know there are requests to process
    onError: (error) => {
      // Silently handle "no request to process" errors
      if (error.message?.includes('no request to process')) {
        return;
      }
      setError('Unable to process withdrawal requests. Please try again later.');
    },
  });

  const { write: processRequest, data: processData } = useContractWrite(processConfig);
  const { isLoading: isProcessing } = useWaitForTransaction({ hash: processData?.hash });

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Clear any previous errors
    
    if (!address) {
      setError('Please connect your wallet to proceed.');
      return;
    }
    
    if (!amount || amount.trim() === '') {
      setError('Please enter a withdrawal amount.');
      return;
    }
    
    if (!isValidAmount(amount)) {
      setError('Please enter a valid withdrawal amount.');
      return;
    }
    
    const amountValue = parseFloat(amount);
    if (amountValue <= 0) {
      setError('Withdrawal amount must be greater than zero.');
      return;
    }
    
    
    if (wstonBalance && parseInputAmount(amount, 27) > wstonBalance) {
      setError('Insufficient WSTON balance for this withdrawal amount.');
      return;
    }
    
    requestWithdrawal?.();
  };

  const handleMaxClick = () => {
    if (wstonBalance) {
      // Use formatUnits directly to get plain number format without commas
      const formatted = formatUnits(wstonBalance.toString(), 27);
      const num = parseFloat(formatted);
      // Format to 6 decimal places without locale formatting
      setAmount(num.toFixed(6).replace(/\.?0+$/, ''));
    }
  };

  const hasClaimableAmount = claimableAmount && claimableAmount > 0n;
  const hasWithdrawalRequests = withdrawalIndex && withdrawalIndex > 0n;

  return (
    <div className="space-y-6">
      {/* Request Withdrawal */}
      <Card className="animate-slide-up">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpRight className="h-5 w-5 text-orange-600" />
            Request Withdrawal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                <div className="text-sm text-red-800">
                  <p className="font-medium">Error</p>
                  <p>{error}</p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="ml-auto text-red-600 hover:text-red-800"
                >
                  ×
                </button>
              </div>
            </div>
          )}
          <form onSubmit={handleRequestSubmit} className="space-y-4">
            {/* Amount Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                WSTON Amount to Withdraw
              </label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.000001"
                  placeholder="Enter WSTON amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pr-16"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleMaxClick}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 px-2 text-xs"
                >
                  MAX
                </Button>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>
                  Balance: {formatBalance(wstonBalance?.toString() || '0', 27)} WSTON
                </span>
              </div>
            </div>

            {/* Minimum Amount Warning */}
            {isValidAmount(amount) && parseFloat(amount) < 100 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                  <div className="text-sm text-red-800">
                    <p className="font-medium">Minimum Amount Required</p>
                    <p>Withdrawal amount must be greater than 100 WSTON.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Warning */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Withdrawal Delay</p>
                  <p>Your withdrawal will be available for claiming after the delay period set by the DepositManager.</p>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              variant="outline"
              size="lg"
              className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
              disabled={!isValidAmount(amount) || parseFloat(amount || '0') < 100 || isRequesting || !address}
            >
              {isRequesting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Requesting...
                </>
              ) : (
                'Request Withdrawal'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Claim & Process Actions */}
      {(hasClaimableAmount || hasWithdrawalRequests) && (
        <Card className="animate-slide-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-600" />
              Withdrawal Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasClaimableAmount && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-green-900">Ready to Claim</p>
                    <p className="text-sm text-green-700">
                      {formatBalance(claimableAmount.toString(), 27)} WTON available
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      setError(null);
                      claimWithdrawal?.();
                    }}
                    variant="default"
                    className="bg-green-600 hover:bg-green-700"
                    disabled={isClaiming}
                  >
                    {isClaiming ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Claiming...
                      </>
                    ) : (
                      'Claim TON'
                    )}
                  </Button>
                </div>
              </div>
            )}

            {hasWithdrawalRequests && (
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Process Requests</p>
                    <p className="text-sm text-gray-600">
                      Help process pending withdrawal requests
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      setError(null);
                      processRequest?.();
                    }}
                    variant="secondary"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      'Process Requests'
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Withdrawal Stats */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {withdrawalIndex?.toString() || '0'}
                </p>
                <p className="text-sm text-gray-600">Total Requests</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {formatBalance(claimableAmount?.toString() || '0', 27, 2)}
                </p>
                <p className="text-sm text-gray-600">Claimable WTON</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}