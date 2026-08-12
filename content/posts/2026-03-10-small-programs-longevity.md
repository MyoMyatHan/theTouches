---
title: Small Programs, Longevity
date: 2026-03-10
category: Essays
subtitle: Why tiny software outlives the platforms it was born on.
---

There is a category of software that seems to be immortal: small programs that do exactly one thing, run everywhere, and never need upgrading. `grep`. `vi`. `curl`. The humble shell. They outlive the operating systems, languages, and even the companies that gave birth to them.

The pattern is consistent. A small program:

- has no dependencies that can rot
- communicates through simple, stable interfaces (text in, text out)
- solves a problem that will exist as long as computers do
- is boring, and proud of it

That last point matters. The kind of software that gets a rewrite every two years is usually software that was chasing novelty instead of usefulness. Boring tools persist because nobody has a reason to replace them.

## The interface is the longevity

A tool that depends on an API gets retired when the API changes. A tool that depends on *text* gets retired when text goes away. That's a long horizon. Every generation rediscovers what plain text already knew: it's the only format no one needs to migrate.

```
$ echo "still works" | wc -w
3
```

This blog is an attempt to practice that philosophy in miniature. Markdown files, a script, a folder of HTML. No database to migrate, no API to version, no framework to upgrade. If the internet is still using HTTP in fifty years, it will still render — because it never depended on anything more fragile than text and a server.

Not everything should be built this way. But more things should. Small programs, honest interfaces, and a refusal to be impressed by our own complexity.
