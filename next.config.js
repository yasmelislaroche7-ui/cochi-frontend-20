/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow development origins (Replit/dev hosts) to access _next static assets and HMR
  allowedDevOrigins: [
    "https://c969333c-924f-4809-be28-6932d896b739-00-1h1rsndl2wcrs.worf.replit.dev",
    "http://localhost:3000",
    "http://0.0.0.0:5000"
  ],
}

module.exports = nextConfig;