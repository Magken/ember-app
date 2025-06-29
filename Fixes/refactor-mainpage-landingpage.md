# Bolt Refactor Instructions: MainPage.tsx & LandingPage.tsx

## Goal
Refactor the two largest pages (`src/components/MainPage.tsx` and `src/components/LandingPage.tsx`) into smaller, well-named composite daughter components. This will improve maintainability, debugging, and clarity. Ensure all navigation and state logic is preserved and remains seamless.

---

## General Instructions
- **Do NOT change any business logic or UI/UX flow.**
- **Do NOT remove or break any navigation, state, or event handling.**
- **Do NOT change prop or state names unless necessary for clarity.**
- **DO split large render blocks, repeated UI, and logical sections into new, clearly named components.**
- **DO keep all state and navigation logic in the parent page unless it is truly local to a new component.**
- **DO pass only the necessary props to each new component.**
- **DO document each new component with a short comment describing its purpose.**
- **DO ensure all page-level state, navigation, and event handlers remain functional.**

---

## MainPage.tsx Refactor Prompts

### 1. Identify Logical Sections
- Header (user info, settings button, flame icon)
- Main content area (hearth display, chat display)
- Settings modal (profile tab, friends tab, tab navigation)
- Profile tab content (nickname, unique code, password change, account actions)
- Friends tab content (add friend, incoming/outgoing requests)
- Modal overlays and validation messages

### 2. Create Daughter Components
- `MainHeader`
- `HearthDisplay`
- `ChatDisplay`
- `SettingsModal`
  - `ProfileTab`
  - `FriendsTab`
  - `TabNavigation`
- `ValidationMessage`
- Any other repeated or logically grouped UI blocks

### 3. Move Render Logic
- Move all JSX and UI for each section into its new component.
- Pass all required props and callbacks from the parent.
- Keep all navigation and state logic (e.g., `showSettings`, `showChat`, `activeTab`, etc.) in `MainPage.tsx` unless it is only used in a daughter component.
- For modal open/close, tab switching, and chat navigation, ensure all state transitions are preserved.

### 4. Special Care
- **State and Navigation:**
  - All navigation between chat, hearth, and settings must remain seamless.
  - All state updates (e.g., after friend request, profile update) must propagate correctly.
- **Subscriptions and Effects:**
  - Keep all real-time subscriptions, polling, and effect hooks in the parent unless they are only relevant to a daughter component.
- **Validation and Messages:**
  - Validation messages should be handled in the parent and passed down as props.
- **Testing:**
  - After refactor, test all navigation, chat, friend requests, and settings flows.

---

## LandingPage.tsx Refactor Prompts

### 1. Identify Logical Sections
- Hero section (logo, headline, intro, CTA)
- Auth section (sign up/login, tab navigation, forms, validation)
- About section (feature cards, example hearth)
- Stationary ember/flame background systems
- Success/confirmation overlays

### 2. Create Daughter Components
- `HeroSection`
- `AuthSection`
  - `AuthTabs`
  - `SignUpForm`
  - `LoginForm`
  - `ValidationMessage`
- `AboutSection`
  - `FeatureCard`
  - `ExampleHearth`
- `StationaryEmberBackground`
- `StationaryFlameBackground`
- Any other repeated or logically grouped UI blocks

### 3. Move Render Logic
- Move all JSX and UI for each section into its new component.
- Pass all required props and callbacks from the parent.
- Keep all navigation and state logic (e.g., `activeTab`, `success`, `needsEmailConfirmation`, etc.) in `LandingPage.tsx` unless it is only used in a daughter component.
- For tab switching, form submission, and overlays, ensure all state transitions are preserved.

### 4. Special Care
- **State and Navigation:**
  - All navigation between tabs, overlays, and forms must remain seamless.
  - All state updates (e.g., after sign up, sign in, resend confirmation) must propagate correctly.
- **Validation and Messages:**
  - Validation messages should be handled in the parent and passed down as props.
- **Testing:**
  - After refactor, test all navigation, sign up, sign in, and overlay flows.

---

## Final Checklist
- [ ] All new components are in `src/components/` or `src/components/ui/` as appropriate.
- [ ] All navigation and state logic is preserved and functional.
- [ ] All validation and event handling works as before.
- [ ] All UI/UX is unchanged except for improved code structure.
- [ ] All new components are documented with comments.
- [ ] All flows are tested after refactor.

---

**Bolt: Follow these prompts step by step for each page. Do not change any business logic or break navigation. Only split and organize the code for maintainability and easier debugging.** 