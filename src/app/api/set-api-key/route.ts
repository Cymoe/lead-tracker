import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { apiKey } = await req.json();
  
  // This endpoint helps set the API key directly
  return NextResponse.json({ 
    success: true, 
    message: 'Use this in browser console: localStorage.setItem("openaiApiKey", "' + apiKey + '")'
  });
}