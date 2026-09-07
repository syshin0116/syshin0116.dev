import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page, type TestInfo } from "@playwright/test"

const REPRESENTATIVE_HREF =
  "/blog/Dev/2026-07-16-Azure B시리즈 CPU 크레딧과 CI 러너 장애"
const REPRESENTATIVE_TITLE =
  "Azure B시리즈 CPU 크레딧 고갈로 CI가 무너진 날"
const SITE_BASE_URL =
  process.env.SITE_BASE_URL?.trim() || "http://127.0.0.1:3129"
const SITE_ORIGIN = new URL(SITE_BASE_URL).origin
const EXPECTED_DEPLOYMENT_SHA = process.env.EXPECTED_DEPLOYMENT_SHA?.trim()

interface BrowserDiagnostics {
  consoleProblems: string[]
  firstPartyFailures: string[]
  requestFailures: string[]
}

const diagnosticsByPage = new WeakMap<Page, BrowserDiagnostics>()

async function stubSignedOutSession(page: Page): Promise<void> {
  await page.route("**/api/auth/session", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "cache-control": "no-store" },
      body: "null",
    })
  })
}

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const metrics = await page.evaluate(() => ({
    bodyClientWidth: document.body.clientWidth,
    bodyScrollWidth: document.body.scrollWidth,
    rootClientWidth: document.documentElement.clientWidth,
    rootScrollWidth: document.documentElement.scrollWidth,
  }))
  expect(metrics.bodyScrollWidth).toBeLessThanOrEqual(metrics.bodyClientWidth)
  expect(metrics.rootScrollWidth).toBeLessThanOrEqual(metrics.rootClientWidth)
}

async function expectA11yClean(page: Page): Promise<void> {
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze()
  expect(
    result.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      nodes: violation.nodes.map((node) => ({
        failureSummary: node.failureSummary,
        html: node.html,
        target: node.target,
      })),
    }))
  ).toEqual([])
}

async function attachScreenshot(
  page: Page,
  testInfo: TestInfo,
  name: string
): Promise<void> {
  await testInfo.attach(`${name}.png`, {
    body: await page.screenshot(),
    contentType: "image/png",
  })
}

test.beforeEach(async ({ page }) => {
  const diagnostics: BrowserDiagnostics = {
    consoleProblems: [],
    firstPartyFailures: [],
    requestFailures: [],
  }
  diagnosticsByPage.set(page, diagnostics)
  page.on("pageerror", (error) => diagnostics.consoleProblems.push(error.message))
  page.on("console", (message) => {
    // Next.js preloads route CSS when links enter the viewport, before navigation.
    if (message.type() === "warning" && message.text().startsWith(`The resource ${SITE_ORIGIN}/_next/static/`) && message.text().includes(".css was preloaded using link preload but not used")) return
    if (message.type() === "error" || message.type() === "warning") {
      diagnostics.consoleProblems.push(`${message.type()}: ${message.text()}`)
    }
  })
  page.on("response", (response) => {
    const url = new URL(response.url())
    if (url.origin === SITE_ORIGIN && response.status() >= 400) {
      diagnostics.firstPartyFailures.push(
        `${response.status()} ${response.request().method()} ${url.pathname}`
      )
    }
  })
  page.on("requestfailed", (request) => {
    const url = new URL(request.url())
    if (url.origin === SITE_ORIGIN) {
      diagnostics.requestFailures.push(
        `${request.method()} ${url.pathname}: ${request.failure()?.errorText ?? "unknown"}`
      )
    }
  })
  await stubSignedOutSession(page)
  if (new URL(SITE_ORIGIN).hostname === "127.0.0.1") {
    for (const path of ["/_vercel/insights/script.js", "/_vercel/speed-insights/script.js"]) {
      await page.route(`${SITE_ORIGIN}${path}`, route => route.fulfill({ status: 200, contentType: "application/javascript", body: "" }))
    }
  }
})

test.afterEach(async ({ page }) => {
  const diagnostics = diagnosticsByPage.get(page)
  expect(diagnostics?.consoleProblems ?? []).toEqual([])
  expect(diagnostics?.firstPartyFailures ?? []).toEqual([])
  expect(diagnostics?.requestFailures ?? []).toEqual([])
})

