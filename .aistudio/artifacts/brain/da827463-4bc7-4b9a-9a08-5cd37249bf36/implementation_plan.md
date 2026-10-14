# Nexus Core: Passes & RSVP Tracking, Fan Reminders, Supporting Band Claims, and Past Show Search

This update introduces full Pass & RSVP reservation tracking for fans, proactive show reminder notifications, unlinked supporting band profile claiming, and enhanced multi-criteria search and filter controls across past tour dates.

> [!IMPORTANT]
> **User-Confirmed Design Choices**:
> - **Passes & RSVP Tracking + Fan Reminders**: Enabled for upcoming shows. Fans can claim free guest passes or RSVP with automated local reminder state triggers (e.g., 24h before showtime).
> - **Supporting Bands Presentation**: Bands on lineups without active Nexus Core profiles render as styled, high-visibility text pills with a **"Claim Profile"** action badge inviting band managers to activate their official page.
> - **Past Shows Search & Filtering**: Includes a real-time search header filtering archived shows by **Venue Name**, **City/State**, **Year**, or **Tour Title**.

---

## 1. Overview & Core Concept

### What It Does
1. **Passes & RSVP System**: Allows fans to claim Digital Guest Entry Passes or toggle RSVP "Remind Me" status directly on upcoming tour and show dates. Includes a fan pass drawer/modal with pass verification QR/barcode display and local reminder state persistence.
2. **Supporting Bands Claim Pathway**: Formats supporting acts without active Nexus Core profiles with a distinctive dark metallic border and a clean "Claim Profile" pill button that opens a profile creation / claim request modal.
3. **Past Shows Search & Filter**: Adds a real-time filter bar above the Past Shows list allowing fans, bands, and promoters to instantly filter history by city, venue, year, or tour name.

### Target Audience & Value
- **Fans**: Seamlessly save upcoming tour dates to their profile passes list and set automated concert reminders.
- **Bands & Promoters**: Effortlessly track fan interest per date while enabling supporting acts to discover and claim their official band profile on the platform.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Claiming a Pass / RSVP**:
   - User browses upcoming tour/show list $\rightarrow$ Clicks "Get Pass" or "Remind Me" $\rightarrow$ Modal displays Digital Pass with access tier, show details, and reminder toggle $\rightarrow$ Pass is stored in `localStorage` / profile state with an instant confirmation toast.
2. **Claiming a Supporting Band Profile**:
   - User opens event details $\rightarrow$ Sees lineup list $\rightarrow$ Supporting acts without profiles feature a subtle "Claim Profile" badge $\rightarrow$ Clicking opens a streamlined Claim Band Profile drawer pre-filled with the band name.
3. **Filtering Past Shows**:
   - User navigates to Past Shows tab $\rightarrow$ Types query into search input (*e.g., "Reggies" or "2026" or "Vader"*) $\rightarrow$ Show list updates instantly with highlight counts and empty state handling.

### Visual Identity & Theme
- **Color Palette**: Deep dark canvas (`#090A0F`), neon teal accent (`#00FFCC`) for active passes and search highlights, warm amber (`#F59E0B`) for venue markers, and subtle zinc borders (`#27272A`).
- **Typography**: Display headings in `Oswald` / `Plus Jakarta Sans`, tabular numerals for dates and attendance, unboxed metadata with clean typographic separators (`·`).

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Local & State-Driven Pass Persistence**:
  - *Approach*: Persist pass claims and reminder preferences in reactive state synced to `localStorage` (with Supabase schema compatibility).
  - *Why*: Ensures instant zero-latency feedback for fans without requiring complex server worker setups during client simulation.

- **Decision 2: Unlinked Supporting Bands UI**:
  - *Approach*: Render as clean inline text tags with a quiet "Claim Profile" button.
  - *Why*: Maintains lineup clarity while providing an intuitive onboarding hook for new bands joining Nexus Core.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PromoterEventsModal                             │
├───────────────────────────────────┬────────────────────────────────────┤
│         Upcoming Shows            │             Past Shows             │
│  ┌─────────────────────────────┐  │  ┌──────────────────────────────┐  │
│  │   Get Pass / RSVP Handler   │  │  │ Multi-Criteria Search Input  │  │
│  └──────────────┬──────────────┘  │  └──────────────┬───────────────┘  │
│                 │                 │                 │                  │
│                 ▼                 │                 ▼                  │
│     ┌───────────────────────┐     │     ┌────────────────────────┐     │
│     │   FanPassModal &      │     │     │  Filtered Archived     │     │
│     │ Local Notification    │     │     │       Show Cards       │     │
│     └───────────────────────┘     │     └────────────────────────┘     │
└───────────────────────────────────┴────────────────────────────────────┘
```

### Component & State Changes
1. **`PromoterEventsModal.tsx`**:
   - Add `searchQuery`, `yearFilter`, and `typeFilter` state to Past Shows tab.
   - Connect "Get Pass" and "RSVP" buttons on active/upcoming shows to open the pass manager.
   - Update lineup rendering to format non-profile supporting bands with a "Claim Profile" trigger.
2. **`FanPassModal.tsx`**:
   - Build/connect a dedicated modal for displaying digital guest pass passes, pass tier selection, and reminder push toggles.
3. **`ClaimBandModal.tsx`**:
   - Modal pre-populated with the target band name to submit a profile claim or initiate band manager registration.
