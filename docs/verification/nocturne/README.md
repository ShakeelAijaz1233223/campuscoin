# Nocturne verification evidence

Captured **2026-09-28** in Chromium against the real local Vite → Express → MySQL stack.

- `home.png`, `login.png`: public desktop scenes.
- `dashboard-empty.png`: actual newly registered account with zero financial activity.
- `dashboard.png`, `dashboard-light.png`, `dashboard-mobile.png`: populated desktop, light and 390px mobile.
- `transactions.png`, `budgets.png`, `goals.png`, `bills.png`, `reports.png`, `insights.png`: connected feature screens.
- `settings.png`, `settings-light.png`: account/settings controls in both themes.
- `transaction-dialog-mobile.png`: 390px scrollable dialog, scrolled to its reachable actions.
- `run-results.txt`: final test/build/audit evidence.

**Data provenance:** populated screenshots use synthetic Amina Khan test records
created through actual APIs in the isolated `campuscoin_test` database. They are
not real personal finances, production seed records, app fallback data, or
claims about an existing user's balance. All application financial cards remain
connected to backend responses. Empty states are captured separately.

Full-page captures place viewport-fixed navigation at its original viewport
position; that is a screenshot behavior, not a second in-content navigation bar.
Theme/typography rendering was awaited before capture. These files are review
evidence, not pixel-diff baseline tests or performance measurements.

See [the A–W audit](../../END_TO_END_AUDIT.md) and
[design notes](../../REDESIGN_NOTES.md) for coverage and honest limits. Older files
outside this directory show the previous design.
