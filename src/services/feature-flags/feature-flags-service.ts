
import { pseudoId } from '@common';
import { StatsigClient } from '@statsig/js-client';
import { LocalStorageCache } from '../cache/local-storage';
import { FEATURE_QUICK_START } from './features';

// TODO: move this to env variable
const STATSIG_CLIENT_KEY = 'client-SSmY5k5Cs39G7II74NdWqPfv5hQzrFiUqCc3C1IU9na';

export class FeatureFlagsService {
  private storage = new LocalStorageCache('FtmFeatureFlag');
  private statsigClient: StatsigClient;

  constructor(public metaData) {
    this.statsigClient = new StatsigClient(STATSIG_CLIENT_KEY, { userID: metaData?.userId || null });
  }

  async initialize() {
    try {
      await this.statsigClient.initializeAsync();
      this.loadAndStore();
    } catch (e) {
      // do nothing, or catch errors when in PWA context.
    }
  }

  /**
   * TODO: create localstorage cache to store flags
   */
  loadAndStore() {
    [
      FEATURE_QUICK_START
    ].forEach((feature) => {
      this.storage.set(feature, this.statsigClient.checkGate(feature))
    });
  }

  isEnabled(key: string) {
    return this.storage.get(key);
  }
}

export const featureFlagService = new FeatureFlagsService({ userId: pseudoId || null });
