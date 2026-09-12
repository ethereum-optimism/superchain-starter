// Import contract artifacts
import { abi as tokenAbi } from '../../contracts/out/CrosschainFlashLoanToken.sol/CrosschainFlashLoanToken.json'
import { bytecode as tokenBytecode } from '../../contracts/out/CrosschainFlashLoanToken.sol/CrosschainFlashLoanToken.json'
import { abi as bridgeAbi } from '../../contracts/out/CrosschainFlashLoanBridge.sol/CrosschainFlashLoanBridge.json'
import { bytecode as bridgeBytecode } from '../../contracts/out/CrosschainFlashLoanBridge.sol/CrosschainFlashLoanBridge.json'
import { abi as vaultAbi } from '../../contracts/out/FlashLoanVault.sol/FlashLoanVault.json'
import { bytecode as vaultBytecode } from '../../contracts/out/FlashLoanVault.sol/FlashLoanVault.json'
import { abi as targetContractAbi } from '../../contracts/out/TargetContract.sol/TargetContract.json'
import { bytecode as targetContractBytecode } from '../../contracts/out/TargetContract.sol/TargetContract.json'

export const TOKEN_ABI = tokenAbi
export const TOKEN_BYTECODE = `0x${tokenBytecode.object.replace(/^0x/, '')}` as `0x${string}`

export const FLASH_LOAN_BRIDGE_ABI = bridgeAbi
export const FLASH_LOAN_BRIDGE_BYTECODE = `0x${bridgeBytecode.object.replace(/^0x/, '')}` as `0x${string}`

export const FLASH_LOAN_VAULT_ABI = vaultAbi
export const FLASH_LOAN_VAULT_BYTECODE = `0x${vaultBytecode.object.replace(/^0x/, '')}` as `0x${string}` 

export const TARGET_CONTRACT_ABI = targetContractAbi
export const TARGET_CONTRACT_BYTECODE = `0x${targetContractBytecode.object.replace(/^0x/, '')}` as `0x${string}`
