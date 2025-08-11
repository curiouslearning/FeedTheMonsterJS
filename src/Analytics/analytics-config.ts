// Analytics configuration for Analytics and Statsig
// Used by @curiouslearning/analytics AnalyticsStrategy and StatsigStrategy

/**
 * Analytics configuration for analytics
 */
export const firebaseConfig = {
    apiKey: "AIzaSyB8c2lBVi26u7YRL9sxOP97Uaq3yN8hTl4",
    authDomain: "ftm-b9d99.firebaseapp.com",
    databaseURL: "https://ftm-b9d99.firebaseio.com",
    projectId: "ftm-b9d99",
    storageBucket: "ftm-b9d99.appspot.com",
    messagingSenderId: "602402387941",
    appId: "1:602402387941:web:a63f4eaddc949f539de10c",
    measurementId: "G-FVLSN7D7NM",
};

/**
 * Statsig configuration for analytics
 */
export const statsigConfig = {
    // Statsig client-side API key
    clientKey: "client-SSmY5k5Cs39G7II74NdWqPfv5hQzrFiUqCc3C1IU9na",
    
    // User ID for Statsig tracking (can be pseudo-anonymous)
    userId: "anonymous-user",
}; 