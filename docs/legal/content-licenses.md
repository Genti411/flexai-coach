# Content License Register

_Last updated: 2026-05-30_

A record of the source and license of every asset and body of content shipped in
FlexAI Coach. Keep this current as content is added (required for copyright
recordkeeping).

## Text content

| Content | Source | License |
|---|---|---|
| Stretch & mobility instructions, names, target muscles, safety notes (`src/core/dataset.ts`) | Original, authored for this app, describing common public-domain movements (e.g., chin tucks, cat-cow, calf stretch) | Original work, owned by Gentian Hoxha. Exercise movements themselves are not copyrightable; the specific wording here is original. |
| Disclaimer, privacy, terms, copyright text (`docs/legal/`, `src/content/legal.ts`) | Original drafts for this app | Original work, owned by Gentian Hoxha (pending attorney review) |

## Media

| Asset | Source | License |
|---|---|---|
| (none bundled in this slice) | Stretch cards use `media_prompt` strings describing AI-generated images to create later; no third-party media is bundled. | n/a |

## Generated media policy

Any media generated from a `media_prompt` must:
- avoid logos, brand names, trademarks, celebrity likenesses;
- avoid imitating any identifiable copyrighted character or artistic style;
- be reviewed and recorded in this register with its generation date, tool, and
  prompt before being bundled.

## Fonts / icons

| Asset | Source | License |
|---|---|---|
| System fonts (`Fonts` in `src/constants/theme.ts`) | OS-provided system fonts | Used under OS license; none bundled |
| Web font CSS variables (`src/global.css`) | CSS variable names only (no font files bundled); falls back to system fonts | No third-party font files shipped |

## Dependencies

Third-party npm packages are used under their respective open-source licenses (see
`package.json` and each package's license). No package's licensed content is
redistributed as app content.
