import { Address, getAddress, isAddress } from 'viem';
import { X, AlertCircle, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

const MAX_RECIPIENTS = 100; // Reasonable limit
const TEST_ADDRESSES = [
  '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
  '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
  '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
  '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
  '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc',
  '0x976EA74026E726554dB657fA54763abd0C3a0aa9',
  '0x14dC79964da2C08b23698B3D3cc7Ca32193d9955',
  '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f',
  '0xa0Ee7A142d267C1f36714E4a8F75612F20a79720',
];

export const MultiRecipientInput = ({
  recipients,
  onChange,
}: {
  recipients: Address[];
  onChange: (recipients: Address[]) => void;
}) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(true);

  const handleAddTestAddresses = useCallback(() => {
    const newAddresses = TEST_ADDRESSES.filter(addr => !recipients.includes(addr as Address));

    if (recipients.length + newAddresses.length > MAX_RECIPIENTS) {
      setError(`Cannot add more than ${MAX_RECIPIENTS} recipients`);
      return;
    }

    onChange([...recipients, ...(newAddresses as Address[])]);
    setError(null);
  }, [recipients, onChange]);

  const validateAndAddAddresses = useCallback(
    (addresses: string[]) => {
      const newValidAddresses: Address[] = [];
      let hasError = false;

      for (const addr of addresses) {
        const trimmedAddr = getAddress(addr.trim());
        if (!trimmedAddr) continue;

        if (!isAddress(trimmedAddr)) {
          setError(`Invalid address format: ${trimmedAddr}`);
          hasError = true;
          break;
        }

        if (recipients.includes(trimmedAddr as Address)) {
          setError(`Address already added: ${trimmedAddr}`);
          hasError = true;
          break;
        }

        newValidAddresses.push(trimmedAddr as Address);
      }

      if (!hasError && newValidAddresses.length > 0) {
        if (recipients.length + newValidAddresses.length > MAX_RECIPIENTS) {
          setError(`Cannot add more than ${MAX_RECIPIENTS} recipients`);
          return;
        }
        onChange([...recipients, ...newValidAddresses]);
        setInput('');
        setError(null);
      }
    },
    [recipients, onChange]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    setError(null);
    if (e.target.value.trim() && !isAddress(e.target.value.trim())) {
      setError('Invalid address format');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      validateAndAddAddresses([input]);
    } else if (e.key === 'Backspace' && input === '' && recipients.length > 0) {
      onChange(recipients.slice(0, -1));
    }
    setShowHelp(false);
  };

  const removeRecipient = (addressToRemove: Address) => {
    onChange(recipients.filter(addr => addr !== addressToRemove));
    setError(null);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Label>Recipients</Label>
        <Button variant="outline" size="sm" onClick={handleAddTestAddresses} className="text-xs">
          Add Test Addresses
        </Button>
      </div>

      <div className="relative border rounded-md bg-background shadow-sm">
        <div className="flex items-center gap-2 p-3">
          <Input
            type="text"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={
              recipients.length === 0
                ? "Enter recipient's Ethereum address..."
                : 'Add another address...'
            }
            className={cn(
              'flex-1 bg-transparent placeholder:text-muted-foreground border-0 shadow-none',
              error && 'text-destructive placeholder:text-destructive'
            )}
          />
        </div>

        {recipients.length > 0 && (
          <>
            <div className="border-t bg-muted/50 px-3 py-2">
              <span className="text-sm font-medium">
                {recipients.length} recipient{recipients.length !== 1 ? 's' : ''} added
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 p-3 bg-background/50">
              {recipients.map((address, index) => (
                <div
                  key={address}
                  className="group flex items-center justify-between gap-2 p-2 bg-secondary/50 rounded-md text-sm animate-in slide-in-from-left-2"
                  style={{
                    animationDelay: `${index * 50}ms`,
                  }}
                >
                  <span className="truncate flex-1">{address}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 p-0 opacity-50 group-hover:opacity-100 transition-opacity shrink-0"
                    onClick={() => removeRecipient(address)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {showHelp && !error && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground animate-in fade-in-0">
          <Info className="h-4 w-4" />
          <p>Press Enter or use commas to add multiple addresses. You can also paste.</p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive animate-in slide-in-from-top-2">
          <AlertCircle className="h-4 w-4" />
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};
