import { test, expect } from "@playwright/test";
import { clearClientData, loginAsManager } from "./helpers";

test.describe("AI suggest", () => {
  test.beforeEach(async ({ page }) => {
    await clearClientData(page);
  });

  test("asks AI and shows suggestion badge", async ({ page }) => {
    await page.route("**/api/leads/*/suggest", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          suggestion: {
            id: "s-e2e",
            leadId: "ignored",
            nextAction: "first_contact",
            reason: "E2E mock reason",
            channel: "email",
            draftMessage: "Привет из e2e-мока",
            provider: "llm",
            createdAt: new Date().toISOString(),
          },
        }),
      });
    });

    await loginAsManager(page);
    await page.getByTestId("new-lead-button").click();
    await page.getByTestId("new-lead-name").fill("AI Lead");
    await page.getByTestId("new-lead-contact").fill("ai@test.local");
    await page.getByTestId("new-lead-form").getByRole("button", { name: "Создать" }).click();
    await page.getByTestId("column-new").getByText("AI Lead").click();

    await page.getByTestId("ai-ask").click();
    await expect(page.getByText("E2E mock reason")).toBeVisible();
    await expect(page.getByText("Привет из e2e-мока")).toBeVisible();
    await expect(page.getByText("Gemini/LLM")).toBeVisible();
  });
});
