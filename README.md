# Manfield

Your personal goal-based media feed. Real YouTube videos, TikTok & Instagram rabbit holes, Reddit posts, and an AI guide — all curated around what you want to learn.

---

## Deploy in 5 Steps

### 1. Install Node.js
Download from https://nodejs.org — click the LTS version and install it.

### 2. Install Vercel CLI
Open Terminal (Mac) or Command Prompt (Windows) and run:
```
npm install -g vercel
```

### 3. Deploy the app
In the same terminal, navigate to this folder and run:
```
vercel
```
Follow the prompts — say Yes to everything. It will give you a URL like `manfield.vercel.app`.

### 4. Add your API keys
Go to https://vercel.com → your project → Settings → Environment Variables

Add these two:
- Name: `YOUTUBE_API_KEY` → Value: your YouTube API key
- Name: `ANTHROPIC_API_KEY` → Value: your Claude API key

### 5. Redeploy
Run this to apply the keys:
```
vercel --prod
```

Your app is now live at your Vercel URL. Share it with anyone.

---

## What's inside

| File | What it does |
|------|-------------|
| `public/index.html` | The full app frontend |
| `api/youtube.js` | Fetches real YouTube videos by goal |
| `api/chat.js` | Powers the AI Guide with Claude |
| `api/reddit.js` | Pulls live Reddit posts by goal |
| `api/rabbit-holes.js` | Generates TikTok & Instagram curated links |
| `vercel.json` | Routes API calls correctly |

---

## Troubleshooting

**Feed shows "Couldn't load"** → Check your API keys are saved in Vercel Environment Variables and you've redeployed.

**AI Guide doesn't respond** → Check your Anthropic API key and make sure you have credits.

**YouTube shows no results** → Make sure YouTube Data API v3 is enabled in Google Cloud Console.
