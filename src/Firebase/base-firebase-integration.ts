import { initializeApp } from "firebase/app";
import { getAnalytics, logEvent } from "firebase/analytics";
import { firebaseConfig } from "./firebase-config";

export class BaseFirebaseIntegration {
    firebaseApp: any;
    analytics: any;
    constructor() {
        this.initializeFirebase();
    }
    protected customEvents(eventName: string, event: object): void {
        try {
            console.log(`Sending custom event ${eventName} with data:`, event);
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
    protected initializeFirebase() {
        try {
            this.firebaseApp = initializeApp(firebaseConfig);
            this.analytics = getAnalytics(this.firebaseApp);
        } catch (error) {
            console.error("Error while initializing Firebase:", error);
        }
    }

}