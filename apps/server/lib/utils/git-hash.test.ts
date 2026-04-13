import { afterEach, describe, expect, it, vi } from 'vitest';

const originalEnv = {
    GIT_HASH: process.env.GIT_HASH,
};

afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.unmock('node:child_process');

    if (originalEnv.GIT_HASH === undefined) {
        delete process.env.GIT_HASH;
    } else {
        process.env.GIT_HASH = originalEnv.GIT_HASH;
    }
});

describe('git-hash', () => {
    it('falls back to unknown when git commands fail', async () => {
        delete process.env.GIT_HASH;

        vi.doMock('node:child_process', () => ({
            execSync: () => {
                throw new Error('git failure');
            },
        }));

        const { gitHash } = await import('@/utils/git-hash');
        expect(gitHash).toBe('unknown');
    });

    it('uses GIT_HASH when provided', async () => {
        process.env.GIT_HASH = '1234567890abcdef';

        const { gitHash } = await import('@/utils/git-hash');
        expect(gitHash).toBe('12345678');
    });
});
