# theTouches

A minimalist, framework-free static blog. No runtime dependencies — just Node.js built-ins.

Design is modeled after darioamodei.com: Newsreader serif type, a narrow 620px reading column,
thin-underlined links, bulleted post lists, and a light/dark theme toggle.

## Requirements

- Node.js 18+ (any recent version works)

## Quick start

```sh
npm run build   # compile content/ -> public/
npm run serve   # preview at http://localhost:8080
```

## Adding a post

Create a new Markdown file in `content/posts/`. Name it `YYYY-MM-DD-slug.md`.

```markdown
---
title: My First Post
date: 2026-01-15
category: Notes
subtitle: Optional one-line description shown under the title.
---

Post body here. Supports headings, **bold**, *italic*, `inline code`,
[links](https://example.com), fenced code blocks, bullet/numbered lists,
blockquotes, and horizontal rules.
```

- `date` (required, `YYYY-MM-DD`) — controls ordering and the archive year.
- `title` (required)
- `category` (optional) — the homepage groups posts under this heading.
- `subtitle` (optional)

The slug becomes the URL: `public/posts/my-first-post.html`.

## Editing the site

- `content/config.json` — site name (shown in the header wordmark), tagline, meta description.
- `content/index.md` — the intro paragraph on the homepage.
- `src/styles.css` — all design tokens (colors, type scale, layout). Light/dark themes
  are CSS variables flipped by the `.u-mode-invert` class.
- `src/main.js` — theme toggle logic (OS preference + `localStorage`).

## Structure

```
content/           # your content (Markdown + config)
  index.md
  config.json
  posts/
src/               # theme source files (copied verbatim into public/)
build.js           # static site generator
serve.js           # zero-dependency preview server
public/            # generated output — do not edit by hand
```
