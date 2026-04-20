import Link from "next/link";

export default function GamePromo() {
  return (
    <section className="py-16 bg-gradient-to-br from-indigo-50 to-purple-50 border-y border-gray-200">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full mb-4">
              NEW GAME
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
              Too Tired to Win
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              A premium meme game about surviving the market without burning out. 
              How long can TOW last?
            </p>
            
            <div className="space-y-3 mb-8">
              <div className="flex items-start gap-3">
                <span className="text-2xl">😴</span>
                <div>
                  <div className="font-semibold">Relatable</div>
                  <div className="text-sm text-gray-600">Every crypto trader's nightmare, gamified</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">🎮</span>
                <div>
                  <div className="font-semibold">Replayable</div>
                  <div className="text-sm text-gray-600">Random events, behavior arcs, endless variation</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">✨</span>
                <div>
                  <div className="font-semibold">Polished</div>
                  <div className="text-sm text-gray-600">Premium UI, smooth animations, expressive character</div>
                </div>
              </div>
            </div>

            <Link
              href="/play"
              className="inline-block px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl hover:scale-105"
            >
              Play Now →
            </Link>
          </div>

          <div className="bg-black rounded-2xl p-6 shadow-2xl">
            <div className="aspect-square bg-gradient-to-br from-zinc-900 to-black rounded-xl flex items-center justify-center overflow-hidden relative">
              <div className="text-center p-8">
                <div className="text-6xl mb-4">😴</div>
                <div className="text-zinc-400 text-sm mb-4">TOW Character Preview</div>
                <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                  <div className="bg-zinc-800 rounded p-2 text-xs text-zinc-400">Check Portfolio</div>
                  <div className="bg-zinc-800 rounded p-2 text-xs text-zinc-400">Buy the Dip</div>
                  <div className="bg-zinc-800 rounded p-2 text-xs text-zinc-400">Touch Grass</div>
                </div>
              </div>
              <div className="absolute top-4 right-4 w-20 h-20 bg-indigo-500/20 rounded-full blur-2xl"></div>
              <div className="absolute bottom-4 left-4 w-20 h-20 bg-purple-500/20 rounded-full blur-2xl"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}