# EViENT Design System

Unified design specifications for consistent UI across User and Admin pages.

---

## Colors

### Primary Palette
| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `primary` | `#1C64F2` | `#1C64F2` | CTA buttons, links, active states |
| `primary-hover` | `#1856d9` | `#1856d9` | Hover states |
| `background` | `#f8f8fc` | `#101022` | Page background |
| `surface` | `#ffffff` | `#1a1a2e` | Cards, modals |
| `input` | `#ffffff` | `#222249` | Form inputs |

### Text Colors
| Token | Light Mode | Dark Mode |
|-------|------------|-----------|
| Default | `slate-900` | `white` |
| Secondary | `slate-500` | `gray-400` |
| Muted | `gray-400` | `gray-500` |

### Semantic Colors  
| Status | Background | Text |
|--------|------------|------|
| Success | `green-100` / `green-900/30` | `green-700` / `green-400` |
| Warning | `amber-100` / `amber-500/20` | `amber-700` / `amber-400` |
| Error | `red-100` / `red-900/30` | `red-700` / `red-400` |
| Info | `blue-100` / `blue-900/30` | `blue-700` / `blue-400` |

---

## Typography

**Font Family:** Inter

| Scale | Size | Weight | Usage |
|-------|------|--------|-------|
| xs | 12px | 400/500 | Badges, captions |
| sm | 14px | 400/500 | Body text, labels |
| base | 16px | 400/500 | Main content |
| lg | 18px | 600 | Subheadings |
| xl | 20px | 700 | Section titles |
| 2xl | 24px | 700 | Page headings |
| 3xl | 30px | 800 | Hero titles |

---

## Components

### Buttons

```html
<!-- Primary -->
<button class="h-10 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-bold transition-colors">
    Primary
</button>

<!-- Secondary -->
<button class="h-10 px-4 rounded-xl bg-gray-200 dark:bg-input-dark hover:bg-gray-300 dark:hover:bg-[#2a2a5a] text-slate-900 dark:text-white text-sm font-bold transition-colors">
    Secondary
</button>

<!-- Outline -->
<button class="h-10 px-4 rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-slate-900 dark:text-white text-sm font-bold transition-colors">
    Outline
</button>

<!-- Ghost -->
<button class="h-10 px-4 rounded-xl hover:bg-gray-100 dark:hover:bg-input-dark text-slate-600 dark:text-gray-300 text-sm font-medium transition-colors">
    Ghost
</button>
```

### Cards

```html
<div class="rounded-2xl bg-surface-light dark:bg-surface-dark shadow-sm border border-gray-200 dark:border-transparent overflow-hidden">
    <!-- Card content -->
</div>
```

### Inputs

```html
<!-- Text Input with Icon -->
<div class="flex items-stretch rounded-xl h-12 border border-gray-200 dark:border-transparent overflow-hidden">
    <div class="flex items-center bg-surface-light dark:bg-input-dark pl-4">
        <span class="material-symbols-outlined text-[20px] text-gray-400">search</span>
    </div>
    <input class="flex-1 bg-surface-light dark:bg-input-dark text-slate-900 dark:text-white px-3 text-sm focus:outline-0 placeholder:text-gray-400" 
           placeholder="Search..." />
</div>
```

### Badges

```html
<!-- Success -->
<span class="px-2.5 py-1 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold">
    Success
</span>

<!-- Warning -->
<span class="px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-semibold">
    Warning
</span>

<!-- Neutral -->
<span class="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-semibold">
    Neutral
</span>
```

### Tables

```html
<div class="rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden">
    <table class="w-full">
        <thead class="bg-gray-50 dark:bg-[#222f49]/50 border-b border-gray-200 dark:border-slate-800">
            <tr>
                <th class="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Header</th>
            </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-slate-800">
            <tr class="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                <td class="px-6 py-4">Content</td>
            </tr>
        </tbody>
    </table>
</div>
```

---

## Layout

### Spacing
- `gap-2` (8px) - Tight spacing
- `gap-4` (16px) - Default spacing
- `gap-6` (24px) - Loose spacing
- `gap-8` (32px) - Section spacing

### Border Radius
- `rounded-lg` - Small elements (badges, small buttons)
- `rounded-xl` - Default (inputs, buttons)
- `rounded-2xl` - Large elements (cards)
- `rounded-3xl` - Hero sections

### Shadows
- `shadow-sm` - Subtle elevation
- `shadow-lg` - Medium elevation
- `shadow-primary/30` - Primary glow effect
