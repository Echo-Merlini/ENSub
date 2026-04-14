import { useState, useEffect } from 'react'
import { WagmiProvider, useAccount, useWriteContract, useSwitchChain, useChainId, createConfig, http } from 'wagmi'
import { waitForTransactionReceipt, deployContract } from '@wagmi/core'
import { decodeEventLog, namehash } from 'viem'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider, ConnectButton, connectorsForWallets, darkTheme, lightTheme } from '@rainbow-me/rainbowkit'
import { injectedWallet, metaMaskWallet, rainbowWallet, coinbaseWallet, walletConnectWallet } from '@rainbow-me/rainbowkit/wallets'
import { mainnet, base, optimism, arbitrum, polygon, linea, scroll } from 'wagmi/chains'
import '@rainbow-me/rainbowkit/styles.css'

const DURIN_CHAINS = [
    { id: 8453,   name: 'Base',      icon: '🔵' },
    { id: 10,     name: 'Optimism',  icon: '🔴' },
    { id: 42161,  name: 'Arbitrum',  icon: '🔷' },
    { id: 137,    name: 'Polygon',   icon: '🟣' },
    { id: 59144,  name: 'Linea',     icon: '⬛' },
    { id: 534352, name: 'Scroll',    icon: '🟡' },
]

const CHAIN_META: Record<number, { wagmiChain: any }> = {
    8453:   { wagmiChain: base     },
    10:     { wagmiChain: optimism },
    42161:  { wagmiChain: arbitrum },
    137:    { wagmiChain: polygon  },
    59144:  { wagmiChain: linea    },
    534352: { wagmiChain: scroll   },
}

const FACTORY_ADDRESS    = '0xDddddDdDDD8Aa1f237b4fa0669cb46892346d22d' as const
const L1_RESOLVER_ADDRESS       = '0x8A968aB9eb8C084FBC44c531058Fc9ef945c3D61' as const
const NAMESTONE_RESOLVER_ADDRESS = '0xA87361C4E58B619c390f469B9E6F27d759715125' as const
const ENS_REGISTRY_ADDRESS       = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e' as const

const L1_RESOLVER_ABI = [
    {
        name: 'setL2Registry',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'node',            type: 'bytes32' },
            { name: 'chainId',         type: 'uint64'  },
            { name: 'registryAddress', type: 'address' },
        ],
        outputs: [],
    },
] as const

const ENS_REGISTRY_ABI = [
    {
        name: 'setResolver',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'node',     type: 'bytes32' },
            { name: 'resolver', type: 'address' },
        ],
        outputs: [],
    },
] as const

// Compiled L2Registrar bytecode (open registrar, free registration, no restrictions)
// Source: src/examples/L2Registrar.sol from namestonehq/durin
const L2_REGISTRAR_BYTECODE = '0x60e060405234801561000f575f80fd5b50604051610a57380380610a5783398101604081905261002e9161004e565b4660a081905263800000001760c0526001600160a01b031660805261007b565b5f6020828403121561005e575f80fd5b81516001600160a01b0381168114610074575f80fd5b9392505050565b60805160a05160c05161096f6100e85f395f8181607301526102b701525f60ec01525f818160ad015281816101340152818161016301528181610280015281816103230152818161038e015281816103bd015281816105200152818161054f0152610647015261096f5ff3fe608060405234801561000f575f80fd5b5060043610610055575f3560e01c80631e59c529146100595780631fe93ea81461006e5780637b103999146100a85780639a8a0592146100e7578063aeb8ce9b1461010e575b5f80fd5b61006c61006736600461072c565b610131565b005b6100957f000000000000000000000000000000000000000000000000000000000000000081565b6040519081526020015b60405180910390f35b6100cf7f000000000000000000000000000000000000000000000000000000000000000081565b6040516001600160a01b03909116815260200161009f565b6100957f000000000000000000000000000000000000000000000000000000000000000081565b61012161011c36600461077f565b61051c565b604051901515815260200161009f565b5f7f00000000000000000000000000000000000000000000000000000000000000006001600160a01b031663b0c3ade47f00000000000000000000000000000000000000000000000000000000000000006001600160a01b031663ddf7fcb06040518163ffffffff1660e01b8152600401602060405180830381865afa1580156101bd573d5f803e3d5ffd5b505050506040513d601f19601f820116820180604052508101906101e191906107be565b86866040518463ffffffff1660e01b8152600401610201939291906107fd565b602060405180830381865afa15801561021c573d5f803e3d5ffd5b505050506040513d601f19601f8201168201806040525081019061024091906107be565b60408051606085901b6bffffffffffffffffffffffff19166020820152815160148183030181526034820192839052638b95dd7160e01b909252919250907f00000000000000000000000000000000000000000000000000000000000000006001600160a01b031690638b95dd71906102e19085907f0000000000000000000000000000000000000000000000000000000000000000908690603801610862565b5f604051808303815f87803b1580156102f8575f80fd5b505af115801561030a573d5f803e3d5ffd5b5050604051638b95dd7160e01b81526001600160a01b037f0000000000000000000000000000000000000000000000000000000000000000169250638b95dd71915061035f908590603c908690600401610862565b5f604051808303815f87803b158015610376575f80fd5b505af1158015610388573d5f803e3d5ffd5b505050507f00000000000000000000000000000000000000000000000000000000000000006001600160a01b0316638bf9baba7f00000000000000000000000000000000000000000000000000000000000000006001600160a01b031663ddf7fcb06040518163ffffffff1660e01b8152600401602060405180830381865afa158015610417573d5f803e3d5ffd5b505050506040513d601f19601f8201168201806040525081019061043b91906107be565b604080515f8082526020820190925289918991899161046a565b60608152602001906001900390816104555790505b506040518663ffffffff1660e01b815260040161048b959493929190610880565b6020604051808303815f875af11580156104a7573d5f803e3d5ffd5b505050506040513d601f19601f820116820180604052508101906104cb91906107be565b50826001600160a01b031685856040516104e6929190610908565b604051908190038120907f1c6eac0e720ec22bb0653aec9c19985633a4fb07971cf973096c2f8e3c37c17f905f90a35050505050565b5f807f00000000000000000000000000000000000000000000000000000000000000006001600160a01b031663b0c3ade47f00000000000000000000000000000000000000000000000000000000000000006001600160a01b031663ddf7fcb06040518163ffffffff1660e01b8152600401602060405180830381865afa1580156105a9573d5f803e3d5ffd5b505050506040513d601f19601f820116820180604052508101906105cd91906107be565b86866040518463ffffffff1660e01b81526004016105ed939291906107fd565b602060405180830381865afa158015610608573d5f803e3d5ffd5b505050506040513d601f19601f8201168201806040525081019061062c91906107be565b6040516331a9108f60e11b81526004810182905290915081907f00000000000000000000000000000000000000000000000000000000000000006001600160a01b031690636352211e90602401602060405180830381865afa9250505080156106b2575060408051601f3d908101601f191682019092526106af91810190610917565b60015b6106c35750505060038110156106ca565b505f925050505b92915050565b5f8083601f8401126106e0575f80fd5b50813567ffffffffffffffff8111156106f7575f80fd5b60208301915083602082850101111561070e575f80fd5b9250929050565b6001600160a01b0381168114610729575f80fd5b50565b5f805f6040848603121561073e575f80fd5b833567ffffffffffffffff811115610754575f80fd5b610760868287016106d0565b909450925050602084013561077481610715565b809150509250925092565b5f8060208385031215610790575f80fd5b823567ffffffffffffffff8111156107a6575f80fd5b6107b2858286016106d0565b90969095509350505050565b5f602082840312156107ce575f80fd5b5051919050565b81835281816020850137505f828201602090810191909152601f909101601f19169091010190565b838152604060208201525f6108166040830184866107d5565b95945050505050565b5f81518084525f5b8181101561084357602081850181015186830182015201610827565b505f602082860101526020601f19601f83011685010191505092915050565b838152826020820152606060408201525f610816606083018461081f565b8581525f602060808184015261089a6080840187896107d5565b6001600160a01b03861660408501528381036060850152845180825282820190600581901b830184018488015f5b838110156108f657601f198684030185526108e483835161081f565b948701949250908601906001016108c8565b50909c9b505050505050505050505050565b818382375f9101908152919050565b5f60208284031215610927575f80fd5b815161093281610715565b939250505056fea2646970667358221220d362d3d6dd045e0ba3c3489a96de1a0c7fe074cd33379b1b6eb23011de70202a64736f6c63430008140033' as const

