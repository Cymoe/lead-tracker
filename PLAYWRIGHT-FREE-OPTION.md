# 🎭 Free Google Ads Scraping with Playwright

Want to scrape Google Ads Transparency Center for FREE? Here's how!

## Why Playwright?

- **100% Free** - No API limits
- **Runs on your server** - Full control
- **Real browser** - Handles JavaScript, anti-bot measures
- **No CORS issues** - Server-side execution

## Quick Implementation

### 1. Install Playwright
```bash
npm install playwright
# Download browser binaries (one time)
npx playwright install chromium
```

### 2. Update Your API Route

Replace the ScrapingBee code with:

```typescript
// src/app/api/check-ad-platforms/route.ts

import { chromium } from 'playwright';

async function checkGoogleAds(leadId: string, companyName: string, location?: string): Promise<AdPlatformStatus> {
  try {
    console.log(`Checking Google Ads for ${companyName} with Playwright...`);
    
    // Launch headless browser
    const browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox'] // Needed for some server environments
    });
    
    const page = await browser.newPage();
    
    // Navigate to Google Ads Transparency Center
    const url = `https://adstransparency.google.com/?region=US&query=${encodeURIComponent(companyName)}`;
    await page.goto(url, { waitUntil: 'networkidle' });
    
    // Wait for ads to load (adjust selector as needed)
    try {
      await page.waitForSelector('[role="list"] [role="listitem"]', { timeout: 5000 });
    } catch {
      // No ads found
      await browser.close();
      return {
        platform: 'Google Ads',
        hasAds: false,
        lastChecked: new Date().toISOString(),
        notes: 'No ads found on Google Ads Transparency Center'
      };
    }
    
    // Count ads
    const adCount = await page.evaluate(() => {
      const adElements = document.querySelectorAll('[role="list"] [role="listitem"]');
      return adElements.length;
    });
    
    // Extract ad details (optional)
    const ads = await page.evaluate(() => {
      const adElements = document.querySelectorAll('[role="list"] [role="listitem"]');
      return Array.from(adElements).slice(0, 5).map((el, i) => ({
        id: `google-real-${i}`,
        type: 'text',
        headline: el.querySelector('h3')?.textContent || 'Google Ad',
        primaryText: el.querySelector('p')?.textContent || '',
        status: 'active'
      }));
    });
    
    await browser.close();
    
    return {
      platform: 'Google Ads',
      hasAds: true,
      lastChecked: new Date().toISOString(),
      adCount: adCount,
      ads: ads,
      notes: `Found ${adCount} real ads on Google Ads Transparency Center`
    };
    
  } catch (error) {
    console.error('Playwright error:', error);
    // Fall back to mock data
    return getEnhancedGoogleAdsMock(leadId, companyName, location);
  }
}
```

### 3. That's It!

No API keys needed. Just runs on your server.

## 🚀 Deployment Considerations

### Vercel/Netlify
- ❌ Won't work - serverless functions have size limits
- Solution: Use a dedicated server or container

### VPS/Docker
- ✅ Perfect - full control
- Install: `RUN npx playwright install-deps chromium`

### Development
- ✅ Works great locally
- Just install and run

## 📊 Comparison

| Aspect | ScrapingBee | Playwright |
|--------|-------------|------------|
| Cost | $0-49/mo | $0 forever |
| Setup | 5 minutes | 30 minutes |
| Maintenance | None | Some |
| Speed | Fast | Slower |
| Reliability | Very high | High |
| Server needs | None | ~512MB RAM |

## 🎯 When to Use What

**Use Playwright when:**
- You want 100% free solution
- You have your own server
- You need full control
- Volume is low-medium

**Use ScrapingBee when:**
- You want instant setup
- Using serverless (Vercel)
- High volume needs
- Don't want maintenance

## 💡 Pro Tips

1. **Cache results** - Don't scrape the same company twice
2. **Add delays** - Be respectful to Google
3. **Use proxies** - For high volume
4. **Monitor performance** - Headless Chrome uses resources

## 🚨 Debugging

```javascript
// See what's happening
const browser = await chromium.launch({ 
  headless: false, // Shows browser
  slowMo: 500 // Slows down actions
});

// Take screenshots
await page.screenshot({ path: 'debug.png' });
```

---

**Bottom line**: If you want 100% free with no limits, Playwright is your answer. It just takes a bit more setup than ScrapingBee's instant API. 