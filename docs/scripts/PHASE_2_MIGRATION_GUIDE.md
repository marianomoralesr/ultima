# Phase 2: Navigation & Layout Migration Guide

## Overview
Phase 2 introduces completely redesigned Header, Dashboard Layout, and navigation components that match the professional shadcn/ui dashboard examples.

## New Components Created

### 1. HeaderNew.tsx
**Location:** `src/components/HeaderNew.tsx`

**Features:**
- Clean, modern header design matching shadcn examples
- Responsive mobile menu using Sheet component
- User dropdown menu with avatar
- Notifications bell icon (ready for implementation)
- Search bar integration
- MegaMenu support
- Sticky positioning

**Key Improvements:**
- Uses shadcn Sheet for mobile navigation (slides from left)
- Dropdown menu with proper user info display
- Better mobile responsiveness
- Cleaner visual hierarchy

### 2. DashboardLayoutNew.tsx
**Location:** `src/components/DashboardLayoutNew.tsx`

**Features:**
- Fixed sidebar navigation (desktop)
- Breadcrumb navigation at top
- User profile card in sidebar
- Mobile bottom navigation bar
- Role-based navigation items (Admin, Sales, Regular users)
- Active link highlighting
- Professional spacing and layout

**Key Improvements:**
- Full-height sidebar with better organization
- Breadcrumbs for navigation context
- Separated primary and secondary navigation
- Mobile-first responsive design
- Consistent with shadcn dashboard examples

### 3. DashboardExample.tsx
**Location:** `src/pages/DashboardExample.tsx`

**Features:**
- Complete dashboard page example
- Stats cards grid (4 columns responsive)
- Recent applications table
- Recent sales list
- Additional metric cards
- Tabbed interface (Overview, Analytics, Reports)
- Real-world layout patterns

**Components Used:**
- StatsCard (redesigned)
- Card, CardHeader, CardTitle, CardDescription, CardContent
- Table components
- Badge for status indicators
- Avatar for user representation
- Tabs for view switching
- Button components

## New Shadcn Components Added

### Sheet Component
**File:** `src/components/ui/sheet.tsx`

A slide-over panel component perfect for mobile menus and side panels.

**Usage:**
```tsx
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

<Sheet>
  <SheetTrigger asChild>
    <Button>Open Menu</Button>
  </SheetTrigger>
  <SheetContent side="left">
    <nav>Navigation content here</nav>
  </SheetContent>
</Sheet>
```

**Props:**
- `side`: "top" | "right" | "bottom" | "left" (default: "right")

### Breadcrumb Components
**File:** `src/components/ui/breadcrumb.tsx`

Professional breadcrumb navigation.

**Usage:**
```tsx
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/">Home</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>Settings</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>
```

## Migration Steps

### Step 1: Test New Components (Current State)

The new components are created alongside existing ones with "New" suffix:
- `Header.tsx` → `HeaderNew.tsx` (new version)
- `DashboardLayout.tsx` → `DashboardLayoutNew.tsx` (new version)

**To test the new design:**

```tsx
// In your router/app configuration
import HeaderNew from './components/HeaderNew';
import DashboardLayoutNew from './components/DashboardLayoutNew';

// Temporarily swap components to test
<HeaderNew />  // Instead of <Header />
<DashboardLayoutNew />  // Instead of <DashboardLayout />
```

### Step 2: Update Routes to Use Example Dashboard

Add the example dashboard to your routes:

```tsx
// In your router configuration
import DashboardExample from './pages/DashboardExample';

// Add route
<Route path="/escritorio/example" element={<DashboardExample />} />
```

Then visit `/escritorio/example` to see the full redesigned dashboard.

### Step 3: Gradual Migration

Once tested and approved:

1. **Backup existing components:**
   ```bash
   mv src/components/Header.tsx src/components/Header.old.tsx
   mv src/components/DashboardLayout.tsx src/components/DashboardLayout.old.tsx
   ```

2. **Rename new components:**
   ```bash
   mv src/components/HeaderNew.tsx src/components/Header.tsx
   mv src/components/DashboardLayoutNew.tsx src/components/DashboardLayout.tsx
   ```

3. **Update imports throughout codebase** (if component names changed)

4. **Test all routes** to ensure everything works

5. **Remove old components** once migration is complete

### Step 4: Update Existing Dashboard Pages

