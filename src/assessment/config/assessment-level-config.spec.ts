import { AssessmentLevelConfig } from './assessment-level-config';

describe('AssessmentLevelConfig', () => {
  it('returns disabled config when payload is invalid', () => {
    const config = new AssessmentLevelConfig('assessmentlevels', () => null);

    expect(config.refreshConfig()).toEqual({
      enabled: false,
      mode: null,
      levels: [],
    });
    expect(config.getTargetLevelIndexes(10)).toEqual([]);
  });

  it('normalizes percentage mode and maps to level indexes', () => {
    const config = new AssessmentLevelConfig('assessmentlevels', () => ({
      mode: 'percentage',
      levels: [0.2, 0.6, 1.5, -1],
    }));

    expect(config.refreshConfig()).toEqual({
      enabled: true,
      mode: 'percentage',
      levels: [0, 0.2, 0.6, 1],
    });

    expect(config.getTargetLevelIndexes(10)).toEqual([0, 1, 5, 9]);
    expect(config.shouldShowAtLevel(5, 10)).toBe(true);
    expect(config.shouldShowAtLevel(3, 10)).toBe(false);
  });

  it('normalizes constant mode and maps to level indexes', () => {
    const config = new AssessmentLevelConfig('assessmentlevels', () => ({
      mode: 'constant',
      levels: [2, 15, 2, 0, -4, 3.9],
    }));

    expect(config.refreshConfig()).toEqual({
      enabled: true,
      mode: 'constant',
      levels: [2, 3, 15],
    });

    expect(config.getTargetLevelIndexes(10)).toEqual([1, 2, 9]);
  });
});
