import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["@electric-sql/pglite", "pg"],
  experimental: {
    serverActions: {
      allowedOrigins: [
        "*.run.app",
        "*.asia-southeast1.run.app",
        "ais-dev-4s5fmrhihpk5d5onpmdmlp-190401891669.asia-southeast1.run.app",
        "ais-pre-4s5fmrhihpk5d5onpmdmlp-190401891669.asia-southeast1.run.app",
      ],
    },
  },
  allowedDevOrigins: [
    "*.run.app",
    "*.asia-southeast1.run.app",
    "ais-dev-4s5fmrhihpk5d5onpmdmlp-190401891669.asia-southeast1.run.app",
    "ais-pre-4s5fmrhihpk5d5onpmdmlp-190401891669.asia-southeast1.run.app",
  ],
  async redirects() {
    return [
      // Sign-in removed: /login now leads straight to the dashboard.
      { source: "/login", destination: "/dashboard", permanent: false },
    ];
  },
  async headers() {
    return [
      {
        // Keep the open dashboard out of search engines.
        source: "/dashboard/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
