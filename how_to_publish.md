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

