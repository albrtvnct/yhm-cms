import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  serverActions: {
    allowedOrigins: [
      "localhost:3000",
      "cmsyhm.vercel.app",
      "yeshproduction.my.id",
      "www.yeshproduction.my.id",
      "https://yeshproduction.my.id",
      "https://www.yeshproduction.my.id",
    ],
  },
};

export default nextConfig;
