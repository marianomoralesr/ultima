# Supabase SMTP Configuration for OTP Emails

## Problem
OTP (One-Time Password) emails for authentication are not being sent because Supabase Auth needs SMTP configuration.

## Solution
Configure Supabase to use Brevo's SMTP server for sending authentication emails.

---

## SMTP Credentials (Brevo)

```
SMTP Server: smtp-relay.brevo.com
Port: 587
Login: 970c27002@smtp-brevo.com
Password: [Your Brevo SMTP password - different from API key]
```

**IMPORTANT:** The SMTP password is NOT the same as your Brevo API key. You need to get it from Brevo dashboard.

---

## Step-by-Step Configuration

### 1. Get SMTP Password from Brevo

1. Go to https://app.brevo.com/settings/keys/smtp
2. You should see your SMTP key listed
3. If you don't have one, click "Generate a new SMTP key"
4. **Copy the password** - you'll need it for Supabase

### 2. Configure Supabase SMTP Settings

#### Option A: Via Supabase Dashboard (Recommended)

1. Go to https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu
2. Click **Settings** (left sidebar)
3. Click **Auth**
4. Scroll down to **SMTP Settings**
5. Click **Enable Custom SMTP**
6. Fill in:
   ```
   SMTP Host: smtp-relay.brevo.com
   SMTP Port: 587
   SMTP User: 970c27002@smtp-brevo.com
   SMTP Password: [Your SMTP password from Brevo]
   Sender Email: noreply@trefa.mx
   Sender Name: TREFA
   ```
7. Click **Save**

#### Option B: Via Supabase CLI

```bash
# Set SMTP configuration
supabase secrets set --project-ref jjepfehmuybpctdzipnu \
  SMTP_HOST=smtp-relay.brevo.com \
  SMTP_PORT=587 \
  SMTP_USER=970c27002@smtp-brevo.com \
  SMTP_PASS=your-smtp-password-here \
  SMTP_SENDER_EMAIL=noreply@trefa.mx \
  SMTP_SENDER_NAME=TREFA
```

---

## 3. Configure Email Templates (Optional but Recommended)

### Customize OTP Email Template

1. In Supabase Dashboard → Auth → Email Templates
2. Find **Magic Link** template
3. Customize the email content:

```html
<h2>Inicia sesión en TREFA</h2>
<p>Haz clic en el siguiente enlace para iniciar sesión:</p>
<p><a href="{{ .ConfirmationURL }}">Iniciar sesión</a></p>
<p>O usa este código: <strong>{{ .Token }}</strong></p>
<p>Este código expira en 60 minutos.</p>
<p>Si no solicitaste este correo, puedes ignorarlo.</p>
```

### Customize other templates:
- Confirm Signup
- Reset Password
- Change Email
- Invite User

---

## 4. Test OTP Email Delivery

### Test via Supabase Dashboard

1. Go to Authentication → Users
2. Try to sign in with email on your app
3. Check if email arrives
4. Check Brevo → Statistics → Email to see if it was sent

### Test via Code

```typescript
// In your app, try to sign in
const { error } = await supabase.auth.signInWithOtp({
  email: 'your-test-email@example.com'
})

if (error) {
  console.error('OTP Error:', error)
} else {
  console.log('OTP sent successfully!')
}
```

---

## 5. Verify SMTP Connection

### Check Supabase Logs

1. Go to Supabase Dashboard → Logs
2. Filter by "auth"
3. Look for SMTP connection errors

### Check Brevo Logs

1. Go to https://app.brevo.com/statistics/email
2. Check if emails are being received by Brevo
3. Check delivery status

---

## Troubleshooting

### Issue: "SMTP connection failed"

**Solution:**
- Verify SMTP credentials are correct
- Check that port 587 is not blocked by firewall
- Ensure SMTP_USER is exactly: `970c27002@smtp-brevo.com`

### Issue: "Authentication failed"

**Solution:**
- Make sure you're using the SMTP password, not the API key
- Generate a new SMTP key in Brevo if needed
- Check for typos in username/password

### Issue: "Emails not arriving"

**Solution:**
1. Check spam folder
2. Verify sender email is verified in Brevo
3. Check Brevo daily sending limit
4. Review Brevo logs for bounces/blocks

### Issue: "Rate limit exceeded"

**Solution:**
- Brevo free tier has limits
- Upgrade Brevo plan if needed
- Implement rate limiting in your app

---

## Security Notes

### SMTP Password Storage

The SMTP password should be stored:
- ✅ In Supabase Dashboard (encrypted)
- ✅ In your password manager
- ❌ NOT in git
- ❌ NOT in environment files committed to git
- ❌ NOT in code

### Sender Email Verification

Before using `noreply@trefa.mx` as sender:
1. Verify domain in Brevo
2. Add SPF/DKIM records to DNS
3. Test email delivery

If domain not verified, use:
```
Sender Email: 970c27002@smtp-brevo.com
Sender Name: TREFA
```

---

## Alternative: Use Supabase's Built-in SMTP (Not Recommended)

Supabase provides a default SMTP for testing, but:
- ⚠️ Emails may go to spam
- ⚠️ Not reliable for production
- ⚠️ Limited customization

**Always use custom SMTP (Brevo) for production!**

---

## Email Rate Limits

### Brevo Free Tier:
- 300 emails per day
- Unlimited contacts

### Brevo Paid Tiers:
- Lite: 10,000 emails/month
- Standard: 20,000 emails/month
- Premium: 350,000 emails/month

**Monitor your usage in Brevo dashboard!**

---

## Next Steps After Configuration

1. ✅ Configure SMTP in Supabase Dashboard
2. ✅ Test OTP email delivery
3. ✅ Customize email templates
4. ✅ Verify domain in Brevo
5. ✅ Set up SPF/DKIM records
6. ✅ Monitor email delivery rates

---

## Quick Setup Checklist

- [ ] Get SMTP password from Brevo dashboard
- [ ] Enable Custom SMTP in Supabase
- [ ] Configure SMTP settings:
  - [ ] Host: smtp-relay.brevo.com
  - [ ] Port: 587
  - [ ] User: 970c27002@smtp-brevo.com
  - [ ] Password: [from Brevo]
  - [ ] Sender: noreply@trefa.mx (or verified email)
- [ ] Test OTP email delivery
- [ ] Customize email templates
- [ ] Monitor Brevo statistics

---

**Status:** Ready to configure - waiting for SMTP password from Brevo dashboard
