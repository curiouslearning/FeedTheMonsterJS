import { initializeApp } from "firebase/app";
import { getAnalytics, logEvent } from "firebase/analytics";
import { firebaseConfig } from "./firebase-config";
import { source, campaign_id } from "@common";

export class BaseFirebaseIntegration {
    firebaseApp: any;
    analytics: any;
    constructor() {
        this.initializeFirebase();
        this.setUserProperties(source,campaign_id);
    }
    protected customEvents(eventName: string, event: object): void {
        try {
            logEvent(this.analytics, eventName, event);
        } catch (error) {
            console.error("Error while logging custom event:", error);
        }
    }
    protected sessionEnd(): void {
        try {
            if (navigator.onLine && this.analytics !== undefined) {
                logEvent(this.analytics, "session_end");
            }
        } catch (error) {
            console.error("Error while logging session_end event:", error);
        }
    }
    private setUserProperties(source: string, campaignId: string): void {
        try {
            setUserProperties(this.analytics, {
                source: source,
                campaign_id: campaignId
            });
            console.log("User properties set: ", { source, campaignId });
        } catch (error) {
            console.error("Error while setting user properties:", error);
        }
    }
    protected initializeFirebase() {
        try {
            this.firebaseApp = initializeApp(firebaseConfig);
            this.analytics = getAnalytics(this.firebaseApp);
        } catch (error) {
            console.error("Error while initializing Firebase:", error);
        }
    }

}