import { describe, it, expect } from '@jest/globals';
import { spawn } from 'node:child_process';

function runWithEnv(
  extra: Record<string, string> = {}
): Promise<{ code: number | null; stderr: string }> {
  const baseEnv: Record<string, string | undefined> = {
    ...process.env,
    NODE_ENV: 'test',
    PORT: '3000',
    MONGO_URI: 'mongodb://127.0.0.1:27017/navin_test',
    JWT_SECRET: 'a-very-long-test-secret-that-is-32-chars',
    REDIS_URL: 'redis://127.0.0.1:6379',
    STELLAR_NETWORK: 'testnet',
    // Clear optional secrets that dotenv may inject with invalid placeholders
    STELLAR_SECRET_KEY: undefined,
    STELLAR_WEBHOOK_SECRET: undefined,
    SMTP_FROM: undefined,
    SENTRY_DSN: undefined,
    FRONTEND_URL: undefined,
    ...extra,
  };

  return new Promise(resolve => {
    const child = spawn(process.execPath, ['--input-type=module', '-e', 'import "./dist/src/env.js";'], {
      env: baseEnv as NodeJS.ProcessEnv,
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 10_000,
    });

    let stderr = '';
    child.stderr?.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on('close', code => {
      resolve({ code, stderr });
    });

    child.on('error', () => {
      resolve({ code: 1, stderr });
    });
  });
}

describe('env validation', () => {
  it('succeeds with all required vars present', async () => {
    const { code, stderr } = await runWithEnv();
    expect(stderr).toBe('');
    expect(code).toBe(0);
  });

  it('fails when MONGO_URI is missing', async () => {
    const { code } = await runWithEnv({ MONGO_URI: '' });
    expect(code).not.toBe(0);
  });

  it('fails when JWT_SECRET is missing', async () => {
    const { code } = await runWithEnv({ JWT_SECRET: '' });
    expect(code).not.toBe(0);
  });

  it('accepts optional vars without error', async () => {
    const { code, stderr } = await runWithEnv({
      SMTP_HOST: 'smtp.example.com',
      SMTP_PORT: '587',
      TWILIO_SID: 'AC123',
      S3_BUCKET: 'my-bucket',
      SENTRY_DSN: 'https://examplePublicKey@o0.ingest.sentry.io/0',
      FRONTEND_URL: 'http://localhost:5173',
    });
    expect(stderr).toBe('');
    expect(code).toBe(0);
  });

  it('rejects invalid URL for SENTRY_DSN', async () => {
    const { code } = await runWithEnv({ SENTRY_DSN: 'not-a-url' });
    expect(code).not.toBe(0);
  });

  it('rejects invalid URL for FRONTEND_URL', async () => {
    const { code } = await runWithEnv({ FRONTEND_URL: 'not-a-url' });
    expect(code).not.toBe(0);
  });
});
