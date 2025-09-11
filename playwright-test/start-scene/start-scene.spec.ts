import { test, expect } from '@playwright/test';

// test.describe('StartScene', () => {
//   test.beforeEach(async ({ page }) => {
//     await page.goto('https://feedthemonsterdev.curiouscontent.org/');
//   });

//   test('should hide loading screen after init', async ({ page }) => {
//     const loading = page.locator('#loading-screen');
//     await expect(loading).toBeVisible();
//     await expect(loading).toBeHidden();
//   });

//   test('should redirect to Level Select on background click', async ({ page }) => {
//     const clickArea = page.locator('#start-scene-click-area');
//     await expect(clickArea).toBeVisible();
//     await clickArea.click();

//     await page.waitForFunction(() =>
//       document.body.innerText.includes('Level Select')
//     );
//   });
// });


test('Title page', async ({page})=>{

await page.goto('https://feedthemonsterdev.curiouscontent.org/');

const pageTitle = await page.title();
console.log('Page Title is:' , pageTitle);

await expect(page).toHaveTitle('Feed The Monster');

await expect(page).toHaveURL('https://feedthemonsterdev.curiouscontent.org/');

//await page.click('id=title-and-play-button')

await page.waitForSelector('#play-button', { timeout: 60000 });

await page.click('#play-button');
await page.goto('https://feedthemonsterdev.curiouscontent.org/');
//await page.close();

})