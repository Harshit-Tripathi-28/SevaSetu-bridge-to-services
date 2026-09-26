# SevaSetu Design System & Visual Foundation

This document serves as the developer-facing reference for the SevaSetu design system implemented in UI/UX Part 1.

All components, tokens, and utilities reside in `client/src/` and are built using React, TypeScript, Tailwind CSS, and Lucide React.

---

## 1. Brand & Design Tokens

Design tokens are centralized in [`client/src/lib/tokens.ts`](./src/lib/tokens.ts) and exposed via CSS variables and utility classes in [`client/src/index.css`](./src/index.css).

### 1.1 Color Palette

The color system is designed for a trusted, reliable local service marketplace with accessible contrast (WCAG AA compliant).

| Token Role | Tailwind Class / Variable | Hex Value | Purpose |
| :--- | :--- | :--- | :--- |
| **Primary** | `primary-600` | `#0284c7` | Brand color, primary CTAs, active highlights |
| **Primary Hover** | `primary-700` | `#0369a1` | Interactive hover state for primary elements |
| **Primary Light** | `primary-50` | `#f0f9ff` | Subtle primary backgrounds, active item tints |
| **Secondary** | `secondary-600` | `#475569` | Secondary actions, neutral emphasis |
| **Accent** | `amber-600` | `#d97706` | Star ratings, badges requiring warm attention |
| **Success** | `emerald-600` | `#059669` | Completed status, confirmed states, success feedback |
| **Warning** | `amber-600` | `#d97706` | Pending, caution, required action feedback |
| **Error / Destructive** | `rose-600` | `#dc2626` | Failed status, destructive actions, errors |
| **Neutral 950** | `neutral-950` | `#020617` | High-contrast headings and icons |
| **Neutral 900** | `neutral-900` | `#0f172a` | Primary text |
| **Neutral 600** | `neutral-600` | `#475569` | Secondary text, descriptions |
| **Neutral 400** | `neutral-400` | `#94a3b8` | Muted text, disabled states, placeholders |
| **Neutral 200** | `neutral-200` | `#e2e8f0` | Standard border lines, dividers |
| **Neutral 100** | `neutral-100` | `#f1f5f9` | Light card backgrounds, secondary buttons |
| **Neutral 50** | `neutral-50` | `#f8fafc` | Application canvas background |

### 1.2 Typography Scale

The typography scale uses a clean sans-serif system (`Inter, system-ui, sans-serif`) with structured sizes and line heights.

| Role | Font Size | Line Height | Weight | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Display** | `2.25rem` (36px) | `2.5rem` (40px) | `700` (Bold) | Major hero headings |
| **H1** | `1.875rem` (30px) | `2.25rem` (36px) | `700` (Bold) | Page titles |
| **H2** | `1.5rem` (24px) | `2rem` (32px) | `600` (SemiBold) | Section headers |
| **H3** | `1.25rem` (20px) | `1.75rem` (28px) | `600` (SemiBold) | Subsection titles, card headers |
| **H4** | `1.125rem` (18px) | `1.5rem` (24px) | `600` (SemiBold) | Group titles, small headings |
| **Body Large**| `1.125rem` (18px) | `1.75rem` (28px) | `400` (Regular) | Lead paragraphs |
| **Body** | `1rem` (16px) | `1.5rem` (24px) | `400` (Regular) | Standard body copy |
| **Body Small**| `0.875rem` (14px)| `1.25rem` (20px)| `400` (Regular) | Secondary content, table cells |
| **Caption** | `0.75rem` (12px) | `1rem` (16px) | `400` (Regular) | Timestamps, metadata, hints |
| **Label** | `0.875rem` (14px)| `1.25rem` (20px)| `500` (Medium) | Form field labels |
| **Button** | `0.875rem` / `1rem`| `1.25rem` (20px)| `500` (Medium) | Interactive button labels |

### 1.3 Spacing System

Based on a standardized 4px grid:
- `1` = 4px (`0.25rem`)
- `2` = 8px (`0.5rem`)
- `3` = 12px (`0.75rem`)
- `4` = 16px (`1rem`)
- `6` = 24px (`1.5rem`)
- `8` = 32px (`2rem`)
- `12` = 48px (`3rem`)
- `16` = 64px (`4rem`)

### 1.4 Border Radius

- `sm` (`0.25rem` / 4px): Badges, small tags
- `md` (`0.375rem` / 6px): Form inputs, alerts, standard buttons
- `lg` (`0.5rem` / 8px): Larger interactive controls, small cards
- `xl` (`0.75rem` / 12px): Standard cards, dialog modals, panels
- `full` (`9999px`): Avatars, pills, circular icon containers

### 1.5 Elevation & Shadows

- `none`: Flat surfaces
- `sm`: Subtle borders and default interactive cards (`0 1px 2px 0 rgb(0 0 0 / 0.05)`)
- `md`: Hovered cards and dropdown containers (`0 4px 6px -1px rgb(0 0 0 / 0.1)`)
- `lg`: Popovers and floating menus (`0 10px 15px -3px rgb(0 0 0 / 0.1)`)
- `xl`: Modal dialogs (`0 20px 25px -5px rgb(0 0 0 / 0.1)`)

---

## 2. Reusable UI Components

All components are located in `client/src/components/ui/` and exported via `client/src/components/ui/index.ts`.

