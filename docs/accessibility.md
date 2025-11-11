# Accessibility & Inclusive Design Notes

## Visual
- Light/dark themes with persistent storage (`ThemeContext`).
- Color-blind friendly overlay adds texture to progress indicators (`html.color-blind` class).
- Minimum contrast ratio of 4.5:1 on primary text/background combinations.

## Audio
- Sound effects and ambient music can be toggled independently from the floating sound card.
- All audio defaults to muted on repeated visits according to last preference (localStorage).

## Keyboard Navigation
- Every interactive element has `:focus` styling and `focus:ring` classes.
- Floating action buttons and menu controls are reachable via tab order.
- Notification dismiss buttons expose `aria-label` for screen readers.

## Screen Readers
- Animated sprites are wrapped in `role="img"` with descriptive `aria-label`.
- Progress bars provide `aria-label` to describe statistic context.
- Offline banner announces limited functionality.

## Testing Checklist
- [x] Tab through dashboard cards in ChromeVox / VoiceOver.
- [x] Confirm color-blind mode using browser simulator.
- [x] Validate ARIA roles via axe DevTools (0 critical issues).

## Verification – 2025-11-11
- VoiceOver confirms new sound effect and ambient toggles expose `aria-pressed` state and descriptive labels.
- `PetBubbleMenu` shortcuts reachable via keyboard (`Shift+F/P/C/R`) and announce help tooltip with `aria-live`.
- Offline fallback page passes axe checks (no color contrast violations, primary landmark present).
- Loading skeletons marked `aria-hidden` while spinner announces `aria-live="polite"` status.
- Theme switch, color friendly textures, and toast dismiss buttons maintain visible focus outlines in both themes.

