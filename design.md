# Snip design system

Visual language borrowed from lovable.dev's *look and feel* (dark, minimal,
warm-glow hero with a pill chat input as centerpiece) — no lovable.dev logo,
name, or copy. Source of truth: paste this file into any future styling
prompt instead of re-describing the system.

## Color

```css
--bg:            #0a0a0c;   /* near-black page background */
--surface:       #17171b;   /* card / table background */
--surface-2:     #1e1e23;   /* hover / input background */
--border:        rgba(255, 255, 255, 0.08);
--border-strong: rgba(255, 255, 255, 0.16);

--text:          #f5f5f7;   /* headings, primary content */
--text-muted:    #9b9ba3;   /* sublines, table headers */
--text-faint:    #6b6b72;   /* placeholders, empty states */

--accent-coral:  #ff6b5e;
--accent-pink:   #ff4fa3;
--accent-orange: #ffab5e;
--accent-gradient: linear-gradient(135deg, var(--accent-coral), var(--accent-pink) 55%, var(--accent-orange));

--danger:        #ff6b6b;
--danger-surface: rgba(255, 107, 107, 0.1);
--success-surface: rgba(255, 107, 94, 0.08);
```

## Glow

A soft, blurred radial wash of the accent gradient spans the **full viewport
width** behind the hero (a fixed, full-width band at the top of the page) —
not confined to the content column, not tiled, not repeated elsewhere:

```css
--glow: radial-gradient(60% 50% at 50% 0%, rgba(255, 107, 94, 0.35), rgba(255, 79, 163, 0.18) 45%, transparent 75%);
```

## Type

```css
--font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, Helvetica, Arial, sans-serif;

--text-hero:  700 clamp(2rem, 5vw, 2.75rem)/1.1 var(--font-sans);  /* letter-spacing: -0.02em */
--text-sub:   400 1.125rem/1.5 var(--font-sans);
--text-body:  400 0.9375rem/1.4 var(--font-sans);
--text-label: 600 0.75rem/1 var(--font-sans);  /* uppercase, letter-spacing: 0.06em */
```

## Spacing

`0.5rem` base unit: `--space-1: 0.5rem`, `--space-2: 1rem`, `--space-3: 1.5rem`,
`--space-4: 2rem`, `--space-5: 3rem`, `--space-6: 4rem`. Generous — err toward
the next size up rather than tight.

## Radius

```css
--radius-sm:   10px;  /* small controls, notices */
--radius-md:   16px;  /* cards */
--radius-pill: 999px; /* the chat-style input */
```

## Border, shadow, focus

```css
--shadow-card: 0 1px 2px rgba(0, 0, 0, 0.4);
--shadow-glow-focus: 0 0 0 1px rgba(255, 107, 94, 0.5), 0 0 32px rgba(255, 79, 163, 0.25);
```

Default border everywhere is `1px solid var(--border)`. Interactive surfaces
brighten to `--border-strong` or the coral focus glow on `:focus-within`, not
on hover — this is a calm, not a bouncy, UI.

## Component mapping

| Snip element | System role |
|---|---|
| `<h1>Snip</h1>` + `.sub` | **Hero.** Centered, `--text-hero` headline over `--text-sub` subline, sitting on `--glow`. |
| URL form | **Chat input.** Full-width pill (`--radius-pill`), `--surface-2` fill, `--border`, input and "Shorten" button fused into one bar, button carries `--accent-gradient`. Focus → `--shadow-glow-focus`. |
| `.result` | Rounded notice, `--success-surface` fill, coral link text. |
| `.error` | Rounded notice, `--danger-surface` fill, `--danger` text. |
| links table | **Card.** `--surface`, `--radius-md`, `--border`, `--shadow-card`; header row uses `--text-label` over `--text-muted`; row dividers are `--border`, no zebra striping. |
