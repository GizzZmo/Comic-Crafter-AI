<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Comic Crafter AI

Create a full comic strip from a single idea using Google Gemini. The app guides you through ideation, storyboard creation, image generation, and exporting to PDF/PNG.

View the live AI Studio app: https://ai.studio/apps/drive/1CyieRiFV8bC75PRDk4r_sXfcYU19T6Sc

## Quick start
**Prerequisites:** Node.js 18+ and a Google Gemini API key (access to `gemini-2.5-flash` and `imagen-4.0-generate-001`).

1) Install dependencies  
```bash
npm install
```
2) Add your key to `.env.local`  
```bash
GEMINI_API_KEY=your-key-here
```
3) Run the app  
```bash
npm run dev
```

## How it works
1. **API Key** – enter your Gemini key. It is stored in the browser’s `localStorage` under `comic-crafter-api-key` and never sent elsewhere. Use “Change API Key” in the footer to clear it.
2. **Ideation** – provide a story idea, pick or describe an art style, and optionally add character descriptions. “Suggest …” buttons ask Gemini to add twists, sidekicks, villains, etc.
3. **Storyboard** – Gemini returns a title, cover prompts, and six panels (prompt + dialogue/narration). Review and continue.
4. **Generation** – each prompt is sent to the image model. You can regenerate individual panels and download the finished comic as:
   - PDF page (high or ultra quality)
   - PNG comic strip

## Scripts
- `npm run dev` – start Vite dev server
- `npm run build` – production build
- `npm run preview` – preview production build

## Troubleshooting
- **Invalid or missing images**: regenerate the specific panel and confirm your key has model access.
- **Low-quality export**: choose **Ultra** quality before downloading PDF/PNG.
- **API/auth errors**: update the key in `.env.local`, reload, and use “Change API Key.”

## Documentation
For a detailed walkthrough, tips, and privacy notes, see [docs/USER_GUIDE.md](docs/USER_GUIDE.md).
