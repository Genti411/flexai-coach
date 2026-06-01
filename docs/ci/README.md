# CI / Pages workflow templates

These GitHub Actions workflow files are kept here because the automation token used
to create this repo lacks the `workflow` scope and cannot push to
`.github/workflows/`. To enable them, the repo owner must copy them into place once
(any of these works):

- **GitHub web UI:** Add file -> create `.github/workflows/ci.yml` and
  `.github/workflows/pages.yml`, pasting the contents from this folder; or
- **Locally with a `workflow`-scoped token:**
  ```bash
  mkdir -p .github/workflows
  cp docs/ci/ci.yml .github/workflows/ci.yml
  cp docs/ci/pages.yml .github/workflows/pages.yml
  git add .github/workflows && git commit -m "ci: enable workflows" && git push
  ```
  (Re-authenticate with `gh auth refresh -s workflow` first if needed.)

## ci.yml
Runs `tsc --noEmit` and `npm test` on every push and pull request.

## pages.yml
Publishes the self-contained legal site (`legal-site/`) to GitHub Pages, giving the
privacy policy a public URL for App Store / Play Store submission. After adding it,
enable Pages: **Settings -> Pages -> Source: GitHub Actions**. The privacy policy
URL will then be `https://<owner>.github.io/<repo>/#privacy`.
