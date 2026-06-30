# UI_GUIDELINES.md

> **Design system reference for the User Queries Module.**
> Read this before writing any component. Never invent colors, spacing, or animation timings.
> Match the existing Cogent Assets visual language exactly — the new module should feel like it has always been part of the app.

---

## 1. Color Palette

### Brand Tokens

| Token           | Hex       | Tailwind                          | Usage                                                     |
| --------------- | --------- | --------------------------------- | --------------------------------------------------------- |
| `primary`       | `#0F1A2B` | `bg-slate-900` (custom in config) | Sidebar background, primary buttons, top navigation, logo |
| `primary-hover` | `#1F2A3D` | hover state                       | Hover on primary buttons                                  |
| `accent`        | `#3B82F6` | `bg-blue-500`                     | Links, active states, focus rings, info                   |
| `accent-hover`  | `#2563EB` | `bg-blue-600`                     | Hover on accent buttons                                   |

### Surface Tokens

| Token           | Hex       | Tailwind          | Usage                                    |
| --------------- | --------- | ----------------- | ---------------------------------------- |
| `background`    | `#F9FAFB` | `bg-gray-50`      | Page background                          |
| `surface`       | `#FFFFFF` | `bg-white`        | Cards, drawers, modals                   |
| `surface-alt`   | `#F3F4F6` | `bg-gray-100`     | Alternating table rows, code backgrounds |
| `border`        | `#E5E7EB` | `border-gray-200` | All borders, dividers                    |
| `border-strong` | `#D1D5DB` | `border-gray-300` | Form field borders                       |

### Text Tokens

| Token           | Hex       | Tailwind        | Usage                      |
| --------------- | --------- | --------------- | -------------------------- |
| `text-primary`  | `#1F2937` | `text-gray-800` | Body text, headings        |
| `text-muted`    | `#6B7280` | `text-gray-500` | Captions, labels, metadata |
| `text-disabled` | `#9CA3AF` | `text-gray-400` | Disabled state             |
| `text-inverse`  | `#FFFFFF` | `text-white`    | Text on dark backgrounds   |

### Semantic Tokens (Status / Priority)

| Status        | Light bg        | Text               | Ring               | Dot              |
| ------------- | --------------- | ------------------ | ------------------ | ---------------- |
| `pending`     | `bg-amber-50`   | `text-amber-700`   | `ring-amber-200`   | `bg-amber-500`   |
| `in_progress` | `bg-blue-50`    | `text-blue-700`    | `ring-blue-200`    | `bg-blue-500`    |
| `resolved`    | `bg-emerald-50` | `text-emerald-700` | `ring-emerald-200` | `bg-emerald-500` |
| `rejected`    | `bg-red-50`     | `text-red-700`     | `ring-red-200`     | `bg-red-500`     |

| Priority   | Light bg       | Text              | Ring              |
| ---------- | -------------- | ----------------- | ----------------- |
| `low`      | `bg-gray-50`   | `text-gray-700`   | `ring-gray-200`   |
| `medium`   | `bg-blue-50`   | `text-blue-700`   | `ring-blue-200`   |
| `high`     | `bg-orange-50` | `text-orange-700` | `ring-orange-200` |
| `critical` | `bg-red-50`    | `text-red-700`    | `ring-red-200`    |

---

## 2. Typography

| Element         | Tailwind classes                                                   |
| --------------- | ------------------------------------------------------------------ |
| H1 (page title) | `text-2xl font-semibold text-gray-900`                             |
| H2 (section)    | `text-xl font-semibold text-gray-900`                              |
| H3 (subsection) | `text-lg font-medium text-gray-900`                                |
| Body            | `text-sm text-gray-700`                                            |
| Body-large      | `text-base text-gray-700`                                          |
| Caption / muted | `text-xs text-gray-500`                                            |
| Label           | `text-sm font-medium text-gray-700`                                |
| Button          | `text-sm font-medium`                                              |
| Code / mono     | `font-mono text-xs text-red-700 bg-gray-100 px-1.5 py-0.5 rounded` |

Font family: inherit from existing app — `font-sans` (Inter or system stack).

---

## 3. Spacing & Layout

Use Tailwind defaults consistently:

| Scale           | Use case                       |
| --------------- | ------------------------------ |
| `p-2` (0.5rem)  | Tight padding (badge inner)    |
| `p-3` (0.75rem) | Compact cells                  |
| `p-4` (1rem)    | Card inner padding             |
| `p-6` (1.5rem)  | Page section padding           |
| `gap-2`         | Inline elements (icon + label) |
| `gap-3`         | Form field rows                |
| `gap-4`         | List items                     |
| `gap-6`         | Page sections                  |
| `space-y-4`     | Vertical card stacks           |

### Container Widths

