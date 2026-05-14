import { ReactNode } from 'react'
import { FiMail, FiGlobe, FiMessageCircle } from 'react-icons/fi'
import {
  SiTelegram, SiDiscord, SiBitcoin, SiEthereum, SiMonero, SiLitecoin,
  SiDogecoin, SiBitcoincash, SiSolana, SiCardano, SiPolkadot, SiPolygon,
  SiOptimism, SiFantom, SiNear, SiStellar, SiAlgorand, SiTon, SiSui,
  SiTether, SiInternetcomputer, SiX, SiReddit, SiGithub, SiWhatsapp,
  SiSignal, SiKeybase, SiSession, SiElement, SiXmpp,
} from 'react-icons/si'

// ─── Contact type definition ───────────────────────────────────────
export interface ContactTypeDef {
  value: string
  label: string
  category: 'contact' | 'donation'
  /** When true the public page renders only a styled button (label + link) */
  buttonOnly?: boolean
  color: string
  icon: (size: number) => ReactNode
}

// ─── Quick-contact types ───────────────────────────────────────────
export const CONTACT_TYPE_DEFS: ContactTypeDef[] = [
  // ── Messaging (info card) ──
  { value: 'telegram', label: 'Telegram', category: 'contact', color: '#0088cc',
    icon: (s) => <SiTelegram size={s} style={{ color: '#0088cc' }} /> },
  { value: 'discord', label: 'Discord', category: 'contact', color: '#5865F2',
    icon: (s) => <SiDiscord size={s} style={{ color: '#5865F2' }} /> },
  { value: 'email', label: 'Email', category: 'contact', color: '#3b82f6',
    icon: (s) => <FiMail size={s} className="text-lz-accent" /> },
  { value: 'xmpp', label: 'XMPP / Jabber', category: 'contact', color: '#5cb85c',
    icon: (s) => <SiXmpp size={s} style={{ color: '#5cb85c' }} /> },
  { value: 'matrix', label: 'Matrix / Element', category: 'contact', color: '#0dbd8b',
    icon: (s) => <SiElement size={s} style={{ color: '#0dbd8b' }} /> },
  { value: 'session', label: 'Session', category: 'contact', color: '#00f782',
    icon: (s) => <SiSession size={s} style={{ color: '#00f782' }} /> },
  { value: 'signal', label: 'Signal', category: 'contact', color: '#3a76f0',
    icon: (s) => <SiSignal size={s} style={{ color: '#3a76f0' }} /> },
  { value: 'keybase', label: 'Keybase', category: 'contact', color: '#33a0ff',
    icon: (s) => <SiKeybase size={s} style={{ color: '#33a0ff' }} /> },

  // ── Button-only channels ──
  { value: 'telegram_channel', label: 'Telegram Channel (button)', category: 'contact', buttonOnly: true, color: '#0088cc',
    icon: (s) => <SiTelegram size={s} style={{ color: '#0088cc' }} /> },
  { value: 'telegram_bot', label: 'Telegram Bot (button)', category: 'contact', buttonOnly: true, color: '#0088cc',
    icon: (s) => <SiTelegram size={s} style={{ color: '#0088cc' }} /> },
  { value: 'discord_server', label: 'Discord Server (button)', category: 'contact', buttonOnly: true, color: '#5865F2',
    icon: (s) => <SiDiscord size={s} style={{ color: '#5865F2' }} /> },
  { value: 'twitter', label: 'X / Twitter (button)', category: 'contact', buttonOnly: true, color: '#ffffff',
    icon: (s) => <SiX size={s} className="text-white" /> },
  { value: 'reddit', label: 'Reddit (button)', category: 'contact', buttonOnly: true, color: '#ff4500',
    icon: (s) => <SiReddit size={s} style={{ color: '#ff4500' }} /> },
  { value: 'github', label: 'GitHub (button)', category: 'contact', buttonOnly: true, color: '#ffffff',
    icon: (s) => <SiGithub size={s} className="text-white" /> },
  { value: 'whatsapp', label: 'WhatsApp (button)', category: 'contact', buttonOnly: true, color: '#25d366',
    icon: (s) => <SiWhatsapp size={s} style={{ color: '#25d366' }} /> },
  { value: 'website', label: 'Website (button)', category: 'contact', buttonOnly: true, color: '#3b82f6',
    icon: (s) => <FiGlobe size={s} className="text-lz-accent" /> },
  { value: 'forum', label: 'Forum (button)', category: 'contact', buttonOnly: true, color: '#a78bfa',
    icon: (s) => <FiMessageCircle size={s} className="text-violet-400" /> },
  { value: 'custom_link', label: 'Custom Link (button)', category: 'contact', buttonOnly: true, color: '#6ee7b7',
    icon: (s) => <FiGlobe size={s} className="text-emerald-300" /> },
]

