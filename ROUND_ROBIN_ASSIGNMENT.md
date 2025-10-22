# Round-Robin Sales Agent Assignment

## Overview

Every user is automatically assigned to a sales agent using a **round-robin distribution mechanism**. This ensures fair and balanced lead distribution among all sales representatives.

## How It Works

### For New Users

When a new user registers:

1. **User creates account** → Profile created with `role = 'user'`
2. **AuthContext detects** no `asesor_asignado_id`
3. **Calls RPC function** `get_next_sales_agent()`
4. **Round-robin algorithm** selects the next sales agent
5. **Profile updated** with the assigned agent ID
6. **Done!** User now has a sales agent assigned

### For Existing Users

Users who were created before the assignment system:

1. **Run migration** `assign_existing_users_to_sales.sql`
2. **Batch processing** assigns all unassigned users
3. **Round-robin distribution** ensures fair allocation
4. **Report generated** showing assignments per agent

## Round-Robin Algorithm

The `get_next_sales_agent()` function:

```sql
1. Gets all users with role = 'sales'
2. Retrieves last assigned index from agent_assignment_state table
3. Increments index (with wraparound)
4. Returns next agent's UUID
5. Updates state for next assignment
```

### Example Flow

**Sales Agents:**
- Agent A
- Agent B
- Agent C
- Agent D

**Assignment Sequence:**
1. User 1 → Agent A
2. User 2 → Agent B
3. User 3 → Agent C
4. User 4 → Agent D
5. User 5 → Agent A (wraps around)
6. User 6 → Agent B
7. ... and so on

## Current Status

✅ **Automatic Assignment:** Working (via AuthContext)
✅ **Round-Robin Function:** Exists in database
✅ **Migration Created:** `assign_existing_users_to_sales.sql`
⏳ **Migration Status:** Ready to run

## Running the Assignment Migration

### Step 1: Verify Sales Agents

Check how many sales agents you have:

```sql
SELECT
    id,
    email,
    first_name,
    last_name,
    role
FROM profiles
WHERE role = 'sales'
ORDER BY created_at;
```

**Expected:** 4 sales agents (as mentioned by user)

### Step 2: Check Unassigned Users

See how many users need assignment:

```sql
SELECT COUNT(*) as unassigned_users
FROM profiles
WHERE role = 'user'
  AND asesor_asignado_id IS NULL;
```

### Step 3: Run the Migration

```bash
# Apply the migration
supabase db push

# Or execute directly
psql [your-database-url] < supabase/migrations/assign_existing_users_to_sales.sql
```

### Step 4: Verify Results

Check the distribution:

```sql
SELECT
    s.email as sales_agent,
    s.first_name || ' ' || s.last_name as agent_name,
    COUNT(u.id) as assigned_users
FROM profiles s
LEFT JOIN profiles u ON u.asesor_asignado_id = s.id AND u.role = 'user'
WHERE s.role = 'sales'
GROUP BY s.id, s.email, s.first_name, s.last_name
ORDER BY assigned_users DESC;
```

**Expected Result:** Fairly balanced distribution across all 4 agents

## Monitoring Assignment

### Check Current Distribution

```sql
-- Summary statistics
SELECT
    COUNT(DISTINCT CASE WHEN role = 'sales' THEN id END) as total_sales_agents,
    COUNT(CASE WHEN role = 'user' AND asesor_asignado_id IS NOT NULL THEN 1 END) as users_with_agent,
    COUNT(CASE WHEN role = 'user' AND asesor_asignado_id IS NULL THEN 1 END) as users_without_agent,
    ROUND(
        100.0 * COUNT(CASE WHEN role = 'user' AND asesor_asignado_id IS NOT NULL THEN 1 END) /
        NULLIF(COUNT(CASE WHEN role = 'user' THEN 1 END), 0),
        2
    ) as percentage_assigned
FROM profiles;
```

### Check Assignment Balance

```sql
-- Detailed per-agent breakdown
SELECT
    s.email,
    s.first_name || ' ' || s.last_name as name,
    COUNT(u.id) as assigned_count,
    ROUND(
        100.0 * COUNT(u.id) /
        NULLIF(SUM(COUNT(u.id)) OVER (), 0),
        2
    ) as percentage_of_total
FROM profiles s
LEFT JOIN profiles u ON u.asesor_asignado_id = s.id AND u.role = 'user'
WHERE s.role = 'sales'
GROUP BY s.id, s.email, s.first_name, s.last_name
ORDER BY assigned_count DESC;
```

## Testing Round-Robin

### Test New User Assignment

```sql
-- 1. Check current state
SELECT * FROM agent_assignment_state;

-- 2. Create a test user (will be auto-assigned on next login)
-- This happens automatically via AuthContext

-- 3. Verify assignment
SELECT
    id,
    email,
    asesor_asignado_id,
    (SELECT email FROM profiles WHERE id = asesor_asignado_id) as assigned_to
FROM profiles
WHERE role = 'user'
ORDER BY created_at DESC
LIMIT 5;
```

### Manual Test (For Development)

