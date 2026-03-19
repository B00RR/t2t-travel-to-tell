
### Date: 2023-10-27
**Title:** Information Disclosure via Raw Database Errors
**Vulnerability:** Raw error messages (e.g., `error.message` from Supabase database requests) were directly surfaced to the user in alerts, potentially exposing database schema, underlying technologies, or sensitive query details.
**Learning:** Never pass internal backend or database error strings directly to UI layers.
**Prevention:** Always log the original error internally (`console.error` or a secure logging service) and display generic, localized error messages (e.g., using `i18n` keys like `day.err_add_failed`) to the user.
