# Incident Response Drill - 2026-05

Status: tabletop package ready for leadership signoff.

## Scenario

Credential stuffing against `/auth` produces a spike of `login-failure` and `access-denied` audit events. A subset of accounts enters password reset, and support receives reports of suspicious access attempts.

## Exercise Objectives

- Confirm alert triage through the admin security dashboard.
- Validate internal escalation paths from engineering to support and leadership.
- Confirm customer-facing communication owner and approval flow.
- Verify session revocation, password reset guidance, and audit log preservation.

## Success Criteria

- Incident commander assigned within 15 minutes.
- Severity declared and documented within 30 minutes.
- Containment actions identified within 60 minutes.
- Post-incident review owner and due date assigned before close.

## Evidence To Capture

- Timeline of decisions.
- Audit log query snapshots.
- Communication drafts.
- Follow-up tickets and owners.