```sql
-- Call the function directly
SELECT get_next_sales_agent() as next_agent_id;

-- Check which agent that is
SELECT email, first_name, last_name
FROM profiles
WHERE id = (SELECT get_next_sales_agent());

-- Call it multiple times to see the rotation
SELECT
    get_next_sales_agent() as agent_1,
    get_next_sales_agent() as agent_2,
    get_next_sales_agent() as agent_3,
    get_next_sales_agent() as agent_4,
    get_next_sales_agent() as agent_5;
```

## Edge Cases Handled

### No Sales Agents Available

If there are no users with `role = 'sales'`:
- Function returns `NULL`
- User is created without assignment
- Can be assigned later when sales agents are available

### Sales Agent Removed

If a sales agent's role is changed or account deleted:
- Existing assignments remain (for historical tracking)
- Future assignments skip that agent
- Consider reassigning their leads manually if needed

### Unequal Distribution

If the distribution becomes unbalanced:
1. Check if all sales agents are active
2. Verify `agent_assignment_state` table
3. Consider manual rebalancing if needed

## Manual Rebalancing (If Needed)

```sql
-- Reset assignment state to start fresh
TRUNCATE agent_assignment_state;
INSERT INTO agent_assignment_state (last_assigned_index) VALUES (0);

-- Redistribute all users
UPDATE profiles
SET asesor_asignado_id = NULL
WHERE role = 'user';

-- Run the assignment migration again
-- (See Step 3 above)
```

## Database Tables Involved

### `profiles` Table
```sql
- id: UUID
- role: TEXT ('user' | 'sales' | 'admin')
- asesor_asignado_id: UUID (references profiles.id)
- autorizar_asesor_acceso: BOOLEAN
```

### `agent_assignment_state` Table
```sql
- last_assigned_index: INTEGER
```

This table tracks the round-robin state.

## Frontend Implementation

The assignment happens automatically in `AuthContext.tsx`:

```typescript
useEffect(() => {
    if (profile && profile.role === 'user' && !profile.asesor_asignado_id) {
        const assignAgent = async () => {
            const { data: agentId, error: rpcError } = await supabase.rpc('get_next_sales_agent');
            if (agentId) {
                await supabase
                    .from('profiles')
                    .update({ asesor_asignado_id: agentId })
                    .eq('id', profile.id);
                await reloadProfile();
            }
        };
        assignAgent();
    }
}, [profile, reloadProfile]);
```

## Troubleshooting

### Issue: Users Not Getting Assigned

**Check:**
1. Are there sales users? (`SELECT COUNT(*) FROM profiles WHERE role = 'sales'`)
2. Does `get_next_sales_agent` function exist?
3. Check browser console for errors
4. Verify `agent_assignment_state` table exists

### Issue: Uneven Distribution

**Possible Causes:**
1. Sales agents were added/removed during assignment
2. Manual assignments were made
3. Assignment state was reset

**Fix:**
Run manual rebalancing (see above)

### Issue: New Users Not Auto-Assigned

**Check:**
1. AuthContext is wrapping the app
2. User is logging in (triggers profile load)
3. Check console for RPC errors
4. Verify function permissions

## Best Practices

1. **Don't Manually Assign** unless necessary
   - Let the round-robin handle it for fairness

2. **Monitor Distribution** regularly
   - Check monthly for balance
   - Adjust if one agent has significantly more

3. **When Adding Sales Agents**
   - New agents will start receiving assignments immediately
   - Distribution will auto-balance over time

4. **When Removing Sales Agents**
   - Consider reassigning their current leads
   - Update `agent_assignment_state` if needed

## Reports

### Monthly Assignment Report

```sql
SELECT
    DATE_TRUNC('month', u.created_at) as month,
    s.email as sales_agent,
    COUNT(u.id) as new_assignments
FROM profiles u
JOIN profiles s ON u.asesor_asignado_id = s.id
WHERE u.role = 'user'
  AND s.role = 'sales'
  AND u.created_at >= NOW() - INTERVAL '6 months'
GROUP BY DATE_TRUNC('month', u.created_at), s.email
ORDER BY month DESC, new_assignments DESC;
```

### Current Load Per Agent

```sql
SELECT
    s.email,
    COUNT(u.id) as total_assigned,
    COUNT(CASE WHEN u.contactado = false THEN 1 END) as not_contacted,
    COUNT(CASE WHEN a.status IN ('submitted', 'reviewing') THEN 1 END) as active_apps
FROM profiles s
LEFT JOIN profiles u ON u.asesor_asignado_id = s.id AND u.role = 'user'
LEFT JOIN applications a ON a.user_id = u.id
WHERE s.role = 'sales'
GROUP BY s.id, s.email
ORDER BY total_assigned DESC;
```

## Next Steps

1. ✅ Round-robin function exists
2. ✅ Auto-assignment implemented (AuthContext)
3. ✅ Migration created for existing users
4. ⏳ Run migration to assign existing users
5. ⏳ Verify distribution is balanced
6. ⏳ Monitor ongoing assignments

## Summary

- **New Users:** ✅ Automatically assigned on first login
- **Existing Users:** ⏳ Run migration to assign
- **Distribution:** Round-robin ensures fairness
- **Monitoring:** Queries provided for verification
- **Status:** Ready for production

Run the migration and verify the results!
