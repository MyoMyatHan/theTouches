# Myo Myat Han — Portfolio

A minimal, framework-free personal portfolio with a biography, selected work, and links to GitHub and LinkedIn. The layout takes cues from darioamodei.com: Newsreader serif type, generous whitespace, understated links, and a light/dark theme toggle.

## Requirements

- Node.js 18+ (any recent version works)

## Quick start

```sh
npm ci          # install the frontmatter parser
npm run build   # compile content/ -> public/
npm run serve   # preview at http://localhost:8080
```

## Updating the portfolio

Edit the project data and portfolio markup in `build.js` to update the Projects, Blog, Contact, and skills sections. Update `content/config.json` for the site name and description. Blog articles are authored in `content/posts/`.

Update the `courses` array in `content/config.json` for the Currently learning section. Each course has a `title`, an optional `provider` and `currentTopic`, and a `progress` percentage from 0 to 100. Set `progress` to `null` to show “In progress” without a percentage or progress bar. Run `npm run build` after updating course progress.

## Adding a writing page

### Publish from your browser

The `.pages.yml` configuration connects Pages CMS to `content/posts/`.
After the setup changes are committed to GitHub, open https://app.pagescms.org,
select this repository and the `main` branch, and open **Articles**.
Create an article, fill in its title and date, write in the visual editor, and save.
Saving on `main` publishes through the existing GitHub Pages workflow once its build finishes.
Saving is publishing: this configuration does not provide a separate draft state or scheduled publishing.
The article date controls sorting, not whether an article is published.

Upload article images through the editor. They are stored in
`static/images/articles/` and copied into the generated site during the build.
Keep existing filenames when editing articles to preserve their URLs.

### Write a file manually (optional)

Create a Markdown file in `content/posts/`. Name it `YYYY-MM-DD-slug.md`.

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
