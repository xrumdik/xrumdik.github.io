---
title: "Migrating a Website from WordPress to Astro"
date: 2026-10-30
summary: "Website migration, Astro, static site."
---

## About the Project

A corporate website rarely changes, yet it needs constant care: updating WordPress, plugins and themes, keeping an eye on the PHP version, backing up the database. For the website of an engineering design company, with services, a portfolio and a blog in three languages (Russian, English, Kazakh), that is extra workload and extra risk.

The goal was to move the site to a different foundation: ready-made pages instead of building each one on every request. Astro was chosen for this. It builds the site in advance into plain HTML files, and the server delivers only those files to the visitor.

## Migration Without Losses

**Content:** pages, blog posts and portfolio works were moved into Markdown files. Editing a text comes down to changing a file and rebuilding the site, with no admin panel and no database.

**URLs:** the old WordPress addresses did not disappear. Permanent redirects (301) lead from them to the new pages, so visitors arriving from external links or from search do not land on a 404 error. After launch, Search Console showed that the old addresses are handled as redirects.

**Search optimization:** on every build, a sitemap is generated automatically, each page gets a canonical URL, and the language versions are linked to each other (hreflang).

**Three languages:** translations are stored separately from the templates, and the build automatically shows what is still untranslated and what became outdated after the Russian text was edited.

## Speed and Security

**Speed:** WordPress builds every page on request: PHP queries the database, and plugins load their own scripts and styles. In Astro the pages are built in advance, and the visitor receives a ready HTML file, with no database query and no PHP code execution. JavaScript is loaded only where it is needed, and style and script files with a hash in the name can be cached in the browser for a long time.

**Security:** a static website lacks what is usually attacked: an admin login, a database, plugins and scripts on the server. Vulnerabilities in WordPress plugins and themes are irrelevant for such a site: there are none. Requests to .php files are blocked at the server level.

**Checks:** on every change to the project and every Monday, GitHub automatically checks the dependencies for known vulnerabilities, looks for passwords and keys accidentally committed to the code, and applies the project's own rules. Any problems found are fixed with a single dependency update, without touching the running site.

## Comparison with WordPress

WordPress builds a page at the moment of the request; Astro builds it in advance. Everything else follows from this:

| Criterion | WordPress | Astro |
| --- | --- | --- |
| How a page is served | Built on every request (PHP and database) | A ready HTML file |
| What the server needs | PHP, database, plugins | Any web server that can serve files |
| Updates | Core, plugins, themes, PHP | Build tools only, checked automatically |
| Main risks | Plugin vulnerabilities, admin panel compromise | Minimal attack surface |
| Editing texts | In the admin panel, no developer needed | In Markdown files, followed by a rebuild |
| Forms, comments, user accounts | Through plugins | Through external services or custom code |

## Summary

**What became harder:** the site has no admin panel, so edits are made in files and require a rebuild, and forms and comments are added through separate services. For a site whose content changes once every few weeks, this is a reasonable price. For an online store, or a site with daily posts from many authors, the choice would be different.

**Result:** moving to Astro turns the site from a "living" system that needs constant care into a set of ready files: fast, secure and easy to maintain.
