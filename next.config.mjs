/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    config.resolve = config.resolve || {}
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      // Metamask SDK (pulled by Web3Auth) optionally requires this RN module; alias to false for web builds
      "@react-native-async-storage/async-storage": false,
    }
    return config
  },
}

export default nextConfig
