

## E-Player Card Dashboard

A new dedicated page displaying player data as futuristic glass-morphism cards with neon borders, QR codes, swipe animations, and status indicators.

---

### New Route

- **URL**: `/e-player-cards`
- **Sidebar**: Add "E-Player Card" menu item under the main navigation (with CreditCard icon)

---

### New Files to Create

#### 1. `src/pages/EPlayerCards.tsx` - Dashboard Page
- Fetches all approved players with their club data from the database
- Search/filter bar (by name, club, position)
- Responsive grid layout on desktop, swipeable carousel on mobile
- Uses Embla Carousel (already installed) for swipe animation between cards

#### 2. `src/components/players/EPlayerCard.tsx` - Individual Card Component

**Glass Card Design:**
- `backdrop-blur-xl bg-white/10 border border-white/20` glass-morphism effect
- Neon border glow based on registration status:
  - Green neon glow = VERIFIED (registration_status = 'approved')
  - Yellow/amber neon glow = PENDING
  - Red neon glow = REJECTED
- Rounded corners with shadow and animation on hover

**Card Layout:**

```text
+----------------------------------+
|  [STATUS TAG]        [QR CODE]   |
|                                  |
|       ( Player Photo )           |
|       (  Circular   )            |
|                                  |
|     PLAYER FULL NAME             |
|     Club Name                    |
|                                  |
|  Position  |  U-XX  |  Flag      |
|                                  |
|  Province Origin                 |
|  PID-XXXXXXXX                    |
+----------------------------------+
```

**Top Section**: Status badge (VERIFIED/PENDING/REJECTED) + dynamic QR code
**Middle Section**: Circular player photo with fallback avatar, full name, club name
**Bottom Section**: Position badge, age category (calculated from DOB: U12/U15/U17/U20/Senior), nationality flag emoji, province, player ID

#### 3. `src/components/players/PlayerQRCode.tsx` - QR Code Component
- Generate QR code dynamically using canvas-based rendering (no extra dependency needed -- use a lightweight inline SVG QR generator or a small utility)
- QR data: URL to player's public profile (`/public/players/{id}`)
- Small size (64x64px) displayed in card corner

---

### Card Data Mapping

| Card Field | Database Source |
|---|---|
| Player Photo | `players.photo_url` |
| Full Name | `players.full_name` |
| Club Name | `clubs.name` (via `current_club_id`) |
| Age Category | Calculated from `players.date_of_birth` (U12/U15/U17/U20/Senior) |
| Player ID | `PID-{players.id.substring(0,8).toUpperCase()}` |
| Province | `players.nik_province` |
| Position | `players.position` (GK/DF/MF/FW) |
| Nationality Flag | Derived from `players.nationality` |
| Status | `players.registration_status` |

---

### Swipe Animation

- Use existing `embla-carousel-react` for mobile swipe
- Desktop: grid layout (3-4 cards per row) with hover scale animation
- Mobile: horizontal carousel with snap-to-card behavior
- Cards animate with `animate-fade-in` and `hover-scale` (existing utilities)

---

### Styling Details

**Neon Border CSS (added to index.css):**
```css
.neon-green { box-shadow: 0 0 15px rgba(34, 197, 94, 0.5), inset 0 0 15px rgba(34, 197, 94, 0.1); border-color: rgb(34, 197, 94); }
.neon-yellow { box-shadow: 0 0 15px rgba(234, 179, 8, 0.5), inset 0 0 15px rgba(234, 179, 8, 0.1); border-color: rgb(234, 179, 8); }
.neon-red { box-shadow: 0 0 15px rgba(239, 68, 68, 0.5), inset 0 0 15px rgba(239, 68, 68, 0.1); border-color: rgb(239, 68, 68); }
```

**Glass background:** Dark gradient background on the page to make glass cards stand out.

---

### Files Modified

1. **`src/App.tsx`** - Add route `/e-player-cards`
2. **`src/components/AppSidebar.tsx`** - Add sidebar menu item
3. **`src/index.css`** - Add neon glow CSS classes

### Files Created

1. **`src/pages/EPlayerCards.tsx`** - Dashboard page
2. **`src/components/players/EPlayerCard.tsx`** - Glass card component
3. **`src/components/players/PlayerQRCode.tsx`** - QR code generator utility

### No Database Changes Required
All data fields already exist in the `players` table.

