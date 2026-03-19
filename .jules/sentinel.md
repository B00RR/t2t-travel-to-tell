
### Date: 2023-10-27
**Title:** Information Disclosure via Raw Database Errors
**Vulnerability:** Raw error messages (e.g., `error.message` from Supabase database requests) were directly surfaced to the user in alerts, potentially exposing database schema, underlying technologies, or sensitive query details.
**Learning:** Never pass internal backend or database error strings directly to UI layers.
**Prevention:** Always log the original error internally (`console.error` or a secure logging service) and display generic, localized error messages (e.g., using `i18n` keys like `day.err_add_failed`) to the user.

**Date**: $(date '+%Y-%m-%d')
**Title**: Information Disclosure via Raw Database Errors
**Vulnerability**: Sensitive backend infrastructure information, SQL query details, or database structure could be exposed to the user if raw database error objects (e.g., `error.message` from Supabase) are passed directly to user-facing UI elements like `Alert.alert`.
**Learning**: Never pass raw error objects or unhandled error messages to user interface elements. This violates security principles around Information Disclosure and could assist attackers in reconnaissance.
**Prevention**: Always log the raw error securely (e.g., via `console.error` on the server/client for debugging) and display generic, non-descript error messages to the user. Maintain context-aware generic errors by utilizing specific conditional checks (like `error.message.includes(...)`) that map to specific, sanitized UX feedback (e.g., localized 'Invalid credentials' messages) without exposing the underlying implementation details.

## 2024-03-19 - [Prevent Information Leakage on DB Errors]
**Vulnerability:** The application handled database insertion errors by directly logging `insertError.message` and exposing it in an Alert to the end user. This could leak raw database structures or context to users, leading to information disclosure.
**Learning:** Raw errors like `insertError.message` should be securely logged internally but never exposed in UI alerts. Generic translation errors should be used instead.
**Prevention:** Avoid interpolating database or internal error messages directly into `Alert.alert` or visible components. Always sanitize or abstract error feedback presented to users.
