const DEFAULT_ASSESSMENT_DATA_KEY = 'zulu-lettersounds';

const languageAliasMap: Record<string, string> = {
  lugandan: 'luganda',
  englishwestafrican: 'west-african-english',
  nepali: 'nepalese',
};

function normalizeLanguage(language: string): string {
  const normalizedLanguage = (language || '').trim().toLowerCase();
  return languageAliasMap[normalizedLanguage] || normalizedLanguage;
}

function normalizeAssessmentType(assessmentType: string): string {
  const normalizedAssessmentType = (assessmentType || '').trim().toLowerCase();
  return normalizedAssessmentType || 'lettersounds';
}

function buildLanguageScopedDataKey(language: string, assessmentType: string): string {
  const normalizedLanguage = normalizeLanguage(language);
  if (!normalizedLanguage) {
    return DEFAULT_ASSESSMENT_DATA_KEY;
  }

  return `${normalizedLanguage}-${normalizeAssessmentType(assessmentType)}`;
}

function deriveLanguageFromSearch(search: string): string {
  const urlParams = new URLSearchParams(search);
  return urlParams.get('cr_lang') || '';
}

export function mapAssessmentTypeToDataKey(
  assessmentType: string,
  search: string = window.location.search
): string {
  return buildLanguageScopedDataKey(deriveLanguageFromSearch(search), assessmentType);
}

export function deriveAssessmentDataKeyFromUrl(search: string): string {
  const urlParams = new URLSearchParams(search);

  const explicitDataKey = urlParams.get('assessment_data_key');
  if (explicitDataKey) {
    return explicitDataKey;
  }

  const languageFromUrl = urlParams.get('cr_lang') || '';
  const assessmentType = urlParams.get('assessment_type') || 'lettersounds';

  return buildLanguageScopedDataKey(languageFromUrl, assessmentType);
}

export async function hasAssessmentData(dataKey: string): Promise<boolean> {
  try {
    const response = await fetch(`/assessment-survey/data/${dataKey}.json`, {
      method: 'HEAD',
      cache: 'no-store',
    });

    return response.ok;
  } catch (error) {
    return false;
  }
}

export async function resolveAssessmentDataKey(
  inputDataKey?: string,
  search: string = window.location.search
): Promise<string> {
  const resolvedInputDataKey = (inputDataKey || '').trim();
  const dataKeyToCheck = resolvedInputDataKey
    ? (resolvedInputDataKey.includes('-')
      ? resolvedInputDataKey
      : mapAssessmentTypeToDataKey(resolvedInputDataKey, search))
    : deriveAssessmentDataKeyFromUrl(search);

  if (await hasAssessmentData(dataKeyToCheck)) {
    return dataKeyToCheck;
  }

  return DEFAULT_ASSESSMENT_DATA_KEY;
}

export { DEFAULT_ASSESSMENT_DATA_KEY };
