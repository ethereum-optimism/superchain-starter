import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useWriteContract, useBalance, useWaitForTransactionReceipt } from 'wagmi';

import { supersimL2A, supersimL2B } from '@eth-optimism/viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { Address, Chain, formatEther, parseEther } from 'viem';
import { crossChainETHMultitransferAbi } from '@/abi/crossChainETHMultitransferAbi';
import { DirectionSelector } from '@/components/DirectionSelector';
import { MultiRecipientInput } from '@/components/MultiRecipientInput';
import { AmountInput } from '@/components/AmountInput';
import { Calculator } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  devAccount: privateKeyToAccount(
    '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
  ),
  supportedChains: [supersimL2A, supersimL2B] as Chain[],
  crossChainETHMultitransferAddress: '0xd361ebb3aae643a74c247fb1e994d52158ca5af8',
} as const;

// Add this helper function near the top of the file, after CONFIG
const formatAddress = (address: Address): string => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const MultisendCard = ({
  recipients,
  setRecipients,
}: {
  recipients: Address[];
  setRecipients: (recipients: Address[]) => void;
}) => {
  const [direction, setDirection] = useState({
    source: CONFIG.supportedChains[0],
    destination: CONFIG.supportedChains[1],
  });

  const [amount, setAmount] = useState<bigint>(parseEther('0.01'));

  const { data, writeContract, isPending } = useWriteContract();
  const { isLoading: isWaitingForReceipt } = useWaitForTransactionReceipt({
    hash: data,
    chainId: direction.source.id,
    pollingInterval: 1000,
  });

  const totalAmount = useMemo(() => amount * BigInt(recipients.length), [amount, recipients]);

  const buttonText = isWaitingForReceipt
    ? 'Waiting for confirmation...'
    : isPending
      ? 'Sending...'
      : 'Send';

  return (
    <Card className="w-[600px]">
      <CardHeader>
        <CardTitle>Cross Chain Multisend</CardTitle>
        <CardDescription>Send ETH to multiple addresses cross-chain</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <DirectionSelector
          allowedChains={CONFIG.supportedChains}
          value={direction}
          onChange={setDirection}
        />
        <MultiRecipientInput recipients={recipients} onChange={setRecipients} />
        <AmountInput amount={amount} setAmount={setAmount} />

        <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calculator className="h-4 w-4" />
              <span>Total Amount</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{`${recipients.length} recipients × ${
                Number(amount) / 1e18
              } ETH =`}</span>
              <span className="font-medium">{`${Number(totalAmount) / 1e18} ETH`}</span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex">
        <Button
          size="lg"
          className="w-full"
          disabled={isPending || isWaitingForReceipt || recipients.length === 0}
          onClick={() => {
            writeContract({
              account: CONFIG.devAccount,
              abi: crossChainETHMultitransferAbi,
              address: CONFIG.crossChainETHMultitransferAddress,
              functionName: 'send',
              args: [
                BigInt(direction.destination.id),
                recipients.map(recipient => ({
                  to: recipient,
                  amount: amount,
                })),
              ],
              chainId: direction.source.id,
              value: totalAmount,
            });
          }}
        >
          {(isPending || isWaitingForReceipt) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {buttonText}
        </Button>
      </CardFooter>
    </Card>
  );
};

const Balance = ({ address, chainId }: { address: Address; chainId: number }) => {
  const { data: balance } = useBalance({
    address,
    chainId,
    query: {
      refetchInterval: 1000,
    },
  });

  return (
    <div>
      {balance?.value
        ? `${formatEther(balance.value).split('.')[0]}.${
            formatEther(balance.value).split('.')[1]?.slice(0, 3) || '00'
          } ETH`
        : '...'}
    </div>
  );
};

const BalancesCard = ({ recipients }: { recipients: Address[] }) => {
  const allRecipients = [...new Set([CONFIG.devAccount.address, ...recipients])];

  return (
    <Card className="w-[600px]">
      <CardHeader>
        <CardTitle>Balances</CardTitle>
        <CardDescription>Account balances across chains</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Account</TableHead>
              {CONFIG.supportedChains.map(chain => (
                <TableHead key={chain.id}>{chain.name}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {allRecipients.map(address => (
              <TableRow key={address}>
                <TableCell className="font-medium">
                  {address === CONFIG.devAccount.address
                    ? `Dev Account (${formatAddress(address)})`
                    : formatAddress(address)}
                </TableCell>
                {CONFIG.supportedChains.map(chain => (
                  <TableCell key={chain.id}>
                    <Balance address={address} chainId={chain.id} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

function App() {
  const [recipients, setRecipients] = useState<Address[]>([]);

  return (
    <div className="flex items-start gap-4 p-4">
      <MultisendCard recipients={recipients} setRecipients={setRecipients} />
      <BalancesCard recipients={recipients} />
    </div>
  );
}

export default App;
