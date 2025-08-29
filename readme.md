# SmoothWall Auto Login (Puppeteer)

This small Node.js project automates logging into **Smoothwall** via Puppeteer.  
It opens the Smoothwall login page, triggers the `login()` function, completes the Google login flow (email + password), and finally checks if the login succeeded by waiting for the **Logout** button.

## Requirements

- Node.js v22+ (managed with `nvm` recommended)
- npm or pnpm

## Setup

1. Clone/download this project.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Open `main.js` and set your Google credentials at the top:

   ```js
   const username = "your.email@example.com";
   const password = "your-password";
   ```

## Run

```bash
node main.js
```

## Success / Failure

- On **success**, the script prints:

  ```
  ✅ Success: Logged into Smoothwall!
  ```

- On **failure**, the browser stays open (if `headless: false`) and you’ll see:

  ```
  ❌ Failed: Logout button not found. Login was most likely unsuccessful.
  ```

---

## Known Issues

- Headless mode does not work. The chromium browser will open visibly.
- It will not work with 2FA enabled accounts.
