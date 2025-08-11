/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    NEXT_PUBLIC_GOOGLE_SCRIPT_URL: process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  },
  output: 'standalone',
}

module.exports = nextConfig