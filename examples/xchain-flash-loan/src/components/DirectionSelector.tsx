import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { Chain } from 'viem';

export const DirectionSelector = ({
  allowedChains,
  value,
  onChange,
}: {
  allowedChains: Chain[];
  value: {
    source: Chain;
    destination: Chain;
  };
  onChange: (value: { source: Chain; destination: Chain }) => void;
}) => {
  const handleSourceChange = (chainId: string) => {
    const newSource = allowedChains.find(chain => chain.id.toString() === chainId);
    if (newSource) {
      // If new source is same as current destination, pick first available different chain
      if (newSource.id === value.destination.id) {
        const newDestination = allowedChains.find(chain => chain.id !== newSource.id);
        if (newDestination) {
          onChange({ source: newSource, destination: newDestination });
        }
      } else {
        onChange({ ...value, source: newSource });
      }
    }
  };

  const handleDestinationChange = (chainId: string) => {
    const newDestination = allowedChains.find(chain => chain.id.toString() === chainId);
    if (newDestination) {
      onChange({ ...value, destination: newDestination });
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>From</Label>
          <Select onValueChange={handleSourceChange} value={value.source.id.toString()}>
            <SelectTrigger>
              <SelectValue placeholder="Select network" />
            </SelectTrigger>
            <SelectContent>
              {allowedChains.map(chain => (
                <SelectItem key={chain.id} value={chain.id.toString()}>
                  {chain.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>To</Label>
          <Select
            onValueChange={handleDestinationChange}
            value={value.destination.id.toString()}
            disabled={!value.source}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select network" />
            </SelectTrigger>
            <SelectContent>
              {allowedChains
                .filter(chain => chain.id !== value.source.id)
                .map(chain => (
                  <SelectItem key={chain.id} value={chain.id.toString()}>
                    {chain.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
