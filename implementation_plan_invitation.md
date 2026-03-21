# Fix Bulk Invitation Links → Pricing Page Redirect

## Problem

When a user clicks a bulk invitation link (`/invite/{token}`), they are shown a **pricing/plans page** instead of being directed to register with the organization. The page at `/app/invite/[token]/page.tsx` renders subscription plans (Starter/Business/Enterprise) and has zero logic to process the invitation token.

## Root Cause

The `/invite/[token]` page was never properly implemented — it's a leftover pricing page template. Meanwhile, the **registration page** at `/auth/{orgSlug}/register?bulk_token={token}` already has full support for bulk invite tokens:
- Validates the token via `GET /api/invite/{token}`
- Extracts the role from the invite data
- Passes `bulkInviteToken` and `invitedRole` to `OrganizationRegisterForm`

## Proposed Changes

### Invitation Page

#### [MODIFY] [page.tsx](file:///c:/Users/Lordg/Desktop/Pulse%20Hub/SofLIA%20-%20Learning/SofLIA-Learning/apps/web/src/app/invite/[token]/page.tsx)

Replace the entire pricing page with a proper invitation landing page that:

1. **Validates the token** by calling `GET /api/invite/{token}`
2. **Shows organization info** (name, logo) from the API response
3. **Shows invitation details** (role, remaining uses)
4. **Handles states**: loading, invalid/expired/exhausted tokens, valid tokens
5. **Provides two CTAs**:
   - "Crear cuenta" → redirects to `/auth/{orgSlug}/register?bulk_token={token}`
   - "Ya tengo cuenta" → redirects to `/auth/{orgSlug}/login` (and we handle the post-login association separately, or note this limitation)

> [!IMPORTANT]
> For users who **already have an account**, we need to also check if we should add a POST handler to `/api/invite/[token]` that associates the logged-in user with the organization. Currently only the registration flow handles bulk tokens.

## Verification Plan

### Manual Verification
1. Create a bulk invite link from the business panel
2. Open the link in an incognito browser
3. Verify it shows organization info + invitation details (not pricing)
4. Click "Crear cuenta" and verify it navigates to the register page with correct `bulk_token` query param
5. Complete registration and verify the user is added to the organization with the correct role
