import { describe, expect, it } from 'vitest';
import { attributeToInfluence } from '../attributeToInfluence';

describe('attributeToInfluence', () => {
	it.each([
		[1, -4],
		[2, -4],
		[3, -4],
		[4, -3],
		[5, -3],
		[6, -2],
		[7, -2],
		[8, -1],
		[9, -1],
		[10, 0],
		[11, 0],
		[12, 1],
		[13, 1],
		[14, 2],
		[15, 2],
		[16, 3],
		[17, 3],
		[18, 4],
		[19, 4],
		[20, 4],
	])('maps attribute %i to influence %i', (attribute, expected) => {
		expect(attributeToInfluence(attribute)).toBe(expected);
	});
});
