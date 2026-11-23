import { test, expect } from "@playwright/test";
import { clearClientData, loginAsManager } from "./helpers";

test.describe("auth", () => {
  test("redirects guests to login", async ({ page }) => {
    await clearClientData(page);
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByTestId("login-form")).toBeVisible();
  });

  test("manager can log in and see board", async ({ page }) => {
    await clearClientData(page);
    await loginAsManager(page);
    await expect(page.getByTestId("column-new")).toBeVisible();
    await expect(page.getByText("Manager Max")).toBeVisible();
  });

  test("invalid credentials stay on login", async ({ page }) => {
    await clearClientData(page);
    await page.goto("/login");
    await page.getByTestId("login-email").fill("manager@demo.local");
    await page.getByTestId("login-password").fill("wrong");
    await page.getByTestId("login-submit").click();
    await expect(page.getByText(/Invalid credentials|Login failed/i)).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });
});
