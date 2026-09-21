# Miaopedia 🐾

A kawaii, Italian-language cat encyclopedia for children. Responsive, keyboard-accessible, and entirely static.

## Explore

- 40 wild species from the IUCN Cat Specialist Group's reference list, plus the domestic cat.
- 45 domestic breeds from the CFA catalog, with coat-length varieties grouped.
- Licensed real photographs, scientific names, origin or habitat, and one short fact per card.
- Search, domestic/wild navigation, and accessible reading dialogs with previous/next navigation.
- An original kitten mascot, self-hosted typography and images, and a full credits panel.
- No accounts, analytics, remote runtime APIs, or paid dependencies.

The species list deliberately follows the CatSG 2017 taxonomy currently presented on its website. It is not a claim to include every recent proposed taxonomic split. Scope and source links are explained in the site.

## GitHub Pages

The complete deployable website is in `dist/`. All paths are relative, so it works on either an account site or a repository site.

1. Create a new repository on the intended GitHub account and push this project to `main`.
2. In **Settings → Pages**, choose **GitHub Actions** as the publishing source.
3. The included **Publish Miaopedia** workflow publishes `dist/`. Run it manually from **Actions** if Pages was enabled after the initial push.

This project has no compilation or installation step. The supplied workflow uses the official GitHub Pages actions.

## Local viewing

Open `dist/index.html`, or serve `dist/` with any static HTTP server. JavaScript must be enabled. The site needs no network connection to show its cat cards; external reference links naturally require one.

## Content and image credits

Each entry in `dist/cats.js` records its source page and image author, original file URL and license. Credits also appear in the site. Photographs retain their individual licenses; WebP conversions and display crops are disclosed.

Nunito is distributed under the SIL Open Font License, included in `dist/assets/OFL-Nunito.txt`. The decorative kitten mascot was generated for this project and is not a factual breed portrait.

Reference date: 20 September 2026.
