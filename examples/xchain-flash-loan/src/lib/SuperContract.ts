import { Address, TransactionReceipt, Abi, keccak256, toHex, getCreate2Address, Log, Block, encodeFunctionData, encodeDeployData, createPublicClient, createWalletClient, http } from 'viem'
import { CREATE2_FACTORY_ADDRESS } from './constants'
import { Wallet } from './Wallet'
import { SuperConfig } from './SuperConfig'

// Default salt value
const defaultSalt = '0x' + keccak256(toHex('my_salt')).slice(2, 34).padStart(64, '0') as `0x${string}`

export interface SuperContractOptions {
  /** Optional salt for CREATE2 deployment */
  salt?: `0x${string}`
  /** Optional address to interact with existing contract (e.g. predeployed contracts) */
  address?: Address
}

export class SuperContract {
  public readonly address: Address

  constructor(
    private config: SuperConfig,
    private wallet: Wallet,
    private abi: Abi,
    private bytecode: `0x${string}`,
    private constructorArgs: any[] = [],
    options?: Partial<SuperContractOptions>
  ) {
    const { salt = defaultSalt, address } = options || {}

    // Store salt for CREATE2 deployment
    this.salt = salt

    // Use provided address or compute deterministic address
    if (address) {
      this.address = address
    } else {
      const deployData = encodeDeployData({
        abi,
        bytecode,
        args: constructorArgs
      })
      this.address = this.computeAddress(deployData)
    }
  }

  private salt: `0x${string}`

  private getClients(chainId: number) {
    const rpcUrl = this.config.getRpcUrl(chainId)
    
    const customChain = {
      id: chainId,
      name: `Chain ${chainId}`,
      network: `network-${chainId}`,
      nativeCurrency: {
        name: 'Ether',
        symbol: 'ETH',
        decimals: 18,
      },
      rpcUrls: {
        default: { http: [rpcUrl] },
        public: { http: [rpcUrl] },
      },
    }

    return {
      publicClient: createPublicClient({
        chain: customChain,
        transport: http(rpcUrl)
      }),
      walletClient: createWalletClient({
        account: this.wallet.getAccount(),
        chain: customChain,
        transport: http(rpcUrl)
      })
    }
  }

  private computeAddress(initcode: `0x${string}`): Address {
    const initCodeHash = keccak256(initcode)
    return getCreate2Address({
      from: CREATE2_FACTORY_ADDRESS,
      salt: this.salt,
      bytecodeHash: initCodeHash,
    })
  }

  async deploy(chainId: number): Promise<TransactionReceipt> {
    const { publicClient, walletClient } = this.getClients(chainId)
    const deployData = encodeDeployData({
      abi: this.abi,
      bytecode: this.bytecode,
      args: this.constructorArgs
    })

    const data = `0x${this.salt.replace(/^0x/, '')}${deployData.replace(/^0x/, '')}` as `0x${string}`

    console.debug('Deploying contract:')
    console.debug('Chain ID:', chainId)
    console.debug('To (CREATE2 Factory):', CREATE2_FACTORY_ADDRESS)
    console.debug('Salt:', this.salt)

    const hash = await walletClient.sendTransaction({
      account: this.wallet.getAccount(),
      chain: walletClient.chain,
      to: CREATE2_FACTORY_ADDRESS,
      data: data,
    })

    console.debug('Transaction sent. Hash:', hash)

    const receipt = await publicClient.waitForTransactionReceipt({ 
      hash,
      pollingInterval: 100,
      retryDelay: 100,
      retryCount: 100,
    })

    console.debug('Contract deployment receipt:', {
      transactionHash: receipt.transactionHash,
      contractAddress: receipt.contractAddress,
      gasUsed: receipt.gasUsed,
      status: receipt.status
    })

    if (receipt.status === 'reverted') {
      throw new Error('Contract deployment failed - transaction reverted')
    }

    // Verify the contract was actually deployed
    const code = await publicClient.getBytecode({ address: this.address })
    if (!code || code === '0x') {
      throw new Error('Contract deployment failed - no code at target address')
    }

    return receipt
  }

  async isDeployed(chainId: number): Promise<boolean> {
    const { publicClient } = this.getClients(chainId)
    try {
      const code = await publicClient.getCode({ address: this.address })
      return code !== undefined && code !== '0x'
    } catch (error) {
      console.error('Error checking contract deployment:', error)
      return false
    }
  }

  async sendTx(chainId: number, functionName: string, args: any[] = [], value: bigint = BigInt(0)): Promise<TransactionReceipt> {
    const { publicClient, walletClient } = this.getClients(chainId)
    console.debug(`Preparing to send transaction for function ${functionName} with args:`, args)

    const data = encodeFunctionData({
      abi: this.abi,
      functionName,
      args,
    })

    const chain = walletClient.chain
    const nonceBigInt = await publicClient.getTransactionCount({
      address: this.wallet.getAccount().address,
      blockTag: 'pending',
    })
    const nonce = Number(nonceBigInt)
    const gasLimit = await publicClient.estimateGas({
      account: this.wallet.getAccount().address,
      to: this.address,
      value,
      data,
    })
    const gasPrice = await publicClient.getGasPrice()

    const transaction = {
      to: this.address,
      data: data as `0x${string}`,
      gas: gasLimit as bigint,
      gasPrice: gasPrice as bigint,
      nonce: nonce as number,
      value,
      chain,
      account: this.wallet.getAccount(),
    }

    const serializedTransaction = await walletClient.signTransaction(transaction)
    console.debug(`${functionName} transaction signed. Serialized:`, serializedTransaction)

    const hash = await walletClient.sendRawTransaction({ serializedTransaction })
    console.debug(`${functionName} raw transaction sent. Hash:`, hash)

    const receipt = await publicClient.waitForTransactionReceipt({ hash })
    console.debug(`${functionName} transaction receipt:`, receipt)

    return receipt
  }

  async call(chainId: number, functionName: string, args: any[] = []): Promise<any> {
    const { publicClient } = this.getClients(chainId)
    console.debug(`Calling function ${functionName} with args:`, args)
    
    const result = await publicClient.readContract({
      address: this.address,
      abi: this.abi,
      functionName,
      args,
    })
    console.debug(`Result of ${functionName}:`, result)
    return result
  }

  watchEvents(chainId: number, fromBlock: bigint, onEvent: (log: Log, block: Block) => void): () => void {
    const { publicClient } = this.getClients(chainId)
    const unwatch = publicClient.watchContractEvent({
      address: this.address,
      abi: this.abi,
      onLogs: async (logs: Log[]) => {
        for (const log of logs) {
          if (log.blockNumber) {
            const block = await publicClient.getBlock({ blockNumber: log.blockNumber })
            onEvent(log, block)
          } else {
            console.warn('Event received without block number:', log)
          }
        }
      },
      fromBlock,
    })

    return unwatch
  }
}
