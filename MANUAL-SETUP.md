# Manual Setup Instructions

If `npm install` is taking too long, here's what you need to do:

## 1. Edit `.env.local`

Add your Google Apps Script URL:
```
NEXT_PUBLIC_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

(Optional) Add your OpenAI API key:
```
OPENAI_API_KEY=sk-your-key-here
```

## 2. Install Dependencies

The install might take 5-10 minutes depending on your connection. You can:

### Option A: Wait for npm
```bash
npm install
# or
yarn install
```

### Option B: Use pnpm (faster)
```bash
npm install -g pnpm
pnpm install
```

### Option C: Install core deps only
```bash
npm install next@14.1.0 react@18.2.0 react-dom@18.2.0
npm install tailwindcss@3.4.1 @types/react@18.2.48 typescript@5.3.3
# Then install the rest later
```

## 3. Run the App

Once dependencies are installed:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

## 4. Open Browser

Navigate to: http://localhost:3000

## Troubleshooting

- **Slow install?** Try: `npm install --prefer-offline --no-audit`
- **Network issues?** Try: `npm config set registry https://registry.npmjs.org/`
- **Still stuck?** The vanilla JS version still works at your Vercel URL!

## What You'll See

1. First visit: Configuration screen for Google Apps Script URL
2. After config: Full lead tracker with all features
3. All your existing data will load automatically

The React version is worth the wait - it's much faster and more maintainable!