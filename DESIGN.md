# FleetOps Design System

## 1. Design Tokens

### Colors (Tailwind Palette)
- **Primary Brand**: Slate 900 (`#0f172a`) - Used for headers, heavy backgrounds, text.
- **Accent**: Blue 600 (`#2563eb`) - Primary buttons, links, active states.
- **Secondary**: Emerald 500 (`#10b981`) - Success states, "Go" actions.
- **Warning**: Amber 500 (`#f59e0b`) - Alerts, caution.
- **Danger**: Red 500 (`#ef4444`) - Errors, destructive actions.
- **Surface**: White / Slate 50 (`#f8fafc`) - Cards, backgrounds.

### Typography
- **Font Family**: System UI / Sans-serif (Inter equivalent).
- **H1 (Hero)**: 4xl - 6xl, Bold/ExtraBold.
- **H2 (Section)**: 3xl, Bold.
- **H3 (Card)**: xl, SemiBold.
- **Body**: base (16px), Regular.
- **Caption**: sm (14px) or xs (12px), text-slate-500.

### Spacing
- **Section Padding**: `py-24` (6rem).
- **Card Padding**: `p-6` (1.5rem).
- **Gap**: Standard grid gap `gap-6` or `gap-8`.

### Shadows & Radius
- **Cards**: `rounded-xl`, `shadow-sm`, `border border-slate-100`.
- **Buttons**: `rounded-lg`, `shadow-md` for primary.

## 2. Components

### Button
- **Primary**: Blue background, white text.
- **Secondary**: White background, blue border, blue text.
- **Ghost**: Transparent background, slate text.

### KPI Card
- White background, rounded corners.
- Icon top right with colored background.
- Big number, small label.

### Map Markers
- Custom SVG icons for vehicles.
- Color coding for status (Green=Moving, Yellow=Idle, Grey=Offline).

## 3. Responsive Rules
- **Mobile**: Sidebar becomes hamburger menu drawer. Tables become stacked cards or scrollable.
- **Desktop**: Persistent sidebar. Multi-column grids.

## 4. Accessibility
- All interactive elements must have `aria-label` if text is not descriptive.
- Focus rings enabled for keyboard navigation.
- Color contrast ratios maintained > 4.5:1.
