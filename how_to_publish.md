# How to publish

## Setup Quarto

Install quarto

https://quarto.org/docs/get-started/

Install extensions

```sh
quarto add quarto-ext/fontawesome
```

# Make edits

Make your edits to local files and save changes.

## Adding photos

Add photos to `poems/images/` straight from your phone, and blur hint photos the usual way with `{.img-blur1}`, `{.img-blur2}` or `{.img-blur3}`. Before committing, shrink them:

```sh
pip install pillow   # first time only
python scripts/optimize_images.py
```

This resizes photos, blurs the tagged hint photos in the file itself (and removes the tag, since the blur is now baked in), compresses map screenshots, and makes a small homepage thumbnail from each poem's `*_map_hint.png`, cropped around the purple trail section. It adds an `image:` line to the poem so the homepage card uses that thumbnail. It skips anything already done, so it's safe to run every time. It overwrites the originals, so keep full-size copies elsewhere if you want them.

Use the `quarto preview` command below to view the output locally. 

```sh
quarto preview
```

# Render 

After you're satisfied with your changes, but before committing changes and publishing, use the `quarto render` command below or the `Render` button in the toolbar to check that everything works (one more time).

The render command below will just render the site. 

The Render button in the toolbar will render the site then attempt to launch a preview window of that rendered site so you can QC it.

```sh
quarto render
```

# Publish - first time

The first time you publish your site, you will have extra steps to get it setup. 

First, save any changes, then commit and push those changes.

## Set up site for publishing

Follow the instructions here: 

https://quarto.org/docs/publishing/github-pages.html#publish-command

Make sure the `.gitignore` file is updated. 

Also make sure the `publish.yml` github action file is added to the `.github` dir.

One key part of the instructions above will be running this command.

```sh
quarto publish gh-pages
```

## Set up domain for publishing

- Add domain to cloudflare
- follow github instructions for creating CNAME records
- *don't* use cloudflare proxy
- Add domain to gh-pages portion of repo settings 

# Publish - every time after first time

After the initial publish is configured, any edits you make to the files in the main branch should trigger an automatic re-render and publish on github (no need to republish yourself). 

You can either make edits in your desktop IDE, then commit and push those changes, or you can make edits directly to the files in github through the browser


# Offline app

The site works offline and can be installed on a phone's home screen. Nothing needs updating by hand: after every render (local or on GitHub), `pwa/build_offline.py` reads the built site and writes `manifest.webmanifest` (app name, description, colour, icons) and `sw.js` (the offline helper, with the list of every file to save). New poems and images are included automatically, and visitors' phones download only what changed.

- The app name and description come from `website.title` and `website.description` in `_quarto.yml`; the colour comes from the theme.
- App icons, the navbar logo, favicon and link-preview image are all made from `brand/logo_master.png` by `scripts/optimize_images.py`.
- While running `quarto preview`, offline mode is switched off so you always see fresh pages. To test it locally, open any page with `?offline-test` added to the address (and `?offline-test=off` to switch it off again), then turn off the network in the browser's developer tools.

# Look and extras

- **Colours and font:** `theme.scss` sets the site's blue (dark enough to read easily) and loads the Source Sans Pro font from the `fonts/` folder instead of from Google, so it also works offline.
- **Photos:** tapping a photo opens it in a zoomable viewer (`lightbox: auto` in `_quarto.yml`). Images that link somewhere else, like the maps, keep their links. To stop a particular image from zooming, add `.nolightbox` to it, e.g. `![](image.jpg){.nolightbox}`.
- **"I found it!" and "Share" buttons:** added to the bottom of every poem by `trail-nav.lua` and run by `site.js`. Nothing to update by hand: the "2 of 4 D4 poems found" count uses the same poem list as the previous and next links. Found poems are saved only in each visitor's browser.
- **"Install app" button:** shown on the homepage (where the empty `#install-app` section is) by `pwa/offline.js`. Android shows the browser's install prompt; on iPhone the button shows the Share → Add to Home Screen steps.