Use the `DashboardExample.tsx` as a template to update your existing dashboard pages:

**Pattern to follow:**
```tsx
import StatsCard from '../components/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

// 1. Stats Grid (responsive 4 columns)
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
  <StatsCard {...} />
  <StatsCard {...} />
  <StatsCard {...} />
  <StatsCard {...} />
</div>

// 2. Main Content (7-column grid for flex layouts)
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
  <Card className="lg:col-span-4">
    {/* Main content (wider) */}
  </Card>
  <Card className="lg:col-span-3">
    {/* Sidebar content (narrower) */}
  </Card>
</div>
```

## Design System Patterns

### Layout Grid

Following shadcn examples, use this grid system:

```tsx
{/* 4-column stats grid */}
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
  {/* Stats cards */}
</div>

{/* 7-column content grid (4+3 split common) */}
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
  <Card className="lg:col-span-4">{/* Main */}</Card>
  <Card className="lg:col-span-3">{/* Side */}</Card>
</div>

{/* 3-column grid */}
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
  {/* Cards */}
</div>
```

### Spacing System

- Page wrapper: `className="flex-1 space-y-4 md:space-y-8"`
- Card spacing: `className="grid gap-4"`
- Content padding: `className="p-4 sm:px-6"`

### Typography

- Page title: `className="text-3xl font-bold tracking-tight"`
- Card title: `className="text-lg font-semibold"` (or use CardTitle)
- Description: `className="text-sm text-muted-foreground"`
- Labels: `className="text-sm font-medium"`

### Colors

Use semantic color classes:
- Text: `text-foreground`, `text-muted-foreground`
- Backgrounds: `bg-background`, `bg-muted`, `bg-card`
- Borders: `border-border`
- Primary actions: `bg-primary`, `text-primary-foreground`
- Destructive: `text-destructive`, `bg-destructive`

## Component Comparison

### Header Changes

| Old Header | New HeaderNew |
|------------|---------------|
| Custom dropdown with state | shadcn DropdownMenu component |
| Mobile menu with overlay | Sheet component (slide-in) |
| Manual avatar styling | Avatar component |
| Custom button styles | Button component variants |
| Fixed height header | Flexible height with consistent padding |

### DashboardLayout Changes

| Old Layout | New DashboardLayoutNew |
|------------|----------------------|
| Collapsible sidebar | Fixed sidebar (desktop) |
| No breadcrumbs | Breadcrumb navigation |
| Basic nav items | Role-based navigation |
| Simple mobile menu | Bottom nav bar (mobile) |
| No user profile card | Profile card in sidebar |

## Testing Checklist

- [ ] Header displays correctly on desktop
- [ ] Mobile menu (Sheet) slides in from left
- [ ] User dropdown menu works
- [ ] Breadcrumbs generate correctly
- [ ] Sidebar navigation highlights active routes
- [ ] Mobile bottom nav shows on small screens
- [ ] All navigation links work
- [ ] User avatar shows correct initials
- [ ] Stats cards display properly
- [ ] Tables render correctly
- [ ] Tabs switch views
- [ ] Responsive layouts work (mobile, tablet, desktop)
- [ ] Dark mode support (if enabled)

## Troubleshooting

### Issue: Components not importing

**Solution:** Ensure all dependencies are installed:
```bash
npm install @radix-ui/react-dialog
```

### Issue: Styles not applying

**Solution:** Check that Tailwind config includes the component paths:
```js
// tailwind.config.js
content: [
  "./src/**/*.{js,ts,jsx,tsx}",
],
```

### Issue: Breadcrumbs not generating

**Solution:** Check that navigation items in `DashboardLayoutNew.tsx` match your route structure.

### Issue: Mobile menu not appearing

**Solution:** Ensure Sheet component is properly imported and `@radix-ui/react-dialog` is installed.

## Next Steps

After migrating Header and Layout:

1. **Update individual dashboard pages** to use new card layouts
2. **Implement real data** in DashboardExample template
3. **Add charts** using Recharts with shadcn styling
4. **Create form pages** using shadcn form components
5. **Add loading states** and skeletons
6. **Implement error boundaries**

## Support

For questions or issues:
1. Check `SHADCN_DESIGN_SYSTEM.md` for general design system info
2. Review shadcn documentation: https://ui.shadcn.com
3. Refer to `DashboardExample.tsx` for implementation patterns
