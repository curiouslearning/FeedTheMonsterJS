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

export function deriveAssessmentDataKeyFromUrl(search: string): string {
  const urlParams = new URLSearchParams(search);

  const explicitDataKey = urlParams.get('assessment_data_key');
  if (explicitDataKey) {
    return explicitDataKey;
  }

  const languageFromUrl = urlParams.get('cr_lang') || '';
  const normalizedLanguage = normalizeLanguage(languageFromUrl);
  const assessmentType = (urlParams.get('assessment_type') || 'lettersounds').trim().toLowerCase();

  if (!normalizedLanguage) {
    return DEFAULT_ASSESSMENT_DATA_KEY;
  }

  return `${normalizedLanguage}-${assessmentType}`;
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
  const dataKeyToCheck = inputDataKey || deriveAssessmentDataKeyFromUrl(search);

  if (await hasAssessmentData(dataKeyToCheck)) {
    return dataKeyToCheck;
  }

  return DEFAULT_ASSESSMENT_DATA_KEY;
}

export { DEFAULT_ASSESSMENT_DATA_KEY };
