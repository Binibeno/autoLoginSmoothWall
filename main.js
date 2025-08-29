import puppeteer from "puppeteer";

const username = "";
const password = "";

(async () => {
  // 1. Launch browser
  const browser = await puppeteer.launch({
    headless: false, // so you can see the login flow
    defaultViewport: null,
    args: [
      "--disable-features=IsolateOrigins,site-per-process",
    ],
  });

  const page = await browser.newPage();

  // 2. Go to the login page
  await page.goto("https://smoothwall.bbis.hu:442/clogin", {
    waitUntil: "networkidle2",
  });

  // 3. Execute login() in the page's context
  await page.evaluate(() => {
    if (typeof login === "function") {
      login();
    } else {
      throw new Error("login() function not found on page");
    }
  });

  // 4. Wait for the new tab to open
  const newPagePromise = new Promise((resolve) =>
    browser.once("targetcreated", async (target) => {
      const newPage = await target.page();
      resolve(newPage);
    })
  );

  // 2) Wait for Google sign -in page to appear
  const googleLoginPage = await browser.waitForTarget(
    t => {
      const u = t.url() || "";
      return /accounts\.google\.com/.test(u);
    },
    { timeout: 15000 }
  ).then(t => t.page());

  await googleLoginPage.bringToFront();
  await googleLoginPage.waitForLoadState?.(); // harmless if not supported

  // 3) Fill the email field (stable: #identifierId)
  await googleLoginPage.waitForSelector("#identifierId", { visible: true, timeout: 15000 });

  // If it’s already focused, typing works; we still target the element for reliability.
  await googleLoginPage.type("#identifierId", username, { delay: 20 });

  // 4) Click the Next button (stable: #identifierNext)
  await googleLoginPage.waitForSelector("#identifierNext button, #identifierNext", {
    visible: true,
    timeout: 10000,
  });

  // Prefer clicking the button inside, else click the container
  const buttonHandle = await googleLoginPage.$("#identifierNext button");
  if (buttonHandle) {
    await buttonHandle.click();
  } else {
    await googleLoginPage.click("#identifierNext");
  }

  // 5) Wait until we’re on the password step (don’t enter it yet)
  // Either the URL changes to /v2/challenge/pwd OR the password input shows up.
  await Promise.race([
    googleLoginPage.waitForNavigation({ waitUntil: "networkidle2", timeout: 20000 }),
    googleLoginPage.waitForSelector('input[name="Passwd"], input[type="password"]', { timeout: 20000 }),
  ]);

  console.log("➡️ Reached password step. Entering password...");

  // 4) PASSWORD STEP — wait for the password input to be visible
  await googleLoginPage.waitForSelector('input[name="Passwd"]', { visible: true, timeout: 25000 });

  // Type the password
  await googleLoginPage.focus('input[name="Passwd"]');
  await googleLoginPage.keyboard.type(password, { delay: 20 });

  // Click "Next" for password
  const pwdNextBtn = await googleLoginPage.$("#passwordNext button") || await googleLoginPage.$("#passwordNext");
  await pwdNextBtn.click();

  // 5) Wait for navigation away from Google OR error
  await Promise.race([
    googleLoginPage.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 }),
    googleLoginPage.waitForSelector('#password div[role="alert"], div.o6cuMc', { timeout: 30000 })
  ]);

  console.log("➡️ Submitted password step.");

  // 6) Check if we landed back on Smoothwall successfully
  try {
    await page.waitForSelector('input[type="submit"][name="ACTION"][value="Logout"]', {
      visible: true,
      timeout: 30000, // give it up to 30s to load
    });
    console.log("✅ Success: Logged into Smoothwall!");
  } catch {
    console.log("❌ Failed: Logout button not found. Login was most likely unsuccessful.");
    return; // don't close browser so you can check manually
  }


  // Keep browser open for further steps
  await browser.close();
})();
