import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { SuperContractOptions } from './superContract';
import { SuperContract } from './superContract';
import { Wallet } from './Wallet';
import { SuperConfig } from './SuperConfig';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const sortBy = <T>(array: T[], ...fns: ((item: T) => number | bigint)[]) => {
  return array.sort((a, b) => {
    for (const fn of fns) {
      const aValue = fn(a);
      const bValue = fn(b);
      const comparison =
        typeof aValue === 'bigint' && typeof bValue === 'bigint'
          ? Number(aValue - bValue)
          : Number(aValue) - Number(bValue);

      if (comparison !== 0) return comparison;
    }
    return 0;
  });
};

/**
 * Helper function to create a SuperContract instance with all required dependencies
 * @param config - SuperConfig instance for managing chain IDs and RPC URLs
 * @param wallet - Either a SuperWallet instance or a private key (as hex string with 0x prefix)
 * @param abi - Contract ABI
 * @param bytecode - Contract bytecode (with 0x prefix)
 * @param constructorArgs - Arguments for the contract constructor
 * @param options - Optional configuration:
 *   - salt: Optional salt for CREATE2 deployment
 *   - address: Optional address to interact with existing contract (e.g. predeployed contracts)
 * @returns SuperContract instance ready for deployment/interaction
 */
export function getSuperContract(
  config: SuperConfig,
  wallet: Wallet | `0x${string}`,
  abi: any[],
  bytecode: `0x${string}`,
  constructorArgs: any[] = [],
  options?: Partial<SuperContractOptions>
): SuperContract {
  const superWallet = wallet instanceof Wallet ? wallet : new Wallet(wallet)
  return new SuperContract(
    config,
    superWallet,
    abi,
    bytecode,
    constructorArgs,
    options
  )
}
