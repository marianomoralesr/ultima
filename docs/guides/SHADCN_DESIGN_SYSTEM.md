# Shadcn Design System Implementation

## Overview
This document outlines the implementation of the shadcn/ui design system with a custom color palette for the TREFA Auto Inventory platform.

## Color Palette

### Light Mode
```css
--background: 0 0% 100%;
--foreground: 20 14.3% 4.1%;
--primary: 24.6 95% 53.1%;        /* Vibrant Orange */
--primary-foreground: 60 9.1% 97.8%;
--secondary: 60 4.8% 95.9%;
--secondary-foreground: 24 9.8% 10%;
--muted: 60 4.8% 95.9%;
--muted-foreground: 25 5.3% 44.7%;
--accent: 60 4.8% 95.9%;
--accent-foreground: 24 9.8% 10%;
--destructive: 0 84.2% 60.2%;
--destructive-foreground: 60 9.1% 97.8%;
--border: 20 5.9% 90%;
--input: 20 5.9% 90%;
--ring: 24.6 95% 53.1%;
```

### Dark Mode
```css
--background: 20 14.3% 4.1%;
--foreground: 60 9.1% 97.8%;
--primary: 20.5 90.2% 48.2%;
--primary-foreground: 60 9.1% 97.8%;
--secondary: 12 6.5% 15.1%;
--muted: 12 6.5% 15.1%;
--accent: 12 6.5% 15.1%;
--destructive: 0 72.2% 50.6%;
--border: 12 6.5% 15.1%;
--input: 12 6.5% 15.1%;
--ring: 20.5 90.2% 48.2%;
```

## Installed Components

### Core UI Components
1. **Button** (`src/components/ui/button.tsx`)
   - Variants: default, destructive, outline, secondary, ghost, link
   - Sizes: default, sm, lg, icon
   - Uses primary orange color for default variant

2. **Card** (`src/components/ui/card.tsx`)
   - Components: Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
   - Rounded borders with subtle shadows
   - Supports light/dark modes

3. **Input** (`src/components/ui/input.tsx`)
   - Standard form input with consistent styling
   - Focus ring using primary color

4. **Label** (`src/components/ui/label.tsx`)
   - Form labels with proper accessibility

5. **Select** (`src/components/ui/select.tsx`)
   - Dropdown select component
   - Components: Select, SelectTrigger, SelectContent, SelectItem, SelectLabel, SelectSeparator

6. **Checkbox** (`src/components/ui/checkbox.tsx`)
   - Styled checkbox with primary color

7. **Switch** (`src/components/ui/switch.tsx`)
   - Toggle switch component

8. **Avatar** (`src/components/ui/avatar.tsx`)
   - User avatar with fallback support

9. **Table** (`src/components/ui/table.tsx`)
   - Data table components with proper styling

10. **Dropdown Menu** (`src/components/ui/dropdown-menu.tsx`)
    - Comprehensive dropdown menu system
    - Components: DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator

11. **Dialog** (`src/components/ui/dialog.tsx`)
    - Modal dialogs

12. **Tabs** (`src/components/ui/tabs.tsx`)
    - Tab navigation component

13. **Badge** (`src/components/ui/badge.tsx`)
    - Status badges and labels

14. **Separator** (`src/components/ui/separator.tsx`)
    - Visual dividers

15. **Popover** (`src/components/ui/popover.tsx`)
    - Floating content containers

16. **Radio Group** (`src/components/ui/radio-group.tsx`)
    - Radio button groups

17. **Navigation Menu** (`src/components/ui/navigation-menu.tsx`)
    - Complex navigation menus

## Redesigned Components

### StatsCard (src/components/StatsCard.tsx)
**Improvements:**
- Now uses shadcn Card components
- Added icons for trend indicators (TrendingUp, TrendingDown, Minus)
- Enhanced color variants with dark mode support
- Added optional description field
- Hover effects with shadow transitions
- Better typography hierarchy
- Responsive design

**Usage:**
```tsx
<StatsCard
  title="Total Leads"
  value="1,234"
  change="+12.5% from last month"
  changeType="increase"
  icon={Users}
  color="orange"
  description="Active leads in pipeline"
/>
```

**Available Colors:**
- blue, purple, yellow, green, red, orange

**Change Types:**
- increase (green with up arrow)
- decrease (red with down arrow)
- neutral (gray with minus sign)

## Design Principles

### 1. Consistency
- All components use the same color palette via CSS variables
- Consistent spacing using Tailwind's spacing scale
- Uniform border radius (0.5rem default)

### 2. Accessibility
- Proper focus states with ring styles
- ARIA labels and semantic HTML
- Keyboard navigation support
- Color contrast ratios meet WCAG standards

### 3. Dark Mode Support
- All components support dark mode via CSS variables
- Automatic dark mode detection possible
- Consistent appearance across themes

### 4. Performance
- Components use React.forwardRef for better composability
- Minimal re-renders with proper memoization
- Lazy loading support for heavy components

## Usage Guidelines

### Importing Components
```tsx
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
```

### Using the cn() Utility
The `cn()` utility function combines class names with proper Tailwind precedence:

```tsx
import { cn } from '@/lib/utils';

<div className={cn(
  "base-classes",
  condition && "conditional-classes",
  className // Allow overrides
)}>
  Content
</div>
```

### Color Usage
- **Primary**: Main brand color (orange) - CTAs, important buttons
- **Secondary**: Subtle actions, secondary buttons
- **Muted**: Less important content, helper text
- **Destructive**: Dangerous actions, errors, deletions
- **Accent**: Highlights, active states

## Next Steps

### Components to Redesign
1. **Header** - Use shadcn Button, DropdownMenu, Avatar
2. **DashboardLayout** - Modern layout with better spacing
3. **SidebarContent** - Clean navigation with icons
4. **Forms** - Use shadcn form components throughout
5. **Analytics Panels** - Modern charts and metrics displays
6. **Tables** - Use shadcn Table components for data display

### Recommended Additions
1. **Toast/Sonner** - For notifications
2. **Sheet** - For slide-out panels
3. **Command** - For command palette
4. **Data Table** - Enhanced table with sorting/filtering
5. **Form** - React Hook Form integration

## Resources
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Radix UI Primitives](https://www.radix-ui.com/)
- [Tailwind CSS](https://tailwindcss.com/)

## Migration Path

### Phase 1: Core Components (COMPLETED)
- ✅ Install shadcn/ui dependencies
- ✅ Apply custom color palette
- ✅ Create base UI components
- ✅ Redesign StatsCard

### Phase 2: Navigation & Layout (IN PROGRESS)
- ⏳ Redesign Header component
- ⏳ Update DashboardLayout
- ⏳ Modernize SidebarContent
- ⏳ Update BottomNav

### Phase 3: Forms & Inputs (TODO)
- ⏳ Update all form components
- ⏳ Implement form validation UI
- ⏳ Add form field components

### Phase 4: Data Display (TODO)
- ⏳ Redesign analytics panels
- ⏳ Update tables and lists
- ⏳ Improve charts and metrics

### Phase 5: Polish & Testing (TODO)
- ⏳ Test all components
- ⏳ Ensure accessibility
- ⏳ Performance optimization
- ⏳ Dark mode testing
