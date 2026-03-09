# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install        # install dependencies (first time only)
npm start          # start the Express server at http://localhost:3000
```

No build step, linter, or test runner is configured.

## Git workflow

After every meaningful change, commit and push to GitHub:

```bash
git add <files>
git commit -m "Short, descriptive message explaining what changed and why"
git push
```

- Commit after each logical unit of work (a new feature, a bug fix, a UI change) — don't batch unrelated changes together.
- Write commit messages in the imperative mood: "Add X", "Fix Y", "Remove Z".
- Never leave uncommitted changes at the end of a session.

## Architecture

This is a two-file project:

- **`server.js`** — Express server whose only job is to serve `index.html` as a static file. It also defines a `/api/research` POST endpoint, but **the frontend bypasses it entirely** and calls the Anthropic API directly from the browser using the `anthropic-dangerous-direct-browser-access: true` header. The server endpoint is currently unused.
- **`index.html`** — The entire application: all CSS, HTML, and JavaScript in one file (~1500 lines). No frontend framework; vanilla JS with CDN libraries.

### Frontend structure

The UI is a single-page app with four views toggled by a fixed sidebar. Each view is a `<div class="view" id="*-view">` and only the active one has `display:flex`.

| View | ID | Purpose |
|---|---|---|
| Research | `home-view` | Company search + streaming report + financial chart |
| Meeting Prep | `meeting-prep-view` | Pre-call planning form with AI auto-populate |
| Landscape | `landscape-view` | Existing vendors/systems tables + MEDDICC qualification + Gong post |
| Settings | `settings-view` | API key management + system prompt editor |

### API calls (all from the browser)

1. **Company report** — streams from `https://api.anthropic.com/v1/messages` using SSE; model `claude-sonnet-4-6`, max 2048 tokens. The system prompt is user-editable and stored in `localStorage`.
2. **AI populate (Meeting Prep)** — non-streaming call to the same endpoint; returns JSON with `company_goals`, `challenges`, `questions` fields extracted from the last report.
3. **Companies House** — fetches from `https://api.company-information.service.gov.uk` and `https://document-api.company-information.service.gov.uk` to pull real turnover data for the chart (falls back to hardcoded illustrative figures).
4. **Gong** — POSTs landscape data to a user-configured endpoint using a Bearer token.

### State & persistence

- `lastCompany` / `lastReportMarkdown` — in-memory JS variables; lost on page reload.
- `localStorage` keys:
  - `claude_api_key` — Anthropic API key
  - `claude_system_prompt` — overridden system prompt
  - `ch_api_key` — Companies House API key
  - `meeting_prep_{company_slug}` — per-company meeting prep form data
  - Gong endpoint and token keys managed in Settings view

### CDN dependencies

| Library | Purpose |
|---|---|
| marked.js | Render Claude's Markdown output to HTML |
| lucide | Icon set |
| Chart.js | Financial performance bar/line chart |
| html2pdf.js | Client-side PDF export for all three exportable views |
