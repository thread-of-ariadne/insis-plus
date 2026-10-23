## What and why

<!-- What does this change, and which problem does it solve? Link the issue: Closes #… -->

## Screenshots

<!-- Before / after, light and dark, desktop and phone. Blur personal data. -->

## Checklist

- [ ] Tested on the real InSIS page or a fixture (`test/make_fixture.py`), in Czech and English if the page has both.
- [ ] Light and dark theme, ~1440px, ~1000px and 375px wide.
- [ ] "Classic view" brings the original page back.
- [ ] No form is submitted, no POST request, nothing done on the user's behalf.
- [ ] No request outside `insis.vse.cz`; no new permission (or it is explained below and in the changelog).
- [ ] No snapshots of logged-in pages or other personal data committed.
- [ ] Line added under **[Unreleased]** in `CHANGELOG.md`.
- [ ] `python scripts/check.py` passes.
