import { supabase } from './supabase';
import type { UserProfile, UserAgreement } from './supabase';

// Email validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  return emailRegex.test(email);
};

// Password strength validation
export interface PasswordValidation {
  valid: boolean;
  errors: string[];
}

export const validatePasswordStrength = (password: string): PasswordValidation => {
  const errors: string[] = [];
  
  // Check minimum length
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  // Check for uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  // Check for lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  // Check for number
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  // Check for special character
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  // Check against common passwords
  const commonPasswords = [
    'password', '12345678', 'qwerty123', 'abc123456', 'password123',
    'admin123', 'letmein123', 'welcome123', 'monkey123', '123456789'
  ];
  
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common, please choose a stronger password');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// Get client IP address (best effort)
const getClientIP = async (): Promise<string | null> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch {
    return null;
  }
};

// Get user agent
const getUserAgent = (): string => {
  return navigator.userAgent;
};

// Log authentication attempt
export const logAuthAttempt = async (
  email: string,
  attemptType: 'login' | 'signup' | 'password_reset',
  success: boolean,
  errorMessage?: string
) => {
  try {
    const ipAddress = await getClientIP();
    const userAgent = getUserAgent();
    
    const { error } = await supabase.rpc('log_auth_attempt', {
      email_input: email,
      attempt_type_input: attemptType,
      success_input: success,
      ip_input: ipAddress,
      user_agent_input: userAgent,
      error_message_input: errorMessage
    });
    
    if (error) {
      console.error('Failed to log auth attempt:', error);
    }
  } catch (error) {
    console.error('Failed to log auth attempt:', error);
  }
};

// Check rate limiting
export const checkRateLimit = async (
  email: string,
  attemptType: 'login' | 'signup' | 'password_reset',
  maxAttempts: number = 5,
  timeWindowMinutes: number = 15
): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('check_rate_limit', {
      email_input: email,
      attempt_type_input: attemptType,
      max_attempts: maxAttempts,
      time_window_minutes: timeWindowMinutes
    });
    
    if (error) {
      console.error('Rate limit check failed:', error);
      return false; // Fail closed - deny if we can't check
    }
    
    return data;
  } catch (error) {
    console.error('Rate limit check failed:', error);
    return false;
  }
};

// Sign up with comprehensive validation
export const signUp = async (
  email: string,
  password: string,
  nickname: string,
  agreeToTerms: boolean
) => {
  try {
    // Validate inputs
    if (!validateEmail(email)) {
      throw new Error('Please enter a valid email address');
    }
    
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.errors.join('. '));
    }
    
    if (!nickname.trim() || nickname.length < 2 || nickname.length > 50) {
      throw new Error('Nickname must be between 2 and 50 characters');
    }
    
    if (!agreeToTerms) {
      throw new Error('You must agree to the terms and conditions');
    }
    
    // Check rate limiting
    const canAttempt = await checkRateLimit(email, 'signup');
    if (!canAttempt) {
      throw new Error('Too many signup attempts. Please try again later.');
    }
    
    // Check if email already exists
    const { data: existingUser } = await supabase.auth.getUser();
    if (existingUser?.user?.email === email) {
      await logAuthAttempt(email, 'signup', false, 'Email already registered');
      throw new Error('An account with this email already exists');
    }
    
    // Attempt signup
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nickname: nickname.trim()
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });
    
    if (error) {
      await logAuthAttempt(email, 'signup', false, error.message);
      throw error;
    }
    
    if (data.user) {
      // Log successful attempt
      await logAuthAttempt(email, 'signup', true);
      
      // Record terms acceptance
      if (data.user.id) {
        const ipAddress = await getClientIP();
        const userAgent = getUserAgent();
        
        await supabase.from('user_agreements').insert({
          user_id: data.user.id,
          agreement_type: 'terms_and_conditions',
          agreement_version: '1.0',
          ip_address: ipAddress,
          user_agent: userAgent
        });
      }
    }
    
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// Sign in with rate limiting
export const signIn = async (email: string, password: string) => {
  try {
    // Validate email format
    if (!validateEmail(email)) {
      throw new Error('Please enter a valid email address');
    }
    
    // Check rate limiting
    const canAttempt = await checkRateLimit(email, 'login');
    if (!canAttempt) {
      throw new Error('Too many login attempts. Please try again later.');
    }
    
    // Attempt sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      await logAuthAttempt(email, 'login', false, error.message);
      throw error;
    }
    
    if (data.user) {
      // Log successful attempt
      await logAuthAttempt(email, 'login', true);
      
      // Update last seen
      await supabase
        .from('user_profiles')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('id', data.user.id);
    }
    
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// Sign out
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    return { error: null };
  } catch (error) {
    return { error };
  }
};

// Request password reset
export const requestPasswordReset = async (email: string) => {
  try {
    if (!validateEmail(email)) {
      throw new Error('Please enter a valid email address');
    }
    
    // Check rate limiting
    const canAttempt = await checkRateLimit(email, 'password_reset', 3, 60); // 3 attempts per hour
    if (!canAttempt) {
      throw new Error('Too many password reset attempts. Please try again later.');
    }
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    });
    
    if (error) {
      await logAuthAttempt(email, 'password_reset', false, error.message);
      throw error;
    }
    
    await logAuthAttempt(email, 'password_reset', true);
    return { error: null };
  } catch (error) {
    return { error };
  }
};

// Update password
export const updatePassword = async (newPassword: string) => {
  try {
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.errors.join('. '));
    }
    
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) throw error;
    
    return { error: null };
  } catch (error) {
    return { error };
  }
};

// Get current user profile
export const getCurrentUserProfile = async (): Promise<UserProfile | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Failed to get user profile:', error);
    return null;
  }
};

// Update user profile
export const updateUserProfile = async (updates: Partial<UserProfile>) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    
    const { error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', user.id);
    
    if (error) throw error;
    
    return { error: null };
  } catch (error) {
    return { error };
  }
};

// Check if user has accepted terms
export const hasAcceptedTerms = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('user_agreements')
      .select('id')
      .eq('user_id', userId)
      .eq('agreement_type', 'terms_and_conditions')
      .limit(1);
    
    if (error) throw error;
    
    return data.length > 0;
  } catch (error) {
    console.error('Failed to check terms acceptance:', error);
    return false;
  }
};

// Get user's authentication attempts
export const getUserAuthAttempts = async (limit: number = 10) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    
    const { data, error } = await supabase
      .from('auth_attempts')
      .select('*')
      .eq('email', user.email)
      .order('attempted_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Failed to get auth attempts:', error);
    return [];
  }
};