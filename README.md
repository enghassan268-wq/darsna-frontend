# درسنا — Public licensed frontend (Phase 6h)

This repo is deployed to GitHub Pages and serves the SuperKey-licensed
copy of the درسنا platform to real browsers. It is generated from
`darsna-baseline-project/project/frontend/` in the main project repo
(`darsna-license-backend`) — see that repo's
`docs/architecture/COMMERCIAL_PLATFORM.md` and
`docs/progress/phase-6b-license-gate-wiring.md` for the full picture.

- `index.html` — the frozen baseline platform (`darsna.baseline.html`),
  unchanged except one added line pointing the License Gate at the real
  deployed backend (`window.DARSNA_LICENSE_API_BASE`).
- `engine/license-gate.js` — talks to the license backend
  (`https://darsna-license-backend.onrender.com`) before the platform
  renders. Fails closed: no active subscription → lock screen, not a
  guess.

**This is not the live public درسنا platform students use today** — that
is still the separate Cowork Artifact
(`https://claude.ai/code/artifact/ab816cd2-7098-4289-8a41-0ddd364e1a1d`).
This repo is the licensed version, kept separate on purpose until the
cutover decision is made deliberately (see the progress doc above).

**Updating this site:** whenever `frontend/darsna.baseline.html` or
`frontend/engine/license-gate.js` change in the main project, copy the
updated file(s) here, re-apply the one `DARSNA_LICENSE_API_BASE` line if
it was overwritten, commit, and push — GitHub Pages redeploys
automatically within a minute or two.
