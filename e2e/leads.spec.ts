import { test, expect } from "@playwright/test";
import { clearClientData, loginAsAdmin, loginAsManager } from "./helpers";

test.describe("leads board", () => {
  test.beforeEach(async ({ page }) => {
    await clearClientData(page);
  });

  test("create lead appears on board with success toast", async ({ page }) => {
    await loginAsManager(page);

    await page.getByTestId("new-lead-button").click();
    await page.getByTestId("new-lead-name").fill("E2E Acme");
    await page.getByTestId("new-lead-contact").fill("e2e@acme.test");
    await page.getByTestId("new-lead-form").getByRole("button", { name: "Создать" }).click();

    await expect(page.getByTestId("new-lead-success")).toBeVisible();
    await expect(page.getByTestId("new-lead-success")).toContainText("E2E Acme");
    await expect(page.getByTestId("column-new").getByText("E2E Acme")).toBeVisible();
    await expect(
      page.getByTestId("column-new").locator("[data-lead-name='E2E Acme']"),
    ).toHaveClass(/lead-card-highlight/);
  });

  test("open lead, add note, see saved toast", async ({ page }) => {
    await loginAsManager(page);

    await page.getByTestId("new-lead-button").click();
    await page.getByTestId("new-lead-name").fill("Note Lead");
    await page.getByTestId("new-lead-contact").fill("note@test.local");
    await page.getByTestId("new-lead-form").getByRole("button", { name: "Создать" }).click();
    await page.getByTestId("column-new").getByText("Note Lead").click();

    await expect(page.getByRole("heading", { name: "Note Lead" })).toBeVisible();
    await page.getByTestId("note-input").fill("позвонить завтра");
    await page.getByTestId("note-submit").click();

    await expect(page.getByTestId("save-toast")).toContainText("Заметка сохранена");
    await expect(page.getByText("позвонить завтра")).toBeVisible();
  });

  test("status change to contacted and back to board highlights card", async ({ page }) => {
    await loginAsManager(page);

    await page.getByTestId("new-lead-button").click();
    await page.getByTestId("new-lead-name").fill("Status Lead");
    await page.getByTestId("new-lead-contact").fill("status@test.local");
    await page.getByTestId("new-lead-form").getByRole("button", { name: "Создать" }).click();
    await page.getByTestId("column-new").getByText("Status Lead").click();

    await page.getByTestId("status-select").selectOption("contacted");
    await expect(page.getByTestId("save-toast")).toContainText("Статус сохранён");

    await page.getByRole("link", { name: "← К воронке" }).click();
    await expect(page.getByTestId("column-contacted").getByText("Status Lead")).toBeVisible();

    const card = page.getByTestId("column-contacted").locator("[data-lead-name='Status Lead']");
    await expect(card).toHaveClass(/lead-card-highlight/);
  });

  test("status select only offers allowed next steps from new", async ({ page }) => {
    await loginAsManager(page);

    await page.getByTestId("new-lead-button").click();
    await page.getByTestId("new-lead-name").fill("Rules Lead");
    await page.getByTestId("new-lead-contact").fill("rules@test.local");
    await page.getByTestId("new-lead-form").getByRole("button", { name: "Создать" }).click();
    await page.getByTestId("column-new").getByText("Rules Lead").click();

    const options = page.getByTestId("status-select").locator("option");
    await expect(options).toHaveText(["new", "contacted", "lost"]);
  });

  test("manager does not see another manager seed lead", async ({ page }) => {
    await loginAsManager(page);
    // TechStart LLC is owned by manager2 in seed
    await expect(page.getByText("TechStart LLC")).toHaveCount(0);
    await expect(page.getByText("ООО Ромашка")).toBeVisible();
  });

  test("admin sees all seed leads", async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page.getByText("TechStart LLC")).toBeVisible();
    await expect(page.getByText("ООО Ромашка")).toBeVisible();
  });
});
