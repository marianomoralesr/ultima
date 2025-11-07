# Kommo CRM Integration Policy

## ⚠️ CRITICAL POLICY: MANUAL OPERATIONS ONLY ⚠️

This document establishes strict rules for interacting with Kommo CRM to prevent data corruption and duplicate leads.

---

## Policy Statement

**ALL operations that send data TO Kommo CRM MUST be manual, lead-by-lead operations initiated by explicit user actions.**

### ✅ ALLOWED Operations

1. **Manual Sync Button** - Admin/Sales viewing a single client profile and clicking "Sync to Kommo"
2. **Manual Search** - Looking up a single lead by phone/email
3. **Read-Only Queries** - Fetching pipelines, leads, tags (no writes)

### ❌ PROHIBITED Operations

1. **Bulk Operations** - Processing multiple leads in a loop
2. **Automated Triggers** - Webhooks, database triggers, or event listeners that send to Kommo
3. **Scheduled Jobs** - Cron jobs, background tasks, or automated syncs
4. **React Lifecycle Hooks** - useEffect, componentDidMount, or any automatic execution
5. **Batch Processing** - Any script that processes more than one lead at a time
6. **CSV Imports** - Automated upload of multiple leads from files

---

## Implementation Safeguards

### Code Level

**KommoService.ts** contains explicit warnings:
```typescript
/**
 * ⚠️ CRITICAL: MANUAL OPERATION ONLY ⚠️
 * This function MUST only be called from user-initiated button clicks.
 * DO NOT call this from loops, triggers, scheduled jobs, or useEffect hooks.
 */
static async syncLeadWithKommo(profile: Profile)
```

**Usage Locations (ONLY 2 allowed)**:
1. `src/pages/AdminClientProfilePage.tsx:521` - Button click handler
2. `src/pages/SalesClientProfilePage.tsx:309` - Button click handler

### Audit Trail

Every call to `syncLeadWithKommo()` logs:
```
[Kommo Sync] MANUAL SYNC initiated for profile: <user_id>
```

Monitor these logs to detect any unauthorized bulk operations.

---

## Why This Policy Exists

### Risks of Automation

1. **Duplicate Leads** - Kommo searches by phone number, but automation could create duplicates if data is inconsistent
2. **Rate Limiting** - Kommo API has rate limits; bulk operations could trigger blocks
3. **Data Corruption** - Mass operations could overwrite existing lead data incorrectly
4. **Audit Trail Loss** - Manual operations provide clear accountability
5. **Customer Experience** - Accidental duplicate leads confuse sales team and customers

### Proper Workflow

```
User Profile Page
      ↓
User clicks "Sync to Kommo"
      ↓
System checks: Lead exists?
      ↓
   Yes → Show existing lead info
   No  → Create ONE new lead
      ↓
System logs operation
      ↓
User sees result
```

---

## Data Flow Architecture

### Outbound (TO Kommo) - MANUAL ONLY

```
TREFA.mx App  →  User Button Click  →  KommoService.syncLeadWithKommo()  →  Kommo API
                    (MANUAL)              (ONE LEAD ONLY)
```

### Inbound (FROM Kommo) - AUTOMATED (Safe)

```
Kommo CRM  →  Webhook Event  →  kommo-webhook Function  →  kommo_leads Table
              (AUTOMATIC)         (READ ONLY TO TREFA)
```

**Key Distinction:**
- **Sending TO Kommo**: Manual, one-by-one, user-initiated ✋
- **Receiving FROM Kommo**: Automated, real-time, read-only ✅

---

## Enforcement

### Developer Checklist

Before adding ANY code that calls Kommo APIs, ask:

- [ ] Is this a manual user action (button click)?
- [ ] Does it process only ONE lead at a time?
- [ ] Is there NO loop, map, forEach, or batch processing?
- [ ] Is there NO automated trigger (webhook, cron, useEffect)?
- [ ] Did I add proper logging?

### Code Review Requirements

Any PR that modifies Kommo integration MUST:
1. Include this policy document in the review
2. Explicitly confirm manual-only operation
3. Show no loops or batch operations
4. Include audit logging

### Monitoring

Check logs daily for patterns like:
```bash
# Good: Sporadic manual syncs
[Kommo Sync] MANUAL SYNC initiated for profile: abc123
... (5 minutes later) ...
[Kommo Sync] MANUAL SYNC initiated for profile: def456

# Bad: Rapid-fire bulk operation (FORBIDDEN)
[Kommo Sync] MANUAL SYNC initiated for profile: user1
[Kommo Sync] MANUAL SYNC initiated for profile: user2
[Kommo Sync] MANUAL SYNC initiated for profile: user3
... (within seconds) ...
```

---

## Exception Process

If there's ever a legitimate need to bulk-sync leads:

1. **Request Approval** from system admin + CRM admin
2. **Document Reason** - Why is bulk operation necessary?
3. **Test Plan** - How will you prevent duplicates?
4. **Rollback Plan** - How will you undo if something goes wrong?
5. **Manual Execution** - Run the script manually, monitor results
6. **Audit Report** - Document every lead touched

**DO NOT** build permanent automation without explicit approval.

---

## Related Documentation

- [Kommo Webhook Integration](./KOMMO_WEBHOOK_INTEGRATION.md) - Receiving data FROM Kommo (automated, safe)
- [Kommo Service API](../src/services/KommoService.ts) - Source code with inline warnings

---

## Version History

- **v1.0** (2025-11-07): Initial policy established
- Enforced in code commit: `73317a2` (feat: Add Kommo CRM webhook integration)

---

## Contact

Questions about this policy? Contact:
- System Admin
- CRM Manager
- Development Team Lead

**Remember: When in doubt, ask before syncing!** ✋
