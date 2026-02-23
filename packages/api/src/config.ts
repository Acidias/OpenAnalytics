import crypto from 'crypto';

// --- JWT ---

if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'change-me-in-production') {
  console.error(
    '\n  ERROR: JWT_SECRET is not set or uses the insecure default.\n' +
    '  Set a strong random secret in your .env file.\n'
  );
  process.exit(1);
}

export const JWT_SECRET: string = process.env.JWT_SECRET;
export const TOKEN_EXPIRY = '7d';
export const TOKEN_EXPIRY_SECONDS = 604_800; // 7 days in seconds

// --- Registration ---

export const REGISTRATION_ENABLED =
  (process.env.REGISTRATION_ENABLED ?? 'true').toLowerCase() === 'true';

// --- Password policy ---

export const COMMON_PASSWORDS = new Set([
  'password1', 'password12', 'password123', 'password1234',
  '12345678', '123456789', '1234567890', '12345678910',
  'qwerty123', 'qwertyuiop', 'qwerty12345',
  'abcdefgh', 'abcd1234', 'abc12345', 'abcdefg1',
  'iloveyou1', 'iloveyou12',
  'admin1234', 'administrator',
  'letmein123', 'welcome123', 'monkey123', 'dragon123',
  'master123', 'shadow123', 'sunshine1', 'princess1',
  'football1', 'baseball1', 'trustno1x',
  'passw0rd1', 'p@ssword1', 'p@ssw0rd1',
  'changeme1', 'changeme12',
  'whatever1', 'nothing123', 'access123',
]);

// --- Timing equalisation ---

let dummyHash: string | null = null;

export function getDummyHash(): string {
  if (!dummyHash) {
    const salt = crypto.randomBytes(16).toString('hex');
    const key = crypto.scryptSync('dummy-password-value', salt, 64);
    dummyHash = `${salt}:${key.toString('hex')}`;
  }
  return dummyHash;
}
