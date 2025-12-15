# 🎮 Rabhne Games - ربحني جيمز

> منصة الألعاب العربية الأولى لربح النقاط والجوائز الحقيقية

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-10-orange)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-cyan)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-black)](https://vercel.com/)

## ✨ Features

### 🎯 Core Features
- **🎮 Multi-Source Games**: Ready for GameMonetize, Custom, and Partner integrations
- **💰 Real Earning System**: 1 point per minute, 10,000 points = $1 USD
- **🏦 USDT TRC20 Withdrawals**: Secure cryptocurrency withdrawals
- **👤 User Dashboard**: Complete profile and transaction management
- **🛡️ Admin Panel**: Full administrative control
- **📱 PWA Ready**: Installable progressive web app

### 🎨 Design & UX
- **🌙 Premium Dark Theme**: Modern design with neon accents
- **🔄 RTL Arabic First**: Native right-to-left support
- **📱 Fully Responsive**: Desktop sidebar + mobile bottom navigation
- **⚡ Fast Loading**: Optimized performance with skeleton loaders
- **🎭 Smooth Animations**: Framer Motion powered transitions

### 🔒 Security & Performance
- **🛡️ Firebase Security Rules**: Comprehensive data protection
- **🔐 Authentication**: Google OAuth + Email/Password
- **⚡ React Query**: Smart caching and state management
- **🚀 Next.js 14**: Latest App Router with TypeScript
- **📊 Real-time Updates**: Live points and session tracking

## 🏗️ Architecture

### 📁 Project Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication pages
│   ├── admin/             # Admin panel
│   ├── games/             # Games listing
│   └── game/[id]/         # Individual game pages
├── components/            # Reusable components
│   ├── ui/                # Design system components
│   ├── layout/            # Layout components
│   ├── auth/              # Authentication components
│   └── game/              # Game-specific components
├── lib/                   # Utilities and configurations
├── types/                 # TypeScript type definitions
└── data/                  # Mock data and constants

functions/                 # Firebase Cloud Functions
├── src/
│   └── index.ts          # Withdraw and admin functions

public/                    # Static assets
├── manifest.json         # PWA manifest
├── robots.txt            # SEO configuration
└── icons/                # App icons
```

### 🎮 Multi-Source Game Architecture
```typescript
interface Game {
  id: string
  title: string
  titleAr: string
  provider: 'GameMonetize' | 'Custom' | 'Partner' | 'Mock'
  sourceType: 'iframe' | 'html5' | 'flash' | 'unity'
  embedUrl: string
  category: GameCategory
  // ... other properties
}
```

**Phase 1**: Mock games with prepared architecture
**Phase 2**: Easy integration with real providers

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Firebase project
- Vercel account (optional)

### Installation
```bash
# Clone repository
git clone https://github.com/your-repo/rabhne-games.git
cd rabhne-games

# Install dependencies
npm install
cd functions && npm install && cd ..

# Setup environment
cp .env.example .env.local
# Fill in your Firebase configuration

# Run development server
npm run dev
```

### Firebase Setup
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login and initialize
firebase login
firebase init

# Deploy Firestore rules and functions
firebase deploy --only firestore,functions
```

## 💰 Points & Earning System

### Earning Rules
- **1 point per minute** of active gameplay
- **Daily limit**: 2,880 points (48 hours worth)
- **Conversion rate**: 10,000 points = $1 USD
- **Minimum withdrawal**: 20,000 points ($2)

### Session Tracking
- Real-time session monitoring
- Heartbeat system (60-second intervals)
- Automatic pause on tab switch
- Fraud prevention ready

### Withdrawal Process
1. User requests withdrawal (USDT TRC20)
2. Points locked automatically
3. Admin reviews and approves
4. Payment processed manually
5. Transaction recorded

## 🛡️ Security Features

### Firebase Security Rules
```javascript
// Users can only modify their own data (except points)
allow update: if request.auth.uid == userId &&
  !('points' in request.resource.data.diff(resource.data));

// Only Cloud Functions can create transactions
allow create: if false;

// Admins have elevated permissions
allow read: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
```

### Data Protection
- Points can only be modified by Cloud Functions
- Atomic transactions for withdrawals
- Admin-only access to sensitive operations
- Comprehensive audit trail

## 🎨 Design System

### Colors
```css
primary: #0ea5e9 (Blue)
secondary: #a855f7 (Purple)
dark: #0f172a to #1e293b (Gradient)
```

### Components
- **Button**: 4 variants (primary, secondary, ghost, danger)
- **Card**: Elevated design with hover effects
- **Badge**: Status indicators
- **Skeleton**: Loading states
- **EmptyState**: No data scenarios

### Responsive Design
- **Desktop**: Header + Sidebar layout
- **Mobile**: Bottom navigation
- **Tablet**: Adaptive layout

## 🔧 Development

### Available Scripts
```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint check
npm run type-check   # TypeScript check
```

### Environment Variables
```bash
# Firebase Client
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
# ... other Firebase config

# Firebase Admin (Server-side)
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=

# App Config
NEXT_PUBLIC_APP_URL=https://rabhne.online
```

## 📱 PWA Features

### Installable App
- Custom app icons (72x72 to 512x512)
- Splash screen configuration
- Standalone display mode
- Arabic RTL support

### Offline Capability
- Service worker ready
- Critical resources cached
- Graceful offline experience

## 🎯 Roadmap

### Phase 1 (Current) ✅
- [x] Complete UI/UX implementation
- [x] Authentication system
- [x] Mock games with earning simulation
- [x] Withdraw request system
- [x] Admin panel
- [x] PWA configuration

### Phase 2 (Next)
- [ ] GameMonetize API integration
- [ ] Real-time earning system
- [ ] Advanced fraud prevention
- [ ] Push notifications
- [ ] Analytics dashboard
- [ ] Multi-language support

### Phase 3 (Future)
- [ ] Mobile app (React Native)
- [ ] Tournaments and leaderboards
- [ ] Social features
- [ ] Referral system
- [ ] Advanced game categories

## 🌐 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### Domain Configuration
- Primary: `rabhne.online`
- Redirect: `www.rabhne.online` → `rabhne.online`
- SSL: Automatic via Vercel

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Code Standards
- TypeScript strict mode
- ESLint + Prettier
- Conventional commits
- Component documentation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

- **Email**: support@rabhne.online
- **Website**: https://rabhne.online
- **Documentation**: [Wiki](https://github.com/your-repo/rabhne-games/wiki)

## 🙏 Acknowledgments

- **Next.js Team** for the amazing framework
- **Firebase Team** for backend services
- **Tailwind CSS** for the utility-first CSS
- **Vercel** for seamless deployment
- **Arabic Gaming Community** for inspiration

---

<div align="center">

**🎮 Built with ❤️ for the Arabic Gaming Community**

[Live Demo](https://rabhne.online) • [Documentation](https://github.com/your-repo/rabhne-games/wiki) • [Report Bug](https://github.com/your-repo/rabhne-games/issues)

</div>" #   D e p l o y m e n t   T e s t   M o n   1 2 / 1 5 / 2 0 2 5   1 1 : 5 6 : 5 6 . 0 9 "      
 