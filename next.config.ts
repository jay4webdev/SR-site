import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