// ─── Donation types ────────────────────────────────────────────────
export const DONATION_TYPE_DEFS: ContactTypeDef[] = [
  { value: 'btc', label: 'Bitcoin (BTC)', category: 'donation', color: '#f7931a',
    icon: (s) => <SiBitcoin size={s} style={{ color: '#f7931a' }} /> },
  { value: 'eth', label: 'Ethereum (ETH)', category: 'donation', color: '#627eea',
    icon: (s) => <SiEthereum size={s} style={{ color: '#627eea' }} /> },
  { value: 'xmr', label: 'Monero (XMR)', category: 'donation', color: '#ff6600',
    icon: (s) => <SiMonero size={s} style={{ color: '#ff6600' }} /> },
  { value: 'ltc', label: 'Litecoin (LTC)', category: 'donation', color: '#bfbbbb',
    icon: (s) => <SiLitecoin size={s} style={{ color: '#bfbbbb' }} /> },
  { value: 'doge', label: 'Dogecoin (DOGE)', category: 'donation', color: '#c2a633',
    icon: (s) => <SiDogecoin size={s} style={{ color: '#c2a633' }} /> },
  { value: 'bch', label: 'Bitcoin Cash (BCH)', category: 'donation', color: '#0ac18e',
    icon: (s) => <SiBitcoincash size={s} style={{ color: '#0ac18e' }} /> },
  { value: 'sol', label: 'Solana (SOL)', category: 'donation', color: '#9945ff',
    icon: (s) => <SiSolana size={s} style={{ color: '#9945ff' }} /> },
  { value: 'trx', label: 'TRON (TRX)', category: 'donation', color: '#eb0029',
    icon: (s) => <span className="font-bold" style={{ color: '#eb0029', fontSize: Math.max(10, s - 4) }}>TRX</span> },
  { value: 'ada', label: 'Cardano (ADA)', category: 'donation', color: '#0033ad',
    icon: (s) => <SiCardano size={s} style={{ color: '#0033ad' }} /> },
  { value: 'dot', label: 'Polkadot (DOT)', category: 'donation', color: '#e6007a',
    icon: (s) => <SiPolkadot size={s} style={{ color: '#e6007a' }} /> },
  { value: 'matic', label: 'Polygon (MATIC)', category: 'donation', color: '#8247e5',
    icon: (s) => <SiPolygon size={s} style={{ color: '#8247e5' }} /> },
  { value: 'avax', label: 'Avalanche (AVAX)', category: 'donation', color: '#e84142',
    icon: (s) => <span className="font-bold" style={{ color: '#e84142', fontSize: Math.max(10, s - 4) }}>AVAX</span> },
  { value: 'arb', label: 'Arbitrum (ARB)', category: 'donation', color: '#28a0f0',
    icon: (s) => <span className="font-bold" style={{ color: '#28a0f0', fontSize: Math.max(10, s - 4) }}>ARB</span> },
  { value: 'op', label: 'Optimism (OP)', category: 'donation', color: '#ff0420',
    icon: (s) => <SiOptimism size={s} style={{ color: '#ff0420' }} /> },
  { value: 'ftm', label: 'Fantom (FTM)', category: 'donation', color: '#1969ff',
    icon: (s) => <SiFantom size={s} style={{ color: '#1969ff' }} /> },
  { value: 'near', label: 'NEAR', category: 'donation', color: '#a3a3a3',
    icon: (s) => <SiNear size={s} className="text-gray-300" /> },
  { value: 'atom', label: 'Cosmos (ATOM)', category: 'donation', color: '#6f7390',
    icon: (s) => <span className="font-bold text-purple-300" style={{ fontSize: Math.max(10, s - 4) }}>ATOM</span> },
  { value: 'xlm', label: 'Stellar (XLM)', category: 'donation', color: '#7d00ff',
    icon: (s) => <SiStellar size={s} style={{ color: '#7d00ff' }} /> },
  { value: 'algo', label: 'Algorand (ALGO)', category: 'donation', color: '#a3a3a3',
    icon: (s) => <SiAlgorand size={s} className="text-gray-300" /> },
  { value: 'vet', label: 'VeChain (VET)', category: 'donation', color: '#15bdff',
    icon: (s) => <span className="font-bold" style={{ color: '#15bdff', fontSize: Math.max(10, s - 4) }}>VET</span> },
  { value: 'ton', label: 'TON', category: 'donation', color: '#0098ea',
    icon: (s) => <SiTon size={s} style={{ color: '#0098ea' }} /> },
  { value: 'sui', label: 'Sui (SUI)', category: 'donation', color: '#6fbcf0',
    icon: (s) => <SiSui size={s} style={{ color: '#6fbcf0' }} /> },
  { value: 'icp', label: 'Internet Computer (ICP)', category: 'donation', color: '#29abe2',
    icon: (s) => <SiInternetcomputer size={s} style={{ color: '#29abe2' }} /> },
  { value: 'zec', label: 'Zcash (ZEC)', category: 'donation', color: '#ecb244',
    icon: (s) => <span className="font-bold" style={{ color: '#ecb244', fontSize: Math.max(10, s - 4) }}>ZEC</span> },
  { value: 'dash', label: 'Dash (DASH)', category: 'donation', color: '#008de4',
    icon: (s) => <span className="font-bold" style={{ color: '#008de4', fontSize: Math.max(10, s - 4) }}>DASH</span> },
  { value: 'etc', label: 'Ethereum Classic (ETC)', category: 'donation', color: '#328332',
    icon: (s) => <span className="font-bold" style={{ color: '#328332', fontSize: Math.max(10, s - 4) }}>ETC</span> },
  { value: 'usdt_erc', label: 'USDT (ERC-20)', category: 'donation', color: '#26a17b',
    icon: (s) => <SiTether size={s} style={{ color: '#26a17b' }} /> },
  { value: 'usdt_trc', label: 'USDT (TRC-20)', category: 'donation', color: '#26a17b',
    icon: (s) => <SiTether size={s} style={{ color: '#26a17b' }} /> },
  { value: 'usdc', label: 'USD Coin (USDC)', category: 'donation', color: '#2775ca',
    icon: (s) => <span className="font-bold" style={{ color: '#2775ca', fontSize: Math.max(10, s - 4) }}>USDC</span> },
  { value: 'dai', label: 'Dai (DAI)', category: 'donation', color: '#f5ac37',
    icon: (s) => <span className="font-bold" style={{ color: '#f5ac37', fontSize: Math.max(10, s - 4) }}>DAI</span> },
  { value: 'busd', label: 'BUSD', category: 'donation', color: '#f0b90b',
    icon: (s) => <span className="font-bold" style={{ color: '#f0b90b', fontSize: Math.max(10, s - 4) }}>BUSD</span> },
  { value: 'wbtc', label: 'Wrapped BTC (WBTC)', category: 'donation', color: '#f7931a',
    icon: (s) => <SiBitcoin size={s} style={{ color: '#f7931a' }} /> },
  { value: 'cro', label: 'Cronos (CRO)', category: 'donation', color: '#002d74',
    icon: (s) => <span className="font-bold" style={{ color: '#25a2e9', fontSize: Math.max(10, s - 4) }}>CRO</span> },
  { value: 'lunc', label: 'Terra Classic (LUNC)', category: 'donation', color: '#ffd83d',
    icon: (s) => <span className="font-bold" style={{ color: '#ffd83d', fontSize: Math.max(10, s - 4) }}>LUNC</span> },
  { value: 'inj', label: 'Injective (INJ)', category: 'donation', color: '#00f2fe',
    icon: (s) => <span className="font-bold" style={{ color: '#00f2fe', fontSize: Math.max(10, s - 4) }}>INJ</span> },
  { value: 'kas', label: 'Kaspa (KAS)', category: 'donation', color: '#70c7ba',
    icon: (s) => <span className="font-bold" style={{ color: '#70c7ba', fontSize: Math.max(10, s - 4) }}>KAS</span> },
]

