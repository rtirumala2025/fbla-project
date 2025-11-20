/**
 * Email Service
 * Utility functions for sending emails via Supabase Edge Functions
 */

import { supabase } from '../lib/supabase';

export interface WelcomeEmailData {
  userName: string;
  userEmail: string;
  petName?: string;
  petSpecies?: string;
  petBreed?: string;
  petColor?: string;
}

export interface EmailLog {
  id: string;
  user_id: string;
  email_address: string;
  email_type: string;
  subject: string;
  status: 'pending' | 'sent' | 'failed';
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
}

/**
 * Send welcome email to a user
 * This function calls the Supabase Edge Function to send the email
 */
export async function sendWelcomeEmail(userId: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  timestamp?: string;
}> {
  try {
    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error('Supabase URL not configured');
    }

    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/send-welcome-email`;

    // Get the current session to use for authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        user_id: userId,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || `HTTP ${response.status}`);
    }

    console.log('✅ Welcome email sent successfully:', result);
    return {
      success: true,
      message: result.message || 'Email sent successfully',
      timestamp: result.timestamp || new Date().toISOString(),
    };
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get email logs for the current user
 */
export async function getEmailLogs(userId: string): Promise<EmailLog[]> {
  try {
    const { data, error } = await supabase
      .from('email_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('❌ Failed to fetch email logs:', error);
    return [];
  }
}

/**
 * Check if welcome email was sent for a user
 */
export async function hasWelcomeEmailBeenSent(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('email_logs')
      .select('id')
      .eq('user_id', userId)
      .eq('email_type', 'welcome')
      .eq('status', 'sent')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "not found", which is fine
      throw error;
    }

    return !!data;
  } catch (error) {
    console.error('❌ Failed to check welcome email status:', error);
    return false;
  }
}

