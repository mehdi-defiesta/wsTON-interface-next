'use client';

import { useState, useEffect } from 'react';
import { useAccount, useContractWrite, useContractRead, usePrepareContractWrite, useWaitForTransaction } from 'wagmi';
import { parseUnits, formatUnits, AbiCoder } from 'ethers';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { WSTON_CONTRACT_ADDRESS, WSTON_ABI, WTON_CONTRACT_ADDRESS, TON_CONTRACT_ADDRESS, ERC20_ABI } from '@/lib/contracts';
import { formatBalance, parseInputAmount, isValidAmount } from '@/lib/utils';
import { ArrowDown, Coins, Loader2, Shield, CheckCircle } from 'lucide-react';
import { ClientOnly } from './ClientOnly';

export function DepositForm() {
  const [amount, setAmount] = useState('');
  const [tokenType, setTokenType] = useState<'WTON' | 'TON'>('WTON');
  const [showDepositStep, setShowDepositStep] = useState(false);
  const [tonWorkflowStep, setTonWorkflowStep] = useState<'approve-ton' | 'swap-ton' | 'approve-wton' | 'deposit' | 'completed'>('approve-ton');
  const { address } = useAccount();

  // Reset states when token type changes
  useEffect(() => {
    setShowDepositStep(false);
    setTonWorkflowStep('approve-ton');
  }, [tokenType]);

  // Get user balances
  const { data: wtonBalance } = useContractRead({
    address: WTON_CONTRACT_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
    enabled: !!address,
    watch: true,
  });

  const { data: tonBalance } = useContractRead({
    address: TON_CONTRACT_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
    enabled: !!address,
    watch: true,
  });

  const { data: wstonBalance } = useContractRead({
    address: WSTON_CONTRACT_ADDRESS,
    abi: WSTON_ABI,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
    enabled: !!address,
    watch: true,
  });

  // Get staking index for conversion calculation
  const { data: stakingIndex } = useContractRead({
    address: WSTON_CONTRACT_ADDRESS,
    abi: WSTON_ABI,
    functionName: 'getStakingIndex',
    watch: true,
    cacheTime: 0,
  });

  // Get layer2 address for TON approveAndCall data
  const { data: layer2Address } = useContractRead({
    address: WSTON_CONTRACT_ADDRESS,
    abi: WSTON_ABI,
    functionName: 'getLayer2Address',
    watch: false,
  });

  // Check allowance - only for WTON (TON uses approveAndCall directly)
  const { data: allowance } = useContractRead({
    address: WTON_CONTRACT_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [address as `0x${string}`, WSTON_CONTRACT_ADDRESS],
    enabled: !!address && isValidAmount(amount) && !showDepositStep && tokenType === 'WTON',
    watch: true,
    onError: (error) => {
      console.debug('Allowance read error (expected):', error.message);
    },
  });

  const needsApproval = tokenType === 'WTON' && allowance !== undefined && allowance !== null && 
    isValidAmount(amount) && 
    parseInputAmount(amount, 27) > allowance;

  // Prepare approval transaction - only for WTON when we actually need approval
  const { config: approveConfig } = usePrepareContractWrite({
    address: WTON_CONTRACT_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [WSTON_CONTRACT_ADDRESS, parseInputAmount(amount, 27)],
    enabled: needsApproval && isValidAmount(amount) && !showDepositStep && tokenType === 'WTON',
    onError: (error) => {
      // Silently handle contract simulation errors - this is expected when no approval needed
      console.debug('Approval preparation error (expected):', error.message);
    },
  });

  const { write: approve, data: approveData } = useContractWrite(approveConfig);
  const { isLoading: isApproving, isSuccess: approvalSuccess } = useWaitForTransaction({ 
    hash: approveData?.hash,
    onSuccess: () => {
      console.log('Approval transaction mined successfully');
      setShowDepositStep(true);
    }
  });

  // Prepare WTON deposit transaction (for both WTON and TON workflows)
  const { config: depositConfig } = usePrepareContractWrite({
    address: WSTON_CONTRACT_ADDRESS,
    abi: WSTON_ABI,
    functionName: 'depositWTONAndGetWSTON',
    args: [parseInputAmount(amount, 27)], // Only WTON amount needed
    enabled: isValidAmount(amount) && (
      (tokenType === 'WTON' && (!needsApproval || (approvalSuccess && showDepositStep))) ||
      (tokenType === 'TON' && tonWorkflowStep === 'deposit')
    ),
    onError: (error) => {
      // Silently handle contract simulation errors
      console.debug('WTON deposit preparation error (expected):', error.message);
    },
  });

  // Check TON allowance for WTON contract
  const { data: tonAllowance } = useContractRead({
    address: TON_CONTRACT_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [address as `0x${string}`, WTON_CONTRACT_ADDRESS],
    enabled: !!address && isValidAmount(amount) && tokenType === 'TON',
    watch: true,
  });

  // Check if TON approval is sufficient for swap
  const tonNeedsApproval = tokenType === 'TON' && tonAllowance !== undefined && tonAllowance !== null && 
    isValidAmount(amount) && 
    parseInputAmount(amount, 18) > tonAllowance;

  // TON Workflow Step 1: Approve WTON contract as spender for TON (not WSTON)
  const { config: tonApproveConfig } = usePrepareContractWrite({
    address: TON_CONTRACT_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [WTON_CONTRACT_ADDRESS, parseInputAmount(amount, 18)],
    enabled: isValidAmount(amount) && tokenType === 'TON' && tonWorkflowStep === 'approve-ton',
  });

  // TON Workflow Step 2: Swap TON to WTON (using WTON contract)
  const { config: swapFromTonConfig } = usePrepareContractWrite({
    address: WTON_CONTRACT_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'swapFromTON',
    args: [parseInputAmount(amount, 18)],
    enabled: isValidAmount(amount) && tokenType === 'TON' && tonWorkflowStep === 'swap-ton' && !tonNeedsApproval,
  });

  // TON Workflow Step 3: Approve WSTON as spender for WTON (after swap)
  const { config: wtonApproveConfig } = usePrepareContractWrite({
    address: WTON_CONTRACT_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [WSTON_CONTRACT_ADDRESS, parseInputAmount(amount, 27)], // WTON has 27 decimals
    enabled: isValidAmount(amount) && tokenType === 'TON' && tonWorkflowStep === 'approve-wton',
  });

  const { write: deposit, data: depositData } = useContractWrite(depositConfig);
  const { isLoading: isDepositing } = useWaitForTransaction({ hash: depositData?.hash });

  // TON Workflow Contract Writes
  const { write: tonApprove, data: tonApproveData } = useContractWrite(tonApproveConfig);
  const { isLoading: isTonApproving } = useWaitForTransaction({ 
    hash: tonApproveData?.hash,
    onSuccess: () => setTonWorkflowStep('swap-ton')
  });

  const { write: swapFromTon, data: swapFromTonData } = useContractWrite(swapFromTonConfig);
  const { isLoading: isSwapping } = useWaitForTransaction({ 
    hash: swapFromTonData?.hash,
    onSuccess: () => setTonWorkflowStep('approve-wton')
  });

  const { write: wtonApprove, data: wtonApproveData } = useContractWrite(wtonApproveConfig);
  const { isLoading: isWtonApproving } = useWaitForTransaction({ 
    hash: wtonApproveData?.hash,
    onSuccess: () => setTonWorkflowStep('deposit')
  });

  // For TON deposits, use the same deposit function but only when workflow reaches deposit step
  const { isLoading: isTonDepositing } = useWaitForTransaction({ 
    hash: depositData?.hash,
    enabled: tokenType === 'TON',
    onSuccess: () => setTonWorkflowStep('completed')
  });

  // Calculate estimated WSTON amount user will receive
  const getEstimatedWSTON = () => {
    if (!isValidAmount(amount) || !stakingIndex) return '0';
    
    try {
      const inputAmount = parseFloat(amount);
      const stakingIndexValue = parseFloat(formatUnits(stakingIndex.toString(), 27));
      const estimatedWSTON = inputAmount / stakingIndexValue;
      return estimatedWSTON.toFixed(6).replace(/\.?0+$/, '');
    } catch (error) {
      return '0';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidAmount(amount)) return;

    if (tokenType === 'TON') {
      // Handle the 4-step TON workflow
      switch (tonWorkflowStep) {
        case 'approve-ton':
          tonApprove?.();
          break;
        case 'swap-ton':
          if (tonNeedsApproval) {
            // If approval is insufficient, go back to approve step
            setTonWorkflowStep('approve-ton');
            tonApprove?.();
          } else {
            swapFromTon?.();
          }
          break;
        case 'approve-wton':
          wtonApprove?.();
          break;
        case 'deposit':
          deposit?.();
          break;
      }
    } else {
      // For WTON, use the two-step approve + deposit method
      if (needsApproval && !showDepositStep) {
        approve?.();
      } else {
        deposit?.();
      }
    }
  };

  const handleMaxClick = () => {
    const balance = tokenType === 'WTON' ? wtonBalance : tonBalance;
    if (balance) {
      const decimals = tokenType === 'TON' ? 18 : 27;
      // Use formatUnits directly to get plain number format without commas
      const formatted = formatUnits(balance.toString(), decimals);
      const num = parseFloat(formatted);
      // Format to 6 decimal places without locale formatting
      setAmount(num.toFixed(6).replace(/\.?0+$/, ''));
    }
  };

  return (
    <Card className="animate-slide-up">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClientOnly fallback={<div className="h-5 w-5"></div>}>
            <Coins className="h-5 w-5 text-primary-600" />
          </ClientOnly>
          Deposit & Get WSTON
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Token Type Selector */}
        <div className="flex rounded-lg bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => setTokenType('WTON')}
            className={`flex-1 rounded-md py-2 px-3 text-sm font-medium transition-colors ${
              tokenType === 'WTON'
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            WTON
          </button>
          <button
            type="button"
            onClick={() => setTokenType('TON')}
            className={`flex-1 rounded-md py-2 px-3 text-sm font-medium transition-colors ${
              tokenType === 'TON'
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            TON
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Amount to Deposit
            </label>
            <div className="relative">
              <Input
                type="number"
                step="0.000001"
                placeholder={`Enter ${tokenType} amount`}
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
                Balance: {formatBalance(
                  (tokenType === 'WTON' ? wtonBalance : tonBalance)?.toString() || '0',
                  tokenType === 'TON' ? 18 : 27
                )} {tokenType}
              </span>
            </div>
          </div>

          {/* Conversion Preview */}
          {isValidAmount(amount) && (
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-primary-700">You will receive:</span>
                <span className="font-medium text-primary-900">~{getEstimatedWSTON()} WSTON</span>
              </div>
              <ClientOnly fallback={<div className="h-4 w-4 mx-auto mt-1"></div>}>
                <ArrowDown className="h-4 w-4 text-primary-600 mx-auto mt-1" />
              </ClientOnly>
            </div>
          )}

          {/* Transaction Status */}
          {isValidAmount(amount) && tokenType === 'WTON' && needsApproval && (
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
              <div className="text-sm text-primary-700 text-center">
                {isApproving ? (
                  <span>Step 1/2: Approving {tokenType} spending...</span>
                ) : showDepositStep ? (
                  <span>✅ Step 1 complete! Now click to deposit your {tokenType}</span>
                ) : (
                  <span>Step 1: First approve {tokenType} spending</span>
                )}
              </div>
            </div>
          )}

          {/* TON 4-step Workflow Status */}
          {isValidAmount(amount) && tokenType === 'TON' && (
            <>
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
                <div className="text-sm text-primary-700 text-center">
                  {isTonApproving ? (
                    <span>Step 1/4: Approving TON spending...</span>
                  ) : isSwapping ? (
                    <span>Step 2/4: Swapping TON to WTON...</span>
                  ) : isWtonApproving ? (
                    <span>Step 3/4: Approving WTON spending...</span>
                  ) : isTonDepositing ? (
                    <span>Step 4/4: Depositing WTON...</span>
                  ) : tonWorkflowStep === 'completed' ? (
                    <span>✅ All steps completed! WSTON received.</span>
                  ) : tonWorkflowStep === 'swap-ton' && tonNeedsApproval ? (
                    <span>⚠️ Insufficient TON approval. Please increase approval amount.</span>
                  ) : tonWorkflowStep === 'swap-ton' ? (
                    <span>✅ Step 1 complete! Now swap TON to WTON</span>
                  ) : tonWorkflowStep === 'approve-wton' ? (
                    <span>✅ Step 2 complete! Now approve WTON spending</span>
                  ) : tonWorkflowStep === 'deposit' ? (
                    <span>✅ Step 3 complete! Now deposit WTON</span>
                  ) : (
                    <span>Step 1: First approve TON spending</span>
                  )}
                </div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="text-sm text-yellow-700 text-center">
                  ⚠️ Note: This workflow doesn't use the callback function yet
                </div>
              </div>
            </>
          )}
          
          {isDepositing && tokenType === 'WTON' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="text-sm text-green-700 text-center">
                <span>Step 2/2: Depositing {tokenType}...</span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            variant="gradient"
            size="lg"
            className="w-full"
            disabled={!isValidAmount(amount) || isApproving || isDepositing || isTonApproving || isSwapping || isWtonApproving || isTonDepositing || !address || (tokenType === 'TON' && tonWorkflowStep === 'completed')}
          >
            {tokenType === 'TON' ? (
              // TON workflow button states
              isTonApproving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Approving TON...
                </>
              ) : isSwapping ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Swapping TON to WTON...
                </>
              ) : isWtonApproving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Approving WTON...
                </>
              ) : isTonDepositing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Depositing WTON...
                </>
              ) : tonWorkflowStep === 'completed' ? (
                'Completed ✅'
              ) : tonWorkflowStep === 'approve-ton' ? (
                'Approve TON Spending'
              ) : tonWorkflowStep === 'swap-ton' && tonNeedsApproval ? (
                'Increase TON Approval'
              ) : tonWorkflowStep === 'swap-ton' ? (
                'Swap TON to WTON'
              ) : tonWorkflowStep === 'approve-wton' ? (
                'Approve WTON Spending'
              ) : tonWorkflowStep === 'deposit' ? (
                'Deposit WTON'
              ) : (
                'Start TON Deposit'
              )
            ) : (
              // WTON workflow button states (existing logic)
              isApproving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Approving {tokenType}...
                </>
              ) : isDepositing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Depositing...
                </>
              ) : needsApproval && !showDepositStep ? (
                `Approve ${tokenType} Spending`
              ) : (
                `Deposit ${tokenType}`
              )
            )}
          </Button>
        </form>

        {/* Current WSTON Balance */}
        {wstonBalance && (
          <div className="border-t pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Your WSTON Balance:</span>
              <span className="font-medium">{formatBalance(wstonBalance.toString(), 27)} WSTON</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}