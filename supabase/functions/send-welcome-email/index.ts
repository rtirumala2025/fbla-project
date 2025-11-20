// Supabase Edge Function: Send Welcome Email
// Triggered when a user profile is created
// Sends a welcome email with user name, pet information, and first steps
// Supports Resend API (recommended) with SMTP fallback
// Includes retry logic and comprehensive error handling

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

interface EmailRequest {
  user_id: string;
  profile_id?: string;
}

interface WelcomeEmailData {
  userName: string;
  userEmail: string;
  petName?: string;
  petSpecies?: string;
  petBreed?: string;
  petColor?: string;
}

interface EmailSendResult {
  success: boolean;
  error?: string;
  provider?: "resend" | "smtp" | "none";
  emailId?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Parse request body
    const { user_id, profile_id }: EmailRequest = await req.json();

    if (!user_id) {
      throw new Error("user_id is required");
    }

    console.log(`📧 Processing welcome email for user: ${user_id}`);

    // Fetch user email from auth.users
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(
      user_id
    );

    if (authError || !authUser?.user?.email) {
      throw new Error(`Failed to fetch user email: ${authError?.message || "User not found"}`);
    }

    const userEmail = authUser.user.email;
    console.log(`✅ Found user email: ${userEmail}`);

    // Fetch profile information
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("username, coins")
      .eq("user_id", user_id)
      .single();

    if (profileError || !profile) {
      throw new Error(`Failed to fetch profile: ${profileError?.message || "Profile not found"}`);
    }

    const userName = profile.username || "there";
    console.log(`✅ Found profile for: ${userName}`);

    // Fetch pet information (if exists)
    const { data: pet, error: petError } = await supabase
      .from("pets")
      .select("name, species, breed, color_pattern")
      .eq("user_id", user_id)
      .single();

    // Pet might not exist yet, that's okay
    const petInfo = pet && !petError ? {
      name: pet.name,
      species: pet.species,
      breed: pet.breed,
      color_pattern: pet.color_pattern,
    } : null;

    if (petInfo) {
      console.log(`✅ Found pet: ${petInfo.name} (${petInfo.species})`);
    } else {
      console.log(`ℹ️ No pet found yet for user`);
    }

    // Prepare email data
    const emailData: WelcomeEmailData = {
      userName,
      userEmail,
      petName: petInfo?.name,
      petSpecies: petInfo?.species,
      petBreed: petInfo?.breed,
      petColor: petInfo?.color_pattern,
    };

    // Generate HTML email content
    const emailSubject = `Welcome to Virtual Pet, ${userName}! 🎉`;
    const emailHtml = generateWelcomeEmailHtml(emailData);

    // Create initial email log entry
    let emailLogId: string | null = null;
    const { data: logEntry, error: logError } = await supabase
      .from("email_logs")
      .insert({
        user_id,
        email_address: userEmail,
        email_type: "welcome",
        subject: emailSubject,
        status: "pending",
      })
      .select("id")
      .single();

    if (logError || !logEntry) {
      console.warn(`⚠️ Failed to log email: ${logError?.message || "Unknown error"}`);
    } else {
      emailLogId = logEntry.id;
      console.log(`📝 Email log created with ID: ${emailLogId}`);
    }

    // Send email with retry logic
    const emailResponse = await sendEmailWithRetry(
      userEmail,
      emailSubject,
      emailHtml,
      emailData
    );

    // Update email log with result
    const logUpdate: {
      status: string;
      error_message?: string | null;
      sent_at?: string | null;
    } = {
      status: emailResponse.success ? "sent" : "failed",
      error_message: emailResponse.error || null,
    };

    if (emailResponse.success) {
      logUpdate.sent_at = new Date().toISOString();
    }

