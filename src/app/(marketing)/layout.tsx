import type { ReactNode } from "react";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import SmoothScroll from "@/components/site/SmoothScroll";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SmoothScroll />
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}
