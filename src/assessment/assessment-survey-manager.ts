import '@curiouslearning/assessment-survey/register';
import { resolveAssessmentDataKey } from './assessment-data-key';
import { AssessmentCacheClient } from './assessment-cache-client';
import { AssessmentOverlay } from './ui/assessment-overlay';
import {
  createAssessmentCloseButton,
  createAssessmentPlayerElement,
} from './ui/assessment-player-element';

export interface AssessmentSurveyOpenOptions {
  dataKey?: string;
  onLoaded?: () => void;
  onCompleted?: () => void;
  onClosed?: () => void;
}

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

  private async warmupResolvedDataKey(dataKey?: string): Promise<void> {
    const resolvedDataKey = await this.resolveAssessmentDataKey(dataKey);

    if (this.warmedDataKeys.has(resolvedDataKey)) {
      return;
    }

    const isCached = await this.requestAssessmentLanguageCache(resolvedDataKey);
    if (isCached) {
      this.warmedDataKeys.add(resolvedDataKey);
    }
  }

  public async warmupAssessmentLanguageCache(dataKey?: string): Promise<void> {
    await this.warmupResolvedDataKey(dataKey);
  }

  public async warmupAssessmentLanguageCaches(dataKeys?: string[]): Promise<void> {
    if (!Array.isArray(dataKeys) || dataKeys.length < 1) {
      await this.warmupResolvedDataKey();
      return;
    }

    const uniqueDataKeys = [...new Set(
      dataKeys
        .map((dataKey) => dataKey?.trim())
        .filter((dataKey) => Boolean(dataKey))
    )] as string[];

    if (uniqueDataKeys.length < 1) {
      await this.warmupResolvedDataKey();
      return;
    }

    await Promise.all(uniqueDataKeys.map((dataKey) => this.warmupResolvedDataKey(dataKey)));
  }

  public async open(options: AssessmentSurveyOpenOptions): Promise<void> {
    const resolvedDataKey = await this.resolveAssessmentDataKey(options.dataKey);
    const skipLoadingScreen = this.warmedDataKeys.has(resolvedDataKey);

    if (!skipLoadingScreen) {
      this.requestAssessmentLanguageCache(resolvedDataKey).then((isCached) => {
        if (isCached) {
          this.warmedDataKeys.add(resolvedDataKey);
        }
      });
    }

    let hasClosed = false;
    const handleClose = () => {
      if (hasClosed) {
        return;
      }

      hasClosed = true;
      this.close();
      options.onClosed?.();
    };

    const playerElement = createAssessmentPlayerElement({
      playerTag: this.playerTag,
      dataKey: resolvedDataKey,
      onLoaded: () => {
        console.log('[assessment-survey] loaded');
        options.onLoaded?.();
      },
      onCompleted: () => {
        console.log('[assessment-survey] completed');
        options.onCompleted?.();
      },
      onClosed: () => {
        handleClose();
      },
    });

    const closeButton = createAssessmentCloseButton({
      closeButtonId: this.closeButtonId,
      onClose: () => {
        handleClose();
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
