import { AnalyticsService, FirebaseStrategy, StatsigStrategy } from '@curiouslearning/analytics';
import { analyticsConfig, statsigConfig } from "./analytics-config";
import { source, campaign_id, pseudoId } from "@common";

export class BaseAnalyticsIntegration {
    private analyticsService: AnalyticsService;
    private firebaseStrategy: FirebaseStrategy;
    private statsigStrategy: StatsigStrategy;
    private isInitialized: boolean = false;

    constructor() {
        this.analyticsService = new AnalyticsService();
    }

    public async initialize(): Promise<void> {
        if (this.isInitialized) {
            return;
        }

        try {
            // Initialize Analytics Strategy
            this.firebaseStrategy = new FirebaseStrategy({
                firebaseOptions: {
                    apiKey: analyticsConfig.apiKey,
                    authDomain: analyticsConfig.authDomain,
                    databaseURL: analyticsConfig.databaseURL,
                    projectId: analyticsConfig.projectId,
                    storageBucket: analyticsConfig.storageBucket,
                    messagingSenderId: analyticsConfig.messagingSenderId,
                    appId: analyticsConfig.appId,
                    measurementId: analyticsConfig.measurementId,
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
            console.log("Analytics service initialized successfully with Firebase and Statsig");

        } catch (error) {
            console.error("Error while initializing analytics:", error);
            throw error; // Re-throw to let users handle initialization errors
        }
    }

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

    protected sessionEnd(): void {
        try {
            if (navigator.onLine && this.isInitialized) {
                this.analyticsService.track("session_end", {});
            }
        } catch (error) {
            console.error("Error while logging session_end event:", error);
        }
    }

    // Getter methods for backward compatibility if needed
    get analytics() {
        return this.analyticsService;
    }

    get firebaseApp() {
        return this.firebaseStrategy?.firebaseApp;
    }

    // Method to check if analytics is ready
    public isAnalyticsReady(): boolean {
        return this.isInitialized;
    }
}