export class ChainIdNotFoundError extends Error {
  constructor(public readonly chainId: number) {
    super(`No RPC URL configured for chain ID ${chainId}`)
    this.name = 'ChainIdNotFoundError'
  }
}

export interface SuperConfig {
  /**
   * Get all configured chain IDs
   * @returns Array of chain IDs
   */
  getChainIds(): number[]

  /**
   * Get the RPC URL for a given chain ID
   * @param chainId The chain ID to get the RPC URL for
   * @throws {ChainIdNotFoundError} If no RPC URL is configured for the given chain ID
   * @returns The RPC URL for the chain
   */
  getRpcUrl(chainId: number): string
}

export class StandardSuperConfig implements SuperConfig {
  constructor(private rpcMap: Record<number, string>) {}

  getChainIds(): number[] {
    return Object.keys(this.rpcMap).map(Number)
  }

  getRpcUrl(chainId: number): string {
    const url = this.rpcMap[chainId]
    if (!url) {
      throw new ChainIdNotFoundError(chainId)
    }
    return url
  }
} 