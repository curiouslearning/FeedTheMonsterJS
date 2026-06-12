export interface AppConfig {
  ENV: 'production' | 'development' | 'test';
  DEBUG_MODE: boolean;
}

declare const __APP_CONFIG__: AppConfig;

export const appConfig: AppConfig = __APP_CONFIG__;
export default appConfig;
