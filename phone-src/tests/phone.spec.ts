import { expect, test } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';

const privatePasswordPath = new URL('../.private-passphrase', import.meta.url);
const privatePassword = process.env.PHONE_PRIVATE_PASSWORD
  ?? (existsSync(privatePasswordPath) ? readFileSync(privatePasswordPath, 'utf8').trim() : '');

async function unlock(page: import('@playwright/test').Page) {
  await expect(page.locator('.phone-shell')).toHaveAttribute('data-state', 'locked', { timeout: 4000 });
  await page.getByRole('button', { name: '解锁' }).click();
  await expect(page.locator('.phone-shell')).toHaveAttribute('data-state', 'home');
}

async function unlockPrivateEdition(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: '打开 Settings' }).click();
  await page.getByRole('button', { name: 'Ad Astra' }).click();
  await page.getByLabel('访问密码').fill(privatePassword);
  await page.getByRole('button', { name: '解锁 Edition' }).click();
  await expect(page.locator('.phone-shell')).toHaveAttribute('data-edition', 'ad-astra', { timeout: 8000 });
  await page.locator('.home-indicator').click();
  await expect(page.locator('.phone-shell')).toHaveAttribute('data-state', 'home');
}

test('boots Standard without requesting private content', async ({ page }) => {
  const privateRequests: string[] = [];
  page.on('request', (request) => {
    if (/\/phone\/private\/|\.(?:jpe?g|png|webp)(?:$|\?)/i.test(request.url())) {
      privateRequests.push(request.url());
    }
  });

  await page.goto('./');
  await expect(page.locator('.phone-shell')).toHaveAttribute('data-edition', 'standard');
  expect(privateRequests).toEqual([]);
});

test('keeps the encrypted pack unloaded until an unlock attempt', async ({ page }) => {
  const packRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/phone/private/ad-astra.pack')) packRequests.push(request.url());
  });

  await page.goto('./');
  await unlock(page);
  await page.getByRole('button', { name: '打开 Settings' }).click();
  await page.getByRole('button', { name: 'Ad Astra' }).click();
  await expect(page.getByRole('dialog', { name: '进入 Ad Astra' })).toBeVisible();
  expect(packRequests).toEqual([]);

  await page.getByLabel('访问密码').fill('not-the-password');
  await page.getByRole('button', { name: '解锁 Edition' }).click();
  await expect(page.getByRole('alert')).toContainText('密码不正确');
  expect(packRequests).toHaveLength(1);
  await expect(page.locator('.phone-shell')).toHaveAttribute('data-edition', 'standard');
});

test('unlocks a text-only memory and returns home', async ({ page }) => {
  test.skip(!privatePassword, 'Private passphrase is only available in an authorized workspace');
  await page.goto('./');
  await unlock(page);
  await unlockPrivateEdition(page);
  await page.getByRole('button', { name: '打开 Memories' }).click();
  await expect(page.locator('[data-active-app="memories"]')).toBeVisible();
  await page.locator('.memory-grid button').first().click();
  await expect(page.locator('.memory-detail')).toContainText('F-25');
  await expect(page.locator('.memory-detail img')).toHaveCount(0);
  await page.getByRole('button', { name: '返回记忆列表' }).click();
  await page.locator('.home-indicator').click();
  await expect(page.locator('.phone-shell')).toHaveAttribute('data-state', 'home');
});

test('navigates the photo-free Story star map', async ({ page }) => {
  test.skip(!privatePassword, 'Private passphrase is only available in an authorized workspace');
  await page.goto('./');
  await unlock(page);
  await unlockPrivateEdition(page);
  await page.getByRole('button', { name: '打开 Story' }).click();
  await expect(page.locator('[data-active-app="story"]')).toBeVisible();
  await expect(page.locator('.story-scene img')).toHaveCount(0);
  await expect(page.locator('.story-copy')).toContainText('一台从共同世界寄来的设备');
  await page.getByRole('button', { name: /打开第 02 幕/ }).click();
  await expect(page.locator('.story-copy')).toContainText('一起认真长大');
});

test('unlocks the private edition and rotates the desktop device', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Desktop shell choreography');
  test.skip(!privatePassword, 'Private passphrase is only available in an authorized workspace');
  await page.goto('./');
  await unlock(page);
  await unlockPrivateEdition(page);
  await expect(page.locator('.phone-shell')).toHaveAttribute('data-edition', 'ad-astra');
  await page.getByRole('button', { name: '切换横竖屏' }).click();
  await expect(page.locator('.phone-shell')).toHaveAttribute('data-orientation', 'landscape');
  await page.getByRole('button', { name: '锁定设备' }).click();
  await expect(page.locator('.phone-shell')).toHaveAttribute('data-edition', 'standard');
  await expect(page.locator('.phone-shell')).toHaveAttribute('data-state', 'locked');
});

test('uses the full viewport in physical mobile landscape', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-landscape', 'Physical landscape viewport');
  await page.goto('./');
  await unlock(page);
  const shell = page.locator('.phone-shell');
  await expect(shell).toHaveAttribute('data-orientation', 'landscape');
  const box = await shell.boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(900);
  expect(box?.height).toBeGreaterThanOrEqual(400);
});

test('garden state survives app switching', async ({ page }) => {
  await page.goto('./');
  await unlock(page);
  await page.getByRole('button', { name: '打开 Garden' }).click();
  await page.getByRole('button', { name: '浇一点水' }).click();
  await expect(page.locator('.garden-plant')).toHaveAttribute('aria-label', '花园成长 50%');
  await page.locator('.home-indicator').click();
  await page.getByRole('button', { name: '打开 Garden' }).click();
  await expect(page.locator('.garden-plant')).toHaveAttribute('aria-label', '花园成长 50%');
});

test('home indicator stays available as a system surface', async ({ page }) => {
  await page.goto('./');
  await unlock(page);
  await expect(page.locator('.phone-screen > .home-indicator')).toBeVisible();
  await page.getByRole('button', { name: '打开 Settings' }).click();
  await expect(page.locator('.phone-screen > .home-indicator')).toBeVisible();
});

test('power button locks and wakes the device', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Desktop hardware buttons');
  await page.goto('./');
  await unlock(page);
  await page.getByRole('button', { name: '电源键' }).click();
  await expect(page.locator('.phone-shell')).toHaveAttribute('data-state', 'locked');
  await page.getByRole('button', { name: '电源键' }).click();
  await expect(page.locator('.phone-shell')).toHaveAttribute('data-state', 'home');
});

test('volume buttons drive the volume HUD', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Desktop hardware buttons');
  await page.goto('./');
  await unlock(page);
  await page.getByRole('button', { name: '音量增' }).click();
  await expect(page.locator('.volume-hud')).toBeVisible();
  await expect(page.locator('.volume-hud .volume-bars i.is-on')).toHaveCount(6);
  await page.getByRole('button', { name: '音量减' }).click();
  await expect(page.locator('.volume-hud .volume-bars i.is-on')).toHaveCount(5);
});

test('restores persisted orientation on revisit', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Desktop orientation preference');
  await page.goto('./');
  await unlock(page);
  await page.getByRole('button', { name: '切换横竖屏' }).click();
  await expect(page.locator('.phone-shell')).toHaveAttribute('data-orientation', 'landscape');
  await page.reload();
  await expect(page.locator('.phone-shell')).toHaveAttribute('data-state', 'locked');
  await unlock(page);
  await expect(page.locator('.phone-shell')).toHaveAttribute('data-orientation', 'landscape');
});
