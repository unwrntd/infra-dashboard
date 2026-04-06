import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  env: {
    PVE_TOKEN: process.env.PVE_TOKEN,
    KUBE_TOKEN: process.env.KUBE_TOKEN,
  },
};

export default nextConfig;
