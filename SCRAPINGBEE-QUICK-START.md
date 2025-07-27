# 🐝 ScrapingBee Quick Start for Google Ads

Get REAL Google Ads data in 5 minutes!

## ✅ What's Already Implemented

Your app is **already set up** to use ScrapingBee for Google Ads Transparency Center! 

When you add a ScrapingBee API key, the app will:
1. Automatically check Google Ads Transparency Center
2. Find real ads for any company
3. Fall back to smart mock data if no key

## 🚀 Quick Setup (5 minutes)

### 1. Get Your Free ScrapingBee Account

1. Go to: https://www.scrapingbee.com
2. Sign up (free - no credit card)
3. Get **1000 free API credits**!

### 2. Copy Your API Key

From: https://app.scrapingbee.com/account/api-settings

### 3. Add to Your App

Add to `.env.local`:
```
SCRAPINGBEE_API_KEY=your_api_key_here
```

### 4. Restart Your App
```bash
npm run dev
```

### 5. Test It!

1. Open any lead
2. Click "Scan Ad Platforms"
3. Watch Google Ads show REAL data!

## 🎯 What You'll See

Instead of mock data, you'll see:
- ✅ **Real ad presence** from Google Ads Transparency Center
- ✅ **Accurate ad counts**
- ✅ **Live status** - "Live data from Google Ads Transparency Center"

## 💰 Cost Analysis

- **Free tier**: 1000 API credits
- **Each scan**: Uses 5-10 credits (with JavaScript rendering)
- **Total scans**: ~100-200 Google Ads checks free!

## 🔍 Manual Testing

Want to see what we're scraping? Visit:
- https://adstransparency.google.com/?region=US&query=Home%20Depot
- https://adstransparency.google.com/?region=US&query=Nike

## 📊 How It Works

```javascript
// This is already in your code!
if (scrapingBeeKey) {
  // Scrapes Google Ads Transparency Center
  const searchUrl = `https://adstransparency.google.com/?region=US&query=${companyName}`;
  
  // Gets real HTML with rendered JavaScript
  const response = await fetch('https://app.scrapingbee.com/api/v1/...');
  
  // Detects real ads
  if (hasAds) {
    return { 
      platform: 'Google Ads',
      notes: 'Live data from Google Ads Transparency Center'
    };
  }
}
```

## ✨ Benefits Over Mock Data

| Mock Data | Real Data (with ScrapingBee) |
|-----------|------------------------------|
| Always shows ads | Shows actual ad presence |
| Random counts | Real ad counts |
| Generic content | Could parse actual ad text |
| Estimated spend | Real activity indicators |

## 🚨 Common Issues

**"Still seeing mock data"**
- Did you restart the app after adding the key?
- Check `.env.local` is in root directory
- Make sure no typos in key

**"API credits running low"**
- Each scan uses 5-10 credits
- Upgrade to paid plan ($49/mo = 150k credits)
- Or use caching to reduce calls

## 🎉 That's It!

You now have:
- ✅ Real Google Ads data via official Transparency Center
- ✅ 1000 free credits to start
- ✅ Automatic fallback to smart mocks
- ✅ No complex setup needed

**Total time**: 5 minutes
**Total cost**: $0

---

🚀 **Next**: Add LinkedIn data? Nextdoor? Let me know! 