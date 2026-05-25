# PII Inventory and Retention

## Data Inventory

| Data class | Tables / systems | Purpose | Retention |
|---|---|---|---|
| Account identity | `users` | Authentication, profile, support | Account lifetime plus 30-day deletion tombstone |
| Contact data | `users.email`, `users.phone` | Login, notifications, support | Account lifetime plus 30-day deletion tombstone |
| Demographics | `users.date_of_birth`, `users.gender`, `users.country_code` | Learning personalization and reporting | Account lifetime; delete/anonymize on deletion completion |
| Organization membership | `organization_users` | Tenant access and reporting | Account lifetime plus contractual audit period |
| Learning records | `user_course_enrollments`, `user_lesson_progress`, certificates | Progress, compliance, certificates | Contract term plus legal/compliance retention |
| Study planner data | `study_plans`, `study_sessions`, calendar integrations | Planning and scheduling | Account lifetime; delete on deletion completion |
| Assistant conversations | `lia_conversations`, `lia_messages` | Support, learning assistance, quality | 12 months by default unless contractual policy differs |
| Security events | `security_audit_log` | Fraud, abuse, audit, incident response | Minimum 1 year |
| Deletion workflow | `privacy_deletion_requests`, `privacy_deletion_tombstones` | GDPR/LFPDPPP deletion workflow and non-PII completion proof | 30 days pending, then hashed tombstone plus audit retention |

## User Rights

- Access: `GET /api/profile/export` returns a JSON export for the authenticated user.
- Rectification: `PUT /api/profile` updates profile data.
- Deletion: `POST /api/profile/delete-account` creates a 30-day pending request and revokes active sessions. `POST /api/internal/jobs/privacy-deletions` performs due definitive deletions through `delete_user_cascade`; Netlify `process-privacy-deletions` runs it hourly.

## Sub-Processors

| Vendor | Use | Data categories |
|---|---|---|
| Supabase | Database, storage, auth support | Account, learning, security events |
| OpenAI | SofLIA assistant | Prompt/context data sent by user |
| Google | Gemini, Google Calendar, OAuth | Study planner/calendar and AI processing data |
| Netlify | Hosting/functions | Request metadata and function logs |

## Retention Controls

- Security audit events are append-only and cannot be deleted before one year except by controlled retention cleanup after the minimum period.
- Deletion requests stay pending for 30 days to support recovery and fraud review.
- Definitive deletion stores only a keyed HMAC tombstone in `privacy_deletion_tombstones`; raw user identifiers are not retained in the tombstone.
- Production tombstone hashing requires `PRIVACY_TOMBSTONE_SECRET` or `USER_JWT_SECRET`; the local fallback is development-only.
- Public privacy policy is available at `/privacy` and linked from the landing footer.
- Production exports must be returned with `Cache-Control: private, no-store`.
- Logs must redact tokens, passwords, emails, cookies, and authorization headers.
