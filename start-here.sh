#!/bin/bash

echo "🚀 Starting React Lead Tracker Setup..."
echo ""

# Check if node_modules exists
if [ -d "node_modules" ]; then
    echo "✅ Dependencies already installed!"
else
    echo "📦 Installing dependencies (this may take 5-10 minutes)..."
    echo "   Running: npm install"
    npm install
fi

echo ""
echo "📝 Now let's configure your app..."
echo ""

# Check if .env.local is configured
if grep -q "NEXT_PUBLIC_GOOGLE_SCRIPT_URL=https" .env.local 2>/dev/null; then
    echo "✅ Google Apps Script URL already configured!"
else
    echo "⚠️  You need to add your Google Apps Script URL to .env.local"
    echo ""
    echo "   Edit the file: .env.local"
    echo "   Add your URL from the vanilla JS version"
    echo "   It should look like: https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"
    echo ""
    echo "Press Enter when you've added your URL..."
    read
fi

echo ""
echo "🎯 Starting the development server..."
echo ""
npm run dev