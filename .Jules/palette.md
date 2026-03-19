## 2025-05-18 - Missing Accessibility Labels on Icon-Only Buttons
**Learning:** Found an accessibility issue pattern where `TouchableOpacity` elements wrapping only an icon (like Like/Comment/Share/Save) lacked `accessibilityLabel` and `accessibilityRole` attributes. This leaves screen reader users completely in the dark regarding the function of these core social interactions.
**Action:** Always verify that icon-only interactive elements in React Native include `accessibilityRole="button"` and context-aware `accessibilityLabel` (e.g., dynamically handling "Like" vs "Unlike" states).