test("served revision matches the requested production commit", async ({
  request,
}, testInfo) => {
  test.skip(testInfo.project.name !== "site-desktop", "single-project contract")
  test.skip(!EXPECTED_DEPLOYMENT_SHA, "production-only contract")

  const response = await request.get("/api/deployment-revision")
  expect(response.status()).toBe(200)
  expect(response.headers()["cache-control"]).toBe("no-store, max-age=0")
  const revision = await response.json()
  expect(revision).toMatchObject({
    schemaVersion: 1,
    gitSha: EXPECTED_DEPLOYMENT_SHA,
  })
  expect(revision.deploymentId).toMatch(/^dpl_[A-Za-z0-9]+$/)
  expect(revision.deploymentUrl).toMatch(/\.vercel\.app$/)
})

test("signed-out home has semantic landmarks and accessible controls", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "site-desktop", "desktop journey")
  await page.goto("/")

  await expect(page.locator("main")).toHaveCount(1)
  await expect(page.getByRole("heading", { name: "AI 검색 실험실" })).toBeVisible()
  await expect(
    page.getByRole("link", { name: "최근 블로그 포스트 전체 보기" })
  ).toBeVisible()
  await expect(
    page.getByRole("link", { name: "최근 프로젝트 전체 보기" })
  ).toBeVisible()
  await expect(page.getByRole("heading", { level: 3 }).first()).toBeVisible()
  await expect(
    page.getByRole("link", { name: "GitHub 프로필 열기" }).first()
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: /모드로 전환|테마 전환/ })
  ).toBeVisible()

  await expectNoHorizontalOverflow(page)
  await expectA11yClean(page)
  await attachScreenshot(page, testInfo, "signed-out-home")
})

test("login is exposed as the primary page heading", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "site-desktop", "desktop journey")
  await page.goto("/login")

  await expect(page.locator("main")).toHaveCount(1)
  await expect(
    page.getByRole("heading", { level: 1, name: "Welcome back" })
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Continue with Google" })
  ).toBeVisible()
  await expectNoHorizontalOverflow(page)
  await expectA11yClean(page)
  await attachScreenshot(page, testInfo, "login")
})

test("representative post is keyboard-labelled and WCAG clean", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "site-desktop", "desktop journey")
  await page.goto(REPRESENTATIVE_HREF)

  await expect(
    page.getByRole("heading", { level: 1, name: REPRESENTATIVE_TITLE })
  ).toBeVisible()
  for (const name of [
    "Main",
    "블로그 탐색",
    "현재 위치",
    "이전 및 다음 글",
    "Table of contents",
  ]) {
    await expect(page.getByRole("navigation", { name })).toHaveCount(1)
  }

  const collapsedFolder = page
    .getByRole("navigation", { name: "블로그 탐색" })
    .getByRole("button", { name: /펼치기$/ })
    .first()
  const controlledId = await collapsedFolder.getAttribute("aria-controls")
  expect(controlledId).toBeTruthy()
  await expect(page.locator(`#${controlledId}`)).toHaveAttribute("inert", "")

  const graph = page.getByRole("group", { name: "관련 콘텐츠 그래프" })
  await expect(graph).toBeVisible()
  await expect(graph.getByRole("link").first()).toBeVisible()

  await expectNoHorizontalOverflow(page)
  await expectA11yClean(page)
  await attachScreenshot(page, testInfo, "representative-post-desktop")

  await page.getByRole("button", { name: "다크 모드로 전환" }).click()
  await expect(page.locator("html")).toHaveClass(/dark/)
  await expect(
    page.getByRole("button", { name: "라이트 모드로 전환" })
  ).toBeVisible()
  await expectA11yClean(page)
  await attachScreenshot(page, testInfo, "representative-post-desktop-dark")
})

test("representative post does not overflow a mobile viewport", async ({
  page,
  request,
}, testInfo) => {
  test.skip(testInfo.project.name !== "site-mobile", "mobile journey")
  const serverResponse = await request.get(REPRESENTATIVE_HREF)
  expect(serverResponse.ok()).toBe(true)
  const serverHtml = await serverResponse.text()
  expect(serverHtml).toContain(
    '<pre tabindex="0"><code>GitHub Actions 큐'
  )
  expect(serverHtml).toContain(
    '<pre tabindex="0"><code>PR 러시'
  )

  await page.goto(REPRESENTATIVE_HREF)

  await expect(
    page.getByRole("heading", { level: 1, name: REPRESENTATIVE_TITLE })
  ).toBeVisible()
  const plainCodeBlocks = page.locator(".prose pre:not([data-language])")
  await expect(plainCodeBlocks).toHaveCount(2)
  for (const codeBlock of await plainCodeBlocks.all()) {
    await expect(codeBlock).toHaveAttribute("tabindex", "0")
  }
  await expectNoHorizontalOverflow(page)
  await expectA11yClean(page)
  await attachScreenshot(page, testInfo, "representative-post-mobile")
})

