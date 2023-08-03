import { firebaseConfig } from "./firebase_config";

export class FirebaseIntegration {
  static firebaseApp: any;
  static analytics: any;
  static async initializeFirebase() {
    this.firebaseApp = firebase.initializeApp(firebaseConfig);
    this.analytics = firebase.analytics(this.firebaseApp);
  }
  static sessionEnd() {
    if (navigator.onLine && this.analytics!=undefined) {
      this.analytics.logEvent("session_end");
    }
  }
  static customEvents(key, value) {
    this.analytics.logEvent(key, value);
  }
}
