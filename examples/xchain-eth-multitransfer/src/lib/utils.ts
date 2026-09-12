import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

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
