# Maruf · Sketchbook

A one-page portfolio. Plain HTML, CSS and JavaScript, so there is nothing to install or build.

## See it on your computer

Double-clicking `index.html` works for a quick look. For the full experience (fonts, every image), run a tiny local server from this folder:

```bash
python -m http.server 5173
```

Then open http://localhost:5173.

## Add a new piece

1. Put a cropped photo of the piece in `assets/img/work/`. Two sizes keep the page fast: `name-sm.webp` (about 900px on the long side) and `name-lg.webp` (about 2000px). A plain `.jpg` also works.
2. In `index.html`, copy any `<figure class="work">…</figure>` block in the chapter you want, and change:
   - the file names in `href`, `src` and `srcset`
   - `width` and `height` (the small image's pixel size)
   - `alt` (describe the artwork for people who can't see it)
   - the title and medium in the label under it
3. Update the count next to that chapter in the Contents list near the top.

Placement:
- Portraits and Paintings hang pieces in rows (`<div class="rows__row">`); every piece in a row is shown at the same height. Each piece needs `style="--ar: 0.75"`, its width divided by its height. Wrap two smaller pieces in `<div class="rows__pair">` so they sit side by side on phones.
- Design hangs pieces the same way using `--ar`. The road uses a 12-column grid: `style="--col: 1 / span 5"` means "start at column 1, five columns wide".

## Things to check before sharing

- **Titles.** Portraits are numbered (Sketch 1 to 8). Rename anything else you like in index.html.
- **Media.** The materials ("Graphite on paper", "Acrylic on canvas", "Ink on black card") were read from the photos. Correct any that are wrong.
- **Years.** Years are shown only where they were known: the 2020 date on one sketch, the 2023 Art Fusion banner, and the 2024 publication of *Under the Veil of Metaphors*. Add more if you want them.

## Put it online (free)

Any static host works. The simplest:
- **Netlify Drop:** drag this whole folder onto https://app.netlify.com/drop.
- **GitHub Pages:** push the folder to a repository and turn on Pages in its settings.
- **Vercel:** import the folder as a project, with no build command.

Before uploading, you can leave out the original full-size photos (the `.jpg`, `.png` and `my photo` files in this folder). The site only uses `index.html` and the `assets/` folder.