const L2_REGISTRAR_ABI = [
    {
        name: 'constructor',
        type: 'constructor',
        stateMutability: 'nonpayable',
        inputs: [{ name: '_registry', type: 'address' }],
    },
    {
        name: 'register',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [{ name: 'label', type: 'string' }, { name: 'owner', type: 'address' }],
        outputs: [],
    },
] as const

const REGISTRY_ABI = [
    {
        name: 'addRegistrar',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [{ name: 'registrar', type: 'address' }],
        outputs: [],
    },
    {
        name: 'setBaseURI',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [{ name: 'baseURI', type: 'string' }],
        outputs: [],
    },
] as const

const FACTORY_ABI = [
    {
        name: 'deployRegistry',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [{ name: 'name', type: 'string' }],
        outputs: [{ name: '', type: 'address' }],
    },
    {
        name: 'RegistryDeployed',
        type: 'event',
        inputs: [
            { name: 'name',     type: 'string',  indexed: false },
            { name: 'admin',    type: 'address', indexed: false },
            { name: 'registry', type: 'address', indexed: false },
        ],
    },
] as const

interface ChainEntry {
    chain_id: number
    chain_name: string
    registry_address: string | null
    registrar_address: string | null
    enabled: boolean
}

interface ClaimEntry {
    id: number
    wallet_address: string
    subdomain: string
    full_name: string
    claimed_at: string
    minted_chains: number[]
}

interface TenantData {
    name: string
    ens_domain: string
    slug: string
    owner_address: string
    logo_url: string | null
    accent_color: string
    claim_limit: number
    claims_count: number
    plan: string
    gate_type: string
    contract_address: string | null
    collection_slug: string | null
    min_balance: string | null
    allowlist_addresses: string | null
    namestone_api_key: string
    claims: ClaimEntry[]
    chains: ChainEntry[]
}

const queryClient = new QueryClient()

function getWagmiConfig() {
    const projectId = (window as any).__WALLETCONNECT_PROJECT_ID__ || '3b3f1c4ecbfa7edd5c5327b56985074a'
    const alchemyKey = (window as any).__ALCHEMY_KEY__
    const rpcUrl = alchemyKey ? `https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}` : 'https://cloudflare-eth.com'
    return createConfig({
        chains: [mainnet, base, optimism, arbitrum, polygon, linea, scroll],
        connectors: connectorsForWallets(
            [{ groupName: 'Popular', wallets: [injectedWallet, metaMaskWallet, rainbowWallet, coinbaseWallet, walletConnectWallet] }],
            { appName: 'ENSub', projectId }
        ),
        transports: {
            [mainnet.id]:  http(rpcUrl),
            [base.id]:     http(),
            [optimism.id]: http(),
            [arbitrum.id]: http(),
            [polygon.id]:  http(),
            [linea.id]:    http(),
            [scroll.id]:   http(),
        },
        ssr: false,
    })
}

const wagmiConfig = getWagmiConfig()

const COLORS = {
    bg:     'var(--bg-primary)',
    card:   'var(--card-bg)',
    border: 'var(--card-border)',
    text:   'var(--text)',
    muted:  'var(--text-muted)',
    dim:    'var(--text-dim)',
}

const inputStyle = {
    width: '100%',
    background: 'var(--input-bg)',
    border: '1.5px solid var(--input-border)',
    borderRadius: '8px',
    padding: '10px 14px',
    color: 'var(--text)',
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: '0.9rem',
    outline: 'none',
    boxSizing: 'border-box' as const,
}

const labelStyle = {
    display: 'block',
    fontSize: '0.78rem',
    color: 'var(--text-muted)',
    marginBottom: '5px',
    letterSpacing: '0.05em',
} as const

