## [1.5.3] - 2025-07-21

### 🎨 UI/UX Improvements

- Gallery redesign with **Grid**, **List**, and **Bento** view modes
- Compact cards, gradient accents, emoji complexity/frequency icons
- Hover-lift and 3D card effects, smooth slide-in animations
- Improved dark-mode gradients and category color badges

### 🔍 Search & Filter Enhancements

- Debounced search input to avoid flicker during rapid typing/deleting
- Preserved cursor focus even while data refreshes
- Removed unnecessary loading state to keep controls bar mounted

### ⚡ Performance / DX

- Reduced unnecessary re-renders; list only updates after debounce
- Added Tailwind utility classes (`hover-lift`, `animate-in`, `card-3d-subtle`)
- Updated global CSS for gradientShift animation

### 🐛 Bug Fixes

- Fixed search-bar focus loss when holding Delete
- Eliminated full bar refresh on filter changes

--- 