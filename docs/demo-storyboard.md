# FBLA Demo Storyboard – Virtual Pet Companion

> Each numbered scene corresponds to a segment in the demo video. Pair with `docs/demo-script.md` for dialogue and timing cues.

| Scene | Visual Focus | Actions & Animations | Narration Highlights | Callouts |
|-------|--------------|----------------------|----------------------|----------|
| 1 | Title card with FBLA + team logo | Fade-in background, animated pet silhouette | "Welcome to Virtual Pet Companion — where pet care meets financial literacy." | Display URL + QR code |
| 2 | Presenter on camera or voice-over | Picture-in-picture, slide overlay with problem statement | "Students need engaging ways to connect daily habits with budgeting." | Problem → Vision icons |
| 3 | App onboarding screen | Screen capture of signup and species selection | "In under a minute, we personalize a pet with name, species, and starter traits." | Highlight accessibility toggle |
| 4 | Dashboard hero view | Animated pet idle loop, stat meters pulsing | "The dashboard keeps hunger, happiness, cleanliness, energy, and health front-and-center." | Show offline banner indicator |
| 5 | Care action modal (Feed) | Click feed button, select item, stats animate upward | "Feeding Luna brings stats back into the green and logs the action in the AI diary." | Overlay tip: cooldown timer |
| 6 | AI Companion drawer | Slide out recommendation cards | "Our AI companion analyzes mood and recommends next steps using Supabase data." | Tag mood icons |
| 7 | Finance screen (Wallet + Shop) | Scroll wallet summary → open shop → purchase item | "Students practice budgeting: earn coins, compare needs vs wants, and review transaction history." | Highlight CSV export |
| 8 | Mini-game showcase | Memory match clip (speed ramp), coins reward popup | "Quick mini-games reinforce focus and deliver rewards that tie back to the economy." | Overlay 'Adaptive Difficulty' |
| 9 | Analytics dashboard | Filter to weekly view, reveal AI insights | "Teachers access analytics for weekly reflections and downloadable CSVs for grading." | Show share/download buttons |
| 10 | Next-Gen Lab | Cycle voice command mock, AR storyboard panels | "Our innovation lab teases voice commands, AR interactions, and weather-aware care loops." | Future roadmap badges |
| 11 | Accessibility spotlight | Toggle high-contrast mode, tab through interface | "Accessibility is built-in: keyboard shortcuts, high contrast themes, and reduced motion modes." | WCAG badge |
| 12 | Closing slide | Logo, team names, thank you message | "Thank you, judges. Scan the QR code for source, docs, and deployment links." | Display feedback prompt |

## Production Notes

- **Capture resolution:** 1920×1080 (16:9) at 30 fps.
- **Transitions:** 0.4 s cross-dissolve between scenes; hold each primary beat for 6–8 seconds.
- **Audio bed:** Light instrumental track mixed at –18 LUFS. Duck to –24 LUFS during narration.
- **Lower thirds:** Introduce each presenter with name and role during scenes 2 and 3.
- **Captions:** Generate `.srt` via `scripts/generate_captions.py` (planned) to meet accessibility expectations.
- **Brand palette:** Use Tailwind theme colors `#2563EB`, `#F97316`, `#111827` for overlays.

## Asset Checklist

- Screen recordings exported as `.mov` or `.mp4`
- Voice-over script from `docs/demo-script.md`
- B-roll GIFs (`frontend/public/assets/demo/`)
- Logo SVG (`frontend/public/logo.svg`)
- Captions + transcript (`docs/demo-transcript.md`, generated post-recording)


