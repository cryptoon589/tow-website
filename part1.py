import os
os.chdir(r'C:\Users\ahmad\Downloads\tow-website')

dirs = [
    'app/meme-generator', 'app/tired-counter', 'app/nft-collection', 'app/links',
    'components', 'config', 'lib',
    'public/assets/logo', 'public/assets/characters',
    'public/assets/memes/templates', 'public/assets/memes/featured',
    'public/assets/nft'
]
for d in dirs:
    os.makedirs(d, exist_ok=True)

files = {}

files['package.json'] = '{"name":"tow-website","version":"0.1.0","private":true,"scripts":{"dev":"next dev","build":"next build","start":"next start","lint":"eslint"},"dependencies":{"next":"16.2.4","react":"19.2.4","react-dom":"19.2.4"},"devDependencies":{"@tailwindcss/postcss":"^4","@types/node":"^20","@types/react":"^19","@types/react-dom":"^19","eslint":"^9","eslint-config-next":"16.2.4","tailwindcss":"^4","typescript":"^5"}}'

files['tsconfig.json'] = '{"compilerOptions":{"target":"ES2017","lib":["dom","dom.iterable","esnext"],"allowJs":true,"skipLibCheck":true,"strict":true,"noEmit":true,"esModuleInterop":true,"module":"esnext","moduleResolution":"bundler","resolveJsonModule":true,"isolatedModules":true,"jsx":"preserve","incremental":true,"plugins":[{"name":"next"}],"paths":{"@/*":["./*"]}},"include":["next-env.d.ts","**/*.ts","**/*.tsx",".next/types/**/*.ts"],"exclude":["node_modules"]}'

files['next.config.ts'] = 'import type { NextConfig } from "next";\nconst nextConfig: NextConfig = {};\nexport default nextConfig;'

files['postcss.config.mjs'] = 'const config = { plugins: { "@tailwindcss/postcss": {} } };\nexport default config;'

files['eslint.config.mjs'] = 'import { defineConfig, globalIgnores } from "eslint/config";\nimport nextCoreWebVitals from "eslint-config-next/core-web-vitals";\nimport nextTypescript from "eslint-config-next/typescript";\nexport default defineConfig([...nextCoreWebVitals, ...nextTypescript, globalIgnores([".next/**"])]);'

files['.gitignore'] = 'node_modules/\n.next/\nout/\n.DS_Store\n.env*.local\n.env\n.vercel\n*.tsbuildinfo\nnext-env.d.ts\n'

files['config/site.ts'] = '''export const siteConfig = {
  name: "TOW", fullName: "Tired Of Winning", tagline: "Too tired to quit.",
  description: "The home of tired memes.",
  heroHeadlines: ["Too tired to quit.", "Tired now. Tired of winning later.", "Still tired. Still here.", "The home of tired memes."],
  heroSubtext: "TOW is the main hub for tired memes, community, and official project links.",
};
export const navItems = [
  { label: "Home", href: "/" }, { label: "Meme Generator", href: "/meme-generator" },
  { label: "Tired Counter", href: "/tired-counter" }, { label: "NFT Collection", href: "/nft-collection" },
  { label: "Official Links", href: "/links" },
];
export const officialLinks = [
  { label: "First Ledger", url: "https://xrpscan.com/tx/YOUR_HASH", description: "The beginning of TOW" },
  { label: "DEX / Chart", url: "https://dexscreener.com/xrpl/YOUR_PAIR", description: "Track the token" },
  { label: "Telegram", url: "https://t.me/YOUR_TELEGRAM", description: "Join the community" },
  { label: "NFT Collection", url: "/nft-collection", description: "View the collection" },
  { label: "X (Twitter)", url: "https://x.com/YOUR_HANDLE", description: "Follow for updates" },
];
export const tiredResponses = [
  "understandable.", "recorded another tired soul.", "tired recognized.",
  "noted. still tired.", "acknowledged. remain tired.", "logged. the tiredness continues.",
  "another one joins the tired.", "tiredness confirmed.",
];'''