// ─── Lookup helpers ────────────────────────────────────────────────
const ALL_DEFS = [...CONTACT_TYPE_DEFS, ...DONATION_TYPE_DEFS]
const DEF_MAP = new Map(ALL_DEFS.map((d) => [d.value, d]))
const CONTACT_SET = new Set(CONTACT_TYPE_DEFS.map((d) => d.value))
const DONATION_SET = new Set(DONATION_TYPE_DEFS.map((d) => d.value))

export function getTypeDef(type: string): ContactTypeDef | undefined {
  return DEF_MAP.get(type)
}
export function isQuickContactType(type: string): boolean {
  return CONTACT_SET.has(type)
}
export function isDonationType(type: string): boolean {
  return DONATION_SET.has(type)
}
export function isButtonOnlyType(type: string): boolean {
  return DEF_MAP.get(type)?.buttonOnly === true
}
export function getTypeIcon(type: string, size = 20): ReactNode {
  const def = DEF_MAP.get(type)
  return def ? def.icon(size) : <FiGlobe className="text-gray-400" size={size} />
}
export function getTypeColor(type: string): string {
  return DEF_MAP.get(type)?.color ?? '#6b7280'
}

export const CONTACT_SELECT_OPTIONS = CONTACT_TYPE_DEFS.map((d) => ({ value: d.value, label: d.label }))
export const DONATION_SELECT_OPTIONS = DONATION_TYPE_DEFS.map((d) => ({ value: d.value, label: d.label }))
