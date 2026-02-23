import '@curiouslearning/assessment-survey/register';

const DEFAULT_ASSESSMENT_DATA_KEY = 'zulu-lettersounds';

class AssessmentSurveyManager {
  private readonly overlayId = 'assessment-survey-overlay';
  private readonly playerTag = 'assessment-survey-player';
  private readonly cacheReadyMessage = 'AssessmentLanguageCached';
  private readonly warmedDataKeys = new Set<string>();

  private readonly languageAliasMap: Record<string, string> = {
    lugandan: 'luganda',
    englishwestafrican: 'west-african-english',
    nepali: 'nepalese',
  };

  private getUrlParams(): URLSearchParams {
    return new URLSearchParams(window.location.search);
  }

  private normalizeLanguage(language: string): string {
    const normalizedLanguage = (language || '').trim().toLowerCase();
    return this.languageAliasMap[normalizedLanguage] || normalizedLanguage;
  }

  private deriveAssessmentDataKeyFromUrl(): string {
    const urlParams = this.getUrlParams();

    const explicitDataKey = urlParams.get('assessment_data_key');
    if (explicitDataKey) {
      return explicitDataKey;
    }

    const languageFromUrl = urlParams.get('cr_lang') || '';
    const normalizedLanguage = this.normalizeLanguage(languageFromUrl);
    const assessmentType = (urlParams.get('assessment_type') || 'lettersounds').trim().toLowerCase();

    if (!normalizedLanguage) {
      return DEFAULT_ASSESSMENT_DATA_KEY;
    }

    return `${normalizedLanguage}-${assessmentType}`;
  }

  private async hasAssessmentData(dataKey: string): Promise<boolean> {
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

  private async resolveAssessmentDataKey(inputDataKey?: string): Promise<string> {
    const dataKeyToCheck = inputDataKey || this.deriveAssessmentDataKeyFromUrl();
    if (await this.hasAssessmentData(dataKeyToCheck)) {
      return dataKeyToCheck;
    }

    return DEFAULT_ASSESSMENT_DATA_KEY;
  }

  private ensureOverlay(): HTMLElement {
    let overlay = document.getElementById(this.overlayId);

    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = this.overlayId;
      overlay.style.position = 'fixed';
      overlay.style.inset = '0';
      overlay.style.width = '100vw';
      overlay.style.height = '100vh';
      overlay.style.zIndex = '30';
      overlay.style.display = 'none';
      overlay.style.background = '#ffffff';
      document.body.appendChild(overlay);
    }

    return overlay;
  }

  private createPlayerElement(dataKey: string, skipLoadingScreen: boolean): HTMLElement {
    const playerElement = document.createElement(this.playerTag);

    playerElement.setAttribute('data-key', dataKey);
    playerElement.setAttribute('user-id', 'ftm-web-user');
    playerElement.setAttribute('user-source', 'feed-the-monster-web');
    playerElement.setAttribute('asset-base-url', '/assessment-survey');
    playerElement.setAttribute('enable-service-worker', 'false');
    playerElement.setAttribute('enable-unity-bridge', 'false');
    playerElement.setAttribute('enable-android-summary', 'false');
    playerElement.setAttribute('enable-parent-post-message', 'false');
    playerElement.setAttribute('skip-loading-screen', String(skipLoadingScreen));

    playerElement.addEventListener('loaded', () => {
      console.log('[assessment-survey] loaded');
    });

    playerElement.addEventListener('completed', () => {
      console.log('[assessment-survey] completed');
    });

    playerElement.addEventListener('closed', () => {
      this.close();
    });

    return playerElement;
  }

  private requestAssessmentLanguageCache(dataKey: string): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
      return Promise.resolve(false);
    }

    return new Promise((resolve) => {
      const channel = new BroadcastChannel('my-channel');

      const timeoutHandle = window.setTimeout(() => {
        channel.removeEventListener('message', onMessage);
        channel.close();
        resolve(false);
      }, 20000);

      const onMessage = (event: MessageEvent): void => {
        if (event?.data?.msg !== this.cacheReadyMessage) {
          return;
        }

        const messageData = event.data?.data || {};
        if (messageData.dataKey !== dataKey) {
          return;
        }

        window.clearTimeout(timeoutHandle);
        channel.removeEventListener('message', onMessage);
        channel.close();
        resolve(Boolean(messageData.ok));
      };

      channel.addEventListener('message', onMessage);
      channel.postMessage({
        command: 'CacheAssessmentLanguage',
        data: dataKey,
      });
    });
  }

  public async warmupAssessmentLanguageCache(dataKey?: string): Promise<void> {
    const resolvedDataKey = await this.resolveAssessmentDataKey(dataKey);
    const isCached = await this.requestAssessmentLanguageCache(resolvedDataKey);
    if (isCached) {
      this.warmedDataKeys.add(resolvedDataKey);
    }
  }

  public async openForTesting(dataKey?: string): Promise<void> {
    const resolvedDataKey = await this.resolveAssessmentDataKey(dataKey);
    const overlay = this.ensureOverlay();
    overlay.innerHTML = '';
    const skipLoadingScreen = this.warmedDataKeys.has(resolvedDataKey);

    if (!skipLoadingScreen) {
      this.requestAssessmentLanguageCache(resolvedDataKey).then((isCached) => {
        if (isCached) {
          this.warmedDataKeys.add(resolvedDataKey);
        }
      });
    }

    const playerElement = this.createPlayerElement(resolvedDataKey, skipLoadingScreen);
    overlay.appendChild(playerElement);
    overlay.style.display = 'block';
  }

  public close(): void {
    const overlay = document.getElementById(this.overlayId);
    if (!overlay) {
      return;
    }

    overlay.style.display = 'none';
    overlay.innerHTML = '';
  }
}

const assessmentSurveyManager = new AssessmentSurveyManager();

export default assessmentSurveyManager;