import { Button } from '@/components/ui/button';
import { formatEther, parseEther } from 'viem';

const AMOUNT_OPTIONS = [
  { value: '0.01', label: '0.01' },
  { value: '0.1', label: '0.1' },
  { value: '0.5', label: '0.5' },
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '5', label: '5' },
];

export const AmountInput = ({
  amount,
  setAmount,
}: {
  amount: bigint;
  setAmount: (amount: bigint) => void;
}) => {
  const currentAmount = formatEther(amount);

  return (
    <div className="w-full space-y-2">
      <div className="text-sm font-medium">Amount (ETH)</div>
      <div className="flex flex-wrap gap-2">
        {AMOUNT_OPTIONS.map(option => (
          <Button
            key={option.value}
            size="sm"
            variant={currentAmount === option.value ? 'default' : 'outline'}
            className="flex-1 m-[2px]"
            onClick={() => setAmount(parseEther(option.value))}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
};
