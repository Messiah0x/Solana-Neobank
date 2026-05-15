/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Solana web3.js requires these Node built-ins to be stubbed in the browser
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    };
    return config;
  },
};

export default nextConfig;
