import { initializeApp } from "firebase/app";
import {
  getAnalytics,
  logEvent,
  setUserProperties,
} from "firebase/analytics";
import { firebaseConfig } from "./firebase-config";
import { lang, pseudoId } from "../../global-variables";

export class BaseFirebaseIntegration {
  firebaseApp: any;
  analytics: any;
  constructor() {
    this.initializeFirebase();
    this.setCommonUserProperties();
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
  private setCommonUserProperties() {
    try {
      setUserProperties(this.analytics, {
        cr_user_id: pseudoId,
        ftm_language: lang,
        profile_number: 0,
        version_number: document.getElementById("version-info-id").innerHTML,
        json_version_number: 1.2333,
      });
      console.log("User properties set");
    } catch (error) {
      console.error("Error while setting user properties:", error);
    }
  }
}
