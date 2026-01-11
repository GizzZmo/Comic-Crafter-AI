# Comic Crafter AI – User & Developer Guide

This guide explains how to run Comic Crafter AI locally, how the workflow is structured, and how to get reliable results from Google Gemini.

## What the app does
- Guides you from **idea → storyboard → final comic images** using Google Gemini (text + image).
- Stores your **Gemini API key in `localStorage`** only in the browser.
- Lets you **regenerate individual panels**, then **export** as a high/ultra-high quality PDF or PNG strip.

## Prerequisites
- Node.js 18+ (recommended by Vite/React 19)
- A Google **Gemini API key** with access to `gemini-2.5-flash` and `imagen-4.0-generate-001`.

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Add your Gemini key to `.env.local` in the project root:
   ```bash
   GEMINI_API_KEY=your-key-here
   ```
   The key is read on the client and cached in `localStorage` under `comic-crafter-api-key`.
3. Start the dev server:
   ```bash
   npm run dev
   ```

## Workflow walkthrough
1. **API key** – enter a valid Gemini key. The app uses `localStorage`; use “Change API Key” in the footer to clear it.
2. **Ideation** – provide a story idea, pick or describe an art style, optionally add character descriptions for visual consistency. “Suggest …” buttons call Gemini to enrich the idea.
3. **Storyboard** – the app asks Gemini for a title, cover prompts, and **6 panels** (prompt + text). You can revise and continue.
4. **Generation** – each cover/panel prompt is sent to `imagen-4.0-generate-001`. You can regenerate any panel, then download:
   - **PDF** (page layout) in high or ultra quality.
   - **PNG strip** of the full comic.

## Tips for better results
- Keep **art style** specific (e.g., “retro sci‑fi pulp with halftone shading”).
- Add **character descriptions** so the model reuses clothing, colors, and props.
- Short, actionable **panel prompts** reduce hallucinations; avoid too many actions in one panel.
- If an image fails, try regenerating once traffic cools down.

## Available scripts
- `npm run dev` – start Vite dev server.
- `npm run build` – production build.
- `npm run preview` – preview the production bundle.

## Troubleshooting
- **401 / “invalid key”**: confirm the key in `.env.local`, reload, and use “Change API Key.”
- **Blank or missing images**: regenerate the specific panel; verify the model access and network calls.
- **Download looks low-res**: choose **Ultra** quality before exporting PDF/PNG.
- **Rate limits**: generation may slow; wait and retry.

## Privacy & data
- The API key never leaves the browser except when calling Gemini.
- Prompts and images are generated client-side; no server state is stored.
