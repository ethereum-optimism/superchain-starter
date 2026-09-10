import { describe, it, expect, beforeAll } from 'vitest'
// import { SuperContract, SuperWallet as Wallet, getSuperContract } from 'superchain-starter'
import { SuperContract } from '../lib/superContract'
import { Wallet } from '../lib/Wallet'
import { getSuperContract } from '../lib/utils'
import { encodeFunctionData } from 'viem'
import {
    TOKEN_ABI,
    TOKEN_BYTECODE,
    FLASH_LOAN_BRIDGE_ABI,
    FLASH_LOAN_BRIDGE_BYTECODE,
    FLASH_LOAN_VAULT_ABI,
    FLASH_LOAN_VAULT_BYTECODE,
    TARGET_CONTRACT_ABI,
    TARGET_CONTRACT_BYTECODE
} from '../abi/contracts'
import { setTimeout } from 'timers/promises'
import { StandardSuperConfig } from '../lib/SuperConfig'

const config = new StandardSuperConfig({
    901: 'http://127.0.0.1:9545', // Local chain 1
    902: 'http://127.0.0.1:9546'  // Local chain 2
}) 

describe('CrosschainFlashLoanBridge End-to-End Tests', () => {
    const PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as const
    const wallet = new Wallet(PRIVATE_KEY)
    const FEE = 10000000000000000n // 0.01 ETH

    let token: SuperContract
    let vault: SuperContract
    let bridge: SuperContract
    let target: SuperContract

    beforeAll(async () => {
        // Deploy token contract
     token = getSuperContract(
        config,
        wallet,
        TOKEN_ABI,
        TOKEN_BYTECODE,
        [wallet.getAccount().address] // Pass owner address to constructor
    )

    // Deploy vault contract
     vault = getSuperContract(
        config,
        wallet,
        FLASH_LOAN_VAULT_ABI,
        FLASH_LOAN_VAULT_BYTECODE,
        [] // No constructor args
    )

    // Deploy bridge contract
     bridge = getSuperContract(
        config,
        wallet,
        FLASH_LOAN_BRIDGE_ABI,
        FLASH_LOAN_BRIDGE_BYTECODE,
        [
            token.address, // token address
            vault.address, // vault address
            FEE, // flat fee
            wallet.getAccount().address // owner
        ]
    )

    // Deploy target contract for testing flash loan execution
     target = getSuperContract(
        config,
        wallet,
        TARGET_CONTRACT_ABI,
        TARGET_CONTRACT_BYTECODE,
        [] // No constructor args
        )

         // Deploy all contracts on chain 901
         await token.deploy(901)
         await vault.deploy(901)
         await bridge.deploy(901)
         
         // Deploy all contracts on chain 902
         await token.deploy(902)
         await vault.deploy(902)
         await bridge.deploy(902)
         await target.deploy(902)
    })

    it('should deploy all contracts successfully', async () => {
        // Verify all deployments
        expect(await token.isDeployed(901)).toBe(true)
        expect(await vault.isDeployed(901)).toBe(true)
        expect(await bridge.isDeployed(901)).toBe(true)
        expect(await token.isDeployed(902)).toBe(true)
        expect(await vault.isDeployed(902)).toBe(true)
        expect(await bridge.isDeployed(902)).toBe(true)
        expect(await target.isDeployed(902)).toBe(true)
    })

    it('should execute a cross-chain flash loan', async () => {
        // Mint tokens for the bridge on chain 901
        const amount = 1000n
        await token.sendTx(901, 'mint', [bridge.address, amount])
        const bridgePreBalance = await token.call(901, 'balanceOf', [bridge.address])
        expect(bridgePreBalance).toBe(amount)

        // Get initial value in target contract
        const initialValue = await target.call(902, 'getValue', [])
        expect(initialValue).toBe(0n)

        // calldata that should be exectuted when the flash loan is executed
        const callData = encodeFunctionData({
            abi: TARGET_CONTRACT_ABI,
            functionName: 'setValue',
            args: [token.address]
          })

        // Initiate flash loan from chain 901 to 902
        await bridge.sendTx(901, 'initiateCrosschainFlashLoan', [
            902n,
            amount,
            target.address,
            callData,
        ], FEE)

        // Wait for cross-chain message to be processed
        await setTimeout(5000)

        // Verify target contract value was updated
        const finalValue = await target.call(902, 'getValue', [])
        expect(finalValue).toBe(amount)

        // wait for the tokens to be sent back to the bridge
        await setTimeout(5000)
        const bridgeBalance = await token.call(901, 'balanceOf', [bridge.address])
        expect(bridgeBalance).toBe(amount)
    })

    it('should fail when fee is insufficient', async () => {
        const amount = 1000n
        const callData = '0x55241077000000000000000000000000000000000000000000000000000000000000002a'

        // Try to initiate flash loan with insufficient fee
        await expect(
            bridge.sendTx(901, 'initiateCrosschainFlashLoan', [
                902n,
                amount,
                target.address,
                callData,
                { value: FEE - 1n }
            ])
        ).rejects.toThrow()
    })

    it('should allow owner to withdraw fees', async () => {
        // Withdraw fees should succeed when called by owner
        await expect(
            bridge.sendTx(901, 'withdrawFees', [])
        ).resolves.toBeDefined()

        // Withdraw fees should fail when called by non-owner
        const nonOwner = new Wallet('0x2222222222222222222222222222222222222222222222222222222222222222')
        const nonOwnerBridge = getSuperContract(
            config,
            nonOwner,
            FLASH_LOAN_BRIDGE_ABI,
            FLASH_LOAN_BRIDGE_BYTECODE,
            [
                token.address,
                vault.address,
                FEE,
                wallet.getAccount().address
            ]
        )

        await expect(
            nonOwnerBridge.sendTx(901, 'withdrawFees', [])
        ).rejects.toThrow()
    })
}) 