test("mobile menu traps focus, closes with Escape, and restores focus", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "site-mobile", "mobile journey")
  await page.goto("/")
  await expect(page.getByRole("heading", { name: "AI 검색 실험실" })).toBeVisible()

  const menuButton = page.getByRole("button", { name: "메뉴 열기" })
  await menuButton.click()
  const dialog = page.getByRole("dialog", { name: "사이트 메뉴" })
  await expect(dialog).toBeVisible()
  await expectA11yClean(page)
  await expect
    .poll(() => dialog.evaluate((element) => element.contains(document.activeElement)))
    .toBe(true)
  await page.keyboard.press("Shift+Tab")
  expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true)
  await attachScreenshot(page, testInfo, "mobile-menu-open")

  await page.keyboard.press("Escape")
  await expect(dialog).toBeHidden()
  await expect(menuButton).toBeFocused()

  await menuButton.click()
  await dialog.getByRole("link", { name: "Home", exact: true }).click()
  await expect(page).toHaveURL(/\/?reset=true$/)
  await expect(dialog).toBeHidden()

  await expectNoHorizontalOverflow(page)
  await expectA11yClean(page)
  await attachScreenshot(page, testInfo, "mobile-menu-closed")
})


test("note filters survive reload and search opens a matching blog note", async ({ page }, testInfo) => {
  await page.goto("/blog")
  await page.getByRole("combobox", { name: "태그", exact: true }).selectOption("ai")
  await page.getByRole("combobox", { name: "정렬", exact: true }).selectOption("title")
  await expect(page).toHaveURL(/tag=ai&sort=title/)
  await page.reload()
  await expect(page.getByRole("combobox", { name: "태그", exact: true })).toHaveValue("ai")
  await expect(page.getByRole("combobox", { name: "정렬", exact: true })).toHaveValue("title")
  await expectA11yClean(page)
  await attachScreenshot(page, testInfo, "filtered-notes")
  await page.keyboard.press("Control+k")
  const search = page.getByRole("dialog", { name: "Search notes" })
  await search.getByRole("combobox").fill("Azure CPU")
  const match = search.getByRole("option").filter({ hasText: REPRESENTATIVE_TITLE })
  await expect(match).toBeVisible()
  await expectA11yClean(page)
  await match.click()
  await expect(page.getByRole("heading", { level: 1, name: REPRESENTATIVE_TITLE })).toBeVisible()
  await expect(search).toBeHidden()
  await expectNoHorizontalOverflow(page)
})

test("graph exploration preserves selection and keyboard navigation", async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto(REPRESENTATIVE_HREF)
  if (testInfo.project.name === "site-mobile") await page.locator(".reading-toc > summary").click()
  const inlineGraph = page.getByRole("group", { name: "관련 콘텐츠 그래프" }).locator(".graph-surface")
  await inlineGraph.scrollIntoViewIfNeeded()
  await expect(inlineGraph).toHaveAttribute("data-status", "ready")
  const explore = page.getByRole("button", { name: "Explore", exact: true })
  await explore.click()
  const dialog = page.getByRole("dialog", { name: "연결된 글 탐색" })
  const canvas = dialog.locator(".graph-canvas")
  await expect(dialog.getByRole("button", { name: "Fit graph" })).toBeEnabled()
  await expect(canvas.locator('[data-node]')).not.toHaveCount(0)
  const current = canvas.locator('[data-current="true"]')
  await current.focus()
  await current.press("ArrowRight")
  await page.keyboard.press("Enter")
  await expect(canvas.locator('[data-selected="true"]')).toHaveCount(1)
  await dialog.getByRole("button", { name: "All notes", exact: true }).click()
  await expect(dialog.getByRole("button", { name: "Fit graph" })).toBeEnabled()
  await dialog.getByRole("textbox", { name: "Find a graph node" }).fill("Azure")
  await expect(dialog.getByRole("button").filter({ hasText: REPRESENTATIVE_TITLE })).toBeVisible()
  await dialog.getByRole("button").filter({ hasText: REPRESENTATIVE_TITLE }).click()
  await expect(dialog.getByRole("link", { name: "Open note" })).toHaveAttribute("href", /\/blog\/Dev\//)
  await expectA11yClean(page)
  await attachScreenshot(page, testInfo, "graph-exploration")
  await page.keyboard.press("Escape")
  await expect(explore).toBeFocused()
})
