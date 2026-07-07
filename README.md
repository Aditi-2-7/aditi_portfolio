# Aditi Tiwari — Portfolio

A cinematic, interactive one-page portfolio built around Aditi's actual work — since her
flagship project is a voice/audio interaction model, the whole site is themed around
"signal": an animated 3D wave-grid in the hero, and a real drag-to-rotate 3D "skills
constellation" (Three.js) instead of static skill bars.

## Files

- `index.html` — page structure and content (all real content, pulled from her resume)
- `style.css` — design system (colors, type, layout, components)
- `script.js` — Three.js scenes, GSAP scroll animations, custom cursor, card tilt, nav rail

## How to view it

Just open `index.html` in any modern browser (Chrome, Edge, Firefox, Safari). No build
step, no install — everything loads from CDN (Three.js, GSAP, Google Fonts).

Note: opening the file directly via `file://` works for everything except the OrbitControls
drag interaction on some browsers due to local module loading quirks — if the skills
constellation doesn't drag-rotate when opened directly, run it through a local server instead:

```bash
# from inside the aditi-portfolio folder
python3 -m http.server 8000
# then open http://localhost:8000 in your browser
```

## Deploying it for real (free options)

- **Vercel / Netlify**: drag-and-drop the whole folder onto their dashboard, or connect a
  GitHub repo — both host static sites free.
- **GitHub Pages**: push this folder to a repo, enable Pages in repo settings, done.

## What's real vs. what's design flourish

Every fact on the page — internships, projects, hackathon results, education, contact
details — comes directly from Aditi's resume. The 3D visuals, animations, and copy framing
are original design work built to present that content, not fabricated achievements.

## Things you could add next

- A proper contact form (needs a backend or a service like Formspree/EmailJS — currently
  the contact links are direct `mailto:`/`tel:` links, which work with zero setup).
- Real GitHub activity via the GitHub API if `github.com/Aditi-2-7` has public repos worth
  surfacing (contribution graph, pinned repos, languages).
- Project screenshots/GIFs/demo videos once available.
