---
title: Why I Chose No Framework
date: 2026-01-15
category: Essays
subtitle: On building with just Markdown, a tiny script, and a stylesheet.
---

There's a strong default in web development today: reach for a framework. Static sites get a generator, a dependency tree, a build step with a thousand transitive packages. And then the framework outgrows you.

This blog is my counterpoint. It's a single Node script, one stylesheet, one small script for the theme toggle, and a folder of Markdown files. That's the entire stack. No framework, no bundler, no package manager, no runtime.

> The best tool is the one that disappears entirely — that you stop thinking about, because the thing you're making is what matters.

## What the build actually does

The whole generator fits in one file. It reads the post files, parses a few lines of frontmatter, renders the Markdown, and writes static HTML into a `public/` folder. Then a tiny HTTP server serves that folder. That's it.

```js
// pseudo-code, the real thing is barely longer
const html = renderMarkdown(body);
const page = layout({ title, content: html });
fs.writeFileSync(`public/posts/${slug}.html`, page);
```

The advantages of this approach:

- **Nothing to upgrade.** When dependencies publish breaking changes, there's nothing to break here.
- **Nothing to install.** `node build.js` runs with the standard library alone.
- **It still works in twenty years.** The output is plain HTML and CSS, served by anything.

## When you should *not* do this

Honesty requires the other side. If your blog needs comments, search, tags, or dozens of contributors editing at once, a generator with a community behind it is the right tool. My needs are deliberately small — write, build, publish — so my tools can be too.

The goal isn't purity. It's that the distance between *thought* and *published* should be as short as possible.

---

There's real value in remembering how little software is actually needed to publish words on the internet. A text editor, a folder of files, and a server. Everything else is taste.