files['config/memeTemplates.ts'] = '''export interface MemeTemplate {
  id: string; name: string; imagePath: string; width: number; height: number;
  textFields: { id: string; label: string; defaultText: string; x: number; y: number; maxWidth: number; align?: "left" | "center" | "right"; }[];
}
export const memeTemplates: MemeTemplate[] = [
  { id: "dad-and-dad", name: "Dad and Dad", imagePath: "/assets/memes/templates/dad-and-dad.png", width: 600, height: 600,
    textFields: [{ id: "top", label: "Top Text", defaultText: "TOP TEXT", x: 300, y: 80, maxWidth: 560, align: "center" }, { id: "bottom", label: "Bottom Text", defaultText: "BOTTOM TEXT", x: 300, y: 540, maxWidth: 560, align: "center" }] },
  { id: "son-and-son", name: "Son and Son", imagePath: "/assets/memes/templates/son-and-son.png", width: 600, height: 600,
    textFields: [{ id: "top", label: "Top Text", defaultText: "TOP TEXT", x: 300, y: 80, maxWidth: 560, align: "center" }, { id: "bottom", label: "Bottom Text", defaultText: "BOTTOM TEXT", x: 300, y: 540, maxWidth: 560, align: "center" }] },
  { id: "girlfriend-and-girlfriend", name: "Girlfriend and Girlfriend", imagePath: "/assets/memes/templates/girlfriend-and-girlfriend.png", width: 600, height: 600,
    textFields: [{ id: "top", label: "Top Text", defaultText: "TOP TEXT", x: 300, y: 80, maxWidth: 560, align: "center" }, { id: "bottom", label: "Bottom Text", defaultText: "BOTTOM TEXT", x: 300, y: 540, maxWidth: 560, align: "center" }] },
  { id: "parody-and-parody", name: "Parody and Parody", imagePath: "/assets/memes/templates/parody-and-parody.png", width: 600, height: 600,
    textFields: [{ id: "top", label: "Top Text", defaultText: "TOP TEXT", x: 300, y: 80, maxWidth: 560, align: "center" }, { id: "bottom", label: "Bottom Text", defaultText: "BOTTOM TEXT", x: 300, y: 540, maxWidth: 560, align: "center" }] },
];'''

files['config/featuredMemes.ts'] = '''export interface FeaturedMeme { id: string; name: string; imagePath: string; }
export const featuredMemes: FeaturedMeme[] = [
  { id: "meme-1", name: "Tired Meme 1", imagePath: "/assets/memes/featured/meme-1.png" },
  { id: "meme-2", name: "Tired Meme 2", imagePath: "/assets/memes/featured/meme-2.png" },
  { id: "meme-3", name: "Tired Meme 3", imagePath: "/assets/memes/featured/meme-3.png" },
  { id: "meme-4", name: "Tired Meme 4", imagePath: "/assets/memes/featured/meme-4.png" },
];'''

files['public/assets/logo/tow-logo.svg'] = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="black"/><text x="50" y="60" text-anchor="middle" fill="white" font-size="28" font-weight="bold" font-family="Arial">TOW</text></svg>'

files['public/assets/README.md'] = '# TOW Assets\n\nDrop images in:\n- `/public/assets/characters/hero.png`\n- `/public/assets/memes/templates/`\n- `/public/assets/memes/featured/`\n- `/public/assets/nft/`\n\nEdit `config/site.ts` for links/text.'

files['README.md'] = '# TOW - Tired Of Winning\n\n## Quick Start\n```bash\nnpm install\nnpm run dev\n```\n\n## Deploy\nPush to GitHub, deploy at [vercel.com/new](https://vercel.com/new)\n\n## Customize\n- `config/site.ts` - text, links\n- `config/memeTemplates.ts` - templates\n- `public/assets/` - images'

for path, content in files.items():
    full_path = os.path.join(os.getcwd(), path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'Created: {path}')

print(f'\nPart 1 done: {len(files)} files created.')