### 2.1 Button (`Button.tsx`)
Supports keyboard accessibility, focus rings, loading states, and icon slots.
- **Variants:** `primary`, `secondary`, `outline`, `ghost`, `destructive`, `link`
- **Sizes:** `sm`, `md`, `lg`
- **Props:** `isLoading`, `leftIcon`, `rightIcon`, standard HTML button attributes.

```tsx
import { Button } from '@/components/ui';

<Button variant="primary" size="md">Save Changes</Button>
<Button variant="outline" isLoading>Processing</Button>
```

### 2.2 Form Controls
All inputs support `label`, `helperText`, `error`, `required`, and accessible `aria-*` attributes.

- **`Input`**: Text, password, search, email, etc., with optional `leftIcon` and `rightIcon`.
- **`Textarea`**: Multi-line input with auto-resize support.
- **`Select`**: Dropdown select with options array or React children, custom arrow indicator.
- **`Checkbox`**: Accessible custom-styled checkbox with check indicator.
- **`Radio`**: Accessible custom-styled radio button.

```tsx
import { Input, Textarea, Select, Checkbox } from '@/components/ui';

<Input label="Email Address" placeholder="name@example.com" required helperText="We will never share your email." />
<Select label="Role" options={[{ value: 'user', label: 'User' }, { value: 'admin', label: 'Admin' }]} />
<Checkbox label="Agree to Terms & Conditions" />
```

### 2.3 Card (`Card.tsx`)
Structured composable card system.
- **Components:** `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`
- **Variants:** `default`, `elevated`, `outline`, `interactive`, `subtle`
- **Padding:** `none`, `sm`, `md`, `lg`

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Button } from '@/components/ui';

<Card variant="default">
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Supporting description text</CardDescription>
  </CardHeader>
  <CardContent>Body content goes here.</CardContent>
  <CardFooter>
    <Button size="sm">Action</Button>
  </CardFooter>
</Card>
```

### 2.4 Badge (`Badge.tsx`)
Status indicators with optional dot indicator and custom icons.
- **Variants:** `neutral`, `success`, `warning`, `error`, `info`
- **Sizes:** `sm`, `md`
- **Props:** `withDot`, `icon`

```tsx
import { Badge } from '@/components/ui';

<Badge variant="success" withDot>Active</Badge>
<Badge variant="warning">Pending Review</Badge>
```

### 2.5 Avatar (`Avatar.tsx`)
User/provider avatar with image, fallback initials, or generic icon.
- **Sizes:** `xs` (24px), `sm` (32px), `md` (40px), `lg` (56px), `xl` (80px)
- **Status indicators:** `online`, `offline`, `busy`, `away`

```tsx
import { Avatar } from '@/components/ui';

<Avatar initials="JD" status="online" size="md" />
<Avatar src="/profile.jpg" alt="Profile" size="lg" />
```

### 2.6 Alert (`Alert.tsx`)
Feedback notices for system status.
- **Variants:** `info`, `success`, `warning`, `error`
- **Props:** `title`, `onClose`, `icon` (boolean)

```tsx
import { Alert } from '@/components/ui';

<Alert variant="success" title="Profile Updated">
  Your account details were saved successfully.
</Alert>
```

### 2.7 Loading Patterns (`Spinner.tsx`, `Skeleton.tsx`)
- **`Spinner`**: Animated accessible loading indicator with `role="status"`.
- **`Skeleton`**: Pulsing loading placeholder with `variant="text" | "circular" | "rectangular" | "card"`.

```tsx
import { Spinner, Skeleton } from '@/components/ui';

<Spinner size="md" variant="primary" />
<Skeleton variant="card" className="h-24 w-full" />
```

### 2.8 EmptyState (`EmptyState.tsx`)
Standard layout for empty lists, search results, or pending states.
- **Props:** `icon`, `title`, `description`, `action`, `compact`

```tsx
import { EmptyState, Button } from '@/components/ui';

<EmptyState
  title="No items found"
  description="Try adjusting your search criteria or add a new record."
  action={<Button size="sm">Add Item</Button>}
/>
```

### 2.9 Modal / Dialog (`Modal.tsx`)
Accessible modal overlay dialog with backdrop, escape key handler, focus retention, and scroll lock.
- **Props:** `isOpen`, `onClose`, `title`, `description`, `size`, `closeOnBackdrop`
- **Subcomponent:** `ModalFooter`

```tsx
import { Modal, ModalFooter, Button } from '@/components/ui';

<Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Confirm Action" description="Please review details below.">
  <p className="text-sm text-neutral-600">This action cannot be undone.</p>
  <ModalFooter>
    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
    <Button variant="destructive">Confirm</Button>
  </ModalFooter>
</Modal>
```

---

## 3. Accessibility & Responsive Guidelines

1. **Focus Management:** All interactive elements feature a high-contrast focus outline using `focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2`.
2. **Keyboard Support:** Modals close on `Escape`; buttons, inputs, radios, checkboxes, and selects are fully operable via Tab, Enter, and Spacebar.
3. **Contrast:** Text colors adhere to WCAG 2.1 AA standards with at least 4.5:1 contrast against their respective backgrounds.
4. **Responsive Breakpoints:**
   - `sm`: 640px
   - `md`: 768px
   - `lg`: 1024px
   - `xl`: 1280px