function ManageContent({ tenant }: { tenant: TenantData }) {
    const { address, isConnected } = useAccount()
    const { writeContractAsync } = useWriteContract()
    const { switchChain } = useSwitchChain()
    const currentChainId = useChainId()
    const accent = tenant.accent_color

    const [form, setForm] = useState({
        name: tenant.name,
        logo_url: tenant.logo_url ?? '',
        accent_color: tenant.accent_color,
        namestone_api_key: tenant.namestone_api_key,
        gate_type: tenant.gate_type,
        contract_address: tenant.contract_address ?? '',
        collection_slug: tenant.collection_slug ?? '',
        min_balance: tenant.min_balance ?? '1',
        allowlist_addresses: tenant.allowlist_addresses ?? '',
        claim_limit: tenant.claim_limit,
    })
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [error, setError] = useState('')
    const [claims, setClaims] = useState<ClaimEntry[]>(tenant.claims)
    const [revoking, setRevoking] = useState<number | null>(null)
    const [linkCopied, setLinkCopied] = useState(false)
    const [embedCopied, setEmbedCopied] = useState(false)

    // L2 chains (Durin)
    const [chains, setChains] = useState<ChainEntry[]>(tenant.chains ?? [])
    const [addingChain, setAddingChain] = useState(false)
    const [newChainId, setNewChainId] = useState<number>(8453)
    const [newRegistry, setNewRegistry] = useState('')
    const [newRegistrar, setNewRegistrar] = useState('')
    const [chainSaving, setChainSaving] = useState(false)
    const [chainError, setChainError] = useState('')
    const [deployStep, setDeployStep] = useState('')
    const [syncing, setSyncing] = useState(false)
    const [syncResult, setSyncResult] = useState('')

    // Phase 2: ENS on-chain resolution
    const [ensResolutionSaving, setEnsResolutionSaving] = useState(false)
    const [ensResolutionStep, setEnsResolutionStep] = useState('')
    const [ensResolutionError, setEnsResolutionError] = useState('')

    const handleAddChain = async () => {
        if (!newRegistry.trim() || !newRegistrar.trim()) {
            setChainError('Both addresses are required')
            return
        }
        setChainSaving(true)
        setChainError('')
        try {
            const res = await fetch(`/api/manage/${tenant.slug}/chains`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chain_id: newChainId,
                    chain_name: DURIN_CHAINS.find(c => c.id === newChainId)?.name ?? String(newChainId),
                    registry_address: newRegistry.trim(),
                    registrar_address: newRegistrar.trim(),
                }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.message || 'Failed')
            setChains(prev => [...prev.filter(c => c.chain_id !== newChainId), {
                chain_id: data.chain_id,
                chain_name: data.chain_name,
                registry_address: data.registry_address,
                registrar_address: data.registrar_address,
                enabled: true,
            }])
            setAddingChain(false)
            setNewRegistry('')
            setNewRegistrar('')
        } catch (e: any) {
            setChainError(e.message)
        } finally {
            setChainSaving(false)
        }
    }

    const handleToggleChain = async (chainId: number, enabled: boolean) => {
        await fetch(`/api/manage/${tenant.slug}/chains/${chainId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enabled }),
        })
        setChains(prev => prev.map(c => c.chain_id === chainId ? { ...c, enabled } : c))
    }

    const handleRemoveChain = async (chainId: number) => {
        await fetch(`/api/manage/${tenant.slug}/chains/${chainId}`, { method: 'DELETE' })
        setChains(prev => prev.filter(c => c.chain_id !== chainId))
    }

    // Redeploy registrar for an existing chain (keeps registry, replaces registrar)
    const handleRedeployRegistrar = async (ch: ChainEntry) => {
        setChainSaving(true)
        setChainError('')
        setDeployStep('')
        try {
            if (currentChainId !== ch.chain_id) {
                await switchChain({ chainId: ch.chain_id })
            }
            setDeployStep('1/2 Deploying registrar…')
            const deployTxHash = await deployContract(wagmiConfig, {
                abi: L2_REGISTRAR_ABI,
                bytecode: L2_REGISTRAR_BYTECODE,
                args: [ch.registry_address as `0x${string}`],
                account: address as `0x${string}`,
                chainId: ch.chain_id,
            })
            const deployReceipt = await waitForTransactionReceipt(wagmiConfig, { hash: deployTxHash, chainId: ch.chain_id })
            const registrarAddr = deployReceipt.contractAddress
            if (!registrarAddr) throw new Error('No contract address in receipt')

            setDeployStep('2/3 Authorizing…')
            const authTxHash = await writeContractAsync({
                address: ch.registry_address as `0x${string}`,
                abi: REGISTRY_ABI,
                functionName: 'addRegistrar',
                args: [registrarAddr],
                chainId: ch.chain_id,
            })
            await waitForTransactionReceipt(wagmiConfig, { hash: authTxHash, chainId: ch.chain_id })

            setDeployStep('3/3 Setting metadata URI…')
            const metaUri = `${window.location.origin}/nft/${tenant.slug}/${ch.chain_id}/`
            const metaTxHash = await writeContractAsync({
                address: ch.registry_address as `0x${string}`,
                abi: REGISTRY_ABI,
                functionName: 'setBaseURI',
                args: [metaUri],
                chainId: ch.chain_id,
            })
            await waitForTransactionReceipt(wagmiConfig, { hash: metaTxHash, chainId: ch.chain_id })

            // Persist the new registrar address
            await fetch(`/api/manage/${tenant.slug}/chains/${ch.chain_id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ registrar_address: registrarAddr }),
            })
            setChains(prev => prev.map(c => c.chain_id === ch.chain_id ? { ...c, registrar_address: registrarAddr } : c))
            setDeployStep('')
        } catch (e: any) {
            setChainError(e.shortMessage ?? e.message ?? 'Redeploy failed')
            setDeployStep('')
        } finally {
            setChainSaving(false)
        }
    }

    const handleDeployRegistry = async () => {
        setChainSaving(true)
        setChainError('')
        setDeployStep('')
        try {
            if (currentChainId !== newChainId) {
                await switchChain({ chainId: newChainId })
            }

            let registryAddr = newRegistry.trim()

            if (!registryAddr) {
                // Step 1: Deploy L2Registry via factory
                setDeployStep('1/3 Deploying registry…')
                const txHash = await writeContractAsync({
                    address: FACTORY_ADDRESS,
                    abi: FACTORY_ABI,
                    functionName: 'deployRegistry',
                    args: [tenant.ens_domain],
                    chainId: newChainId,
                })
                const receipt = await waitForTransactionReceipt(wagmiConfig, { hash: txHash, chainId: newChainId })
                for (const log of receipt.logs) {
                    try {
                        const decoded = decodeEventLog({ abi: FACTORY_ABI, data: log.data, topics: log.topics as any })
                        if (decoded.eventName === 'RegistryDeployed') {
                            registryAddr = (decoded.args as any).registry as string
                            break
                        }
                    } catch {}
                }
                if (!registryAddr) throw new Error('Could not find RegistryDeployed event')
                setNewRegistry(registryAddr)
            }

            // Step 2: Deploy L2Registrar (open, free) pointing at the registry
            setDeployStep(`${newRegistry ? '1' : '2'}/2 Deploying registrar…`)
            const deployTxHash = await deployContract(wagmiConfig, {
                abi: L2_REGISTRAR_ABI,
                bytecode: L2_REGISTRAR_BYTECODE,
                args: [registryAddr as `0x${string}`],
                account: address as `0x${string}`,
                chainId: newChainId,
            })
            const deployReceipt = await waitForTransactionReceipt(wagmiConfig, { hash: deployTxHash, chainId: newChainId })
            const registrarAddr = deployReceipt.contractAddress
            if (!registrarAddr) throw new Error('Registrar deployment failed — no contract address')

            // Step 3: Authorize registrar on the registry
            const totalSteps = newRegistry ? 2 : 3
            setDeployStep(`${totalSteps - 1}/${totalSteps} Authorizing…`)
            const authTxHash = await writeContractAsync({
                address: registryAddr as `0x${string}`,
                abi: REGISTRY_ABI,
                functionName: 'addRegistrar',
                args: [registrarAddr],
                chainId: newChainId,
            })
            await waitForTransactionReceipt(wagmiConfig, { hash: authTxHash, chainId: newChainId })

            // Step 4: Set metadata base URI
            setDeployStep(`${totalSteps}/${totalSteps} Setting metadata URI…`)
            const metaUri = `${window.location.origin}/nft/${tenant.slug}/${newChainId}/`
            const metaTxHash = await writeContractAsync({
                address: registryAddr as `0x${string}`,
                abi: REGISTRY_ABI,
                functionName: 'setBaseURI',
                args: [metaUri],
                chainId: newChainId,
            })
            await waitForTransactionReceipt(wagmiConfig, { hash: metaTxHash, chainId: newChainId })

            setNewRegistrar(registrarAddr)
            setDeployStep('')
        } catch (e: any) {
            setChainError(e.shortMessage ?? e.message ?? 'Deploy failed')
            setDeployStep('')
        } finally {
            setChainSaving(false)
        }
    }

    // Phase 2: set ENS resolver (generic — takes target address)
    const handleSyncL2Mints = async () => {
        setSyncing(true)
        setSyncResult('')
        try {
            const res = await fetch(`/api/manage/${tenant.slug}/chains/sync`, { method: 'POST' })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Sync failed')
            // Refresh chains (updated last_synced_block) and claims
            if (Array.isArray(data.chains)) setChains(data.chains)
            setSyncResult('Sync complete')
            // Refresh claims list
            const claimsRes = await fetch(`/api/claim/${tenant.slug}/mine?all=1`)
            // mine endpoint is per-wallet — refetch manage page claims instead
            setTimeout(() => setSyncResult(''), 4000)
        } catch (e: any) {
            setSyncResult(e.message)
        } finally {
            setSyncing(false)
        }
    }

    const handleSetResolverTo = async (resolverAddress: `0x${string}`, label: string) => {
        setEnsResolutionSaving(true)
        setEnsResolutionError('')
        setEnsResolutionStep('')
        try {
            if (currentChainId !== mainnet.id) {
                await switchChain({ chainId: mainnet.id })
            }
            setEnsResolutionStep(`${label}…`)
            const node = namehash(tenant.ens_domain)
            const txHash = await writeContractAsync({
                address: ENS_REGISTRY_ADDRESS,
                abi: ENS_REGISTRY_ABI,
                functionName: 'setResolver',
                args: [node, resolverAddress],
                chainId: mainnet.id,
            })
            await waitForTransactionReceipt(wagmiConfig, { hash: txHash, chainId: mainnet.id })
            setEnsResolutionStep('')
        } catch (e: any) {
            setEnsResolutionError(e.shortMessage ?? e.message ?? 'Failed to set resolver')
            setEnsResolutionStep('')
        } finally {
            setEnsResolutionSaving(false)
        }
    }

    const handleSetResolver         = () => handleSetResolverTo(L1_RESOLVER_ADDRESS,       'Setting Durin resolver on mainnet')
    const handleRevertToNamestone   = () => handleSetResolverTo(NAMESTONE_RESOLVER_ADDRESS, 'Reverting to Namestone resolver')

    // Phase 2: register L2Registry with L1Resolver on mainnet for a specific chain
    const handleSetL2Registry = async (ch: ChainEntry) => {
        setEnsResolutionSaving(true)
        setEnsResolutionError('')
        setEnsResolutionStep('')
        try {
            if (currentChainId !== mainnet.id) {
                await switchChain({ chainId: mainnet.id })
            }
            setEnsResolutionStep(`Registering ${ch.chain_name} on mainnet…`)
            const node = namehash(tenant.ens_domain)
            const txHash = await writeContractAsync({
                address: L1_RESOLVER_ADDRESS,
                abi: L1_RESOLVER_ABI,
                functionName: 'setL2Registry',
                args: [node, BigInt(ch.chain_id), ch.registry_address as `0x${string}`],
                chainId: mainnet.id,
            })
            await waitForTransactionReceipt(wagmiConfig, { hash: txHash, chainId: mainnet.id })
            setEnsResolutionStep('')
        } catch (e: any) {
            setEnsResolutionError(e.shortMessage ?? e.message ?? 'Failed to register L2 registry')
            setEnsResolutionStep('')
        } finally {
            setEnsResolutionSaving(false)
        }
    }

    const isOwner = isConnected && address?.toLowerCase() === tenant.owner_address.toLowerCase()

    const set = (key: string, val: any) => setForm(f => ({ ...f, [key]: val }))

    const handleSave = async () => {
        if (!address) return
        setSaving(true)
        setError('')
        setSaved(false)
        try {
            const res = await fetch(`/api/manage/${tenant.slug}/save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, owner_address: address }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Save failed')
            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
        } catch (e: any) {
            setError(e.message)
        } finally {
            setSaving(false)
        }
    }

    const handleRevoke = async (claim: ClaimEntry) => {
        if (!address) return
        setRevoking(claim.id)
        try {
            const res = await fetch(`/api/manage/${tenant.slug}/claims/${claim.id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ owner_address: address }),
            })
            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Revoke failed')
            }
            setClaims(prev => prev.filter(c => c.id !== claim.id))
        } catch (e: any) {
            setError(e.message)
        } finally {
            setRevoking(null)
        }
    }

    const card = {
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        borderRadius: '12px',
        padding: '24px',
    }

    const planBadge: Record<string, string> = {
        free: '#555',
        pro: '#7c3aed',
        business: '#0891b2',
    }

    return (
        <main style={{ minHeight: '100vh', background: COLORS.bg, fontFamily: "'Inter', system-ui, sans-serif" }}>
            {/* Header */}
            <header style={{
                borderBottom: `1px solid ${COLORS.border}`,
                background: 'var(--header-bg)',
                backdropFilter: 'blur(8px)',
                padding: '16px 32px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                position: 'sticky', top: 0, zIndex: 10,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {tenant.logo_url && (
                        <img src={tenant.logo_url} alt={tenant.name}
                            style={{ width: '28px', height: '28px', borderRadius: '6px', imageRendering: 'pixelated' }} />
                    )}
                    <span style={{ fontWeight: 'bold', color: accent, textShadow: `0 0 10px ${accent}80` }}>
                        {tenant.name}
                    </span>
                    <span style={{
                        fontSize: '0.7rem', padding: '2px 8px', borderRadius: '99px',
                        background: planBadge[tenant.plan] ?? '#555', color: '#fff', fontWeight: 'bold',
                    }}>{tenant.plan.toUpperCase()}</span>
                </div>
                <ConnectButton />
            </header>

            <div style={{ maxWidth: '640px', margin: '0 auto', padding: '40px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {/* Stats bar */}
                <div style={{ ...card, display: 'flex', gap: '24px' }}>
                    <div>
                        <p style={{ color: COLORS.muted, fontSize: '0.75rem' }}>Claims</p>
                        <p style={{ color: accent, fontWeight: 'bold', fontSize: '1.25rem' }}>
                            {tenant.claims_count}<span style={{ color: COLORS.dim, fontSize: '0.85rem' }}>/{tenant.claim_limit}</span>
                        </p>
                    </div>
                    <div>
                        <p style={{ color: COLORS.muted, fontSize: '0.75rem' }}>Domain</p>
                        <p style={{ color: COLORS.text, fontWeight: 'bold', fontSize: '0.95rem' }}>*.{tenant.ens_domain}</p>
                    </div>
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <a href={`/claim/${tenant.slug}`} target="_blank" rel="noopener noreferrer"
                            style={{
                                padding: '8px 14px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold',
                                background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
                                color: '#0a0a1a', textDecoration: 'none',
                            }}>
                            View claim page →
                        </a>
                    </div>
                </div>

                {!isConnected && (
                    <div style={{ ...card, textAlign: 'center', padding: '40px' }}>
                        <p style={{ color: COLORS.muted, marginBottom: '20px', fontSize: '0.875rem' }}>
                            Connect the owner wallet to manage settings
                        </p>
                        <ConnectButton />
                    </div>
                )}

                {isConnected && !isOwner && (
                    <div style={{ ...card, textAlign: 'center', padding: '32px', borderColor: 'rgba(255,68,68,0.3)' }}>
                        <p style={{ color: '#ff4444', fontWeight: 'bold' }}>Not authorized</p>
                        <p style={{ color: COLORS.muted, fontSize: '0.875rem', marginTop: '8px' }}>
                            This page belongs to <span style={{ fontFamily: 'monospace', color: COLORS.dim }}>
                                {tenant.owner_address.slice(0, 6)}…{tenant.owner_address.slice(-4)}
                            </span>
                        </p>
                    </div>
                )}

                {isOwner && (
                    <>
                        {/* Branding */}
                        <div style={card}>
                            <h2 style={{ color: COLORS.text, fontSize: '1rem', fontWeight: 'bold', marginBottom: '18px' }}>Branding</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <div>
                                    <label style={labelStyle}>Project name</label>
                                    <input style={inputStyle} value={form.name} onChange={e => set('name', e.target.value)} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Logo URL</label>
                                    <input style={inputStyle} value={form.logo_url} onChange={e => set('logo_url', e.target.value)} placeholder="https://..." />
                                </div>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={labelStyle}>Accent color</label>
                                        <input style={inputStyle} value={form.accent_color} onChange={e => set('accent_color', e.target.value)} placeholder="#00ff88" />
                                    </div>
                                    <input type="color" value={form.accent_color} onChange={e => set('accent_color', e.target.value)}
                                        style={{ width: '44px', height: '40px', border: 'none', background: 'none', cursor: 'pointer', borderRadius: '6px' }} />
                                </div>
                            </div>
                        </div>

                        {/* Gate */}
                        <div style={card}>
                            <h2 style={{ color: COLORS.text, fontSize: '1rem', fontWeight: 'bold', marginBottom: '18px' }}>Access gate</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <div>
                                    <label style={labelStyle}>Gate type</label>
                                    <select style={{ ...inputStyle, appearance: 'none' as const }}
                                        value={form.gate_type} onChange={e => set('gate_type', e.target.value)}>
                                        <option value="open">Open — anyone can claim</option>
                                        <option value="nft">NFT holders only</option>
                                        <option value="token">Token holders (ERC-20)</option>
                                        <option value="allowlist">Allowlist</option>
                                    </select>
                                </div>

                                {form.gate_type === 'nft' && (
                                    <>
                                        <div>
                                            <label style={labelStyle}>ETHscriptions collection slug</label>
                                            <input style={inputStyle} value={form.collection_slug} onChange={e => set('collection_slug', e.target.value)} placeholder="e.g. pixel-goblins" />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>ERC-721 contract address</label>
                                            <input style={inputStyle} value={form.contract_address} onChange={e => set('contract_address', e.target.value)} placeholder="0x..." />
                                        </div>
                                    </>
                                )}

                                {form.gate_type === 'token' && (
                                    <>
                                        <div>
                                            <label style={labelStyle}>ERC-20 contract address</label>
                                            <input style={inputStyle} value={form.contract_address} onChange={e => set('contract_address', e.target.value)} placeholder="0x..." />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Minimum balance required</label>
                                            <input style={inputStyle} type="number" min={0} step="any"
                                                value={form.min_balance} onChange={e => set('min_balance', e.target.value)} placeholder="1" />
                                            <p style={{ color: COLORS.dim, fontSize: '0.72rem', marginTop: '4px' }}>In whole tokens (e.g. 1 = 1 token)</p>
                                        </div>
                                    </>
                                )}

                                {form.gate_type === 'allowlist' && (
                                    <div>
                                        <label style={labelStyle}>Allowed wallet addresses</label>
                                        <textarea
                                            style={{ ...inputStyle, height: '120px', resize: 'vertical' as const, fontFamily: 'monospace', fontSize: '0.78rem' }}
                                            value={form.allowlist_addresses}
                                            onChange={e => set('allowlist_addresses', e.target.value)}
                                            placeholder={'0xabc...\n0xdef...\n0x123...'}
                                        />
                                        <p style={{ color: COLORS.dim, fontSize: '0.72rem', marginTop: '4px' }}>One address per line</p>
                                    </div>
                                )}

                                <div>
                                    <label style={labelStyle}>Claim limit</label>
                                    <input style={inputStyle} type="number" min={1} max={50000}
                                        value={form.claim_limit} onChange={e => set('claim_limit', parseInt(e.target.value) || 1)} />
                                </div>
                            </div>
                        </div>

                        {/* Namestone */}
                        <div style={card}>
                            <h2 style={{ color: COLORS.text, fontSize: '1rem', fontWeight: 'bold', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <img src="/images/namestone-logo.png" alt="" style={{ height: '16px', opacity: 0.85 }} />Namestone API key
                            </h2>
                            <p style={{ color: COLORS.muted, fontSize: '0.78rem', marginBottom: '14px' }}>
                                Get your key at <a href="https://namestone.com" target="_blank" rel="noopener noreferrer"
                                    style={{ color: accent }}>namestone.com</a>
                            </p>
                            <input style={inputStyle} value={form.namestone_api_key}
                                onChange={e => set('namestone_api_key', e.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
                        </div>

                        {/* Upgrade */}
                        {tenant.plan === 'free' && (
                            <div style={{ ...card, borderColor: `${accent}33`, background: `rgba(0,255,136,0.03)` }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                                    <div>
                                        <p style={{ color: COLORS.text, fontWeight: 'bold', fontSize: '0.9rem' }}>You're on the Free plan</p>
                                        <p style={{ color: COLORS.muted, fontSize: '0.8rem', marginTop: '2px' }}>50 claims · Upgrade for more</p>
                                    </div>
                                    <a href={`/pricing?slug=${tenant.slug}`}
                                        style={{
                                            padding: '8px 18px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 'bold',
                                            background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
                                            color: '#0a0a1a', textDecoration: 'none',
                                        }}>
                                        Upgrade →
                                    </a>
                                </div>
                            </div>
                        )}

                        {/* Claims list */}
                        <div style={card}>
                            <h2 style={{ color: COLORS.text, fontSize: '1rem', fontWeight: 'bold', marginBottom: '16px' }}>
                                Claimed subdomains
                                <span style={{ color: COLORS.muted, fontWeight: 'normal', fontSize: '0.8rem', marginLeft: '8px' }}>
                                    ({claims.length})
                                </span>
                            </h2>
                            {claims.length === 0 ? (
                                <p style={{ color: COLORS.dim, fontSize: '0.85rem', textAlign: 'center', padding: '16px 0' }}>
                                    No claims yet
                                </p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {claims.map(c => (
                                        <div key={c.id} style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '10px 12px', borderRadius: '8px',
                                            background: 'var(--row-bg)',
                                            border: '1px solid var(--row-border)',
                                            gap: '12px',
                                        }}>
                                            <div style={{ minWidth: 0, flex: 1 }}>
                                                <p style={{ color: accent, fontSize: '0.875rem', fontWeight: 'bold',
                                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {c.full_name}
                                                </p>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                                                    <span style={{ fontSize: '0.7rem', color: '#00c850', background: 'rgba(0,200,80,0.1)', border: '1px solid rgba(0,200,80,0.2)', borderRadius: '3px', padding: '1px 5px' }}>
                                                        Ξ ETH
                                                    </span>
                                                    {(c.minted_chains ?? []).map(cid => {
                                                        const meta = DURIN_CHAINS.find(d => d.id === cid)
                                                        return (
                                                            <span key={cid} style={{ fontSize: '0.7rem', color: '#60a5fa', background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: '3px', padding: '1px 5px' }}>
                                                                {meta?.icon ?? '🔗'} {meta?.name ?? `Chain ${cid}`}
                                                            </span>
                                                        )
                                                    })}
                                                    <span style={{ color: COLORS.dim, fontSize: '0.7rem', fontFamily: 'monospace' }}>
                                                        {c.wallet_address.slice(0, 6)}…{c.wallet_address.slice(-4)}
                                                        <span style={{ marginLeft: '6px' }}>{new Date(c.claimed_at).toLocaleDateString()}</span>
                                                    </span>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px', flexShrink: 0 }}>
                                                <button
                                                    onClick={() => handleRevoke(c)}
                                                    disabled={revoking === c.id}
                                                    title={(c.minted_chains ?? []).length > 0 ? 'Removes offchain record only — L2 NFTs cannot be burned' : 'Remove this claim'}
                                                    style={{
                                                        padding: '5px 10px',
                                                        borderRadius: '6px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 'bold',
                                                        background: 'transparent',
                                                        border: '1px solid rgba(255,68,68,0.3)',
                                                        color: revoking === c.id ? COLORS.dim : '#ff6666',
                                                        cursor: revoking === c.id ? 'not-allowed' : 'pointer',
                                                    }}
                                                >
                                                    {revoking === c.id ? '...' : 'Revoke'}
                                                </button>
                                                {(c.minted_chains ?? []).length > 0 && (
                                                    <span style={{ fontSize: '0.62rem', color: COLORS.dim, whiteSpace: 'nowrap' as const }}>
                                                        offchain only
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Share */}
                        {(() => {
                            const claimUrl = `${window.location.origin}/claim/${tenant.slug}`
                            const shareText = `Claim your free ${tenant.ens_domain} subdomain on ENSub 🌐`
                            const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(claimUrl)}`
                            const farcasterUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText + '\n' + claimUrl)}`
                            const btnStyle = {
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '8px 14px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold',
                                background: 'var(--row-bg)', border: '1px solid var(--row-border)',
                                color: 'var(--text-muted)', textDecoration: 'none', cursor: 'pointer',
                            } as const
                            return (
                                <div style={card}>
                                    <h2 style={{ color: COLORS.text, fontSize: '1rem', fontWeight: 'bold', marginBottom: '6px' }}>Share claim page</h2>
                                    <p style={{ color: COLORS.muted, fontSize: '0.78rem', marginBottom: '14px', fontFamily: 'monospace' }}>{claimUrl}</p>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        <a href={twitterUrl} target="_blank" rel="noopener noreferrer" style={{ ...btnStyle, color: '#1d9bf0' }}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.258 5.632 5.907-5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                            </svg>
                                            Share on X
                                        </a>
                                        <a href={farcasterUrl} target="_blank" rel="noopener noreferrer" style={{ ...btnStyle, color: '#8b5cf6' }}>
                                            <svg width="14" height="14" viewBox="0 0 1000 1000" fill="currentColor">
                                                <path d="M257.778 155.556H742.222V844.445H671.111V528.889H670.414C662.554 441.677 589.258 373.333 500 373.333C410.742 373.333 337.446 441.677 329.586 528.889H328.889V844.445H257.778V155.556Z"/>
                                                <path d="M128.889 253.333L157.778 351.111H182.222V746.667C169.949 746.667 160 756.616 160 768.889V795.556H155.556C143.283 795.556 133.333 805.505 133.333 817.778V844.445H382.222V817.778C382.222 805.505 372.273 795.556 360 795.556H355.556V768.889C355.556 756.616 345.606 746.667 333.333 746.667H306.667V253.333H128.889Z"/>
                                                <path d="M675.556 746.667C663.283 746.667 653.333 756.616 653.333 768.889V795.556H648.889C636.616 795.556 626.667 805.505 626.667 817.778V844.445H875.556V817.778C875.556 805.505 865.606 795.556 853.333 795.556H848.889V768.889C848.889 756.616 838.94 746.667 826.667 746.667V351.111H851.111L880 253.333H702.222V746.667H675.556Z"/>
                                            </svg>
                                            Farcaster
                                        </a>
                                        <button
                                            onClick={() => { navigator.clipboard.writeText(claimUrl); setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000) }}
                                            style={{ ...btnStyle, color: linkCopied ? '#00ff88' : 'var(--text-muted)' }}>
                                            {linkCopied ? '✓ Copied' : '🔗 Copy link'}
                                        </button>
                                    </div>
                                </div>
                            )
                        })()}

                        {/* Embed */}
                        {tenant.plan === 'free' ? (
                            <div style={{ ...card, borderColor: `${accent}22` }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                                    <div>
                                        <p style={{ color: COLORS.text, fontWeight: 'bold', fontSize: '0.9rem' }}>
                                            {'</>'} Embed claim box
                                        </p>
                                        <p style={{ color: COLORS.muted, fontSize: '0.8rem', marginTop: '2px' }}>
                                            Add the claim widget to your own site — Pro &amp; Business only
                                        </p>
                                    </div>
                                    <a href={`/pricing?slug=${tenant.slug}`}
                                        style={{
                                            padding: '8px 18px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 'bold',
                                            background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
                                            color: '#0a0a1a', textDecoration: 'none', flexShrink: 0,
                                        }}>
                                        Upgrade →
                                    </a>
                                </div>
                            </div>
                        ) : (
                            <div style={card}>
                                <h2 style={{ color: COLORS.text, fontSize: '1rem', fontWeight: 'bold', marginBottom: '6px' }}>{'</>'} Embed claim box</h2>
                                <p style={{ color: COLORS.muted, fontSize: '0.78rem', marginBottom: '12px' }}>
                                    Drop this snippet anywhere on your site to embed the claim widget.
                                </p>
                                <pre style={{
                                    background: 'var(--pre-bg)', border: '1px solid var(--pre-border)',
                                    borderRadius: '8px', padding: '14px', fontSize: '0.72rem',
                                    color: 'var(--text-muted)', overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                                    fontFamily: "'Fira Code', 'Courier New', monospace", margin: 0,
                                }}>{`<iframe\n  src="${window.location.origin}/claim/${tenant.slug}"\n  width="480"\n  height="560"\n  frameborder="0"\n  style="border-radius:12px;border:none;overflow:hidden;"\n  allow="clipboard-write; ethereum"\n></iframe>`}</pre>
                                <button
                                    onClick={() => {
                                        const snippet = `<iframe\n  src="${window.location.origin}/claim/${tenant.slug}"\n  width="480"\n  height="560"\n  frameborder="0"\n  style="border-radius:12px;border:none;overflow:hidden;"\n  allow="clipboard-write; ethereum"\n></iframe>`
                                        navigator.clipboard.writeText(snippet)
                                        setEmbedCopied(true)
                                        setTimeout(() => setEmbedCopied(false), 2000)
                                    }}
                                    style={{
                                        marginTop: '10px', padding: '8px 16px', borderRadius: '8px',
                                        fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer',
                                        background: embedCopied ? 'rgba(0,255,136,0.1)' : 'var(--row-bg)',
                                        border: `1px solid ${embedCopied ? '#00ff8844' : 'var(--row-border)'}`,
                                        color: embedCopied ? '#00ff88' : 'var(--text-muted)',
                                    }}>
                                    {embedCopied ? '✓ Copied!' : 'Copy snippet'}
                                </button>
                            </div>
                        )}

                        {/* L2 Chains (Durin) */}
                        <div style={{ ...card, marginTop: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', gap: '8px' }}>
                                <h2 style={{ color: 'var(--text)', fontSize: '1rem', fontWeight: 'bold', margin: 0 }}>
                                    L2 Claim Chains
                                </h2>
                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                    {chains.length > 0 && (
                                        <button
                                            onClick={handleSyncL2Mints}
                                            disabled={syncing}
                                            title="Sync on-chain NameRegistered events into the claims list"
                                            style={{ fontSize: '0.75rem', background: 'var(--row-bg)', border: '1px solid var(--row-border)', color: syncing ? COLORS.dim : COLORS.muted, borderRadius: '6px', padding: '4px 10px', cursor: syncing ? 'not-allowed' : 'pointer' }}>
                                            {syncing ? '⟳ Syncing…' : syncResult || '⟳ Sync mints'}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => { setAddingChain(a => !a); setChainError('') }}
                                        style={{ fontSize: '0.8rem', background: `${accent}18`, border: `1px solid ${accent}44`, color: accent, borderRadius: '6px', padding: '4px 10px', cursor: 'pointer' }}>
                                        {addingChain ? 'Cancel' : '+ Add chain'}
                                    </button>
                                </div>
                            </div>

                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px', marginTop: 0 }}>
                                Let claimants mint subdomains as NFTs on L2 chains via <a href="https://durin.dev" target="_blank" rel="noreferrer" style={{ color: accent }}>Durin</a>.
                                Each chain needs a deployed L2Registry and L2Registrar contract.
                            </p>

                            {/* Offchain always-on row */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--row-border)' }}>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text)' }}>Ξ ETH — Gasless</span>
                                <span style={{ fontSize: '0.75rem', color: '#00c850', background: 'rgba(0,200,80,0.12)', border: '1px solid rgba(0,200,80,0.25)', borderRadius: '4px', padding: '2px 8px' }}>Always on</span>
                            </div>

                            {/* Active chains */}
                            {chains.map(ch => {
                                const meta = DURIN_CHAINS.find(c => c.id === ch.chain_id)
                                return (
                                    <div key={ch.chain_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--row-border)', gap: '8px' }}>
                                        <span style={{ fontSize: '0.85rem', color: 'var(--text)', flex: 1 }}>
                                            {meta?.icon ?? '🔗'} {ch.chain_name}
                                        </span>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={ch.enabled}
                                                onChange={e => handleToggleChain(ch.chain_id, e.target.checked)}
                                            />
                                            {ch.enabled ? 'Enabled' : 'Disabled'}
                                        </label>
                                        <button
                                            onClick={() => handleRedeployRegistrar(ch)}
                                            disabled={chainSaving}
                                            title="Redeploy L2Registrar and re-authorize it on the registry (fixes minting)"
                                            style={{ fontSize: '0.75rem', color: '#f59e0b', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.4)', borderRadius: '5px', cursor: chainSaving ? 'not-allowed' : 'pointer', padding: '3px 9px', opacity: chainSaving ? 0.5 : 1, fontWeight: 'bold', whiteSpace: 'nowrap' as const }}>
                                            {chainSaving && deployStep ? deployStep : '⚙ Fix'}
                                        </button>
                                        <button
                                            onClick={() => handleRemoveChain(ch.chain_id)}
                                            style={{ fontSize: '0.75rem', color: '#ff4444', background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px 6px' }}>
                                            ✕
                                        </button>
                                    </div>
                                )
                            })}

                            {chains.length === 0 && !addingChain && (
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '8px', marginBottom: 0 }}>No L2 chains added yet.</p>
                            )}

                            {/* Add chain form */}
                            {addingChain && (
                                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {/* Chain selector */}
                                    <select
                                        value={newChainId}
                                        onChange={e => { setNewChainId(Number(e.target.value)); setNewRegistry('') }}
                                        style={{ ...inputStyle, cursor: 'pointer' }}>
                                        {DURIN_CHAINS.filter(c => !chains.find(ch => ch.chain_id === c.id)).map(c => (
                                            <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                                        ))}
                                    </select>

                                    {/* L2Registry address — paste existing or leave blank to deploy fresh */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                            L2Registry address
                                            <span style={{ color: 'var(--text-dim)', fontWeight: 'normal', marginLeft: '6px' }}>(leave blank to deploy new)</span>
                                        </span>
                                        <input
                                            style={inputStyle}
                                            placeholder="0x… or leave blank to deploy"
                                            value={newRegistry}
                                            onChange={e => setNewRegistry(e.target.value)}
                                        />
                                    </div>

                                    {/* Registrar address — auto-filled after deploy, or paste existing */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>L2Registrar address</span>
                                        <input
                                            style={{ ...inputStyle, color: newRegistrar ? 'var(--text)' : 'var(--text-dim)' }}
                                            placeholder="Auto-filled after deploy below"
                                            value={newRegistrar}
                                            onChange={e => setNewRegistrar(e.target.value)}
                                        />
                                    </div>

                                    {/* Deploy button */}
                                    <button
                                        onClick={handleDeployRegistry}
                                        disabled={chainSaving || !!newRegistrar}
                                        style={{ padding: '9px 14px', background: newRegistrar ? 'var(--row-bg)' : `${accent}18`, border: `1px solid ${newRegistrar ? 'var(--card-border)' : accent + '44'}`, color: newRegistrar ? 'var(--text-dim)' : accent, borderRadius: '8px', fontWeight: 'bold', fontSize: '0.82rem', cursor: (chainSaving || !!newRegistrar) ? 'not-allowed' : 'pointer', textAlign: 'left' as const }}>
                                        {chainSaving
                                            ? `⟳ ${deployStep || 'Deploying…'}`
                                            : newRegistrar
                                                ? `✓ Registrar ready`
                                                : newRegistry
                                                    ? `⚡ Deploy Registrar on ${DURIN_CHAINS.find(c => c.id === newChainId)?.name}`
                                                    : `⚡ Deploy Registry + Registrar on ${DURIN_CHAINS.find(c => c.id === newChainId)?.name}`}
                                    </button>

                                    {chainError && <p style={{ color: '#ff4444', fontSize: '0.8rem', margin: 0 }}>{chainError}</p>}

                                    <button
                                        onClick={handleAddChain}
                                        disabled={chainSaving || !newRegistry || !newRegistrar}
                                        style={{ padding: '10px', background: (newRegistry && newRegistrar) ? `linear-gradient(135deg, ${accent}, ${accent}cc)` : 'var(--row-bg)', color: (newRegistry && newRegistrar) ? '#0a0a1a' : 'var(--text-dim)', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.85rem', cursor: (chainSaving || !newRegistry || !newRegistrar) ? 'not-allowed' : 'pointer' }}>
                                        Save chain
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* ENS On-chain Resolution (Phase 2) */}
                        {chains.length > 0 && (
                            <div style={{ ...card, marginTop: '8px' }}>
                                <h2 style={{ color: 'var(--text)', fontSize: '1rem', fontWeight: 'bold', marginBottom: '4px' }}>
                                    ENS On-chain Resolution
                                </h2>
                                <p style={{ color: COLORS.muted, fontSize: '0.78rem', marginBottom: '16px', lineHeight: '1.55' }}>
                                    Allow <strong style={{ color: COLORS.text }}>*.{tenant.ens_domain}</strong> subdomains to resolve on-chain (wallets, dApps, viem).
                                    Requires two Ethereum mainnet steps — switch resolver once, then register each L2 chain.
                                </p>

                                {/* Step 1 — update resolver */}
                                <div style={{ marginBottom: '12px', padding: '14px', borderRadius: '8px', background: 'var(--row-bg)', border: '1px solid var(--row-border)' }}>
                                    <p style={{ color: COLORS.text, fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '6px' }}>
                                        Step 1 — Set ENS Resolver
                                    </p>
                                    <p style={{ color: COLORS.muted, fontSize: '0.78rem', marginBottom: '10px', lineHeight: '1.5' }}>
                                        Change the resolver for <code style={{ color: accent, fontSize: '0.75rem' }}>{tenant.ens_domain}</code> to the Durin L1Resolver on Ethereum mainnet.
                                        Skip this if you already did it.
                                    </p>
                                    <div style={{ display: 'flex', gap: '10px', padding: '10px 12px', borderRadius: '7px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.35)', marginBottom: '12px' }}>
                                        <span style={{ fontSize: '0.85rem', flexShrink: 0 }}>⚠️</span>
                                        <p style={{ color: '#f59e0b', fontSize: '0.76rem', lineHeight: '1.55', margin: 0 }}>
                                            <strong>This disables Namestone offchain resolution.</strong> Claimants who only did the gasless
                                            "Ξ ETH" claim and have not minted on any L2 chain will stop resolving in wallets and dApps.
                                            Ensure your claimants have minted on at least one L2 chain before switching.
                                        </p>
                                    </div>
                                    <code style={{ display: 'block', fontSize: '0.72rem', color: COLORS.dim, fontFamily: "'Fira Code', monospace", marginBottom: '10px', wordBreak: 'break-all' as const }}>
                                        {L1_RESOLVER_ADDRESS}
                                    </code>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
                                        <button
                                            onClick={handleSetResolver}
                                            disabled={ensResolutionSaving}
                                            style={{ padding: '7px 14px', background: `${accent}18`, border: `1px solid ${accent}44`, color: accent, borderRadius: '6px', fontWeight: 'bold', fontSize: '0.8rem', cursor: ensResolutionSaving ? 'not-allowed' : 'pointer', opacity: ensResolutionSaving ? 0.6 : 1 }}>
                                            {ensResolutionSaving && ensResolutionStep.includes('resolver') ? `⟳ ${ensResolutionStep}` : 'Set resolver (mainnet tx)'}
                                        </button>
                                        <a href={`https://app.ens.domains/${tenant.ens_domain}`} target="_blank" rel="noreferrer"
                                            style={{ padding: '7px 14px', background: 'transparent', border: '1px solid var(--row-border)', color: COLORS.muted, borderRadius: '6px', fontSize: '0.8rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                                            Or use ENS app ↗
                                        </a>
                                        <button
                                            onClick={handleRevertToNamestone}
                                            disabled={ensResolutionSaving}
                                            title={`Revert to Namestone resolver (${NAMESTONE_RESOLVER_ADDRESS})`}
                                            style={{ padding: '7px 14px', background: 'transparent', border: '1px solid rgba(255,68,68,0.3)', color: '#ff6666', borderRadius: '6px', fontSize: '0.8rem', cursor: ensResolutionSaving ? 'not-allowed' : 'pointer', opacity: ensResolutionSaving ? 0.6 : 1 }}>
                                            {ensResolutionSaving && ensResolutionStep.includes('Namestone') ? `⟳ ${ensResolutionStep}` : '↩ Revert to Namestone'}
                                        </button>
                                    </div>
                                </div>

                                {/* Step 2 — register each L2 registry */}
                                <div style={{ padding: '14px', borderRadius: '8px', background: 'var(--row-bg)', border: '1px solid var(--row-border)' }}>
                                    <p style={{ color: COLORS.text, fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '6px' }}>
                                        Step 2 — Register L2 Registries
                                    </p>
                                    <p style={{ color: COLORS.muted, fontSize: '0.78rem', marginBottom: '12px', lineHeight: '1.5' }}>
                                        Tell the L1Resolver which registry contract handles subdomain lookups on each chain.
                                        One mainnet tx per chain.
                                    </p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {chains.filter(ch => ch.registry_address).map(ch => {
                                            const meta = DURIN_CHAINS.find(c => c.id === ch.chain_id)
                                            const isActive = ensResolutionSaving && ensResolutionStep.includes(ch.chain_name)
                                            return (
                                                <div key={ch.chain_id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <span style={{ fontSize: '0.82rem', color: COLORS.text, flex: 1 }}>
                                                        {meta?.icon} {ch.chain_name}
                                                    </span>
                                                    <code style={{ fontSize: '0.68rem', color: COLORS.dim, fontFamily: 'monospace', flex: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                                                        {ch.registry_address}
                                                    </code>
                                                    <button
                                                        onClick={() => handleSetL2Registry(ch)}
                                                        disabled={ensResolutionSaving}
                                                        style={{ padding: '5px 12px', background: `${accent}18`, border: `1px solid ${accent}44`, color: accent, borderRadius: '6px', fontSize: '0.78rem', fontWeight: 'bold', cursor: ensResolutionSaving ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' as const, opacity: ensResolutionSaving ? 0.6 : 1, flexShrink: 0 }}>
                                                        {isActive ? `⟳ ${ensResolutionStep}` : 'Register'}
                                                    </button>
                                                </div>
                                            )
                                        })}
                                        {chains.filter(ch => ch.registry_address).length === 0 && (
                                            <p style={{ fontSize: '0.78rem', color: COLORS.dim, margin: 0 }}>
                                                No chains with deployed registries yet. Add and deploy a chain above first.
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {ensResolutionError && (
                                    <p style={{ color: '#ff4444', fontSize: '0.8rem', marginTop: '10px', marginBottom: 0 }}>{ensResolutionError}</p>
                                )}
                                {ensResolutionStep && !ensResolutionError && (
                                    <p style={{ color: accent, fontSize: '0.8rem', marginTop: '10px', marginBottom: 0 }}>⟳ {ensResolutionStep}</p>
                                )}
                            </div>
                        )}

                        {error && <p style={{ color: '#ff4444', fontSize: '0.85rem' }}>{error}</p>}

                        <button
                            onClick={handleSave}
                            disabled={saving}
                            style={{
                                width: '100%', padding: '14px',
                                background: saving ? 'rgba(255,255,255,0.06)' : saved
                                    ? 'rgba(0,200,80,0.2)'
                                    : `linear-gradient(135deg, ${accent}, ${accent}cc)`,
                                color: saving ? '#555' : saved ? '#00c850' : '#0a0a1a',
                                border: saved ? '1px solid #00c85044' : 'none',
                                borderRadius: '8px', fontWeight: 'bold', fontSize: '0.9rem',
                                letterSpacing: '0.08em', cursor: saving ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s',
                            }}>
                            {saving ? '⟳ SAVING...' : saved ? '✓ SAVED' : 'SAVE CHANGES'}
                        </button>
                    </>
                )}

                <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    Powered by <a href="/" style={{ color: 'var(--text-muted)', textDecoration: 'underline' }}>ENSub</a>
                </p>
            </div>
        </main>
    )
}

export default function Manage({ tenant }: { tenant: TenantData }) {
    const accent = tenant.accent_color
    const [isLight, setIsLight] = useState(() => document.documentElement.classList.contains('light'))
    useEffect(() => {
        const obs = new MutationObserver(() => setIsLight(document.documentElement.classList.contains('light')))
        obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
        return () => obs.disconnect()
    }, [])
    return (
        <WagmiProvider config={wagmiConfig}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider theme={isLight ? lightTheme({ accentColor: accent }) : darkTheme({ accentColor: accent })}>
                    <ManageContent tenant={tenant} />
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    )
}
