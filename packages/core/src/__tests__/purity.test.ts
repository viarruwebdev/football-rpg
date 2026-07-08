import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const CORE_SRC = join(import.meta.dirname, '..');
const SELF_FILE = relative(CORE_SRC, import.meta.filename ?? '');

function collectTsFiles(dir: string): string[] {
	const entries = readdirSync(dir);
	const files: string[] = [];
	for (const entry of entries) {
		const fullPath = join(dir, entry);
		const stats = statSync(fullPath);
		if (stats.isDirectory()) {
			files.push(...collectTsFiles(fullPath));
		} else if (entry.endsWith('.ts') && relative(CORE_SRC, fullPath) !== SELF_FILE) {
			files.push(fullPath);
		}
	}
	return files;
}

function findMatches(pattern: RegExp): string[] {
	const matches: string[] = [];
	for (const file of collectTsFiles(CORE_SRC)) {
		const content = readFileSync(file, 'utf-8');
		const lines = content.split('\n');
		lines.forEach((line, index) => {
			if (pattern.test(line)) {
				matches.push(`${relative(CORE_SRC, file)}:${index + 1}: ${line.trim()}`);
			}
			pattern.lastIndex = 0;
		});
	}
	return matches;
}

describe('core-determinism-guard', () => {
	it('packages/core/src has no non-deterministic sources', () => {
		const pattern =
			/Math\.random|Date\.now|new Date|performance\.now|fetch\(|window\.|document\.|localStorage|sessionStorage/;
		const matches = findMatches(pattern);
		expect(matches).toEqual([]);
	});

	it('packages/core/src does not import from apps/ or ui/', () => {
		const pattern = /from ['"](\.\.\/)*(apps|ui)/;
		const matches = findMatches(pattern);
		expect(matches).toEqual([]);
	});
});
