import { useState } from 'react';
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
import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useConfig } from 'wagmi';
import { supersimL2A, supersimL2B } from '@eth-optimism/viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { type Chain, encodeFunctionData, parseEther } from 'viem';
import { TOKEN_ABI, FLASH_LOAN_BRIDGE_ABI, TARGET_CONTRACT_ABI } from '@/abi/contracts';
import { DirectionSelector } from '@/components/DirectionSelector';
import { AmountInput } from '@/components/AmountInput';
import { waitForTransactionReceipt } from '@wagmi/core';
// Configuration
const CONFIG = {
  devAccount: privateKeyToAccount(
    '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
  ),
  supportedChains: [supersimL2A, supersimL2B] as Chain[],
  flashLoanBridgeAddress: '0x1748606018e906af088453290ab4e5da8e9cc26a',
  tokenAddress: '0x0769743d9a2e952bccace0d9064dfb5031db01df',
  targetContractAddress: '0x5c735e5477ede722e7e6ce5e654b764b7247d2ae',
  flatFee: parseEther('0.01'),
} as const;

const TokenMintCard = () => {
  const [mintAmount, setMintAmount] = useState<bigint>(parseEther('1000'));

  const { data: bridgeBalance, refetch } = useReadContract({
    address: CONFIG.tokenAddress,
    abi: TOKEN_ABI,
    functionName: 'balanceOf',
    args: [CONFIG.flashLoanBridgeAddress],
    chainId: CONFIG.supportedChains[0].id,
  });

  const config = useConfig();

  const { data, writeContract, isPending } = useWriteContract({
    mutation: {
      onSuccess: async hash => {
        await waitForTransactionReceipt(config, {
          hash,
          chainId: CONFIG.supportedChains[0].id,
        });
        refetch();
      },
    },
  });

  const { isLoading: isWaitingForReceipt } = useWaitForTransactionReceipt({
    hash: data,
    chainId: CONFIG.supportedChains[0].id,
  });

  const buttonText = isWaitingForReceipt
    ? 'Waiting for confirmation...'
    : isPending
      ? 'Minting...'
      : 'Mint Tokens to Bridge';

  return (
    <Card className="w-[600px] mb-4">
      <CardHeader>
        <CardTitle>Mint Flash Loan Tokens</CardTitle>
        <CardDescription>Mint tokens to the bridge contract for testing</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <AmountInput amount={mintAmount} setAmount={setMintAmount} />

        <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Bridge Token Balance:</span>
            <span className="font-medium">
              {bridgeBalance ? (Number(bridgeBalance) / 1e18).toString() : '0'} CXL
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex">
        <Button
          size="lg"
          className="w-full"
          disabled={isPending || isWaitingForReceipt}
          onClick={() => {
            writeContract({
              account: CONFIG.devAccount,
              address: CONFIG.tokenAddress,
              abi: TOKEN_ABI,
              functionName: 'mint',
              args: [CONFIG.flashLoanBridgeAddress, mintAmount],
              chainId: CONFIG.supportedChains[0].id,
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

const FlashLoanCard = () => {
  const [direction, setDirection] = useState({
    source: CONFIG.supportedChains[0],
    destination: CONFIG.supportedChains[1],
  });

  const [amount, setAmount] = useState<bigint>(parseEther('1'));

  const { data: targetValue, refetch: refetchTargetValue } = useReadContract({
    address: CONFIG.targetContractAddress,
    abi: TARGET_CONTRACT_ABI,
    functionName: 'getValue',
    chainId: direction.destination.id,
  });

  const { data: tokenBalance, refetch: refetchTokenBalance } = useReadContract({
    address: CONFIG.tokenAddress,
    abi: TOKEN_ABI,
    functionName: 'balanceOf',
    args: [CONFIG.targetContractAddress],
    chainId: direction.destination.id,
  });

  const config = useConfig();
  const { data, writeContract, isPending, error } = useWriteContract({
    mutation: {
      onSuccess: async hash => {
        await waitForTransactionReceipt(config, {
          hash,
          chainId: direction.source.id,
        });
        refetchTargetValue();
        refetchTokenBalance();
      },
    },
  });

  const { isLoading: isWaitingForReceipt } = useWaitForTransactionReceipt({
    hash: data,
    chainId: direction.source.id,
  });

  const buttonText = isWaitingForReceipt
    ? 'Waiting for confirmation...'
    : isPending
      ? 'Executing Flash Loan...'
      : 'Execute Flash Loan';

  return (
    <Card className="w-[600px]">
      <CardHeader>
        <CardTitle>Cross Chain Flash Loan</CardTitle>
        <CardDescription>Execute a flash loan across chains</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <DirectionSelector
          allowedChains={CONFIG.supportedChains}
          value={direction}
          onChange={setDirection}
        />
        <AmountInput amount={amount} setAmount={setAmount} />

        <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Target Contract Value:</span>
              <span className="font-medium">{targetValue?.toString() || '0'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Target Contract Token Balance:</span>
              <span className="font-medium">{tokenBalance?.toString() || '0'}</span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex">
        <Button
          size="lg"
          className="w-full"
          disabled={isPending || isWaitingForReceipt}
          onClick={() => {
            const callData = encodeFunctionData({
              abi: TARGET_CONTRACT_ABI,
              functionName: 'setValue',
              args: [CONFIG.tokenAddress],
            });

            writeContract({
              account: CONFIG.devAccount,
              address: CONFIG.flashLoanBridgeAddress,
              abi: FLASH_LOAN_BRIDGE_ABI,
              functionName: 'initiateCrosschainFlashLoan',
              args: [
                BigInt(direction.destination.id),
                amount,
                CONFIG.targetContractAddress,
                callData,
              ],
              chainId: direction.source.id,
              value: CONFIG.flatFee,
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

function App() {
  return (
    <div className="flex flex-col items-start gap-4 p-4">
      <TokenMintCard />
      <FlashLoanCard />
    </div>
  );
}

export default App;
