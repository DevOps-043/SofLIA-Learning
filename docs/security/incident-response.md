# Incident Response Plan

## Severity

| Severity | Examples | Response SLA | Update cadence |
|---|---|---:|---:|
| P0 | Confirmed data breach, active account takeover, ransomware | 15 min | 30 min |
| P1 | Privilege escalation, exposed secret, severe outage with security impact | 30 min | 60 min |
| P2 | Contained vulnerability, suspicious abuse spike, failed control | 4 h | Daily |
| P3 | Low-risk finding, policy gap, hardening task | 2 business days | Weekly |

## Roles

- Incident Commander: owns coordination, severity, timeline, and closure.
- Security Lead: containment, evidence handling, root-cause analysis.
- Engineering Lead: hotfixes, rollbacks, production validation.
- Communications Lead: internal updates, customer notices, regulator notices.
- Legal/Privacy: GDPR/LFPDPPP assessment and 72-hour notification decision.

## Playbooks

### Credential Leak

1. Revoke exposed credential and rotate dependent secrets.
2. Search logs and audit trails for use after exposure time.
3. Deploy replacement secret through approved environments.
4. Document blast radius and preventive control.

### Data Breach

1. Freeze relevant logs and preserve evidence.
2. Disable affected access path or feature flag.
3. Identify affected users, data classes, and timestamps.
4. Notify leadership and Legal/Privacy within P0 SLA.
5. Prepare user/regulator communications if required.

### Account Takeover

1. Revoke active sessions and refresh tokens for affected accounts.
2. Force password reset and review recent security audit events.
3. Check role changes, cross-tenant access, exports, and admin actions.
4. Add detection rule if the pattern is new.

### DDoS or Bot Abuse

1. Enable WAF challenge or stricter rate limits.
2. Review IP/User-Agent patterns and add temporary blocks.
3. Validate service health and queue/backpressure status.
4. Keep customer-facing messaging separate from attacker details.

## Simulation

Run one tabletop exercise every six months. Store summaries in `docs/security/incident-drills/` with scope, timeline, findings, owners, and due dates.

## Post-Mortem Template

- Summary
- Timeline
- Customer impact
- Root cause
- Detection gap
- What worked
- What failed
- Corrective actions
- Owners and due dates
