# GigGuard Mobile App

A React Native mobile application for delivery workers to manage parametric insurance policies and claims.

## Features

### 📊 Dashboard
- Overview of active policies and claims
- Quick stats on payouts and pending claims
- Recent claims activity
- Weather alerts and notifications

### 💼 Policies Management
- View all active insurance policies
- Check coverage periods and premium amounts
- Track maximum weekly payouts
- View policy details and history

### 📋 Claims Management
- File new insurance claims
- Track claim status (PENDING, APPROVED, REJECTED)
- View payout history
- Fraud assessment insights
- Filter claims by status

### 👤 Profile
- View worker information
- Platform and zone details
- Risk score tracking
- Logout and account management

## Tech Stack

- **React Native** - Cross-platform mobile framework
- **Expo** - Development and deployment platform
- **Redux Toolkit** - State management
- **React Navigation** - Navigation system
- **Axios** - HTTP client
- **React Native Paper** - UI components
- **Material Icons** - Icon library

## Project Structure

```
src/
├── App.js                 # Main navigation setup
├── index.js              # Redux provider wrapper
├── screens/              # Screen components
│   ├── LoginScreen.js
│   ├── DashboardScreen.js
│   ├── PoliciesScreen.js
│   ├── ClaimsScreen.js
│   ├── ProfileScreen.js
│   ├── PolicyDetailScreen.js
│   ├── ClaimDetailScreen.js
│   └── FileClaimScreen.js
├── store/                # Redux store
│   ├── store.js
│   ├── authSlice.js
│   ├── policiesSlice.js
│   └── claimsSlice.js
└── services/             # API clients
    └── api.js
```

## Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn
- Expo CLI

### Installation

1. Navigate to mobile-app directory:
```bash
cd mobile-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Run on desired platform:
   - **iOS**: Press `i`
   - **Android**: Press `a`
   - **Web**: Press `w`

## API Configuration

Update `src/services/api.js` with your backend API URL:

```javascript
const API_BASE_URL = 'http://your-api-url/api/v1';
```

## Authentication

The app uses JWT-based authentication. Tokens are stored securely using Expo SecureStore.

### Demo Credentials
- **Phone**: 9876543210
- **Password**: demo123

## Features in Development

- [ ] Push notifications
- [ ] Offline mode
- [ ] Biometric authentication
- [ ] Document upload
- [ ] Chat support
- [ ] Advanced analytics

## Build & Deploy

### For iOS
```bash
eas build --platform ios
```

### For Android
```bash
eas build --platform android
```

## Troubleshooting

### Connection Issues
- Ensure backend API is running on `http://localhost:8000`
- Check `API_BASE_URL` in `src/services/api.js`
- Verify network connectivity

### Redux State Issues
- Clear app cache: `npx react-native start --reset-cache`
- Check Redux DevTools browser extension

### Navigation Issues
- Ensure all screens are properly imported
- Check navigation param names match screen definitions

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

This project is part of GigGuard - AI-powered parametric insurance for gig workers.

## Support

For issues and questions, please contact support@gigguard.com
