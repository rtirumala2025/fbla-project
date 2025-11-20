# Welcome Email Setup Guide

This guide explains how to set up and configure the welcome email feature for the Virtual Pet application.

## Overview

The welcome email feature automatically sends a personalized email to users when they create their profile. The email includes:
- User's name
- Pet information (if available)
- First steps and tips for using the app

## Architecture

The welcome email system consists of:

1. **Database Migration** (`011_email_logging.sql`): Creates `email_logs` table for tracking sent emails
2. **Database Trigger** (`012_welcome_email_trigger.sql`): Automatically triggers email sending on profile creation
3. **Edge Function** (`supabase/functions/send-welcome-email/`): Handles email generation and sending
4. **Email Service** (`frontend/src/services/emailService.ts`): TypeScript utility for email operations

## Setup Instructions

### 1. Run Database Migrations

Apply the email logging and trigger migrations:

```bash
# Using Supabase CLI
supabase db push

# Or manually in Supabase dashboard SQL editor
# Run: supabase/migrations/011_email_logging.sql
# Run: supabase/migrations/012_welcome_email_trigger.sql
```

### 2. Deploy Edge Function

Deploy the welcome email edge function:

```bash
# Using Supabase CLI
supabase functions deploy send-welcome-email

# Or via Supabase dashboard: Functions → New Function
```

### 3. Configure Email Service

Choose one of the following email providers:

#### Option A: Resend (Recommended)

1. Sign up for a Resend account at https://resend.com
2. Create an API key
3. Set environment variables in Supabase:

```bash
# Using Supabase CLI
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxx
supabase secrets set RESEND_FROM_EMAIL=noreply@yourdomain.com
supabase secrets set APP_URL=https://your-app.com
```

Or in Supabase Dashboard:
- Go to Project Settings → Edge Functions → Secrets
- Add:
  - `RESEND_API_KEY`: Your Resend API key
  - `RESEND_FROM_EMAIL`: Your verified sender email (e.g., `noreply@yourdomain.com`)
  - `APP_URL`: Your application URL

#### Option B: Supabase SMTP

1. Configure SMTP in Supabase Dashboard:
   - Go to Settings → Auth → SMTP Settings
   - Enter your SMTP credentials
   - Test the connection

2. Update the edge function to use Supabase's email API (if available)

#### Option C: Other Email Services

You can modify the `sendEmailViaSupabase` function in the edge function to use:
- SendGrid
- AWS SES
- Mailgun
- Any other email service with an API

### 4. Configure Database Trigger Settings

The trigger needs to know your Supabase project URL. Set it as a database setting:

```sql
-- In Supabase SQL Editor
ALTER DATABASE postgres SET app.supabase_url = 'https://your-project.supabase.co';
ALTER DATABASE postgres SET app.supabase_service_role_key = 'your-service-role-key';
```

**Note**: For security, consider using Supabase secrets instead of database settings for the service role key.

### 5. Test the Implementation

Run the test script to verify everything works:

```bash
# Set environment variables
export SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Run test (using Deno)
deno run --allow-net --allow-env scripts/test-welcome-email.ts

# Or using Node/TypeScript
npm install -g ts-node
ts-node scripts/test-welcome-email.ts
```

## How It Works

1. **Profile Creation**: When a user creates a profile (via `profileService.createProfile()`), a new row is inserted into the `profiles` table.

2. **Database Trigger**: The `trg_send_welcome_email` trigger fires after the insert.

3. **Edge Function Call**: The trigger calls the `send-welcome-email` edge function via HTTP using `pg_net`.

4. **Email Generation**: The edge function:
   - Fetches user email from `auth.users`
   - Fetches profile information
   - Fetches pet information (if exists)
   - Generates HTML email template
   - Logs email attempt in `email_logs` table

5. **Email Sending**: The function sends the email via Resend API (or configured SMTP).

6. **Logging**: The email log is updated with success/failure status.

## Email Template

The welcome email includes:
- Personalized greeting with user's name
- Pet information section (if pet exists)
- First steps guide
- Pro tips section
- Call-to-action button to dashboard
- Responsive HTML design

## Monitoring

Check email logs in the database:

```sql
-- View all email logs
SELECT * FROM email_logs ORDER BY created_at DESC;

-- View failed emails
SELECT * FROM email_logs WHERE status = 'failed';

-- View emails for a specific user
SELECT * FROM email_logs WHERE user_id = 'user-uuid-here';
```

## Troubleshooting

### Emails Not Sending

1. **Check email logs**: Query `email_logs` table to see error messages
2. **Verify API keys**: Ensure `RESEND_API_KEY` is set correctly
3. **Check trigger**: Verify the trigger exists and is enabled
4. **Check edge function logs**: View logs in Supabase Dashboard → Edge Functions → Logs

### Trigger Not Firing

1. Verify trigger exists:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'trg_send_welcome_email';
   ```

2. Check trigger function:
   ```sql
   SELECT * FROM pg_proc WHERE proname = 'send_welcome_email_trigger';
   ```

3. Test trigger manually:
   ```sql
   SELECT send_welcome_email_trigger();
   ```

### Edge Function Errors

1. Check function logs in Supabase Dashboard
2. Verify environment variables are set
3. Test function directly:
   ```bash
   curl -X POST https://your-project.supabase.co/functions/v1/send-welcome-email \
     -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
     -H "Content-Type: application/json" \
     -d '{"user_id": "user-uuid-here"}'
   ```

## Security Considerations

1. **Service Role Key**: Never expose the service role key in client-side code
2. **Email Validation**: The edge function validates user_id before sending
3. **Rate Limiting**: Consider adding rate limiting to prevent abuse
4. **Email Content**: Sanitize user input in email templates

## Production Checklist

- [ ] Database migrations applied
- [ ] Edge function deployed
- [ ] Email service configured (Resend API key set)
- [ ] From email address verified
- [ ] APP_URL environment variable set
- [ ] Database trigger settings configured
- [ ] Test email sent successfully
- [ ] Email logs table accessible
- [ ] Monitoring set up for failed emails

## Support

For issues or questions:
1. Check the email logs table
2. Review edge function logs
3. Verify all environment variables are set
4. Test with the provided test script

