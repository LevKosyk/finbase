import path from "node:path";
import { expect, test } from "@playwright/test";

const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;

test.describe("Finbase smoke", () => {
  test.skip(!email || !password, "Set E2E_EMAIL and E2E_PASSWORD to run smoke tests.");

  test("login -> dashboard -> import -> export -> documents -> ai", async ({ page, context }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(String(email));
    await page.getByPlaceholder("••••••••").fill(String(password));
    await page.getByRole("button", { name: "Увійти" }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText("Дашборд")).toBeVisible();

    await page.goto("/dashboard/income");
    await expect(page.getByText("Облік доходів")).toBeVisible();

    const file = path.resolve(process.cwd(), "tests/e2e/fixtures/income-smoke.csv");
    await page.getByRole("button", { name: "Імпорт" }).click();
    await page.locator("input[type='file']").setInputFiles(file);
    await expect(page.getByText("Імпорт завершено")).toBeVisible();

    const exportResponse = await page.request.get("/api/export?type=incomes&format=csv");
    expect(exportResponse.status()).toBe(200);
    const disposition = exportResponse.headers()["content-disposition"] || "";
    expect(disposition).toContain("attachment");

    const docResponse = await page.request.post("/api/documents", {
      data: {
        type: "invoice",
        format: "json",
        counterparty: "Smoke LLC",
        description: "E2E invoice",
        amount: 1000,
      },
    });
    expect(docResponse.status()).toBe(200);

    await page.goto("/dashboard/chat");
    await page.getByPlaceholder("Напишіть ваше питання...").fill("Який у мене податок за місяць?");
    await page.locator("button[type='submit']").click();
    await expect(page.locator("text=Думаю...")).toBeHidden({ timeout: 30000 });

    const chatText = await page.locator("main").innerText();
    expect(chatText.length).toBeGreaterThan(50);

    await context.clearCookies();
  });
});
