# Send Welcome Email Edge Function

This Supabase Edge Function sends a welcome email to users when they create their profile.

## Environment Variables

Set these in Supabase Dashboard → Project Settings → Edge Functions → Secrets:

- `SUPABASE_URL`: Your Supabase project URL (automatically available)
- `SUPABASE_SERVICE_ROLE_KEY`: Your service role key (automatically available)
- `RESEND_API_KEY`: (Optional) Resend API key for sending emails
- `RESEND_FROM_EMAIL`: (Optional) Verified sender email address
- `APP_URL`: (Optional) Your application URL for email links

## Deployment

```bash
supabase functions deploy send-welcome-email
```

## Usage

The function is automatically called by the database trigger when a profile is created. You can also call it manually:

```bash
curl -X POST https://your-project.supabase.co/functions/v1/send-welcome-email \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "user-uuid-here"}'
```

## Email Provider Setup

### Option 1: Resend (Recommended)

1. Sign up at https://resend.com
2. Create an API key
3. Verify your domain
4. Set `RESEND_API_KEY` and `RESEND_FROM_EMAIL` secrets

### Option 2: Configure SMTP in Supabase

1. Go to Settings → Auth → SMTP Settings
2. Enter your SMTP credentials
3. The function will attempt to use Supabase's email service

## Testing

See `scripts/test-welcome-email.ts` for a comprehensive test script.

