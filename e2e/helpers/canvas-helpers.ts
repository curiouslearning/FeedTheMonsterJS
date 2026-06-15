import { Page } from '@playwright/test';

interface Point {
  x: number;
  y: number;
}

/** Returns absolute pixel position from a ratio (0–1) within the element. */
async function ratioToAbsolute(page: Page, selector: string, rx: number, ry: number): Promise<Point> {
  const bb = await page.locator(selector).boundingBox();
  if (!bb) throw new Error(`BoundingBox not found for: ${selector}`);
  return { x: bb.x + bb.width * rx, y: bb.y + bb.height * ry };
}

/**
 * Simulates a touch-style drag on the canvas.
 * Uses mouse events because Playwright does not support real PointerEvents on canvas.
 */
export async function canvasDrag(
  page: Page,
  canvasSelector: string,
  from: { rx: number; ry: number },
  to: { rx: number; ry: number },
  steps = 15,
) {
  const start = await ratioToAbsolute(page, canvasSelector, from.rx, from.ry);
  const end = await ratioToAbsolute(page, canvasSelector, to.rx, to.ry);

  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps });
  await page.mouse.up();
}

/**
 * Returns the pixel colour at (rx, ry) on the canvas as [r, g, b, a].
 * Useful for asserting that stones have been rendered at certain positions.
 */
export async function getCanvasPixelColor(
  page: Page,
  canvasSelector: string,
  rx: number,
  ry: number,
): Promise<[number, number, number, number]> {
  const bb = await page.locator(canvasSelector).boundingBox();
  if (!bb) throw new Error(`BoundingBox not found for: ${canvasSelector}`);

  return page.evaluate(
    ({ sel, x, y }) => {
      const canvas = document.querySelector(sel) as HTMLCanvasElement;
      const ctx = canvas.getContext('2d');
      const data = ctx!.getImageData(x, y, 1, 1).data;
      return [data[0], data[1], data[2], data[3]] as [number, number, number, number];
    },
    { sel: canvasSelector, x: Math.round(bb.width * rx), y: Math.round(bb.height * ry) },
  );
}

/** Asserts the canvas is non-blank (at least one non-transparent pixel exists). */
export async function assertCanvasHasContent(page: Page, canvasSelector: string) {
  const hasContent = await page.evaluate((sel) => {
    const canvas = document.querySelector(sel) as HTMLCanvasElement;
    if (!canvas) return false;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] > 0) return true;
    }
    return false;
  }, canvasSelector);

  if (!hasContent) {
    throw new Error(`Canvas ${canvasSelector} appears to be blank`);
  }
}
