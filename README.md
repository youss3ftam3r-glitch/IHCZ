# IHCZ / InHouseCarbonZ

A work-in-progress interactive automotive showcase exploring 3D presentation, motion, and a minimal visual style for a carbon-fiber body-kit concept.

**[View the live demo](https://ihcz.pages.dev/)**

The project focuses on the web experience around a third-party BMW M4 model: scroll-driven reveals, cursor-responsive movement, lighting, and animated product copy. The car model itself is not original work; see [Asset credits](#asset-credits).

## Features

- A fixed 3D scene behind a scrollable content layer.
- Scroll-driven rotation through front, side, and rear views.
- Smooth cursor-following tilt and subtle position changes, with a reset when the pointer leaves the page.
- Model bounds normalized around a centered pivot, with camera framing that adapts to the viewport.
- Material adjustments, environmental lighting, and timed highlights for matching mesh names.
- Product-copy transitions across a five-viewport-height scroll sequence.

## Stack

React 18, Three.js, React Three Fiber, Drei, and Vite. GSAP is listed as a dependency, but the current scene uses React state and Three.js frame updates for its motion.

## Run locally

Install a current Node.js LTS release, then:

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`). No API keys or backend are required. Google Fonts and the Drei city environment preset require network access.

```sh
npm run build     # Production output in dist/
npm run preview   # Preview the production build
```

For a static host such as Cloudflare Pages, use `npm run build` as the build command and `dist` as the output directory.

## Project layout

```text
src/
  App.jsx                       Scene and content composition
  scenes/CarScene.jsx            Model, camera, lighting, and pointer motion
  components/ScrollCopy.jsx      Scroll progress and product-copy transitions
  components/Nav.jsx             Navigation presentation
  components/SoundToggle.jsx     Audio-control prototype
public/models/m4_placeholder.glb Third-party car model
```

## Current status

This is a visual prototype, not a working store. Navigation links point to `#`, and the shop button has no checkout behavior. The sound control references `/audio/engine-idle.mp3`, which is not included. Mobile navigation, accessibility, loading feedback, and performance still need refinement. The production build currently reports a large JavaScript chunk; the bundled GLB is approximately 22 MB.

## Asset credits

The embedded metadata in `public/models/m4_placeholder.glb` identifies:

- **Model:** BMW M4 Modified Widebody @knitro_builds
- **Creator:** [knitro_builds](https://sketchfab.com/knitro_builds)
- **Source:** [Sketchfab model page](https://sketchfab.com/3d-models/bmw-m4-modified-widebody-knitro-builds-6e325ec23a0f41c08366472b34b8f8c8)
- **License recorded in the asset:** [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/)
- **Presentation changes:** runtime material adjustments, lighting, positioning, scaling, and animation. The GLB file is unchanged.

The earlier site footer named a different creator and license; it has been corrected to match the bundled model's metadata. Third-party assets and dependencies retain their respective licenses. This repository does not grant ownership of BMW branding or imply affiliation with BMW.
