import os
os.chdir(r'C:\Users\ahmad\Downloads\tow-website')

files = {}

files['app/globals.css'] = '@import "tailwindcss";\nhtml { font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif; }\nbody { background-color: white; color: black; }\n@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }\n.animate-fade-in { animation: fadeIn 0.3s ease-in; }'

files['app/layout.tsx'] = 'import type { Metadata } from "next";\nimport "./globals.css";\nexport const metadata: Metadata = { title: "TOW - Tired Of Winning", description: "The home of tired memes." };\nexport default function RootLayout({ children }: { children: React.ReactNode }) {\n  return (<html lang="en"><body className="antialiased">{children}</body></html>);\n}'

files['app/page.tsx'] = '"use client";\nimport Header from "@/components/Header";\nimport HeroSection from "@/components/HeroSection";\nimport TiredCounter from "@/components/TiredCounter";\nimport MemeTemplateGrid from "@/components/MemeTemplateGrid";\nimport OfficialLinks from "@/components/OfficialLinks";\nimport NftHighlight from "@/components/NftHighlight";\nimport FeaturedMemes from "@/components/FeaturedMemes";\nimport Footer from "@/components/Footer";\nexport default function Home() {\n  return (<div className="min-h-screen bg-white"><Header /><main><HeroSection /><TiredCounter /><MemeTemplateGrid /><NftHighlight /><FeaturedMemes /><OfficialLinks /></main><Footer /></div>);\n}'

files['app/meme-generator/page.tsx'] = 'import Header from "@/components/Header";\nimport Footer from "@/components/Footer";\nimport MemeEditor from "@/components/MemeEditor";\nexport default function MemeGeneratorPage() {\n  return (<div className="min-h-screen bg-white"><Header /><main className="py-12"><div className="max-w-6xl mx-auto px-4"><div className="mb-12"><h1 className="text-4xl md:text-5xl font-bold mb-4">Meme Generator</h1><p className="text-lg text-gray-600">Choose a template, add text, download.</p></div><MemeEditor /></div></main><Footer /></div>);\n}'

files['app/tired-counter/page.tsx'] = 'import Header from "@/components/Header";\nimport Footer from "@/components/Footer";\nimport TiredCounter from "@/components/TiredCounter";\nexport default function TiredCounterPage() {\n  return (<div className="min-h-screen bg-white"><Header /><main><TiredCounter initialCount={0} /><section className="py-16 md:py-24"><div className="max-w-4xl mx-auto px-4 text-center"><h2 className="text-3xl md:text-4xl font-bold mb-6">What is this?</h2><div className="space-y-4 text-lg text-gray-600"><p>The Tired Counter tracks how many times people have pressed the TIRED button.</p><p>Each press represents another soul who understands the eternal fatigue of existence.</p><p>There is no leaderboard. There are no rewards. Just tiredness. Shared tiredness.</p></div></div></section></main><Footer /></div>);\n}'

files['app/links/page.tsx'] = 'import Header from "@/components/Header";\nimport Footer from "@/components/Footer";\nimport OfficialLinks from "@/components/OfficialLinks";\nexport default function LinksPage() {\n  return (<div className="min-h-screen bg-white"><Header /><main className="py-12"><div className="max-w-4xl mx-auto px-4"><div className="text-center mb-12"><h1 className="text-4xl md:text-5xl font-bold mb-4">Official Links</h1><p className="text-lg text-gray-600">Everything TOW. All in one place.</p></div><OfficialLinks /></div></main><Footer /></div>);\n}'

for path, content in files.items():
    full_path = os.path.join(os.getcwd(), path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'Created: {path}')

print(f'\nPart 2 done: {len(files)} files created.')