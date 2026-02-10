# UI Flow: Peach Nectar & Ripen Action

## 1. Peach Nectar Notification
**Trigger:** When compatibility score between User and Potential Match is >= 90%.

**Display:**
- **Visual:** High-energy overlay or distinct card styling (Gold/Honey colors).
- **Animation:** Pulse effect to draw attention.
- **Copy:** "Sweet like Nectar! 🍯 You and [Alias] are a [Score]% match."
- **Context:** Displays specific shared attributes (e.g., "You both hate 8 AM lectures but love Suya?").

## 2. Ripen Button Interaction
The "Ripen" action is the core monetization trigger.

**State A: Sufficient Pits (>= 5)**
- **Button Text:** "Ripen Now (5 Pits)"
- **Action:**
  1. User clicks button.
  2. System deducts 5 Pits from balance.
  3. Match card updates immediately:
     - Blurred photo -> Clear photo.
     - Alias -> Real Name.
  4. Notification dismisses.

**State B: Insufficient Pits (< 5)**
- **Button Text:** "Get Pits to Ripen"
- **Action:**
  1. User clicks button.
  2. User is redirected to the `PitStore` screen.
  3. `PitStore` shows options to buy Pits.
  4. After purchase, user can return to `Discover` to complete the Ripen action.

## 3. Post-Ripen View
- **Details Revealed:** Full photo, Real Name.
- **Next Steps:** Option to initiate chat or send a "Wave".