    // Update the email log
    if (emailLogId) {
      const { error: updateError } = await supabase
        .from("email_logs")
        .update(logUpdate)
        .eq("id", emailLogId);

      if (updateError) {
        console.warn(`⚠️ Failed to update email log: ${updateError.message}`);
      } else {
        console.log(`✅ Email log updated: ${emailResponse.success ? "sent" : "failed"}`);
      }
    } else {
      // Fallback: find and update the most recent pending log for this user
      const { data: pendingLogs } = await supabase
        .from("email_logs")
        .select("id")
        .eq("user_id", user_id)
        .eq("status", "pending")
        .eq("email_type", "welcome")
        .order("created_at", { ascending: false })
        .limit(1);

      if (pendingLogs && pendingLogs.length > 0) {
        await supabase
          .from("email_logs")
          .update(logUpdate)
          .eq("id", pendingLogs[0].id);
      }
    }

    if (emailResponse.success) {
      console.log(`✅ Welcome email sent successfully to ${userEmail}`);
      return new Response(
        JSON.stringify({
          success: true,
          message: "Welcome email sent successfully",
          user_id,
          email: userEmail,
          timestamp: new Date().toISOString(),
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } else {
      throw new Error(emailResponse.error || "Failed to send email");
    }
  } catch (error) {
    console.error("❌ Error sending welcome email:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

/**
 * Generate HTML email template for welcome email
 */
function generateWelcomeEmailHtml(data: WelcomeEmailData): string {
  const { userName, petName, petSpecies, petBreed, petColor } = data;

  const petSection = petName
    ? `
      <div style="background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 20px; margin: 20px 0; border-radius: 8px;">
        <h3 style="margin-top: 0; color: #0369a1;">🐾 Your Pet: ${petName}</h3>
        <p style="margin: 10px 0; color: #0c4a6e;">
          <strong>Species:</strong> ${petSpecies || "N/A"}<br>
          ${petBreed ? `<strong>Breed:</strong> ${petBreed}<br>` : ""}
          ${petColor ? `<strong>Color:</strong> ${petColor}` : ""}
        </p>
      </div>
    `
    : `
      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 8px;">
        <h3 style="margin-top: 0; color: #92400e;">🎨 Create Your Pet</h3>
        <p style="margin: 10px 0; color: #78350f;">
          You haven't created your pet yet! Head to the dashboard to customize your virtual companion.
        </p>
      </div>
    `;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Virtual Pet!</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700;">
                🎉 Welcome to Virtual Pet!
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin-top: 0; color: #1f2937; font-size: 24px;">
                Hello ${userName}! 👋
              </h2>
              
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                We're thrilled to have you join our virtual pet community! Your journey to caring for and bonding with your digital companion starts now.
              </p>

              ${petSection}

              <!-- First Steps -->
              <div style="background: #f9fafb; border: 1px solid #e5e7eb; padding: 25px; margin: 30px 0; border-radius: 8px;">
                <h3 style="margin-top: 0; color: #111827; font-size: 20px;">🚀 First Steps</h3>
                <ol style="color: #374151; font-size: 16px; line-height: 1.8; padding-left: 20px; margin: 15px 0;">
                  <li><strong>Explore Your Dashboard:</strong> Get familiar with your pet's stats and needs</li>
                  <li><strong>Feed & Care:</strong> Keep your pet happy by feeding, playing, and grooming regularly</li>
                  <li><strong>Complete Quests:</strong> Earn coins and rewards by completing daily challenges</li>
                  <li><strong>Customize:</strong> Visit the shop to buy accessories and personalize your pet</li>
                  <li><strong>Track Progress:</strong> Watch your pet grow and develop unique traits over time</li>
                </ol>
              </div>

              <!-- Tips -->
              <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 8px;">
                <h3 style="margin-top: 0; color: #065f46;">💡 Pro Tips</h3>
                <ul style="color: #047857; font-size: 15px; line-height: 1.8; margin: 10px 0; padding-left: 20px;">
                  <li>Check in daily to maintain your pet's happiness and health</li>
                  <li>Balance all stats (hunger, happiness, cleanliness, energy) for optimal pet mood</li>
                  <li>Complete quests to unlock special rewards and achievements</li>
                  <li>Join clubs to connect with other pet owners and share experiences</li>
                </ul>
              </div>

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${Deno.env.get("APP_URL") || "https://your-app.com"}/dashboard" 
                       style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                      Go to Dashboard →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0; border-top: 1px solid #e5e7eb; padding-top: 20px;">
                If you have any questions or need help, don't hesitate to reach out. We're here to make your virtual pet experience amazing!
              </p>

              <p style="color: #9ca3af; font-size: 14px; margin: 20px 0 0 0;">
                Happy pet parenting! 🐾<br>
                <strong>The Virtual Pet Team</strong>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-radius: 0 0 12px 12px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} Virtual Pet. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Send email with retry logic (exponential backoff)
 */
async function sendEmailWithRetry(
  to: string,
  subject: string,
  html: string,
  data: WelcomeEmailData
): Promise<EmailSendResult> {
  let lastError: string | undefined;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1);
      console.log(`⏳ Retry attempt ${attempt}/${MAX_RETRIES} after ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    const result = await sendEmail(to, subject, html, data);
    
    if (result.success) {
      if (attempt > 0) {
        console.log(`✅ Email sent successfully on retry attempt ${attempt}`);
      }
      return result;
    }

    lastError = result.error;
    console.warn(`⚠️ Attempt ${attempt + 1} failed: ${lastError}`);
  }

  return {
    success: false,
    error: `Failed after ${MAX_RETRIES + 1} attempts. Last error: ${lastError}`,
    provider: "none",
  };
}

/**
 * Send email using Resend API (primary) or SMTP (fallback)
 * Returns result with provider information for logging
 */
async function sendEmail(
  to: string,
  subject: string,
  html: string,
  data: WelcomeEmailData
): Promise<EmailSendResult> {
  // Get environment variables
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || Deno.env.get("SMTP_USER") || "noreply@virtualpet.app";
  const appUrl = Deno.env.get("APP_URL") || "https://virtualpet.app";

  // Try Resend API first (recommended for production)
  if (resendApiKey) {
    try {
      console.log("📧 Attempting to send email via Resend API...");
      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [to],
          subject: subject,
          html: html,
        }),
      });

      const resendResult = await resendResponse.json();

      if (resendResponse.ok && resendResult.id) {
        console.log(`✅ Email sent successfully via Resend API. Email ID: ${resendResult.id}`);
        return {
          success: true,
          provider: "resend",
          emailId: resendResult.id,
        };
      } else {
        const errorMsg = resendResult.message || `Resend API error: ${resendResponse.status} ${resendResponse.statusText}`;
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error(`❌ Resend API error: ${error instanceof Error ? error.message : "Unknown error"}`);
      // Fall through to try SMTP
    }
  }

  // Fallback: Try SMTP if configured
  const smtpHost = Deno.env.get("SMTP_HOST");
  const smtpPort = Deno.env.get("SMTP_PORT");
  const smtpUser = Deno.env.get("SMTP_USER");
  const smtpPass = Deno.env.get("SMTP_PASS");

  if (smtpHost && smtpPort && smtpUser && smtpPass) {
    try {
      console.log("📧 Attempting to send email via SMTP...");
      const smtpResult = await sendEmailViaSMTP(
        smtpHost,
        parseInt(smtpPort),
        smtpUser,
        smtpPass,
        fromEmail,
        to,
        subject,
        html
      );

      if (smtpResult.success) {
        console.log(`✅ Email sent successfully via SMTP`);
        return {
          success: true,
          provider: "smtp",
        };
      } else {
        throw new Error(smtpResult.error || "SMTP send failed");
      }
    } catch (error) {
      console.error(`❌ SMTP error: ${error instanceof Error ? error.message : "Unknown error"}`);
      // Continue to fallback logging
    }
  }

  // Final fallback: Log-only mode (development/testing)
  const isDevelopment = !resendApiKey && !smtpHost;
  
  if (isDevelopment) {
    console.log("═══════════════════════════════════════════════════════");
    console.log("📧 EMAIL WOULD BE SENT (Development/Test Mode)");
    console.log("═══════════════════════════════════════════════════════");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`From: ${fromEmail}`);
    console.log(`Provider: None (email service not configured)`);
    console.log("═══════════════════════════════════════════════════════");
    console.log("ℹ️ To enable email sending:");
    console.log("   1. Set RESEND_API_KEY environment variable (recommended)");
    console.log("   2. Or set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS");
    console.log("═══════════════════════════════════════════════════════");

    // In development, mark as successful but log the limitation
    return {
      success: true,
      provider: "none",
      error: "Email service not configured. Email logged for testing only. Set RESEND_API_KEY or SMTP credentials to enable actual sending.",
    };
  }

  // Production mode: fail if no email service is configured
  return {
    success: false,
    error: "No email service configured. Please set RESEND_API_KEY or SMTP credentials.",
    provider: "none",
  };
}

/**
 * Send email via SMTP using a mail relay service API
 * Supports SendGrid, Mailgun, or other HTTP-based SMTP services
 * For raw SMTP, users should configure SMTP via Supabase Dashboard or use Resend API
 */
async function sendEmailViaSMTP(
  host: string,
  port: number,
  username: string,
  password: string,
  from: string,
  to: string,
  subject: string,
  html: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if this is a SendGrid API (common pattern)
    if (host.includes("sendgrid") || host.includes("api.sendgrid.com")) {
      console.log("📧 Detected SendGrid API, using SendGrid endpoint...");
      const sendGridApiKey = password || username; // SendGrid uses API key as password
      
      const sendGridResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${sendGridApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: from },
          subject: subject,
          content: [{ type: "text/html", value: html }],
        }),
      });

      if (sendGridResponse.ok) {
        console.log("✅ Email sent via SendGrid");
        return { success: true };
      } else {
        const errorText = await sendGridResponse.text();
        throw new Error(`SendGrid API error: ${sendGridResponse.status} - ${errorText}`);
      }
    }

    // Check if this is Mailgun API
    if (host.includes("mailgun") || host.includes("api.mailgun.net")) {
      console.log("📧 Detected Mailgun API, using Mailgun endpoint...");
      const apiKey = password || username;
      const domain = from.split("@")[1]; // Extract domain from email
      const mailgunUrl = `https://api.mailgun.net/v3/${domain}/messages`;

      const mailgunResponse = await fetch(mailgunUrl, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${btoa(`api:${apiKey}`)}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          from: from,
          to: to,
          subject: subject,
          html: html,
        }).toString(),
      });

      if (mailgunResponse.ok) {
        const result = await mailgunResponse.json();
        console.log(`✅ Email sent via Mailgun. ID: ${result.id}`);
        return { success: true };
      } else {
        const errorText = await mailgunResponse.text();
        throw new Error(`Mailgun API error: ${mailgunResponse.status} - ${errorText}`);
      }
    }

    // For raw SMTP servers, we cannot easily implement SMTP protocol in edge functions
    // Users should either:
    // 1. Use Resend API (recommended)
    // 2. Use SendGrid/Mailgun API (configure host as API endpoint)
    // 3. Configure SMTP via Supabase Dashboard (handled by Supabase)
    console.warn("⚠️ Raw SMTP protocol not supported in edge functions.");
    console.warn("💡 Options:");
    console.warn("   1. Use Resend API (set RESEND_API_KEY) - Recommended");
    console.warn("   2. Use SendGrid API (set SMTP_HOST=api.sendgrid.com, SMTP_PASS=api_key)");
    console.warn("   3. Use Mailgun API (set SMTP_HOST=api.mailgun.net, SMTP_PASS=api_key)");
    console.warn("   4. Configure SMTP via Supabase Dashboard (Settings → Auth → SMTP)");
    
    return {
      success: false,
      error: "Raw SMTP protocol not supported in edge functions. Please use Resend API, SendGrid, Mailgun, or configure SMTP via Supabase Dashboard.",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown SMTP error",
    };
  }
}

