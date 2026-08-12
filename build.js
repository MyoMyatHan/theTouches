'use strict';

/*
 * theTouches — static site generator.
 * Zero dependencies: only Node.js built-ins (fs, path).
 *
 * Reads content/ (config.json, index.md, posts/*.md) and writes public/.
 * Run with: node build.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const CONTENT = path.join(ROOT, 'content');
const POSTS = path.join(CONTENT, 'posts');
const SRC = path.join(ROOT, 'src');
const PUBLIC = path.join(ROOT, 'public');

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/* ------------------------------------------------------------------ */
/*  HTML escaping                                                      */
/* ------------------------------------------------------------------ */

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeChar(ch) {
  if (ch === '&') return '&amp;';
  if (ch === '<') return '&lt;';
  if (ch === '>') return '&gt;';
  return ch;
}

/* ------------------------------------------------------------------ */
/*  Inline markdown                                                    */
/* ------------------------------------------------------------------ */

function scanLink(text, i) {
  if (text[i] !== '[') return null;
  const close = text.indexOf(']', i + 1);
  if (close === -1 || text[close + 1] !== '(') return null;
  const label = text.slice(i + 1, close);
  let depth = 0;
  let end = -1;
  for (let k = close + 1; k < text.length; k++) {
    if (text[k] === '(') depth++;
    else if (text[k] === ')') {
      depth--;
      if (depth === 0) { end = k; break; }
    }
  }
  if (end === -1) return null;
  let dest = text.slice(close + 2, end);
  let title = null;
  const tm = /^\s*(.*?)\s+(?:["'])(.*?)(?:["'])\s*$/.exec(dest);
  if (tm) { dest = tm[1]; title = tm[2]; }
  dest = dest.trim();
  if (!dest) return null;
  return { label, dest, title, end: end + 1 };
}

function tryLink(text, i) {
  const s = scanLink(text, i);
  if (!s) return null;
  const titleAttr = s.title ? ` title="${escapeHtml(s.title)}"` : '';
  return {
    html: `<a href="${escapeHtml(s.dest)}"${titleAttr}>${inline(s.label)}</a>`,
    end: s.end,
  };
}

function tryImage(text, i) {
  if (text[i] !== '!' || text[i + 1] !== '[') return null;
  const s = scanLink(text, i + 1);
  if (!s) return null;
  return {
    html: `<img src="${escapeHtml(s.dest)}" alt="${escapeHtml(s.label)}">`,
    end: s.end,
  };
}

function tryEmphasis(text, i, delim) {
  let run = 0;
  while (i + run < text.length && text[i + run] === delim) run++;
  if (run !== 1 && run !== 2) return null;
  const len = run;
  const after = text[i + len];
  if (after === undefined || /\s/.test(after)) return null;
  const close = delim.repeat(len);
  let j = i + len;
  while (j < text.length) {
    const idx = text.indexOf(close, j);
    if (idx === -1) return null;
    if (idx === i + len) { j = idx + len; continue; }
    const before = text[idx - 1];
    if (before !== undefined && /\s/.test(before)) { j = idx + len; continue; }
    const inner = text.slice(i + len, idx);
    if (inner.length === 0 || /^\s|\s$/.test(inner)) { j = idx + len; continue; }
    const tag = len === 2 ? 'strong' : 'em';
    return { html: `<${tag}>${inline(inner)}</${tag}>`, end: idx + len };
  }
  return null;
}

function tryAutolink(text, i) {
  const m = /^<([^ >]+)>/.exec(text.slice(i));
  if (!m) return null;
  const url = m[1];
  const isScheme = /^(https?|ftp|mailto):\/\//.test(url);
  const isEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(url);
  if (!isScheme && !isEmail) return null;
  const href = isEmail && !/^mailto:/.test(url) ? `mailto:${url}` : url;
  return { html: `<a href="${escapeHtml(href)}">${escapeHtml(url)}</a>`, end: i + m[0].length };
}

function inline(text) {
  let out = '';
  let i = 0;
  const len = text.length;
  while (i < len) {
    const ch = text[i];
    if (ch === '\\' && i + 1 < len && '\\`*_[]<>!'.includes(text[i + 1])) {
      out += text[i + 1];
      i += 2;
      continue;
    }
    if (ch === '`') {
      let j = i + 1;
      while (j < len && text[j] === '`') j++;
      const ticks = j - i;
      const close = '`'.repeat(ticks);
      const end = text.indexOf(close, j);
      if (end !== -1) {
        let content = text.slice(j, end).replace(/\n/g, ' ');
        if (content.length > 1 && content.startsWith(' ') && content.endsWith(' ') && content.trim().length > 0) {
          content = content.slice(1, -1);
        }
        out += `<code>${escapeHtml(content)}</code>`;
        i = end + ticks;
        continue;
      }
      out += '`';
      i++;
      continue;
    }
    const img = tryImage(text, i);
    if (img) { out += img.html; i = img.end; continue; }
    if (ch === '[') {
      const link = tryLink(text, i);
      if (link) { out += link.html; i = link.end; continue; }
    }
    if (ch === '*' || ch === '_') {
      const em = tryEmphasis(text, i, ch);
      if (em) { out += em.html; i = em.end; continue; }
    }
    if (ch === '<') {
      const auto = tryAutolink(text, i);
      if (auto) { out += auto.html; i = auto.end; continue; }
    }
    out += escapeChar(ch);
    i++;
  }
  return out;
}

/* ------------------------------------------------------------------ */
/*  Block markdown                                                     */
/* ------------------------------------------------------------------ */

const RE_HR = /^(---|\*\*\*|___)\s*$/;
const RE_ATX = /^(#{1,6})\s+(.*?)\s*#*\s*$/;
const RE_FENCE = /^(```+|~~~+)\s*(\S*)\s*$/;
const RE_UL = /^\s*[-*+]\s+/;
const RE_OL = /^\s*\d+[.)]\s+/;
const RE_BLOCK_START = /^(#{1,6}\s|>|```|~~~|[-*+]\s|\d+[.)]\s)/;

function renderMarkdown(src) {
  const lines = src.replace(/\r\n/g, '\n').split('\n');
  const n = lines.length;
  let html = '';
  let i = 0;

  while (i < n) {
    const line = lines[i];

    const fence = RE_FENCE.exec(line);
    if (fence) {
      const marker = fence[1][0];
      const closeRe = new RegExp('^\\' + marker + '{3,}\\s*$');
      const codeLines = [];
      i++;
      while (i < n && !closeRe.test(lines[i])) {
        codeLines.push(lines[i]);
        i++;
      }
      i++;
      const lang = fence[2] ? ` class="language-${escapeHtml(fence[2])}"` : '';
      html += `<pre><code${lang}>${escapeHtml(codeLines.join('\n'))}</code></pre>\n`;
      continue;
    }

    if (RE_HR.test(line)) {
      html += '<hr>\n';
      i++;
      continue;
    }

    const heading = RE_ATX.exec(line);
    if (heading) {
      const level = heading[1].length;
      html += `<h${level}>${inline(heading[2].trim())}</h${level}>\n`;
      i++;
      continue;
    }

    if (line.startsWith('>')) {
      const quoteLines = [];
      while (i < n && lines[i].startsWith('>')) {
        quoteLines.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      html += `<blockquote>\n${renderMarkdown(quoteLines.join('\n'))}</blockquote>\n`;
      continue;
    }

    if (RE_UL.test(line)) {
      const items = [];
      while (i < n && RE_UL.test(lines[i])) {
        items.push(lines[i].replace(RE_UL, ''));
        i++;
      }
      html += '<ul>\n' + items.map((it) => `  <li>${inline(it)}</li>`).join('\n') + '\n</ul>\n';
      continue;
    }

    if (RE_OL.test(line)) {
      const items = [];
      while (i < n && RE_OL.test(lines[i])) {
        items.push(lines[i].replace(RE_OL, ''));
        i++;
      }
      html += '<ol>\n' + items.map((it) => `  <li>${inline(it)}</li>`).join('\n') + '\n</ol>\n';
      continue;
    }

    if (/^\s*$/.test(line)) {
      i++;
      continue;
    }

    const paraLines = [];
    while (i < n) {
      const l = lines[i];
      if (/^\s*$/.test(l)) break;
      if (RE_BLOCK_START.test(l) || RE_HR.test(l)) break;
      paraLines.push(l);
      i++;
    }
    html += `<p>${inline(paraLines.join(' '))}</p>\n`;
  }

  return html;
}

/* ------------------------------------------------------------------ */
/*  Frontmatter + post loading                                         */
/* ------------------------------------------------------------------ */

function parseFrontmatter(src) {
  const meta = {};
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(src);
  if (m) {
    for (const line of m[1].split(/\r?\n/)) {
      const kv = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
      if (kv) meta[kv[1]] = kv[2].trim();
    }
    return { meta, body: src.slice(m[0].length) };
  }
  return { meta, body: src };
}

function formatDate(d) {
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function formatMonthYear(d) {
  return `${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
}

function loadPosts() {
  const posts = [];
  for (const file of fs.readdirSync(POSTS)) {
    if (!file.endsWith('.md')) continue;
    const src = fs.readFileSync(path.join(POSTS, file), 'utf8');
    const { meta, body } = parseFrontmatter(src);

    const basename = file.replace(/\.md$/, '');
    let slug = basename;
    const datePrefix = /^(\d{4})-(\d{2})-(\d{2})-(.+)$/.exec(basename);
    if (datePrefix) {
      slug = datePrefix[4];
      if (!meta.date) meta.date = datePrefix[1] + '-' + datePrefix[2] + '-' + datePrefix[3];
    }
    if (meta.slug) slug = meta.slug;

    const date = meta.date ? new Date(meta.date + 'T00:00:00') : new Date(0);
    if (Number.isNaN(date.getTime())) throw new Error(`Invalid date in ${file}: ${meta.date}`);

    posts.push({
      slug,
      title: meta.title || basename,
      date,
      dateStr: meta.date || '',
      category: meta.category || '',
      subtitle: meta.subtitle || '',
      body,
      bodyHtml: renderMarkdown(body),
    });
  }
  posts.sort((a, b) => b.date - a.date);
  return posts;
}

/* ------------------------------------------------------------------ */
/*  Page templates                                                     */
/* ------------------------------------------------------------------ */

const FLASH_JS = `(function(){var s=localStorage.getItem('darkMode');var d;if(s!==null){d=s==='true';}else{d=window.matchMedia('(prefers-color-scheme: dark)').matches;}document.documentElement.classList.toggle('u-mode-invert',d);})();`;

function pageShell({ rel, title, description, content }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;0,6..72,700;1,6..72,400;1,6..72,600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${rel}styles.css">
<script>${FLASH_JS}</script>
</head>
<body>
<header class="header">
  <div class="container cc-header">
    <a href="${rel}index.html" class="header-name-link"><h1 class="header-name">${escapeHtml(site.name)}</h1></a>
    <a href="${rel}archive.html" class="header-archive-tag">Archive</a>
    <span class="toggle-switch">
      <input type="checkbox" id="color-mode" name="Color Mode" class="toggle-checkbox">
      <label for="color-mode" class="toggle-label" aria-label="Toggle dark mode"></label>
    </span>
  </div>
</header>
<main class="page-main">
  <div class="container cc-narrow">
${content}
  </div>
</main>
<script src="${rel}main.js"></script>
</body>
</html>
`;
}

function bulletItem(rel, post) {
  return `    <li class="bullet-list_item"><a class="bullet-list_link" href="${rel}posts/${post.slug}.html">${escapeHtml(post.title)}</a></li>`;
}

function buildIndex(site, indexBodyHtml, posts) {
  const sections = [];
  const categories = [...new Set(posts.map((p) => p.category))].filter(Boolean);

  sections.push(`<section>\n${indexBodyHtml}</section>`);

  if (categories.length > 0) {
    for (const cat of categories) {
      const group = posts.filter((p) => p.category === cat);
      sections.push(`<section class="u-mt-sm">\n<h2 class="h3">${escapeHtml(cat)}</h2>\n<ul class="bullet-list">\n${group.map((p) => bulletItem('', p)).join('\n')}\n</ul>\n</section>`);
    }
  } else {
    sections.push(`<section class="u-mt-sm">\n<h2 class="h3">Posts</h2>\n<ul class="bullet-list">\n${posts.map((p) => bulletItem('', p)).join('\n')}\n</ul>\n</section>`);
  }

  return pageShell({
    rel: '',
    title: site.name,
    description: site.description,
    content: sections.join('\n\n'),
  });
}

function buildArchive(site, posts) {
  const years = [...new Set(posts.map((p) => p.date.getFullYear()))];
  const sections = years.map((year) => {
    const group = posts.filter((p) => p.date.getFullYear() === year);
    const items = group.map((p) => {
      return `    <li class="bullet-list_item"><a class="bullet-list_link" href="posts/${p.slug}.html">${escapeHtml(p.title)}</a><span class="bullet-list_year">(${formatMonthYear(p.date)})</span></li>`;
    });
    return `<section class="archive-year">\n<h2 class="h3">${year}</h2>\n<ul class="bullet-list">\n${items.join('\n')}\n</ul>\n</section>`;
  });

  return pageShell({
    rel: '',
    title: `${site.name} — Archive`,
    description: `All posts on ${site.name}.`,
    content: `<h1>Archive</h1>\n${sections.join('\n')}`,
  });
}

function buildPost(site, post) {
  const subtitle = post.subtitle
    ? `<p class="post-subtitle">${inline(post.subtitle)}</p>\n`
    : '';
  const content =
`<article class="rich-text">
  <h1>${escapeHtml(post.title)}</h1>
  ${subtitle}  <div class="post-date">${formatDate(post.date)}</div>
${post.bodyHtml}
</article>`;

  return pageShell({
    rel: '../',
    title: `${site.name} — ${post.title}`,
    description: post.subtitle || `${post.title} by ${site.author}.`,
    content,
  });
}

/* ------------------------------------------------------------------ */
/*  Main                                                               */
/* ------------------------------------------------------------------ */

const site = JSON.parse(fs.readFileSync(path.join(CONTENT, 'config.json'), 'utf8'));

const indexBody = fs.readFileSync(path.join(CONTENT, 'index.md'), 'utf8');
const indexBodyHtml = renderMarkdown(indexBody);

const posts = loadPosts();

fs.rmSync(PUBLIC, { recursive: true, force: true });
fs.mkdirSync(path.join(PUBLIC, 'posts'), { recursive: true });

fs.writeFileSync(path.join(PUBLIC, 'index.html'), buildIndex(site, indexBodyHtml, posts));
fs.writeFileSync(path.join(PUBLIC, 'archive.html'), buildArchive(site, posts));

for (const post of posts) {
  fs.writeFileSync(path.join(PUBLIC, 'posts', `${post.slug}.html`), buildPost(site, post));
}

fs.copyFileSync(path.join(SRC, 'styles.css'), path.join(PUBLIC, 'styles.css'));
fs.copyFileSync(path.join(SRC, 'main.js'), path.join(PUBLIC, 'main.js'));

console.log(`Built ${PUBLIC}`);
console.log(`  - ${posts.length} post(s)`);
console.log(`  - index.html, archive.html, posts/*.html, styles.css, main.js`);
