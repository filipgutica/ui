# ui taste pass evidence

Before: f18b72748108d57575a88f07ea9578c6bc2d1a36 (original main).
After: eb7175d30b29cea1b3263d6f3ec6a6a6aae934f4.
Captured from the local Vite docs app in Chromium at 1280 x 1000, light and dark.

- docs: real Select component documentation, including shared headings and navigation.
- select: real native picker opened with the keyboard; focused row retains its inset ring.
- select-pointer: picker opened with the pointer, then hovering the Failed row; no hover ring.
- select-placeholder: the playground's Selected value control chooses its empty-value option.
- site: existing consumer-style SitePage fixture, using the shipped styles.
- site-content: commands, definitions, and instructions in the same fixture.
- site-plain: same fixture with --heading-mark: none on its shell, demonstrating the documented identity override.

No screenshot adds navigation or drawn UI. The docs app has no standalone consumer product page, so the existing browser fixture supplies that evidence.
The mockups' DS-3 neutral/sink/link/switch/status values were intentionally excluded.

Verification: lint, themes:check, typecheck, docs:typecheck, 367 unit tests, 84 Playwright tests, build, docs:build, pack dry-run, and publint pass.
Select and site fixture pass the Interface Design display-mode script (4/4 each).
The docs home has pre-existing 200% text overflow: the same mode fails on original main and this commit (3/4 each).
Axe was unavailable because @axe-core/playwright is not installed.