| Layout                    | Max width                                          |
| ------------------------- | -------------------------------------------------- |
| Admin page (main content) | `max-w-7xl`                                        |
| Employee page             | `max-w-6xl`                                        |
| Drawer                    | Fixed `w-[480px]` desktop, `w-full` mobile         |
| Modal                     | `max-w-lg` for forms, `max-w-md` for confirmations |

### Border Radius

- Small (buttons, badges, inputs): `rounded-md` (0.375rem)
- Medium (cards): `rounded-lg` (0.5rem)
- Large (drawers, modals): `rounded-xl` (0.75rem)
- Pills (status badges): `rounded-full`

### Shadows

| Use            | Class                            |
| -------------- | -------------------------------- |
| Card resting   | `shadow-sm`                      |
| Card hover     | `shadow-md`                      |
| Modal / drawer | `shadow-xl`                      |
| Dropdown       | `shadow-lg ring-1 ring-gray-200` |

---

## 4. Animation Patterns (Framer Motion)

### Standard Durations

| Element           | Duration         | Easing                             |
| ----------------- | ---------------- | ---------------------------------- |
| Toast slide-in    | `0.3s`           | spring (damping 25, stiffness 200) |
| Modal/Drawer      | `0.25s`          | spring (damping 25, stiffness 200) |
| Dropdown menu     | `0.15s`          | ease-out                           |
| Tab/filter switch | `0.2s`           | ease-out                           |
| Hover lift        | `0.2s`           | ease-out                           |
| Page entrance     | `0.3s`           | ease-out                           |
| Stagger delay     | `0.05s per item` | —                                  |

### Standard Variants

```typescript
// fade-up entry (use for list items, sections)
const fadeUp = {
	initial: { opacity: 0, y: 10 },
	animate: { opacity: 1, y: 0 },
	exit: { opacity: 0, y: -10 },
	transition: { duration: 0.3, ease: 'easeOut' },
};

// drawer slide from right
const drawerVariants = {
	initial: { x: '100%', opacity: 0 },
	animate: { x: 0, opacity: 1 },
	exit: { x: '100%', opacity: 0 },
	transition: { type: 'spring', damping: 25, stiffness: 200 },
};

// modal fade + scale
const modalVariants = {
	initial: { opacity: 0, scale: 0.95 },
	animate: { opacity: 1, scale: 1 },
	exit: { opacity: 0, scale: 0.95 },
	transition: { duration: 0.2 },
};

// dropdown
const dropdownVariants = {
	initial: { opacity: 0, y: -8, scale: 0.95 },
	animate: { opacity: 1, y: 0, scale: 1 },
	exit: { opacity: 0, y: -8, scale: 0.95 },
	transition: { duration: 0.15 },
};

// card hover lift
const cardHover = {
	whileHover: { y: -2, boxShadow: '0 8px 24px rgba(15, 26, 43, 0.08)' },
	transition: { duration: 0.2 },
};

// badge color transition
const badgeLayout = {
	layout: true,
	transition: { duration: 0.2 },
};

// stagger list
const staggerContainer = {
	initial: 'hidden',
	animate: 'visible',
	variants: {
		visible: { transition: { staggerChildren: 0.05 } },
	},
};

const staggerItem = {
	hidden: { opacity: 0, y: 8 },
	visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};
```

### Pulse on Badge (notification count)

```typescript
<motion.span
  initial={{ scale: 0 }}
  animate={{ scale: 1 }}
  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
  key={count} // re-trigger animation when count changes
>
  {count}
</motion.span>
```

### Reduced Motion

Always respect user preference:

```typescript
import { useReducedMotion } from 'framer-motion';

function Component() {
	const shouldReduceMotion = useReducedMotion();
	const variants = shouldReduceMotion ? {} : fadeUp;
	// ...
}
```

---

## 5. Component Patterns

### Buttons

```tsx
// Primary
<button className="
  inline-flex items-center gap-2
  px-4 py-2
  text-sm font-medium text-white
  bg-slate-900 hover:bg-slate-800
  rounded-md
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
  disabled:opacity-50 disabled:cursor-not-allowed
  transition-colors duration-200
">
  Submit
</button>

// Secondary
<button className="
  inline-flex items-center gap-2
  px-4 py-2
  text-sm font-medium text-gray-700
  bg-white border border-gray-300 hover:bg-gray-50
  rounded-md
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
  transition-colors duration-200
">
  Cancel
</button>

// Danger
<button className="
  inline-flex items-center gap-2
  px-4 py-2
  text-sm font-medium text-white
  bg-red-600 hover:bg-red-700
  rounded-md
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500
">
  Delete
</button>
```

### Inputs

