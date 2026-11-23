import { expect, type Page } from "@playwright/test";

export async function loginAs(
  page: Page,
  email: string,
  password: string,
) {
  await page.goto("/login");
  await page.getByTestId("login-email").fill(email);
  await page.getByTestId("login-password").fill(password);
  await page.getByTestId("login-submit").click();
  await expect(page.getByRole("heading", { name: "Воронка лидов" })).toBeVisible();
}

export async function loginAsManager(page: Page) {
  await loginAs(page, "manager@demo.local", "manager");
}

export async function loginAsAdmin(page: Page) {
  await loginAs(page, "admin@demo.local", "admin");
}

export async function clearClientData(page: Page) {
  await page.goto("/login");
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}
