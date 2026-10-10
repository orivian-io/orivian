# Lesson narration generator

Creates the narration audio learners hear when they press **Listen**, using
Kokoro, a free open-source voice model that runs on your own computer.
Audio is uploaded to the public `lesson-audio` bucket in Supabase Storage,
so every browser, phone and the future app plays the same files.

## First time

```powershell
cd tools\narration
npm install
```

## Generate

```powershell
npm run generate -- --course cissp                       # every lesson, all 4 voices
npm run generate -- --course cissp --voices af_heart     # just the default voice
npm run generate -- --lesson <lesson-id>                 # one lesson
npm run generate -- --course cissp --dry-run             # write MP3s to .narration-preview, no upload
```

The first run downloads the Kokoro model (~330 MB) once. Re-runs only
generate blocks whose text changed, so run it again after editing lessons.
`--fast` uses a smaller model; `--force` regenerates everything.

Blocks without generated audio still play, using the browser's own voice.

Voices are listed in `lib/narration.ts` (`NARRATION_VOICES`).

## Generate on GitHub instead (recommended)

`.github/workflows/narration.yml` runs the same generator on GitHub's free
servers, split into many parallel jobs, and re-runs nightly to pick up new
or edited lessons. One-time setup: add repository secrets `SUPABASE_URL` and
`SUPABASE_SERVICE_ROLE_KEY` (Settings → Secrets and variables → Actions).
Start a run from Actions → Generate narration → Run workflow.
