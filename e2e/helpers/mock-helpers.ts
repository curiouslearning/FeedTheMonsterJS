import { Page, Route } from '@playwright/test';

// Minimal valid WAV: RIFF header + fmt chunk + 1 silent sample.
// Prevents "Unable to decode audio data" errors when the game calls
// AudioContext.decodeAudioData() on mocked responses.
const SILENT_WAV = Buffer.from([
  0x52, 0x49, 0x46, 0x46, // "RIFF"
  0x26, 0x00, 0x00, 0x00, // chunk size = 38
  0x57, 0x41, 0x56, 0x45, // "WAVE"
  0x66, 0x6d, 0x74, 0x20, // "fmt "
  0x10, 0x00, 0x00, 0x00, // subchunk size = 16
  0x01, 0x00,             // PCM
  0x01, 0x00,             // mono
  0x22, 0x56, 0x00, 0x00, // 22050 Hz
  0x44, 0xac, 0x00, 0x00, // byte rate = 44100
  0x02, 0x00,             // block align = 2
  0x10, 0x00,             // 16-bit
  0x64, 0x61, 0x74, 0x61, // "data"
  0x02, 0x00, 0x00, 0x00, // data size = 2
  0x00, 0x00,             // one silent sample
]);

/**
 * Intercepts all audio requests and responds with a valid silent WAV so the
 * browser can decode it without throwing an error.
 */
export async function mockAudioRequests(page: Page) {
  await page.route('**/*.{mp3,wav,ogg,aac}', (route: Route) => {
    route.fulfill({ status: 200, contentType: 'audio/wav', body: SILENT_WAV });
  });
}

/**
 * Intercepts Firebase / analytics / feature-flag network calls so tests do
 * not depend on third-party services being reachable and so all feature flags
 * are deterministically OFF (FEATURE_QUICK_START disabled, etc.).
 */
export async function mockAnalytics(page: Page) {
  await page.route('**/firebase**', (route: Route) => route.fulfill({ status: 200, body: '{}' }));
  await page.route('**/firebaseapp**', (route: Route) => route.fulfill({ status: 200, body: '{}' }));
  await page.route('**/googleapis**', (route: Route) => route.fulfill({ status: 200, body: '{}' }));
  await page.route('**/connect.facebook.net/**', (route: Route) => route.fulfill({ status: 200, body: '' }));
  // Statsig feature-flag service: return empty gates so all flags are OFF.
  // This ensures FEATURE_QUICK_START is disabled and the play button goes to
  // level selection, not directly to gameplay.
  await page.route('**/statsig.com/**', (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        feature_gates: {},
        dynamic_configs: {},
        layer_configs: {},
        has_updates: false,
        time: 0,
      }),
    }),
  );
}

/**
 * Intercepts the Rive WASM download (large binary) and replaces it with an
 * empty placeholder so tests do not stall waiting for it.
 * Note: Rive canvas will remain blank – canvas-dependent tests should not call this.
 */
export async function mockRiveWasm(page: Page) {
  await page.route('**/rive.wasm', (route: Route) =>
    route.fulfill({ status: 200, contentType: 'application/wasm', body: Buffer.alloc(0) }),
  );
}

/**
 * Applies the standard set of mocks used by most tests:
 * – audio files silenced
 * – analytics calls stubbed
 */
export async function applyStandardMocks(page: Page) {
  await mockAudioRequests(page);
  await mockAnalytics(page);
}
