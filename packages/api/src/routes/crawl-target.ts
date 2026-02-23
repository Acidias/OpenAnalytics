import dns from 'node:dns/promises';
import net from 'node:net';
import { domainToASCII } from 'node:url';

type ResolvedAddress = { address: string; family: 4 | 6 };
type HostResolver = (hostname: string) => Promise<ResolvedAddress[]>;

const defaultHostResolver: HostResolver = async (hostname) => {
  const addrs = await dns.lookup(hostname, { all: true, verbatim: true });
  return addrs.map(addr => ({
    address: addr.address,
    family: addr.family as 4 | 6,
  }));
};

const BLOCKED_CRAWL_HOSTNAMES = new Set([
  'localhost',
  'metadata.google.internal',
  'metadata',
  'metadata.aws.internal',
]);

const ALLOWED_CRAWL_SCHEMES = new Set(['https:', ...(process.env.ALLOW_INSECURE_CRAWL_HTTP === 'true' ? ['http:'] : [])]);

function ipv4ToInt(ip: string): number {
  return ip.split('.').reduce((acc, part) => ((acc << 8) + Number.parseInt(part, 10)) >>> 0, 0);
}

function isIpv4InCidr(ip: string, cidr: string): boolean {
  const [base, prefixRaw] = cidr.split('/');
  const prefix = Number.parseInt(prefixRaw, 10);
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  return (ipv4ToInt(ip) & mask) === (ipv4ToInt(base) & mask);
}

function parseIpv6ToBigInt(address: string): bigint | null {
  let raw = address.toLowerCase();
  if (raw.includes('.')) {
    const idx = raw.lastIndexOf(':');
    if (idx === -1) return null;
    const v4 = raw.slice(idx + 1);
    if (!net.isIPv4(v4)) return null;
    const nums = v4.split('.').map(Number);
    raw = `${raw.slice(0, idx)}:${((nums[0] << 8) | nums[1]).toString(16)}:${((nums[2] << 8) | nums[3]).toString(16)}`;
  }

  const parts = raw.split('::');
  if (parts.length > 2) return null;
  const left = parts[0] ? parts[0].split(':').filter(Boolean) : [];
  const right = parts[1] ? parts[1].split(':').filter(Boolean) : [];
  const missing = 8 - (left.length + right.length);
  if (missing < 0) return null;

  const hextets = [...left, ...Array(missing).fill('0'), ...right];
  if (hextets.length !== 8) return null;

  return hextets.reduce((acc, part) => {
    const value = Number.parseInt(part, 16);
    if (Number.isNaN(value) || value < 0 || value > 0xffff) {
      throw new Error('invalid_ipv6');
    }
    return (acc << 16n) + BigInt(value);
  }, 0n);
}

function isIpv6InCidr(ip: string, cidr: string): boolean {
  const [base, prefixRaw] = cidr.split('/');
  const prefix = BigInt(Number.parseInt(prefixRaw, 10));
  const ipVal = parseIpv6ToBigInt(ip);
  const baseVal = parseIpv6ToBigInt(base);
  if (ipVal === null || baseVal === null) return false;
  if (prefix === 0n) return true;
  const shift = 128n - prefix;
  return (ipVal >> shift) === (baseVal >> shift);
}

function isBlockedIpAddress(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const blockedCidrs = [
      '0.0.0.0/8',
      '10.0.0.0/8',
      '100.64.0.0/10',
      '127.0.0.0/8',
      '169.254.0.0/16',
      '172.16.0.0/12',
      '192.0.0.0/24',
      '192.0.2.0/24',
      '192.168.0.0/16',
      '198.18.0.0/15',
      '198.51.100.0/24',
      '203.0.113.0/24',
      '224.0.0.0/4',
      '240.0.0.0/4',
    ];
    return blockedCidrs.some(cidr => isIpv4InCidr(ip, cidr));
  }

  if (net.isIPv6(ip)) {
    const blockedCidrs = [
      '::/128',
      '::1/128',
      'fc00::/7',
      'fe80::/10',
      'ff00::/8',
      '2001:db8::/32',
      '::ffff:127.0.0.0/104',
    ];
    return blockedCidrs.some(cidr => isIpv6InCidr(ip, cidr));
  }

  return true;
}

export async function resolveAndValidateCrawlHostname(hostname: string, resolver: HostResolver = defaultHostResolver): Promise<void> {
  const addresses = await resolver(hostname);
  if (!addresses.length) {
    throw new Error('DNS resolution failed for crawl target');
  }

  for (const { address } of addresses) {
    if (isBlockedIpAddress(address)) {
      throw new Error(`Blocked crawl target address: ${address}`);
    }
  }
}

function parseAllowedPorts(protocol: string): Set<number> {
  const defaults = protocol === 'https:' ? [443] : [80];
  const extra = (process.env.ALLOWED_CRAWL_PORTS || '')
    .split(',')
    .map(p => Number.parseInt(p.trim(), 10))
    .filter(p => Number.isInteger(p) && p > 0 && p <= 65535);
  return new Set([...defaults, ...extra]);
}

export function normalizeAndValidateCrawlTarget(rawTarget: string): URL {
  const target = rawTarget.trim();
  const parsed = target.includes('://') ? new URL(target) : new URL(`https://${target}`);

  if (!ALLOWED_CRAWL_SCHEMES.has(parsed.protocol)) {
    throw new Error(`Unsupported crawl scheme: ${parsed.protocol}`);
  }
  if (parsed.username || parsed.password) {
    throw new Error('Crawl target must not include credentials');
  }

  const asciiHostname = domainToASCII(parsed.hostname).toLowerCase();
  if (!asciiHostname) {
    throw new Error('Invalid crawl hostname');
  }
  if (BLOCKED_CRAWL_HOSTNAMES.has(asciiHostname)) {
    throw new Error(`Blocked crawl hostname: ${asciiHostname}`);
  }
  if (asciiHostname.endsWith('.internal')) {
    throw new Error(`Blocked crawl hostname: ${asciiHostname}`);
  }

  const allowedPorts = parseAllowedPorts(parsed.protocol);
  const effectivePort = parsed.port ? Number.parseInt(parsed.port, 10) : (parsed.protocol === 'https:' ? 443 : 80);
  if (!allowedPorts.has(effectivePort)) {
    throw new Error(`Blocked crawl port: ${effectivePort}`);
  }

  parsed.hostname = asciiHostname;
  parsed.hash = '';
  return parsed;
}

