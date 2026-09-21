import Link from "next/link";
import ParallaxImage from "./ParallaxImage";
import Reveal from "./Reveal";

export default function FinalCta() {
  return (
    <section className="relative flex min-h-[85svh] items-center justify-center overflow-hidden bg-navy-950">
      <ParallaxImage
        src="/images/yacht-night.jpg"
        alt="Finch 65 at anchor in the evening, lights glowing across the lagoon"
        speed={0.2}
        imgClassName="opacity-70"
      />
      <div className="absolute inset-0 bg-navy-950/55" />
      <Reveal className="relative mx-auto max-w-3xl px-5 py-32 text-center sm:px-8">
        <p className="eyebrow text-teal-300">Salt Republic</p>
        <h2 className="display-xl mt-8 text-balance text-ivory">
          Your Maldives. Your Yacht. Your Experience.
        </h2>
        <p className="mx-auto mt-8 max-w-lg text-lg font-light leading-relaxed text-ivory/75">
          Tell us how you want to experience the Maldives.
        </p>
        <div className="mt-12">
          <Link href="/book" className="btn btn-light">
            Book Now
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
