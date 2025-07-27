# 🐝 ScrapingBee Setup - Start Here!

## Option A: Automatic Setup (Recommended)
```bash
./SCRAPINGBEE-SETUP.sh
```
This script will guide you through everything!

## Option B: Manual Setup

### 1️⃣ Sign Up (2 minutes)
👉 **Go to**: https://www.scrapingbee.com
- Click "Start free trial"
- Sign up with email
- No credit card needed!

### 2️⃣ Get Your API Key (1 minute)
👉 **Go to**: https://app.scrapingbee.com/account/api-settings
- Copy your API key (looks like: `ABCDEF123456...`)

### 3️⃣ Add to Your App (1 minute)
Create or edit `.env.local`:
```
SCRAPINGBEE_API_KEY=paste_your_key_here
```

### 4️⃣ Restart Your App (1 minute)
```bash
npm run dev
```

## 🎉 That's It! Test It Out:

1. Open your app: http://localhost:3000
2. Click on any lead
3. Click "Scan Ad Platforms" 
4. Google Ads will now show **REAL DATA**!

## 🔍 What You'll See:

**Before (Mock Data)**:
- Random ad presence
- Generic ad content
- Note: "Mock data"

**After (Real Data)**:
- ✅ Actual ad presence from Google
- ✅ Real ad counts
- ✅ Note: "Live data from Google Ads Transparency Center"

## 📊 Your Free Credits:
- **1000 free API calls**
- Each Google Ads scan uses ~5-10 credits
- That's **100-200 free scans**!

## 🚨 Quick Test:
Check what we're scraping:
- [Nike on Google Ads](https://adstransparency.google.com/?region=US&query=Nike)
- [Home Depot on Google Ads](https://adstransparency.google.com/?region=US&query=Home%20Depot)

---

**Need help?** The mock data works great without any setup! 