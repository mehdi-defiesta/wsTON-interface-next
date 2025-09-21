'use client';

import { useState, useEffect } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { WSTON_CONTRACT_ADDRESS, WSTON_ABI } from '@/lib/contracts';
import { formatBalance, shortenAddress } from '@/lib/utils';
import { ClientOnly } from './ClientOnly';
import { History, ArrowDownRight, ArrowUpRight, Clock, ExternalLink } from 'lucide-react';

interface Transaction {
  hash: string;
  type: 'deposit' | 'withdrawal_request' | 'withdrawal_claim';
  amount: string;
  timestamp: number;
  blockNumber: number;
  user: string;
  token?: 'TON' | 'WTON';
}

export function TransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { address } = useAccount();
  const publicClient = usePublicClient();

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!publicClient) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // Get the latest block number
        const latestBlock = await publicClient.getBlockNumber();
        const fromBlock = latestBlock - BigInt(5); // Use only 5 blocks to be extra safe with Alchemy free tier
        const toBlock = latestBlock; // Use specific block number instead of 'latest'
        
        console.log(`Fetching logs from block ${fromBlock} to ${toBlock} (range: ${Number(toBlock - fromBlock)} blocks)`);

        // Initialize empty arrays
        let rawLogs: any[] = [];
        let transferLogs: any[] = [];

        // Try to get all logs with error handling
        try {
          rawLogs = await publicClient.getLogs({
            address: WSTON_CONTRACT_ADDRESS,
            fromBlock,
            toBlock
          });
          console.log(`Found ${rawLogs.length} total logs from WSTON contract`);
          
          // Log the raw events to see what's actually being emitted
          if (rawLogs.length > 0) {
            console.log('Raw logs:', rawLogs.map(log => ({
              topics: log.topics,
              data: log.data,
              blockNumber: log.blockNumber.toString(),
              transactionHash: log.transactionHash
            })));
          }
        } catch (error) {
          console.log('Error fetching raw logs:', error);
        }

        // Try to fetch Transfer events with error handling
        try {
          transferLogs = await publicClient.getLogs({
            address: WSTON_CONTRACT_ADDRESS,
            event: {
              type: 'event',
              name: 'Transfer',
              inputs: [
                { name: 'from', type: 'address', indexed: true },
                { name: 'to', type: 'address', indexed: true },
                { name: 'value', type: 'uint256', indexed: false }
              ]
            },
            fromBlock,
            toBlock
          });
          console.log(`Found ${transferLogs.length} Transfer events`);
        } catch (error) {
          console.log('Error fetching Transfer events:', error);
        }

        // Try other event names that might exist
        let depositLogs: any[] = [];
        let withdrawalRequestLogs: any[] = [];
        let withdrawalClaimLogs: any[] = [];

        try {
          depositLogs = await publicClient.getLogs({
            address: WSTON_CONTRACT_ADDRESS,
            event: {
              type: 'event',
              name: 'Deposited',
              inputs: [
                { name: 'user', type: 'address', indexed: true },
                { name: 'amount', type: 'uint256', indexed: false },
                { name: 'token', type: 'bool', indexed: false }
              ]
            },
            fromBlock,
            toBlock
          });
          console.log(`Found ${depositLogs.length} Deposited events`);
        } catch (error) {
          console.log('Deposited event not found, trying alternative names...');
        }

        try {
          withdrawalRequestLogs = await publicClient.getLogs({
            address: WSTON_CONTRACT_ADDRESS,
            event: {
              type: 'event',
              name: 'WithdrawalRequested',
              inputs: [
                { name: 'user', type: 'address', indexed: true },
                { name: 'amount', type: 'uint256', indexed: false }
              ]
            },
            fromBlock,
            toBlock
          });
          console.log(`Found ${withdrawalRequestLogs.length} WithdrawalRequested events`);
        } catch (error) {
          console.log('WithdrawalRequested event not found');
        }

        try {
          withdrawalClaimLogs = await publicClient.getLogs({
            address: WSTON_CONTRACT_ADDRESS,
            event: {
              type: 'event',
              name: 'WithdrawalClaimed',
              inputs: [
                { name: 'user', type: 'address', indexed: true },
                { name: 'amount', type: 'uint256', indexed: false }
              ]
            },
            fromBlock,
            toBlock
          });
          console.log(`Found ${withdrawalClaimLogs.length} WithdrawalClaimed events`);
        } catch (error) {
          console.log('WithdrawalClaimed event not found');
        }

        // If no custom events found, use Transfer events as fallback
        let processableLogs = [...depositLogs, ...withdrawalRequestLogs, ...withdrawalClaimLogs];
        
        if (processableLogs.length === 0 && transferLogs.length > 0) {
          console.log('Using Transfer events as fallback');
          processableLogs = transferLogs;
        }

        // Get block timestamps for all unique blocks
        const blockNumbers = Array.from(new Set(processableLogs.map(log => log.blockNumber)));
        
        const blockTimestamps: Record<string, number> = {};
        await Promise.all(
          blockNumbers.map(async (blockNumber) => {
            try {
              const block = await publicClient.getBlock({ blockNumber });
              blockTimestamps[blockNumber.toString()] = Number(block.timestamp);
            } catch (error) {
              console.error('Error fetching block:', error);
              blockTimestamps[blockNumber.toString()] = Date.now() / 1000;
            }
          })
        );

        // Process all transactions
        let allTransactions: Transaction[] = [];

        // Process custom events if available
        if (depositLogs.length > 0 || withdrawalRequestLogs.length > 0 || withdrawalClaimLogs.length > 0) {
          allTransactions = [
            ...depositLogs.map(log => ({
              hash: log.transactionHash,
              type: 'deposit' as const,
              amount: log.args.amount?.toString() || '0',
              timestamp: blockTimestamps[log.blockNumber.toString()] || 0,
              blockNumber: Number(log.blockNumber),
              user: log.args.user?.toString() || '',
              token: (log.args.token ? 'TON' : 'WTON') as 'TON' | 'WTON'
            })),
            ...withdrawalRequestLogs.map(log => ({
              hash: log.transactionHash,
              type: 'withdrawal_request' as const,
              amount: log.args.amount?.toString() || '0',
              timestamp: blockTimestamps[log.blockNumber.toString()] || 0,
              blockNumber: Number(log.blockNumber),
              user: log.args.user?.toString() || ''
            })),
            ...withdrawalClaimLogs.map(log => ({
              hash: log.transactionHash,
              type: 'withdrawal_claim' as const,
              amount: log.args.amount?.toString() || '0',
              timestamp: blockTimestamps[log.blockNumber.toString()] || 0,
              blockNumber: Number(log.blockNumber),
              user: log.args.user?.toString() || ''
            }))
          ];
        } else if (transferLogs.length > 0) {
          // Use Transfer events as fallback
          allTransactions = transferLogs.map(log => ({
            hash: log.transactionHash,
            type: 'deposit' as const, // Assume transfers are deposits for now
            amount: log.args.value?.toString() || '0',
            timestamp: blockTimestamps[log.blockNumber.toString()] || 0,
            blockNumber: Number(log.blockNumber),
            user: log.args.to?.toString() || '', // Use 'to' address as user
            token: 'WTON' as const
          }));
        }

        // Sort by timestamp (newest first) and take last 10
        const sortedTransactions = allTransactions
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 10);

        setTransactions(sortedTransactions);
      } catch (error) {
        console.error('Error fetching transaction history:', error);
        
        // If we get an error (likely due to Alchemy rate limits), show a message instead of crashing
        if (error instanceof Error && error.message.includes('block range')) {
          console.log('Alchemy rate limit reached - showing fallback message');
          // Set a special state to show a message about rate limits
          setTransactions([]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [publicClient]);

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownRight className="h-4 w-4 text-green-600" />;
      case 'withdrawal_request':
        return <Clock className="h-4 w-4 text-orange-600" />;
      case 'withdrawal_claim':
        return <ArrowUpRight className="h-4 w-4 text-primary-600" />;
      default:
        return <History className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTransactionLabel = (type: Transaction['type']) => {
    switch (type) {
      case 'deposit':
        return 'Deposit';
      case 'withdrawal_request':
        return 'Withdrawal Request';
      case 'withdrawal_claim':
        return 'Withdrawal Claim';
      default:
        return 'Transaction';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getExplorerUrl = (hash: string) => {
    return `https://sepolia.etherscan.io/tx/${hash}`;
  };

  // Show transaction history even without wallet connection

  return (
    <Card className="animate-slide-up">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClientOnly fallback={<div className="h-5 w-5"></div>}>
            <History className="h-5 w-5 text-purple-600" />
          </ClientOnly>
          Recent Transactions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 bg-gray-200 rounded"></div>
                    <div className="h-4 w-24 bg-gray-200 rounded"></div>
                  </div>
                  <div className="h-4 w-16 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ClientOnly fallback={<div className="h-12 w-12 mx-auto mb-4"></div>}>
              <History className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            </ClientOnly>
            <p className="text-sm">No transactions found</p>
            <p className="text-xs mt-1">Recent protocol activity will appear here</p>
            <p className="text-xs mt-2 text-gray-400">Note: Limited to last 5 blocks due to free tier restrictions</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx, index) => (
              <div key={`${tx.hash}-${index}`} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <ClientOnly fallback={<div className="h-4 w-4"></div>}>
                    {getTransactionIcon(tx.type)}
                  </ClientOnly>
                  <div>
                    <div className="font-medium text-sm">
                      {getTransactionLabel(tx.type)}
                      {tx.token && ` (${tx.token})`}
                    </div>
                    <div className="text-xs text-gray-500">
                      {shortenAddress(tx.user)} • {formatTimestamp(tx.timestamp)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-sm">
                    {formatBalance(tx.amount, tx.type === 'deposit' && tx.token === 'TON' ? 18 : 27, 4)} 
                    {tx.type === 'deposit' ? ` ${tx.token || 'WTON'}` : ' WSTON'}
                  </div>
                  <a
                    href={getExplorerUrl(tx.hash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800"
                  >
                    <ClientOnly fallback={<span>View</span>}>
                      <>
                        View <ExternalLink className="h-3 w-3" />
                      </>
                    </ClientOnly>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}