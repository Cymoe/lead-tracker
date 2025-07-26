# 🚀 Quick Setup Guide

## Step 1: Configure Your Environment

Open `.env.local` and add your Google Apps Script URL from your existing setup:

```bash
NEXT_PUBLIC_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

## Step 2: Install Dependencies

Run ONE of these commands (they all do the same thing):

```bash
# Option 1: NPM (might be slow)
npm install

# Option 2: Yarn (if you have it)
yarn install

# Option 3: PNPM (fastest, if you have it)
pnpm install
```

**Note**: First install can take 5-10 minutes. This is normal!

## Step 3: Start the Development Server

```bash
npm run dev
# or: yarn dev
# or: pnpm dev
```

## Step 4: Open Your Browser

Go to: http://localhost:3000

## 🎉 That's It!

You'll see:
1. The same lead tracker interface
2. All your existing data
3. But now in React with better performance!

## 💡 Tips

- **Slow install?** That's normal for first time. It's downloading ~300MB of dependencies.
- **Getting errors?** Make sure you have Node.js 18+ installed: `node --version`
- **Need your Script URL?** Check your vanilla JS version's localStorage or settings

## 📱 What's Better in React Version?

- ⚡ Faster UI updates
- 🔄 Better state management
- 📦 Smaller bundle size
- 🎨 Smoother animations
- 🛠️ Easier to maintain
- 📈 Ready to scale

---

If you're stuck, the vanilla JS version still works great! This React version is for when you're ready to scale up.