# Embr - Comprehensive Authentication System

A secure, production-ready authentication system built with Supabase and React.

## Features

### 🔐 Authentication
- **Email & Password Sign Up/In** with comprehensive validation
- **Email Verification** required before account activation
- **Password Reset** functionality with secure token handling
- **Rate Limiting** to prevent brute force attacks
- **Session Management** with automatic refresh

### 🛡️ Security Features
- **Strong Password Requirements**:
  - Minimum 8 characters
  - At least 1 uppercase letter
  - At least 1 lowercase letter
  - At least 1 number
  - At least 1 special character
  - Protection against common passwords
- **Email Validation** with proper format checking
- **Terms & Conditions** acceptance tracking with timestamps
- **Authentication Attempt Logging** for security monitoring
- **JWT Token Management** with automatic refresh
- **Row Level Security (RLS)** on all database tables

### 📊 Database Schema
- `user_profiles` - Extended user information
- `user_agreements` - Terms acceptance tracking
- `auth_attempts` - Failed login monitoring
- `password_reset_tokens` - Secure password reset
- `user_sessions` - Enhanced session management

## Setup Instructions

### 1. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor in your Supabase dashboard
3. Run the migration file: `supabase/migrations/create_auth_system.sql`
4. Configure authentication settings:
   - Go to Authentication > Settings
   - Disable "Enable email confirmations" if you want immediate access (not recommended for production)
   - Set up email templates for verification and password reset

### 2. Environment Variables

1. Copy `.env.example` to `.env`
2. Fill in your Supabase project details:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

### 3. Email Configuration (Production)

For production, configure SMTP settings in Supabase:
1. Go to Authentication > Settings
2. Configure SMTP settings with your email provider
3. Customize email templates for your brand

## Usage

### Basic Authentication

```tsx
import { AuthProvider, useAuth } from './components/auth/AuthProvider';
import { AuthPage } from './components/auth/AuthPage';

function App() {
  return (
    <AuthProvider>
      <AuthPage />
    </AuthProvider>
  );
}
```

### Using Authentication in Components

```tsx
import { useAuth } from './components/auth/AuthProvider';

function MyComponent() {
  const { user, profile, loading, signOut } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please sign in</div>;

  return (
    <div>
      <h1>Welcome, {profile?.nickname}!</h1>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

### Manual Authentication Functions

```tsx
import { signUp, signIn, signOut, requestPasswordReset } from './lib/auth';

// Sign up with validation
const { data, error } = await signUp(email, password, nickname, agreeToTerms);

// Sign in with rate limiting
const { data, error } = await signIn(email, password);

// Request password reset
const { error } = await requestPasswordReset(email);
```

## Security Features

### Rate Limiting
- **Login**: 5 attempts per 15 minutes
- **Sign Up**: 5 attempts per 15 minutes  
- **Password Reset**: 3 attempts per 60 minutes

### Password Requirements
All passwords must meet these criteria:
- Minimum 8 characters
- At least 1 uppercase letter (A-Z)
- At least 1 lowercase letter (a-z)
- At least 1 number (0-9)
- At least 1 special character (!@#$%^&*)
- Not in common password list

### Data Protection
- All sensitive data encrypted at rest
- Row Level Security (RLS) enabled on all tables
- User data isolated by authentication
- Secure session handling with automatic cleanup

## Database Functions

The system includes several PostgreSQL functions for enhanced security:

- `validate_email()` - Email format validation
- `validate_password_strength()` - Password strength checking
- `check_rate_limit()` - Rate limiting enforcement
- `log_auth_attempt()` - Authentication attempt logging
- `cleanup_expired_data()` - Automatic cleanup of expired tokens

## Monitoring & Analytics

Track authentication attempts and user behavior:

```tsx
import { getUserAuthAttempts } from './lib/auth';

// Get user's recent authentication attempts
const attempts = await getUserAuthAttempts(10);
```

## Production Considerations

1. **Email Configuration**: Set up proper SMTP for email delivery
2. **Rate Limiting**: Monitor and adjust rate limits based on usage
3. **Session Management**: Configure appropriate session timeouts
4. **Monitoring**: Set up alerts for suspicious authentication patterns
5. **Backup**: Regular database backups for user data protection

## Support

For issues or questions:
1. Check the Supabase documentation
2. Review the authentication logs in your dashboard
3. Monitor rate limiting and adjust as needed

## License

This authentication system is part of the Embr project and follows the same licensing terms.