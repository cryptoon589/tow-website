import Link from "next/link";

export default function MemeTemplateGrid() {
  return (
    <section className="py-10 md:py-12">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div className="order-2 text-center md:order-1 md:text-left">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Meme Generator
            </h2>

            <p className="mb-6 max-w-xl text-lg text-gray-600">
              Make something tired. Export it. Post it.
            </p>

            <Link
              href="/meme-generator"
              className="inline-block rounded-lg border-2 border-black bg-white px-8 py-4 font-bold text-black transition hover:bg-black hover:text-white"
            >
              Open Meme Generator
            </Link>
          </div>

          <div className="order-1 md:order-2">
            <div className="mx-auto aspect-square w-full max-w-[460px] overflow-hidden rounded-xl border-2 border-black bg-white shadow-sm">
              <img
                src="/assets/memes/preview.png"
                alt="TOW meme generator preview"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}