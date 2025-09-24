import { AnalyticsService, FirebaseStrategy, StatsigStrategy } from '@curiouslearning/analytics';
import { firebaseConfig, statsigConfig } from "./analytics-config";
import { source, campaign_id, pseudoId } from "@common";

/**
 * `BaseAnalyticsIntegration` is the foundational analytics integration class
 * that configures and manages multiple analytics providers under a unified
 * {@link AnalyticsService}.
 *
 * Currently, this class integrates:
 * - {@link FirebaseStrategy} → For Firebase Analytics
 * - {@link StatsigStrategy} → For feature flagging and experimentation
 *
 * It ensures that both strategies are initialized with the appropriate
 * configuration and user context. Once initialized, events can be tracked
 * seamlessly through the unified analytics service.
 *
 * @remarks
 * - This class should not be used directly in most cases.
 *   Use {@link AnalyticsIntegration}, which extends this base class.
 * - Events can be queued until initialization is complete.
 *
 * @example
 * ```ts
 * const baseAnalytics = new BaseAnalyticsIntegration();
 * await baseAnalytics.initialize();
 *
 * baseAnalytics['trackCustomEvent']("custom_event", {
 *   foo: "bar",
 *   userId: "123"
 * });
 * ```
 *
 * @since 1.0.0
 */
export class BaseAnalyticsIntegration {
    private analyticsService: AnalyticsService;
    private firebaseStrategy: FirebaseStrategy;
    private statsigStrategy: StatsigStrategy;
    private isInitialized: boolean = false;

    constructor() {
        this.analyticsService = new AnalyticsService();
    }
  /**
   * Initializes Firebase and Statsig analytics strategies
   * and registers them into the {@link AnalyticsService}.
   *
   * @returns {Promise<void>} A promise that resolves when initialization completes.
   *
   * @throws Will re-throw any errors encountered during strategy initialization.
   *
   * @example
   * ```ts
   * const analytics = new BaseAnalyticsIntegration();
   * await analytics.initialize();
   * ```
   *
   * @since 1.0.0
   */
    public async initialize(): Promise<void> {
        if (this.isInitialized) {
            return;
        }

        try {
            // Initialize Analytics Strategy
            this.firebaseStrategy = new FirebaseStrategy({
                firebaseOptions: {
                    apiKey: firebaseConfig.apiKey,
                    authDomain: firebaseConfig.authDomain,
                    databaseURL: firebaseConfig.databaseURL,
                    projectId: firebaseConfig.projectId,
                    storageBucket: firebaseConfig.storageBucket,
                    messagingSenderId: firebaseConfig.messagingSenderId,
                    appId: firebaseConfig.appId,
                    measurementId: firebaseConfig.measurementId,
                },
                userProperties: {
                    campaign_id: campaign_id || '',
                    source: source || ''
                }
            });

            await this.firebaseStrategy.initialize();
            this.analyticsService.register('firebase', this.firebaseStrategy);

            // Initialize Statsig Strategy
            this.statsigStrategy = new StatsigStrategy({
                clientKey: statsigConfig.clientKey,
                statsigUser: {
                    userID: pseudoId || statsigConfig.userId
                }
            });

            await this.statsigStrategy.initialize();
            this.analyticsService.register('statsig', this.statsigStrategy);

            this.isInitialized = true;

        } catch (error) {
            console.error("Error while initializing analytics:", error);
            throw error; // Re-throw to let users handle initialization errors
        }
    }
/**
   * Tracks a custom analytics event using the registered strategies.
   *
   * @param {string} eventName - The name of the event (e.g. `"session_start"`).
   * @param {object} event - The event payload object.
   * @returns {void}
   *
   * @remarks
   * - If analytics is not yet initialized, the event may be queued.
   * - Any runtime errors will be logged to the console.
   *
   * @example
   * ```ts
   * this.trackCustomEvent("level_completed", {
   *   level: 3,
   *   duration: 120
   * });
   * ```
   *
   * @since 1.0.0
   * @protected
   */
    protected trackCustomEvent(eventName: string, event: object): void {
        if (!this.isInitialized) {
            console.warn("Analytics not initialized, queuing event:", eventName);
            // The analytics service should handle queuing events until initialization
        }

        try {
            this.analyticsService.track(eventName, event);
        } catch (error) {
            console.error("Error while logging custom event:", error);
        }
    }
 /**
   * Tracks a `session_end` event.
   *
   * @returns {void}
   *
   * @remarks
   * - The event will only be logged if analytics is initialized
   *   and the user is online (`navigator.onLine`).
   * - Any runtime errors will be logged to the console.
   *
   * @example
   * ```ts
   * this.sessionEnd();
   * ```
   *
   * @since 1.0.0
   * @protected
   */
    protected sessionEnd(): void {
        try {
            if (navigator.onLine && this.isInitialized) {
                this.analyticsService.track("session_end", {});
            }
        } catch (error) {
            console.error("Error while logging session_end event:", error);
        }
    }

   /**
   * Exposes the underlying {@link AnalyticsService} instance.
   *
   * @returns {AnalyticsService} The analytics service instance.
   *
   * @since 1.0.0
   */
  get analytics(): AnalyticsService {
    return this.analyticsService;
  }

  /**
   * Exposes the initialized Firebase app, if available.
   *
   * @returns {FirebaseApp | undefined} The Firebase app instance,
   * or `undefined` if not yet initialized.
   *
   * @since 1.0.0
   */
    get firebaseApp() {
        return this.firebaseStrategy?.firebaseApp;
    }

    /**
   * Returns whether the analytics system has finished initialization.
   *
   * @returns {boolean} `true` if analytics are ready, otherwise `false`.
   *
   * @example
   * ```ts
   * if (analytics.isAnalyticsReady()) {
   *   analytics.trackCustomEvent("event", { foo: "bar" });
   * }
   * ```
   *
   * @since 1.0.0
   */
    public isAnalyticsReady(): boolean {
        return this.isInitialized;
    }
}