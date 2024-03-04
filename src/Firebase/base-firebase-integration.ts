import { initializeApp } from "firebase/app";
import {
  getAnalytics,
  logEvent,
  setUserId,
  setUserProperties,
} from "firebase/analytics";
import { firebaseConfig } from "./firebase-config";
import { lang, pseudoId } from "../../global-variables";

export class BaseFirebaseIntegration {
  firebaseApp: any;
  analytics: any;
  userProperties: any = {};
  constructor() {
    this.initializeFirebase()
    // this.setInitialUserProperties();
  }
  // protected setInitialUserProperties(): void {
  //   // Set initial user properties at the beginning of the session
  //   setUserId(this.analytics,"55555");
  //   this.userProperties.cr_user_id = pseudoId;
  //   this.userProperties.ftm_language =lang;
  //   this.userProperties.profile_number =0;
  //   this.userProperties.version_number =  document.getElementById("version-info-id").innerHTML;
  //   this.userProperties.json_version_number =  new Date().getTime().toString();
  //   setUserProperties(this.analytics,this.userProperties);
  // }
  protected customEvents(eventName: string, event: object): void {
    try {
      setUserId(this.analytics,pseudoId);
      this.userProperties.cr_user_id = event.cr_user_id;
      this.userProperties.ftm_language = event.ftm_language;
      this.userProperties.profile_number = event.profile_number;
      this.userProperties.version_number = event.version_number;
      this.userProperties.json_version_number =  new Date().getTime();
      setUserProperties(this.analytics,this.userProperties);
 
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
