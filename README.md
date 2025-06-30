# Embr - Social Connection Platform

## 🌟 Project Overview

**Embr** is a minimalist social connection platform that reimagines digital communication through the metaphor of a hearth. Each user is represented as a flame on a shared hearth, with the flame's brightness indicating the strength of your connection and recent activity.

### Core Concept
- **Flames as Friends**: Each flame represents a person you care about
- **Visual Connection Strength**: Bright flames = active connections, dim flames = needs attention
- **Minimalist Design**: No endless threads, no noise - just meaningful moments
- **Hearth Metaphor**: A warm, inviting space where connections naturally grow

## 🛠️ Tech Stack

### Frontend
- **React 18.3.1** - Modern React with hooks and functional components
- **TypeScript 5.5.3** - Type-safe development with strict type checking
- **Vite 5.4.2** - Fast build tool and development server
- **Tailwind CSS 3.4.1** - Utility-first CSS framework for rapid UI development
- **Lucide React 0.344.0** - Beautiful, customizable icons

### Backend & Database
- **Supabase 2.39.0** - Open-source Firebase alternative
  - PostgreSQL database with real-time subscriptions
  - Built-in authentication and authorization
  - Row Level Security (RLS) for data protection
  - Real-time messaging capabilities

### Development Tools
- **ESLint 9.9.1** - Code linting and quality enforcement
- **PostCSS 8.4.35** - CSS processing and optimization
- **Autoprefixer 10.4.18** - Automatic vendor prefixing

## ✨ Key Features

### 🔥 The Hearth Experience
- **Interactive Hearth Interface** - Navigate a beautiful, animated hearth where each flame represents a friend
- **Flame Visualization** - Dynamic flames that respond to connection strength and activity
- **Zoom & Pan Controls** - Explore your social connections with intuitive navigation
- **Visual Connection Strength** - Flames brighten with active connections, dim with neglected ones
- **Dying Flame Alerts** - Visual indicators when connections need attention

### 💬 Real-time Messaging
- **Instant Messaging** between connected users with real-time updates
- **Conversation Caching** - Fast loading of message history
- **Unread Indicators** - Green dots on flames with new messages
- **Typing Indicators** - See when friends are composing messages
- **Message Persistence** - Conversations saved and accessible across sessions

### 👥 Social Connection Management
- **Friend System** - Add, remove, and manage your connections
- **Profile Customization** - Personalize your profile with avatars and bios
- **Connection Strength Tracking** - Automatic calculation based on interaction frequency
- **Activity Monitoring** - Track when friends are active and engaged
- **Friend Discovery** - Find and connect with new people

### 🔐 Security & Authentication
- **Secure Authentication** - Email/password with comprehensive validation
- **Email Verification** - Account security with email confirmation
- **Password Reset** - Secure token-based password recovery
- **Rate Limiting** - Protection against brute force attacks
- **Session Management** - Automatic token refresh and secure sessions

### 🎨 User Experience
- **Responsive Design** - Seamless experience across desktop and mobile
- **Dark Theme** - Consistent, eye-friendly dark aesthetic
- **Smooth Animations** - Fluid transitions and interactive elements
- **Accessibility** - Keyboard navigation and screen reader support
- **Device Compatibility** - Smart warnings for unsupported platforms

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation
```bash
# Clone the repository
git clone [repository-url]
cd ember-app

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Run database migrations
# Execute migration files in supabase/migrations/

# Start development server
npm run dev
```

### Environment Variables
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## 📱 Device Support

### Supported Platforms
- **Desktop**: Windows, Linux, Android (Chrome, Firefox, Edge)
- **Mobile**: Android devices with modern browsers

### Limited Support
- **Apple Devices**: iOS, macOS, Safari (shows compatibility warning)
- **Legacy Browsers**: Internet Explorer, older versions

## 🎯 Project Vision

### Mission
Embr aims to simplify digital social connection by removing the noise and focusing on what matters most - meaningful relationships. Through the hearth metaphor, users can visually understand and nurture their connections in an intuitive, beautiful way.

### Core Values
1. **Simplicity** - Clean, distraction-free interface
2. **Connection** - Meaningful, visual representation of relationships
3. **Authenticity** - Real-time, genuine interactions
4. **Accessibility** - Inclusive design for diverse users
5. **Privacy** - Secure, user-controlled data

### Future Roadmap
- **Group Conversations** - Multi-user flame circles for group chats
- **Media Sharing** - Photo and file sharing capabilities
- **Voice Messages** - Audio communication features
- **Mobile Apps** - Native iOS and Android applications
- **Advanced Analytics** - Connection strength insights and recommendations
- **Custom Hearth Themes** - Personalized visual experiences

## 🤝 Contributing

### Development Guidelines
- Follow TypeScript best practices
- Use functional components with hooks
- Maintain consistent code style with ESLint
- Write meaningful commit messages
- Test changes across different devices

### Code Structure
- **Components**: Reusable, single-responsibility components
- **Hooks**: Custom hooks for shared logic
- **Types**: Comprehensive TypeScript interfaces
- **Utils**: Pure functions for business logic
- **Styles**: Tailwind classes with custom design tokens

## 📄 License

This project is part of the Embr platform and follows the same licensing terms. All rights reserved.

---

**Embr** - Where connection glows, and conversation fuels the flame. 🔥