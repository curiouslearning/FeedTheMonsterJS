import { AssessmentLevelConfig } from './assessment-level-config';

describe('AssessmentLevelConfig', () => {
  it('returns disabled config when payload is invalid', () => {
    const config = new AssessmentLevelConfig('assessmentlevels', () => null);

    expect(config.refreshConfig()).toEqual({
      enabled: false,
      mode: null,
      assessments: [],
    });
    expect(config.getTargetLevelIndexes(10)).toEqual([]);
    expect(config.getAssessmentTypeForLevel(1, 10)).toBeNull();
  });

  it('normalizes percentage mode and maps to level indexes with assessment types', () => {
    const config = new AssessmentLevelConfig('assessmentlevels', () => ({
      enabled: true,
      mode: 'percentage',
      assessments: [
        { assessmentType: 'lettersounds', level: 0.2 },
        { assessmentType: 'sightwords', level: 0.6 },
        { assessmentType: 'lettersounds', level: 1.5 },
        { assessmentType: 'lettersounds', level: -1 },
      ],
    }));

    expect(config.refreshConfig()).toEqual({
      enabled: true,
      mode: 'percentage',
      assessments: [
        { assessmentType: 'lettersounds', level: 0.2 },
        { assessmentType: 'sightwords', level: 0.6 },
        { assessmentType: 'lettersounds', level: 1 },
        { assessmentType: 'lettersounds', level: 0 },
      ],
    });

    expect(config.getTargetAssessments(10)).toEqual([
      { levelIndex: 1, assessmentType: 'lettersounds' },
      { levelIndex: 5, assessmentType: 'sightwords' },
      { levelIndex: 9, assessmentType: 'lettersounds' },
      { levelIndex: 0, assessmentType: 'lettersounds' },
    ]);
    expect(config.getTargetLevelIndexes(10)).toEqual([0, 1, 5, 9]);
    expect(config.shouldShowAtLevel(5, 10)).toBe(true);
    expect(config.shouldShowAtLevel(3, 10)).toBe(false);
    expect(config.getAssessmentTypeForLevel(1, 10)).toBe('lettersounds');
    expect(config.getAssessmentTypeForLevel(5, 10)).toBe('sightwords');
  });

  it('normalizes constant mode and maps to level indexes with assessment types', () => {
    const config = new AssessmentLevelConfig('assessmentlevels', () => ({
      enabled: true,
      mode: 'constant',
      assessments: [
        { assessmentType: 'lettersounds', level: 2 },
        { assessmentType: 'lettersounds', level: 2 },
        { assessmentType: 'sightwords', level: 3.9 },
        { assessmentType: 'lettersounds', level: 15 },
        { assessmentType: 'lettersounds', level: 0 },
        { assessmentType: '', level: 4 },
      ],
    }));

    expect(config.refreshConfig()).toEqual({
      enabled: true,
      mode: 'constant',
      assessments: [
        { assessmentType: 'lettersounds', level: 2 },
        { assessmentType: 'sightwords', level: 3 },
        { assessmentType: 'lettersounds', level: 15 },
      ],
    });

    expect(config.getTargetAssessments(10)).toEqual([
      { levelIndex: 1, assessmentType: 'lettersounds' },
      { levelIndex: 2, assessmentType: 'sightwords' },
      { levelIndex: 9, assessmentType: 'lettersounds' },
    ]);
    expect(config.getTargetLevelIndexes(10)).toEqual([1, 2, 9]);
    expect(config.getAssessmentTypeForLevel(2, 10)).toBe('sightwords');
  });

  it('preserves explicit assessment data keys from Statsig config', () => {
    const config = new AssessmentLevelConfig('assessmentlevels', () => ({
      enabled: true,
      mode: 'constant',
      assessments: [
        { assessmentType: 'French-LetterSounds', level: 2 },
        { assessmentType: 'french-sightwords', level: 3 },
      ],
    }));

    expect(config.refreshConfig()).toEqual({
      enabled: true,
      mode: 'constant',
      assessments: [
        { assessmentType: 'french-lettersounds', level: 2 },
        { assessmentType: 'french-sightwords', level: 3 },
      ],
    });

    expect(config.getTargetAssessments(10)).toEqual([
      { levelIndex: 1, assessmentType: 'french-lettersounds' },
      { levelIndex: 2, assessmentType: 'french-sightwords' },
    ]);
    expect(config.getAssessmentTypeForLevel(1, 10)).toBe('french-lettersounds');
    expect(config.getAssessmentTypeForLevel(2, 10)).toBe('french-sightwords');
  });

  it('returns disabled when enabled is false', () => {
    const config = new AssessmentLevelConfig('assessmentlevels', () => ({
      enabled: false,
      mode: 'constant',
      assessments: [
        { assessmentType: 'lettersounds', level: 2 },
      ],
    }));

    expect(config.refreshConfig()).toEqual({
      enabled: false,
      mode: 'constant',
      assessments: [],
    });
    expect(config.getTargetLevelIndexes(10)).toEqual([]);
  });
});
