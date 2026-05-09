"use client";

const featuredMemes = [
  "/assets/memes/featured/featured-1.png",
  "/assets/memes/featured/featured-2.png",
  "/assets/memes/featured/featured-3.png",
  "/assets/memes/featured/featured-4.png",
  "/assets/memes/featured/featured-5.png",
  "/assets/memes/featured/featured-6.png",
];

export default function FeaturedMemes() {
  return (
    <section className="bg-gray-50 py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-8 text-center">
          <h2 className="mb-3 text-3xl font-bold md:text-4xl">
            Featured Memes
          </h2>
          <p className="text-lg text-gray-600">
            Community favorites. Or just ones we liked.
          </p>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
          {featuredMemes.map((src, index) => (
            <div
              key={src}
              className="min-w-[260px] snap-start overflow-hidden rounded-xl border-2 border-black bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg md:min-w-[320px]"
            >
              <img
                src={src}
                alt={`Featured TOW meme ${index + 1}`}
                className="h-[260px] w-full object-cover md:h-[320px]"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}