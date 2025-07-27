#!/bin/bash

echo "🐝 ScrapingBee Setup for Real Google Ads Data"
echo "============================================="
echo ""
echo "📝 Step 1: Sign up for FREE ScrapingBee account"
echo "   👉 Opening: https://www.scrapingbee.com"
echo ""
echo "Press Enter when you've signed up..."
read

echo ""
echo "🔑 Step 2: Get your API key"
echo "   👉 Opening: https://app.scrapingbee.com/account/api-settings"
echo ""
echo "Copy your API key and paste it here:"
read -p "API Key: " API_KEY

if [ -z "$API_KEY" ]; then
    echo "❌ No API key provided. Exiting."
    exit 1
fi

echo ""
echo "📄 Step 3: Adding to .env.local..."

# Check if .env.local exists
if [ -f .env.local ]; then
    # Check if SCRAPINGBEE_API_KEY already exists
    if grep -q "SCRAPINGBEE_API_KEY" .env.local; then
        echo "⚠️  SCRAPINGBEE_API_KEY already exists in .env.local"
        echo "   Updating it with new value..."
        # Update existing key
        sed -i.bak "s/SCRAPINGBEE_API_KEY=.*/SCRAPINGBEE_API_KEY=$API_KEY/" .env.local
    else
        # Add new key
        echo "" >> .env.local
        echo "# ScrapingBee API Key for Google Ads scraping" >> .env.local
        echo "SCRAPINGBEE_API_KEY=$API_KEY" >> .env.local
    fi
else
    # Create new .env.local
    echo "# ScrapingBee API Key for Google Ads scraping" > .env.local
    echo "SCRAPINGBEE_API_KEY=$API_KEY" >> .env.local
fi

echo "✅ API key added to .env.local"
echo ""
echo "🔄 Step 4: Restart your app"
echo "   Running: npm run dev"
echo ""

# Open browser for testing
echo "🌐 Opening test URLs..."
echo "   1. Google Ads Transparency Center examples"
open "https://adstransparency.google.com/?region=US&query=Nike"
echo "   2. Your app (after restart)"
open "http://localhost:3000"

echo ""
echo "✨ Setup Complete!"
echo ""
echo "🎯 What to do next:"
echo "   1. Restart your app: npm run dev"
echo "   2. Open any lead"
echo "   3. Click 'Scan Ad Platforms'"
echo "   4. Watch Google Ads show REAL data!"
echo ""
echo "📊 Your ScrapingBee account:"
echo "   - Free credits: 1000"
echo "   - Each scan: ~5-10 credits"
echo "   - Total scans: ~100-200"
echo ""
echo "🔍 Test it manually first:"
echo "   https://adstransparency.google.com/?region=US&query=Home%20Depot"
echo "" 