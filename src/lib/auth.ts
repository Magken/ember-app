import { supabase } from './supabase';
import type { User, Session } from '@supabase/supabase-js';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

export interface PasswordValidation {
  valid: boolean;
  errors: string[];
}

// Simple authentication functions without complex class structure
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

export const validatePasswordStrength = (password: string): PasswordValidation => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

export const signUp = async (email: string, password: string, nickname: string) => {
  try {
    console.log('Attempting sign up for:', email);
    
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

    // Sign up with Supabase
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          nickname: nickname.trim()
        }
      }
    });

    if (error) {
      console.error('Supabase sign up error:', error);
      throw error;
    }

    console.log('Sign up response:', { 
      user: !!data.user, 
      session: !!data.session,
      needsConfirmation: !data.session && !!data.user
    });

    // Check if user was created but needs email confirmation
    if (data.user && !data.session) {
      // User was created but needs email confirmation
      return { 
        data: {
          ...data,
          needsEmailConfirmation: true
        }, 
        error: null 
      };
    }

    return { data, error: null };
  } catch (error: any) {
    console.error('Sign up error:', error);
    return { data: null, error };
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    console.log('Attempting sign in for:', email);
    
    // Validate inputs
    if (!validateEmail(email)) {
      throw new Error('Please enter a valid email address');
    }

    if (!password) {
      throw new Error('Please enter your password');
    }

    // Sign in with Supabase - this will create a new session in this tab
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });

    if (error) {
      console.error('Supabase sign in error:', error);
      // Provide more helpful error messages
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Invalid email or password. Please check your credentials and try again.');
      } else if (error.message.includes('Email not confirmed')) {
        throw new Error('Please check your email and click the confirmation link before signing in.');
      } else {
        throw error;
      }
    }

    console.log('Sign in successful:', { user: !!data.user, session: !!data.session });
    return { data, error: null };
  } catch (error: any) {
    console.error('Sign in error:', error);
    return { data: null, error };
  }
};

export const signOut = async () => {
  try {
    console.log('Attempting sign out for this tab only');
    
    // Sign out with local scope to only affect this tab/window
    // This allows other tabs/windows to maintain their sessions
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error) {
      console.error('Supabase sign out error:', error);
      // Don't throw error, we'll handle cleanup anyway
    }
    
    // Clear this tab's session storage
    try {
      const keysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.includes('supabase')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => sessionStorage.removeItem(key));
      console.log('Cleared tab-specific session storage');
    } catch (storageError) {
      console.warn('Error clearing session storage:', storageError);
    }
    
    console.log('Sign out successful for this tab');
    return { error: null };
  } catch (error: any) {
    console.error('Sign out error:', error);
    return { error };
  }
};

export const resetPassword = async (email: string) => {
  try {
    if (!validateEmail(email)) {
      throw new Error('Please enter a valid email address');
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`
    });

    if (error) {
      throw error;
    }

    return { error: null };
  } catch (error: any) {
    console.error('Password reset error:', error);
    return { error };
  }
};

export const changePassword = async (currentPassword: string, newPassword: string) => {
  try {
    console.log('Attempting password change');
    
    // Validate new password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.errors.join('. '));
    }

    // First, verify the current password by attempting to sign in
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      throw new Error('User not found. Please sign in again.');
    }

    // Verify current password by attempting to sign in
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword
    });

    if (verifyError) {
      if (verifyError.message.includes('Invalid login credentials')) {
        throw new Error('Current password is incorrect');
      } else {
        throw new Error('Failed to verify current password');
      }
    }

    // If verification successful, update to new password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (updateError) {
      console.error('Password update error:', updateError);
      throw updateError;
    }

    console.log('Password changed successfully');
    return { error: null };
  } catch (error: any) {
    console.error('Change password error:', error);
    return { error };
  }
};

export const updateProfile = async (updates: { nickname?: string; bio?: string; avatar_url?: string }) => {
  try {
    console.log('Updating profile:', updates);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not found. Please sign in again.');
    }

    // Update user_profiles table
    const { error } = await supabase
      .from('user_profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (error) {
      console.error('Profile update error:', error);
      throw error;
    }

    console.log('Profile updated successfully');
    return { error: null };
  } catch (error: any) {
    console.error('Update profile error:', error);
    return { error };
  }
};

export const deleteAccount = async () => {
  try {
    console.log('Attempting account deletion');
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not found. Please sign in again.');
    }

    // Call the cleanup function to remove all user data including friendships
    console.log('Cleaning up user data and friendships...');
    const { error: cleanupError } = await supabase.rpc('cleanup_user_account', {
      user_id_to_delete: user.id
    });

    if (cleanupError) {
      console.error('Cleanup error:', cleanupError);
      // Continue with deletion even if cleanup fails
    }

    // Delete the user from auth.users (this will trigger the deletion trigger)
    // Note: In production, this would typically be done via an admin function
    // For now, we'll just sign out the user and mark their profile as inactive
    
    // Mark user profile as inactive
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (profileError) {
      console.error('Profile deactivation error:', profileError);
    }

    // Sign out the user from all sessions
    const { error: signOutError } = await supabase.auth.signOut({ scope: 'global' });
    
    if (signOutError) {
      console.error('Sign out error during deletion:', signOutError);
      throw signOutError;
    }

    console.log('Account deletion process completed');
    return { error: null };
  } catch (error: any) {
    console.error('Delete account error:', error);
    return { error };
  }
};

export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      throw error;
    }

    return { user, error: null };
  } catch (error: any) {
    console.error('Get current user error:', error);
    return { user: null, error };
  }
};

export const getCurrentUserProfile = async () => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.log('No user found for profile fetch');
      return null;
    }

    console.log('Fetching profile for user:', user.id);

    // Try to get the profile with retries for new users
    let profile = null;
    let attempts = 0;
    const maxAttempts = 3;

    while (!profile && attempts < maxAttempts) {
      attempts++;
      console.log(`Profile fetch attempt ${attempts}/${maxAttempts}`);

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error(`Profile fetch error (attempt ${attempts}):`, error);
        
        if (error.code === 'PGRST116') {
          // Profile not found - might still be creating
          if (attempts < maxAttempts) {
            console.log('Profile not found, waiting before retry...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          } else {
            console.log('Profile not found after all attempts, might need manual creation');
            return null;
          }
        } else {
          // Other error
          console.error('Profile fetch failed with error:', error);
          return null;
        }
      } else {
        profile = data;
        console.log('Profile fetched successfully:', profile);
      }
    }

    return profile;
  } catch (error) {
    console.error('Get user profile error:', error);
    return null;
  }
};

// Function to resend confirmation email
export const resendConfirmation = async (email: string) => {
  try {
    if (!validateEmail(email)) {
      throw new Error('Please enter a valid email address');
    }

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim()
    });

    if (error) {
      throw error;
    }

    return { error: null };
  } catch (error: any) {
    console.error('Resend confirmation error:', error);
    return { error };
  }
};

// Export a simple auth service object with all functions
export const authService = {
  validateEmail,
  validatePasswordStrength,
  signUp,
  signIn,
  signOut,
  resetPassword,
  changePassword,
  updateProfile,
  deleteAccount,
  getCurrentUser,
  getCurrentUserProfile,
  resendConfirmation
};