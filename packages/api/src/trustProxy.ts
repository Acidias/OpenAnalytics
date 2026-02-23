import type { FastifyServerOptions } from 'fastify';

type TrustProxyValue = FastifyServerOptions['trustProxy'];

const KNOWN_PROXY_ENV_VARS = [
  'VERCEL',
  'RENDER',
  'HEROKU',
  'FLY_APP_NAME',
  'CF_PAGES',
  'CLOUDFLARE',
  'RAILWAY_ENVIRONMENT',
  'KOYEB_APP_NAME',
];

function parseBoolean(value: string | undefined): boolean | undefined {
  if (!value) return undefined;
  const normalised = value.trim().toLowerCase();
  if (normalised === 'true') return true;
  if (normalised === 'false') return false;
  return undefined;
}

function parseTrustedProxyHops(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return undefined;
  }
  return parsed;
}

function parseTrustedProxySubnets(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function hasKnownProxyEnvironment(env: NodeJS.ProcessEnv): boolean {
  return KNOWN_PROXY_ENV_VARS.some((variable) => Boolean(env[variable]));
}

export function resolveTrustProxyConfig(env: NodeJS.ProcessEnv = process.env): {
  trustProxy: TrustProxyValue;
  warnings: string[];
} {
  const warnings: string[] = [];

  const explicitTrustProxy = parseBoolean(env.TRUST_PROXY);
  const trustedHops = parseTrustedProxyHops(env.TRUSTED_PROXY_HOPS);
  const trustedSubnets = parseTrustedProxySubnets(env.TRUSTED_PROXY_SUBNETS);

  if (env.TRUST_PROXY && explicitTrustProxy === undefined) {
    warnings.push('TRUST_PROXY is set but is not a valid boolean. Falling back to automatic trustProxy detection.');
  }

  if (env.TRUSTED_PROXY_HOPS && trustedHops === undefined) {
    warnings.push('TRUSTED_PROXY_HOPS is set but is not a valid non-negative integer. Ignoring this value.');
  }

  let trustProxy: TrustProxyValue = false;

  if (trustedSubnets.length > 0) {
    trustProxy = trustedSubnets;
  } else if (trustedHops !== undefined) {
    trustProxy = trustedHops;
  } else if (explicitTrustProxy === true) {
    trustProxy = true;
  } else if (explicitTrustProxy === false) {
    trustProxy = false;
  } else if (hasKnownProxyEnvironment(env)) {
    trustProxy = true;
  }

  if (trustProxy === true) {
    warnings.push(
      'trustProxy is enabled without TRUSTED_PROXY_HOPS or TRUSTED_PROXY_SUBNETS. ' +
      'Configure trusted proxy hops/subnets to prevent X-Forwarded-For spoofing.'
    );
  }

  return { trustProxy, warnings };
}
