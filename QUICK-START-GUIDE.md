# 🚀 React Lead Tracker - Quick Start Guide

## While NPM Install is Running...

### 1️⃣ Get Your Google Apps Script URL

You need the URL from your existing setup. Find it by:

**Option A: From Your Browser**
1. Open your vanilla JS Lead Tracker (the one on Vercel)
2. Open DevTools (F12)
3. Go to: Application → Local Storage → Your Domain
4. Find: `sheetApiUrl`
5. Copy the value (starts with `https://script.google.com/macros/s/`)

**Option B: From Google Apps Script**
1. Go to script.google.com
2. Open your Lead Tracker project
3. Click Deploy → Manage Deployments
4. Copy the Web App URL

### 2️⃣ Add to .env.local

```bash
NEXT_PUBLIC_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

### 3️⃣ (Optional) Add OpenAI Key

If you're using AI extraction:
```bash
OPENAI_API_KEY=sk-your-key-here
```

### 4️⃣ Check Install Progress

```bash
# See how many packages installed:
ls node_modules | wc -l
# Should show 300+ when done

# Check if still running:
ps aux | grep npm
```

### 5️⃣ Start the App

Once install completes:
```bash
npm run dev
```

Then open: **http://localhost:3000**

## 🎯 What You'll See

1. **First Visit**: If no Google Script URL, you'll see the config screen
2. **After Config**: Your full lead tracker with all your data!
3. **All Features**: Everything from vanilla version, but faster

## 🔧 Troubleshooting

**Install taking forever?**
- Normal for first time (downloading ~300MB)
- Try: `npm install --prefer-offline`

**Port 3000 in use?**
- Run on different port: `npm run dev -- -p 3001`

**Can't find Google Script URL?**
- Check the README in parent directory
- Or redeploy your Google Apps Script

## 🎨 What's Different in React?

- **Instant Updates**: No page refreshes
- **Smooth Animations**: Professional transitions  
- **Better Organization**: Components are reusable
- **Type Safety**: TypeScript catches errors
- **Modern UI**: Tailwind CSS styling

## 🚀 Next Steps After Running

1. **Test It**: Add a test lead
2. **Import Data**: Use bulk import 
3. **Try AI Extract**: If you added OpenAI key
4. **Customize**: Edit components in `src/components`

---

The React version is worth the wait - much faster and cleaner code!