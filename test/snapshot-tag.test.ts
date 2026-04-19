import { describe, expect, it } from 'vitest';

import { buildSnapshotTag, formatUtcDate, resolveSnapshotDate, validateSnapshotDate } from '../src/snapshot-tag';

describe('snapshot tag helpers', () => {
  it('formats UTC dates as YYYY.MM.DD', () => {
    const date = new Date('2026-04-19T23:59:59.000Z');

    expect(formatUtcDate(date)).toBe('2026.04.19');
  });

  it('uses the provided snapshot date as-is', () => {
    expect(resolveSnapshotDate('2026.04.19', new Date('2020-01-01T00:00:00.000Z'))).toBe('2026.04.19');
  });

  it('falls back to the current UTC date when no input is provided', () => {
    expect(resolveSnapshotDate(undefined, new Date('2026-04-19T00:00:00.000Z'))).toBe('2026.04.19');
  });

  it('builds the expected snapshot tag', () => {
    expect(buildSnapshotTag('2026.04.19')).toBe('v2026.04.19');
  });

  it('rejects invalid snapshot dates', () => {
    expect(() => validateSnapshotDate('2026-04-19')).toThrow('snapshot date must use YYYY.MM.DD format');
  });

  it('rejects impossible calendar dates', () => {
    expect(() => validateSnapshotDate('2026.13.01')).toThrow(
      'snapshot date must be a real calendar date in YYYY.MM.DD format',
    );
    expect(() => validateSnapshotDate('2026.02.30')).toThrow(
      'snapshot date must be a real calendar date in YYYY.MM.DD format',
    );
  });

  it('accepts valid leap day dates', () => {
    expect(() => validateSnapshotDate('2028.02.29')).not.toThrow();
  });
});
