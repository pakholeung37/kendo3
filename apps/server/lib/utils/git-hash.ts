import { execSync } from 'node:child_process';

let gitHash = process.env.GIT_HASH?.slice(0, 8);
let gitDate: Date | undefined;
if (!gitHash) {
    try {
        gitHash = execSync('git rev-parse HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
            .toString()
            .trim()
            .slice(0, 8);
        gitDate = new Date(
            execSync('git log -1 --format=%cd', { stdio: ['ignore', 'pipe', 'ignore'] })
                .toString()
                .trim()
        );
    } catch {
        gitHash = 'unknown';
    }
}

export { gitDate, gitHash };
