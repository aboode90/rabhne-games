# 🚀 Rabhne Games - Deployment Guide

## Prerequisites

1. **Node.js 18+** installed
2. **Firebase CLI** installed: `npm install -g firebase-tools`
3. **Vercel CLI** installed: `npm install -g vercel`
4. **Firebase Project** created
5. **Domain** connected to Vercel (rabhne.online)

## 🔧 Setup Instructions

### 1. Install Dependencies

```bash
npm install
cd functions && npm install && cd ..
```

### 2. Firebase Setup

#### Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create new project: `rabhne-games`
3. Enable Authentication (Google + Email/Password)
4. Enable Firestore Database
5. Enable Cloud Functions

#### Configure Environment Variables
1. Copy `.env.example` to `.env.local`
2. Fill in Firebase configuration from project settings
3. Generate Firebase Admin SDK private key for server-side operations

```bash
# Example .env.local
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=rabhne-games.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=rabhne-games
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=rabhne-games.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef

FIREBASE_ADMIN_PROJECT_ID=rabhne-games
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@rabhne-games.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"

NEXT_PUBLIC_APP_URL=https://rabhne.online
```

#### Deploy Firestore Rules and Functions
```bash
# Login to Firebase
firebase login

# Initialize Firebase (if not done)
firebase init

# Deploy Firestore rules and indexes
firebase deploy --only firestore

# Deploy Cloud Functions
firebase deploy --only functions
```

### 3. Create Admin User

#### Set Admin Custom Claims
```bash
# Install Firebase Admin SDK globally for quick setup
npm install -g firebase-admin

# Create admin user script (run once)
node -e "
const admin = require('firebase-admin');
const serviceAccount = require('./path-to-service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Replace with your admin email
const adminEmail = 'admin@rabhne.online';

admin.auth().getUserByEmail(adminEmail)
  .then(user => {
    return admin.auth().setCustomUserClaims(user.uid, { admin: true });
  })
  .then(() => {
    console.log('Admin claims set successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
"
```

### 4. Vercel Deployment

#### Connect Domain
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Import GitHub repository or deploy directly
3. Add custom domain: `rabhne.online` and `www.rabhne.online`
4. Configure environment variables in Vercel dashboard

#### Deploy to Vercel
```bash
# Login to Vercel
vercel login

# Deploy
vercel --prod

# Or use GitHub integration for automatic deployments
```

### 5. Domain Configuration

#### DNS Settings (Hostinger)
```
Type: A
Name: @
Value: 76.76.19.61 (Vercel IP)

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

#### Vercel Domain Settings
1. Add both `rabhne.online` and `www.rabhne.online`
2. Set `rabhne.online` as primary
3. Enable automatic HTTPS

## 🧪 Testing

### Local Development
```bash
# Start Next.js development server
npm run dev

# Start Firebase emulators (optional)
firebase emulators:start
```

### Production Testing
1. Test authentication (Google + Email)
2. Test game loading and session tracking
3. Test withdraw request flow
4. Test admin panel functionality
5. Test PWA installation
6. Test mobile responsiveness

## 📊 Monitoring

### Firebase Console
- Monitor authentication users
- Check Firestore usage
- Monitor Cloud Functions logs
- Review security rules

### Vercel Dashboard
- Monitor deployment status
- Check performance metrics
- Review function logs
- Monitor bandwidth usage

## 🔒 Security Checklist

- [ ] Firestore security rules deployed
- [ ] Environment variables secured
- [ ] Admin custom claims configured
- [ ] HTTPS enabled on domain
- [ ] CSP headers configured
- [ ] Rate limiting implemented (Phase 2)

## 🚀 Go Live Checklist

- [ ] Firebase project configured
- [ ] Cloud Functions deployed
- [ ] Firestore rules and indexes deployed
- [ ] Admin user created with custom claims
- [ ] Environment variables configured
- [ ] Domain connected to Vercel
- [ ] SSL certificate active
- [ ] PWA manifest working
- [ ] Mobile responsiveness tested
- [ ] All authentication methods working
- [ ] Withdraw flow tested
- [ ] Admin panel accessible

## 📞 Support

For deployment issues:
- Check Firebase Console logs
- Check Vercel deployment logs
- Review environment variables
- Test locally first

## 🔄 Updates

### Code Updates
```bash
# Pull latest changes
git pull origin main

# Deploy to Vercel (automatic with GitHub integration)
vercel --prod

# Update Cloud Functions if needed
firebase deploy --only functions
```

### Database Updates
```bash
# Deploy new Firestore rules
firebase deploy --only firestore:rules

# Deploy new indexes
firebase deploy --only firestore:indexes
```

---

**🎮 Rabhne Games is now live at https://rabhne.online**

Built with ❤️ for the Arabic gaming community.