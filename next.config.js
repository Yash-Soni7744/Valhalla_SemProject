/** @type {import('next').NextConfig} */
/**
 * NEXT.JS CONFIGURATION
 * 
 * This file tells Next.js how to build and run your website.
 * We removed the TypeScript types to keep it simple!
 */
const nextConfig = {
  /* You can add special Next.js settings here if needed */
  experimental: {
    turbo: {
      root: './'
    }
  }
};


export default nextConfig;


