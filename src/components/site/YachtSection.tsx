import Link from "next/link";
import type { yachts } from "@/db/schema";
import ParallaxImage from "./ParallaxImage";
import Reveal from "./Reveal";

type Yacht = typeof yachts.$inferSelect;

function GalleryImage({
  yacht,
  label,
  className,
  alt,
  speed = 0.12,
}: {
  yacht: Yacht;
  label: string;
  className: string;
  alt: string;
  speed?: number;
}) {
  const item = yacht.gallery.find((g) => g.label === label);
  if (!item) return null;
  return (
    <div className={`group relative overflow-hidden bg-navy-950 ${className}`}>
      <ParallaxImage src={item.src} alt={alt} speed={speed} />
      <div className="absolute bottom-4 left-4 bg-navy-950/55 px-4 py-2 backdrop-blur-sm">
        <span className="eyebrow text-[0.6rem] text-ivory/90">{item.label}</span>
      </div>
    </div>
  );
}

export default function YachtSection({ yacht }: { yacht: Yacht }) {
  const specs = [
    { label: "Maximum Speed", value: `${yacht.maxSpeedKnots}`, unit: "Knots", sub: `${yacht.maxSpeedKmh} km/h` },
    { label: "Bedrooms", value: String(yacht.bedrooms), unit: "", sub: "Private cabins" },
    { label: "Beds", value: String(yacht.beds), unit: "", sub: "Sleeping in comfort" },
    { label: "Washrooms", value: String(yacht.washrooms), unit: "", sub: "Aboard" },
    { label: "Air Conditioned", value: yacht.airConditioned ? "Yes" : "No", unit: "", sub: "Climate controlled" },
    { label: "Maximum Day Guests", value: String(yacht.maxDayGuests), unit: "", sub: "Day charters" },
    { label: "Maximum Overnight Guests", value: String(yacht.maxOvernightGuests), unit: "", sub: "Overnight charters" },
    { label: "Crew", value: String(yacht.crew), unit: "", sub: "Dedicated to your charter" },
  ];

  return (
    <section id="yacht" className="bg-cream py-24 md:py-36">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="eyebrow text-ocean-500">04 · The Vessel</p>
          <h2 className="display-lg mt-6 text-navy-900">{yacht.name}</h2>
          <p className="mt-7 max-w-2xl mx-auto font-light leading-relaxed text-stone">
            {yacht.summary}
          </p>
        </Reveal>

        {/* Specifications */}
        <Reveal delay={100}>
          <div className="mt-16 grid grid-cols-2 border-t border-l border-navy-900/10 md:grid-cols-4">
            {specs.map((spec) => (
              <div
                key={spec.label}
                className="group border-navy-900/10 border-b border-r px-5 py-8 text-center transition-colors duration-500 hover:bg-white sm:px-8 sm:py-11"
              >
                <p className="eyebrow text-[0.55rem] text-stone">{spec.label}</p>
                <p className="display-numeral mt-3 text-5xl text-navy-900 sm:text-6xl">
                  {spec.value}
                  {spec.unit ? (
                    <span className="ml-2 align-baseline font-sans text-sm font-normal tracking-wide text-stone">
                      {spec.unit}
                    </span>
                  ) : null}
                </p>
                <p className="mt-2 text-xs font-light text-stone/80">{spec.sub}</p>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Editorial gallery */}
        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-12">
          <Reveal className="lg:col-span-7">
            <GalleryImage
              yacht={yacht}
              label="Exterior"
              alt="Side profile of the Finch 65 private motor yacht"
              className="h-[380px] sm:h-[480px] lg:h-[560px]"
              speed={0.1}
            />
          </Reveal>
          <div className="flex flex-col gap-5 lg:col-span-5">
            <Reveal delay={100}>
              <GalleryImage
                yacht={yacht}
                label="Interior Saloon"
                alt="The light, modern interior saloon of Finch 65"
                className="h-[270px] sm:h-[272px]"
                speed={0.16}
              />
            </Reveal>
            <Reveal delay={180}>
              <GalleryImage
                yacht={yacht}
                label="Accommodation"
                alt="A private air-conditioned guest cabin aboard Finch 65"
                className="h-[270px] sm:h-[272px]"
                speed={0.16}
              />
            </Reveal>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">
          <Reveal>
            <GalleryImage
              yacht={yacht}
              label="Aerial View"
              alt="Aerial view of Finch 65 at anchor in the lagoon"
              className="h-[320px]"
            />
          </Reveal>
          <Reveal delay={100}>
            <GalleryImage
              yacht={yacht}
              label="At Anchor"
              alt="Finch 65 anchored beside a Maldivian sandbank"
              className="h-[320px]"
            />
          </Reveal>
          <Reveal delay={180}>
            <GalleryImage
              yacht={yacht}
              label="Evenings Aboard"
              alt="Finch 65 at blue hour with warm deck lighting"
              className="h-[320px]"
            />
          </Reveal>
        </div>

        <Reveal className="mt-5">
          <GalleryImage
            yacht={yacht}
            label="Aft Deck Dining"
            alt="Dining set on the shaded aft deck of Finch 65"
            className="h-[300px] sm:h-[420px]"
            speed={0.1}
          />
        </Reveal>

        <Reveal className="mt-14 flex flex-col items-center gap-6 text-center">
          <p className="max-w-xl text-sm font-light leading-relaxed text-stone">
            Finch 65 is the vessel that enables the experience — private,
            comfortable and entirely yours for the duration of your charter.
          </p>
          <Link href="/book" className="btn btn-dark">
            Charter Finch 65
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