```tsx
<input
	className='
  block w-full
  px-3 py-2
  text-sm text-gray-900
  bg-white border border-gray-300
  rounded-md
  placeholder:text-gray-400
  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
  disabled:bg-gray-50 disabled:text-gray-500
  transition-shadow duration-200
'
/>
```

### Card

```tsx
<motion.div
	whileHover={{ y: -2 }}
	transition={{ duration: 0.2 }}
	className='
    bg-white
    rounded-lg
    border border-gray-200
    shadow-sm hover:shadow-md
    p-4
    cursor-pointer
    transition-shadow
  '
>
	{/* content */}
</motion.div>
```

### Drawer (Side Panel)

```tsx
<AnimatePresence>
	{open && (
		<>
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				className='fixed inset-0 bg-black/30 z-40'
				onClick={onClose}
			/>
			<motion.aside
				initial={{ x: '100%' }}
				animate={{ x: 0 }}
				exit={{ x: '100%' }}
				transition={{ type: 'spring', damping: 25, stiffness: 200 }}
				className='
          fixed top-0 right-0 bottom-0
          w-full md:w-[480px]
          bg-white shadow-xl
          z-50
          flex flex-col
        '
			>
				{/* drawer content */}
			</motion.aside>
		</>
	)}
</AnimatePresence>
```

### Table Row (Alternating)

Match the existing pattern from `Assets.tsx`:

```tsx
<tr
	className='
  even:bg-gray-50/50
  hover:bg-blue-50/50
  cursor-pointer
  transition-colors duration-150
'
>
	<td className='px-4 py-3 text-sm text-gray-700'>...</td>
</tr>
```

### Empty State

```tsx
<div className='flex flex-col items-center justify-center py-16'>
	<div className='w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4'>
		<InboxIcon className='w-8 h-8 text-gray-400' />
	</div>
	<h3 className='text-base font-medium text-gray-900 mb-1'>No queries yet</h3>
	<p className='text-sm text-gray-500 mb-6 text-center max-w-sm'>
		Click "+ New Query" to report an issue or request a new asset.
	</p>
	<button className='...'>+ New Query</button>
</div>
```

### Loading Skeleton (not spinners)

```tsx
<div className='animate-pulse space-y-3'>
	<div className='h-4 bg-gray-200 rounded w-3/4' />
	<div className='h-4 bg-gray-200 rounded w-1/2' />
	<div className='h-20 bg-gray-200 rounded' />
</div>
```

---

## 6. Status Badge Component

```tsx
import { motion } from 'framer-motion';
import type { QueryStatus } from '@/types/queries';

const STATUS_STYLES: Record<
	QueryStatus,
	{ bg: string; text: string; ring: string; dot: string; label: string }
> = {
	pending: {
		bg: 'bg-amber-50',
		text: 'text-amber-700',
		ring: 'ring-amber-200',
		dot: 'bg-amber-500',
		label: 'Pending',
	},
	in_progress: {
		bg: 'bg-blue-50',
		text: 'text-blue-700',
		ring: 'ring-blue-200',
		dot: 'bg-blue-500',
		label: 'In Progress',
	},
	resolved: {
		bg: 'bg-emerald-50',
		text: 'text-emerald-700',
		ring: 'ring-emerald-200',
		dot: 'bg-emerald-500',
		label: 'Resolved',
	},
	rejected: {
		bg: 'bg-red-50',
		text: 'text-red-700',
		ring: 'ring-red-200',
		dot: 'bg-red-500',
		label: 'Rejected',
	},
};

export function StatusBadge({ status }: { status: QueryStatus }) {
	const s = STATUS_STYLES[status];
	return (
		<motion.span
			layout
			transition={{ duration: 0.2 }}
			className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ring-1 ${s.bg} ${s.text} ${s.ring}`}
		>
			<span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
			{s.label}
		</motion.span>
	);
}
```

---

## 7. Priority Badge Component

```tsx
import type { QueryPriority } from '@/types/queries';

const PRIORITY_STYLES: Record<
	QueryPriority,
	{ bg: string; text: string; ring: string; label: string }
> = {
	low: {
		bg: 'bg-gray-50',
		text: 'text-gray-700',
		ring: 'ring-gray-200',
		label: 'Low',
	},
	medium: {
		bg: 'bg-blue-50',
		text: 'text-blue-700',
		ring: 'ring-blue-200',
		label: 'Medium',
	},
	high: {
		bg: 'bg-orange-50',
		text: 'text-orange-700',
		ring: 'ring-orange-200',
		label: 'High',
	},
	critical: {
		bg: 'bg-red-50',
		text: 'text-red-700',
		ring: 'ring-red-200',
		label: 'Critical',
	},
};

