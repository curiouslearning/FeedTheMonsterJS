import '@curiouslearning/assessment-survey/register';
import { resolveAssessmentDataKey } from './assessment-data-key';
import { AssessmentCacheClient } from './assessment-cache-client';
import { AssessmentOverlay } from './ui/assessment-overlay';
import {
  createAssessmentCloseButton,
  createAssessmentPlayerElement,
} from './ui/assessment-player-element';

export class AssessmentSurveyManager {
  private readonly overlayId = 'assessment-survey-overlay';
  private readonly closeButtonId = 'assessment-survey-close-button';
  private readonly playerTag = 'assessment-survey-player';
  private readonly warmedDataKeys = new Set<string>();
  private readonly assessmentOverlay = new AssessmentOverlay(this.overlayId);
  private readonly assessmentCacheClient = new AssessmentCacheClient();

  private resolveAssessmentDataKey(inputDataKey?: string): Promise<string> {
    return resolveAssessmentDataKey(inputDataKey, window.location.search);
  }

  private requestAssessmentLanguageCache(dataKey: string): Promise<boolean> {
    return this.assessmentCacheClient.requestAssessmentLanguageCache(dataKey);
  }

  public async warmupAssessmentLanguageCache(dataKey?: string): Promise<void> {
    const resolvedDataKey = await this.resolveAssessmentDataKey(dataKey);
    const isCached = await this.requestAssessmentLanguageCache(resolvedDataKey);
    if (isCached) {
      this.warmedDataKeys.add(resolvedDataKey);
    }
  }

  public async open(dataKey?: string): Promise<void> {
    const resolvedDataKey = await this.resolveAssessmentDataKey(dataKey);
    const skipLoadingScreen = this.warmedDataKeys.has(resolvedDataKey);

    if (!skipLoadingScreen) {
      this.requestAssessmentLanguageCache(resolvedDataKey).then((isCached) => {
        if (isCached) {
          this.warmedDataKeys.add(resolvedDataKey);
        }
      });
    }

    const playerElement = createAssessmentPlayerElement({
      playerTag: this.playerTag,
      dataKey: resolvedDataKey,
      onLoaded: () => {
        console.log('[assessment-survey] loaded');
      },
      onCompleted: () => {
        console.log('[assessment-survey] completed');
      },
      onClosed: () => {
        this.close();
      },
    });

    const closeButton = createAssessmentCloseButton({
      closeButtonId: this.closeButtonId,
      onClose: () => {
        this.close();
      },
    });

    this.assessmentOverlay.openWithChildren([playerElement, closeButton]);
  }

  public close(): void {
    this.assessmentOverlay.close();
  }
}

const assessmentSurveyManager = new AssessmentSurveyManager();

export default assessmentSurveyManager;
