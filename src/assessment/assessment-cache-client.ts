const DEFAULT_CHANNEL_NAME = 'my-channel';
const DEFAULT_CACHE_READY_MESSAGE = 'AssessmentLanguageCached';
const DEFAULT_CACHE_TIMEOUT_MS = 20000;

export class AssessmentCacheClient {
  constructor(
    private readonly channelName: string = DEFAULT_CHANNEL_NAME,
    private readonly cacheReadyMessage: string = DEFAULT_CACHE_READY_MESSAGE,
    private readonly timeoutMs: number = DEFAULT_CACHE_TIMEOUT_MS
  ) {}

  public requestAssessmentLanguageCache(dataKey: string): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
      return Promise.resolve(false);
    }

    return new Promise((resolve) => {
      const channel = new BroadcastChannel(this.channelName);

      const timeoutHandle = window.setTimeout(() => {
        channel.removeEventListener('message', onMessage);
        channel.close();
        resolve(false);
      }, this.timeoutMs);

      const onMessage = (event: MessageEvent): void => {
        if (event?.data?.msg !== this.cacheReadyMessage) {
          return;
        }

        const messageData = event.data?.data || {};
        if (messageData.dataKey !== dataKey) {
          return;
        }

        window.clearTimeout(timeoutHandle);
        channel.removeEventListener('message', onMessage);
        channel.close();
        resolve(Boolean(messageData.ok));
      };

      channel.addEventListener('message', onMessage);
      channel.postMessage({
        command: 'CacheAssessmentLanguage',
        data: dataKey,
      });
    });
  }
}