export function PriorityBadge({ priority }: { priority: QueryPriority }) {
	const s = PRIORITY_STYLES[priority];
	return (
		<span
			className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ring-1 ${s.bg} ${s.text} ${s.ring}`}
		>
			{s.label}
		</span>
	);
}
```

---

## 8. Timeline Component Spec

```
┌─────────────────────────────────────────────────┐
│  •  Created                                      │  ← system event (gray, italic)
│  │  Aizaz Sadaqat · 2h ago                       │
│  │                                                │
│  •  💬  Aizaz Sadaqat (You)         2h ago      │  ← own message bubble (right-aligned, blue tint)
│  │      "Screen flickers when I open the lid."   │
│  │                                                │
│  •  ⚙️  Status changed: Pending → In Progress    │  ← system event (subtle accent)
│  │      by Sher Ali · 1h ago                     │
│  │                                                │
│  •  💬  Sher Ali (Admin)            1h ago      │  ← other message bubble (left-aligned, gray)
│  │      "Bringing it to the repair vendor."      │
│  │                                                │
│  └─────────────────────────────────────────────  │
│                                                  │
│  [ Write a reply...                  ] [Send ]   │
└─────────────────────────────────────────────────┘
```

Visual rules:

- Vertical connecting line: `border-l-2 border-gray-200`, sits behind each event
- System events: italic, muted, with small icon (⚙️ for status, ➕ for created, 💬 disabled)
- User messages: rounded card with subtle background
  - Own message: `bg-blue-50` if employee viewing own, `bg-slate-50` if admin
  - Other party: `bg-gray-50`
- Author + timestamp above each message block
- Newest message at bottom, auto-scroll on new arrival
- Stagger fade-in on initial load (0.05s delay between items)

---

## 9. Accessibility Checklist

- [ ] All interactive elements reachable by Tab
- [ ] Focus rings visible (use `focus-visible:ring-2 focus-visible:ring-blue-500`)
- [ ] Color is not the only signal for status — always pair with label/icon
- [ ] All icons that act as buttons have `aria-label`
- [ ] Modals trap focus and restore on close
- [ ] Esc closes modals and drawers
- [ ] Status changes announced via `aria-live="polite"` region
- [ ] Form errors associated via `aria-describedby`
- [ ] Color contrast ratio ≥ 4.5:1 for body text, ≥ 3:1 for large text
- [ ] Animations respect `prefers-reduced-motion`

---

## 10. Mobile Breakpoints

Test at these widths:

| Width   | Device      | Considerations                               |
| ------- | ----------- | -------------------------------------------- |
| 360px   | Small phone | Employee portal must remain fully functional |
| 768px   | Tablet      | Admin tables collapse to cards if needed     |
| 1024px+ | Desktop     | Full multi-column layouts                    |

Use Tailwind responsive prefixes: `sm:`, `md:`, `lg:`.

For tables on mobile, prefer horizontal scroll over breaking layout:

```tsx
<div className='overflow-x-auto -mx-4 sm:mx-0'>
	<table className='min-w-full'>...</table>
</div>
```

---

## 11. Icon Library

Use `lucide-react` (already in repo). Standard icon size: `w-4 h-4` for inline, `w-5 h-5` for buttons, `w-6 h-6` for headers.

| Need           | Icon                |
| -------------- | ------------------- |
| Notifications  | `Bell`              |
| New / Add      | `Plus`              |
| Edit           | `Pencil`            |
| Delete         | `Trash2`            |
| Asset          | `Package`           |
| Category       | `Layers`            |
| Comment        | `MessageSquare`     |
| Status changed | `Activity`          |
| Created        | `CirclePlus`        |
| Resolved       | `CheckCircle2`      |
| Rejected       | `XCircle`           |
| In progress    | `Loader2`           |
| Pending        | `Clock`             |
| Attachment     | `Paperclip`         |
| Upload         | `Upload`            |
| Download       | `Download`          |
| Preview        | `Eye`               |
| Send           | `Send`              |
| Close          | `X`                 |
| Filter         | `SlidersHorizontal` |
| Search         | `Search`            |
| Menu / More    | `MoreVertical`      |
| User           | `User`              |

---

## 12. Toast Patterns (react-hot-toast)

Use consistent placement and style:

```tsx
// Success
toast.success('Query submitted successfully', {
	duration: 4000,
	position: 'top-right',
	style: {
		background: '#10B981',
		color: '#fff',
	},
});

// Error
toast.error('Could not delete query — admin has already replied', {
	duration: 5000,
	position: 'top-right',
});

// Custom (for new query notification to admin) — see Phase 8 in IMPLEMENTATION_PLAN.md
```

Global config in `App.tsx`:

```tsx
import { Toaster } from 'react-hot-toast';

<Toaster
	position='top-right'
	toastOptions={{
		duration: 4000,
		style: { fontSize: '0.875rem' },
	}}
/>;
```

---

**Last updated:** June 2026
