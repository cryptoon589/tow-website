# TOW - Tired Of Winning Website

A simple website for the TOW community. It has a meme generator, a "tired counter," and links to official project pages.

---

## What This Site Does

- **Homepage** — Shows what TOW is, with buttons to make memes, press the tired button, and view links.
- **Meme Generator** — Pick a meme template, add your own text, and download the finished meme as an image.
- **Tired Counter** — A big button that counts how many times people have pressed "TIRED." The count is stored in your browser.
- **NFT Collection** — Shows the TOW NFT collection with a gallery.
- **Official Links** — One page with all important TOW links (DEX, Telegram, NFT marketplace, etc.).

---

## How to Run This Site on Your Computer

### Step 1: Install Node.js

Node.js is the software that runs this website on your computer.

1. Go to [nodejs.org](https://nodejs.org/)
2. Click the **LTS** (Long Term Support) button to download
3. Run the installer and follow the prompts
4. To check it worked, open **Command Prompt** or **PowerShell** and type:

node --version

You should see a number like `v20.x.x`.

### Step 2: Get the Project Files

1. Go to the GitHub repo: `github.com/cryptoon589/tow-website`
2. Click **Code** → **Download ZIP**
3. Extract the ZIP to a folder on your computer

### Step 3: Install Dependencies

Open **Command Prompt** or **PowerShell**, go to the project folder, and run:

npm install


This downloads all the tools the website needs. You only do this once.

### Step 4: Start the Website

Run:

npm run dev


You'll see `Local: http://localhost:3000`. Open that URL in your browser.

To stop it, press **Ctrl+C** in the terminal.

---

## How to Deploy Updates to the Live Website

The live site is on **Vercel**. Every time you push changes to GitHub, Vercel automatically updates the live site.

### To Make an Update:

1. **Make your changes** (edit files)
2. Open **Command Prompt** or **PowerShell** in the project folder
3. Run:

git add . git commit -m "describe what you changed" git push


Vercel will detect the push and redeploy automatically.

---

## How to Edit the Website

### Change Homepage Text (Headlines, Buttons, Descriptions)

**File:** `config/site.ts`

Open this file in any text editor.

- **Hero headline** — Look for `heroHeadlines`. Change the quoted strings.
- **Hero subtitle** — Change `heroSubtext`.
- **Navigation labels** — Edit `navItems`.
- **Official links** — Edit `officialLinks`. Each link has a `label`, `url`, and `description`.
- **Tired button responses** — Edit `tiredResponses`.

Save the file, then `git add .`, `git commit`, `git push`.

---

### Change the Logo

**File:** `public/assets/logo/tow-logo.svg`

Replace this file with your own logo.

---

### Change the Hero Image

**File:** `public/assets/characters/hero.png`

Replace this image. Recommended size: **600x600 pixels**.

---

### Change Meme Templates

**File:** `config/memeTemplates.ts`

To add a new template:

1. Add your image to `public/assets/memes/templates/your-template.png`
2. Add a new entry to the `memeTemplates` array in `config/memeTemplates.ts`:

```typescript
{
  id: "my-new-template",
  name: "My New Template",
  imagePath: "/assets/memes/templates/my-new-template.png",
  width: 600,
  height: 600,
  textFields: [
    { id: "top", label: "Top Text", defaultText: "TOP TEXT", x: 300, y: 80, maxWidth: 560, align: "center" },
    { id: "bottom", label: "Bottom Text", defaultText: "BOTTOM TEXT", x: 300, y: 540, maxWidth: 560, align: "center" },
  ],
}

What each field means:

    id — Unique name (no spaces)
    name — What users see
    imagePath — Where the image is
    width / height — Image size in pixels
    textFields — Where text appears:
        x — Horizontal position (0 = left, 600 = right)
        y — Vertical position (0 = top, 600 = bottom)
        align — "center", "left", or "right"

Change Featured Memes

File: config/featuredMemes.ts

Add or remove entries. Put images in public/assets/memes/featured/.
Change Official Links

File: config/site.ts

Edit the officialLinks array. Each link has label, url, and description.
Image & Asset Guide
Where Images Are Stored
Folder	What Goes Here
public/assets/logo/	TOW logo
public/assets/characters/	Character images (hero)
public/assets/memes/templates/	Meme templates
public/assets/memes/featured/	Featured meme gallery
public/assets/nft/	NFT images
Recommended Image Sizes

    All images: 600x600px, PNG format
    Keep under 500KB each

Project Structure

tow-website/
├── app/              # Pages (homepage, meme generator, etc.)
├── components/       # Reusable sections (header, footer, etc.)
├── config/           # Easy-to-edit settings (text, links, templates)
├── public/assets/    # All images
└── package.json      # Project settings

Most changes: Edit files in config/ (text/links) or public/assets/ (images).
Common Tasks
Change Homepage Headline

    Open config/site.ts
    Find heroHeadlines
    Change the text
    Save, git add ., git commit -m "changed headline", git push

Add a New Meme Template

    Save image to public/assets/memes/templates/my-template.png
    Add entry to config/memeTemplates.ts
    Save, commit, push

Update Official Links

    Open config/site.ts
    Edit officialLinks
    Save, commit, push

Troubleshooting
Site Doesn't Update

    Refresh browser with Ctrl+F5
    Check git status — should say "nothing to commit"
    Check vercel.com/dashboard for deployment status

Build Fails

    Check the error message
    Common cause: syntax error in a config file (missing comma or quote)
    Revert your last change and try again

Future Expansion

These features are not built yet but can be added:

    Leaderboard — Needs a database (Supabase/Firebase)
    Wallet Connect — Add to header using XRPL wallet SDK
    Community Meme Gallery — New page with submission form
    NFT Holder Perks — Check wallet for TOW NFT ownership
