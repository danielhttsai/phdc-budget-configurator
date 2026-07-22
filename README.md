# PHDc Multi-Country RWD Budget Configurator

An interactive preliminary budget for the PHDc multi-country real-world data programme.
Tick the databases in scope; the contract value updates live.

**Live page:** https://danielhttsai.github.io/phdc-budget-configurator/ (password required)

## Password protection

This repository is public so that GitHub Pages can serve the page, so the page itself is
encrypted. `PHD-budget-configurator.html` contains nothing but an unlock screen and a block of
ciphertext. The browser derives a key from the password with PBKDF2-SHA256 (600,000 iterations)
and decrypts with AES-256-GCM, entirely on the client. Without the password the published file
is noise.

The readable page lives at `src/app.html` and is **git-ignored on purpose**. It never enters the
repository.

## Editing

1. Edit `src/app.html`.
2. Re-encrypt: `node build.js "<password>"`
3. Commit and push `PHD-budget-configurator.html`. Pages rebuilds in a minute or two.

Skipping step 2 publishes an unchanged page, so it is worth checking the printed byte count.

To change a price, a database profile or a credit, edit the `ITEMS` and `BUNDLES` arrays near
the top of the `<script>` block in `src/app.html`. Everything else is derived from them.

## What the page does

- Eight databases across Taiwan, Korea, Japan, Hong Kong and Thailand, each with an
  AsPEN-style profile (coverage, start year, data types) and a note on what the figure covers.
- Automatic shared-work credits: where two databases in the same country are both selected,
  the study design, variable harmonisation, programming and QC that would otherwise be counted
  twice are credited back.
- Two fee layers expressed as **shares of the total contract value**, applied by gross-up:

  ```
  subtotal = direct   / (1 − 0.18)     central scientific and network coordination
  total    = subtotal / (1 − 0.20)     institutional indirect costs
  ```

  Equivalently `total = direct ÷ 0.656`. Quoting these as mark-ups on direct cost instead
  (`× 1.18 × 1.20`) would deliver only 15.25% and 16.7% of the contract value, and the shortfall
  would come out of the direct research budget.
- Auto-generated proposal paragraph, clipboard and JSON export, and a print stylesheet that
  flattens the page into a one-page quotation sheet.

Append `#admin` to the URL for an internal panel that unlocks the two percentages, toggles the
shared-work credits, and compares the gross-up basis against a mark-up basis. Do not hand that
form of the link to a sponsor.

## Files

| File | Purpose |
| --- | --- |
| `src/app.html` | The readable page. Git-ignored, single file, logo inlined as a data URI |
| `build.js` | Encrypts `src/app.html` into the published file |
| `PHD-budget-configurator.html` | Built output: unlock screen plus ciphertext |
| `index.html` | Redirect so the repository root serves the configurator |
| `robots.txt` | Keeps the page out of search indexes |

## Status

Figures are a preliminary planning estimate prepared to support trial design and evidence
planning. They are not a binding offer. Final third-party data licensing and extraction charges
are passed through at actual cost, subject to the vendor's quotation and prior sponsor approval.
