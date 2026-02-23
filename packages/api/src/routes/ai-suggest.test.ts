import test from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizeAndValidateCrawlTarget,
  resolveAndValidateCrawlHostname,
} from './crawl-target';

test('normalizeAndValidateCrawlTarget allows https default target', () => {
  const parsed = normalizeAndValidateCrawlTarget('example.com');
  assert.equal(parsed.protocol, 'https:');
  assert.equal(parsed.hostname, 'example.com');
  assert.equal(parsed.port, '');
});

test('normalizeAndValidateCrawlTarget rejects http without explicit opt-in', () => {
  assert.throws(() => normalizeAndValidateCrawlTarget('http://example.com'), /Unsupported crawl scheme/);
});

test('normalizeAndValidateCrawlTarget rejects blocked hostnames', () => {
  assert.throws(() => normalizeAndValidateCrawlTarget('localhost'), /Blocked crawl hostname/);
  assert.throws(() => normalizeAndValidateCrawlTarget('foo.internal'), /Blocked crawl hostname/);
});

test('normalizeAndValidateCrawlTarget rejects non-standard ports', () => {
  assert.throws(() => normalizeAndValidateCrawlTarget('https://example.com:8443'), /Blocked crawl port/);
});

test('resolveAndValidateCrawlHostname allows public DNS addresses', async () => {
  await assert.doesNotReject(() => resolveAndValidateCrawlHostname('example.com', async () => [
    { address: '93.184.216.34', family: 4 },
  ]));
});

test('resolveAndValidateCrawlHostname rejects loopback/private/link-local/metadata targets', async () => {
  await assert.rejects(
    () => resolveAndValidateCrawlHostname('bad.local', async () => [{ address: '127.0.0.1', family: 4 }]),
    /Blocked crawl target address/
  );

  await assert.rejects(
    () => resolveAndValidateCrawlHostname('bad.local', async () => [{ address: '10.0.0.5', family: 4 }]),
    /Blocked crawl target address/
  );

  await assert.rejects(
    () => resolveAndValidateCrawlHostname('bad.local', async () => [{ address: '169.254.169.254', family: 4 }]),
    /Blocked crawl target address/
  );

  await assert.rejects(
    () => resolveAndValidateCrawlHostname('bad.local', async () => [{ address: '::1', family: 6 }]),
    /Blocked crawl target address/
  );
});
