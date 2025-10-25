# Final Setup Steps for Email Notifications

## ✅ Completed

1. ✅ **Brevo API Key Generated**: [API key configured in Supabase secrets]
2. ✅ **Edge Function Deployed**: `send-brevo-email`
3. ✅ **Brevo API Key Secret Set**: Configured in Supabase

## 🔧 Remaining Steps

### Step 1: Fix Email Trigger Functions ⚡ QUICK & EASY (2 minutes)

The email triggers need to be updated with hardcoded configuration instead of dynamic settings.

1. Go to https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/sql/new
2. Open the file `apply_email_trigger_fix.sql` from the project root
3. Copy its entire contents and paste into the SQL Editor
4. Click "Run"
5. You should see "Success. No rows returned"

### ✅ Step 2: Apply Email Triggers Migration - ALREADY DONE

You already ran this migration and updated the URL to trefa.mx/escritorio/solicitudes. No action needed!

### Step 3: Upload Logo to Storage

1. Go to **Storage** in Supabase Dashboard: https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/storage/buckets
2. Create bucket `public-assets` (make it public)
3. Upload `public/images/logoblanco.png` to the bucket
4. The logo will be accessible at: `https://jjepfehmuybpctdzipnu.supabase.co/storage/v1/object/public/public-assets/logoblanco.png`

### Step 4: Verify Sender Email in Brevo

1. Log in to Brevo: https://app.brevo.com
2. Go to **Senders & IP** → **Senders**
3. Add `hola@trefa.mx` as a verified sender
4. Verify the email by following Brevo's instructions
5. Add DNS records (SPF, DKIM) as instructed by Brevo for your domain

## 🧪 Testing

### Test Application Submission Email

Run this in Supabase SQL Editor (replace the ID with a real draft application):

```sql
UPDATE financing_applications
SET status = 'submitted'
WHERE id = 'YOUR_DRAFT_APPLICATION_ID' AND status = 'draft';
```

### Test Status Change Email

```sql
UPDATE financing_applications
SET status = 'approved'
WHERE id = 'YOUR_APPLICATION_ID';
```

### Test Document Status Email

```sql
UPDATE uploaded_documents
SET status = 'approved'
WHERE id = 'YOUR_DOCUMENT_ID';
```

## 📋 What's New

### For Assessors (Lead Profile Page)
- **Download Documents**: Click download button on any document
- **View Documents**: Preview images and PDFs in modal
- **Approve/Reject**: Change document status with dropdown
- **Call Client**: Green button to initiate phone call

### For Clients (Email Notifications)
- **Application Submitted**: Confirmation email with next steps
- **Status Changed**: Updates for reviewing, approved, rejected, etc.
- **Document Status**: Notifications when documents are approved/rejected

### Email Design
- Brand colors (Trefa orange #FF6801, navy #0B2540)
- Responsive HTML templates
- Be Vietnam Pro font
- Direct links to portal
- Status-specific messaging

## 🔍 Monitoring

- **Brevo Dashboard**: https://app.brevo.com → Statistics → Email
- **Edge Function Logs**: https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/functions/send-brevo-email/logs
- **Database Logs**: Check trigger execution in Supabase logs

## 📚 Documentation

Full documentation available in: `docs/EMAIL_NOTIFICATIONS_SETUP.md`

## ⚠️ Important Notes

1. **Never commit** the Brevo API key to version control (it's in .env which is gitignored)
2. **Test thoroughly** before going live with production emails
3. **Configure sender domain** in Brevo to avoid spam filters
4. **Monitor delivery rates** in the Brevo dashboard

## 🎉 You're All Set!

Once you complete Steps 1-4 above, your email notification system will be fully operational!

**Need Help?**
- Check `docs/EMAIL_NOTIFICATIONS_SETUP.md` for detailed troubleshooting
- Review email templates in `supabase/functions/send-brevo-email/index.ts`
- Test with sample data before production use
