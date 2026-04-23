# Creator Template

A minimal, clean portfolio template for creators. Upload photos and videos, customize your name and colors — no coding needed.

---

## First-time Setup (do this once)

### Step 1 — Install Node.js
Go to **https://nodejs.org** and download the **LTS** version. Install it normally.

### Step 2 — Install dependencies
Open a terminal (Command Prompt or PowerShell) inside this folder and run:
```
npm install
```

### Step 3 — Start the site
```
npm start
```

Then open **http://localhost:3000** in your browser.

---

## Admin Panel

Go to **http://localhost:3000/admin**

From there you can:
- **Change your creator name** (shown big on every page)
- **Pick an accent color** (applies everywhere)
- **Set your Instagram URL and email** (shown on Let's Talk)
- **Upload photos and videos** — just click "Choose File" then "Upload"
- **Delete media** — hover over any item and click ✕

---

## Pages

| URL | What it shows |
|-----|--------------|
| `/` | Home — all videos + photos |
| `/work` | Work — videos only |
| `/letstalk` | Let's Talk — Instagram + email |
| `/admin` | Admin panel |

---

## Deploy to Railway (free hosting)

1. Push this folder to a GitHub repository
2. Go to **https://railway.app** and sign in with GitHub
3. Click **New Project → Deploy from GitHub repo**
4. Select your repo — Railway detects Node.js automatically
5. Click **Deploy** — your site will be live in ~1 minute

> Note: On Railway, uploaded files live on the server. For permanent storage across deploys, connect a volume in Railway's settings.

---

## Using as a template for multiple creators

For each new creator:
1. Copy this entire folder and rename it (e.g. `creator-john`)
2. Run `npm install` inside it
3. Open `/admin` and set their name, color, Instagram, email
4. Upload their content
5. Deploy as a separate Railway project

Each creator gets their own independent site.
