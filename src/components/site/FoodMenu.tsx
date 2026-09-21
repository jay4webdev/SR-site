"use client";

import { useCallback, useEffect, useState } from "react";
import ParallaxImage from "./ParallaxImage";
import Reveal from "./Reveal";

export default function FoodMenu() {
  const [open, setOpen] = useState(false);
  const [zoomed, setZoomed] = useState(false);

  const close = useCallback(() => {
    setOpen(false);
    setZoomed(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, close]);

  return (
    <section id="menu" className="relative overflow-hidden bg-navy-900">
      <ParallaxImage
        src="/images/dining.jpg"
        alt="Gourmet dining prepared aboard Finch 65"
        speed={0.18}
        decorative={false}
        imgClassName="opacity-30"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-navy-950/90 via-navy-950/60 to-navy-950/30" />
      <div className="relative mx-auto max-w-[1400px] px-5 py-32 sm:px-8 md:py-44">
        <Reveal className="max-w-xl">
          <p className="index-label text-teal-300">06 · Food &amp; Dining</p>
          <h2 className="display-lg mt-6 text-balance text-ivory">
            A menu made for the middle of the ocean
          </h2>
          <p className="mt-7 font-light leading-relaxed text-ivory/70">
            Fresh, considered dining prepared by your crew as part of the
            charter. Browse the Salt Republic menu and let us know your
            preferences when you request your booking.
          </p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="btn btn-light mt-10"
          >
            Explore Our Menu
          </button>
        </Reveal>
      </div>

      {open ? (
        <div
          className="animate-fade-in fixed inset-0 z-[70] flex items-center justify-center bg-navy-950/90 p-4 backdrop-blur-sm sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label="Salt Republic food menu"
          onClick={close}
        >
          <div
            className="animate-scale-in relative flex max-h-[90vh] w-full max-w-3xl flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between text-ivory">
              <span className="eyebrow text-[0.65rem] text-teal-300">
                Salt Republic Menu
              </span>
              <button
                type="button"
                onClick={close}
                aria-label="Close menu"
                className="flex h-10 w-10 items-center justify-center border border-ivory/30 transition-colors hover:border-ivory hover:bg-ivory/10"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            <div
              className={`relative overflow-auto bg-white ${
                zoomed ? "cursor-zoom-out" : "cursor-zoom-in"
              }`}
              style={{ maxHeight: "78vh" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/food-menu.jpg"
                alt="The Salt Republic food and dining menu"
                onClick={() => setZoomed((z) => !z)}
                className={zoomed ? "w-[160%] max-w-none" : "mx-auto w-full"}
              />
            </div>
            <p className="mt-3 text-center text-[0.68rem] uppercase tracking-[0.18em] text-ivory/45">
              Tap the image to zoom · Press ESC to close · Placeholder preview —
              official menu artwork to be supplied
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
