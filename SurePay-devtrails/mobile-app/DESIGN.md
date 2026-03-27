# GigGuard Mobile App - Design Documentation

## Overview

GigGuard Mobile App is a React Native application built with Expo, designed specifically for delivery workers to manage parametric insurance policies and file claims for disruption-related income loss.

## Design Principles

### 1. **Mobile-First UX**
- Optimized for small screens and touch interactions
- Fast loading and offline-capable
- Intuitive navigation patterns
- Minimal data usage

### 2. **Accessibility**
- High contrast colors for visibility
- Large touch targets (min 48x48dp)
- Clear labels and icons
- Keyboard navigation support

### 3. **Performance**
- Lazy loading of screens
- Efficient state management with Redux
- Async operations with loading states
- Image optimization

## Architecture

### State Management (Redux)

**Auth Slice**
- `isAuthenticated`: Boolean flag
- `user`: User object with worker details
- `token`: JWT auth token
- `loading`: Loading state
- `error`: Error messages

**Policies Slice**
- `items`: Array of policy objects
- `selectedPolicy`: Currently viewed policy
- `loading`: Loading state

**Claims Slice**
- `items`: Array of claim objects
- `selectedClaim`: Currently viewed claim
- `loading`: Loading state

### API Service

Centralized API client with:
- Base URL configuration
- JWT token injection in headers
- Request/response interceptors
- Error handling and timeouts

## Screen Hierarchy

```
Root (Redux Provider)
├── Login Screen (Unauthenticated)
└── Main App (Authenticated)
    ├── Dashboard
    │   └── Policy Detail
    ├── Policies
    │   └── Policy Detail
    ├── Claims
    │   ├── Claim Detail
    │   └── File Claim
    └── Profile
```

## Screen Descriptions

### Login Screen
**Purpose**: Authenticate workers
**Features**:
- Phone number input with validation
- Password authentication
- Register/Login toggle
- Demo credentials display
- Error handling

### Dashboard Screen
**Purpose**: Home screen with overview
**Features**:
- Greeting with dynamic user name
- Statistics cards:
  - Active policies count
  - Pending claims count
  - Approved claims count
  - Total payouts amount
- Weather information (when available)
- Recent claims list (3 items)
- Quick action FAB to file claim
- Pull-to-refresh functionality

### Policies Screen
**Purpose**: List all policies
**Features**:
- List of active policies
- Premium and coverage display
- Status indicator with color coding
- Coverage period information
- Max payout display
- View details navigation
- Empty state handling

### Policy Detail Screen
**Purpose**: Show detailed policy information
**Features**:
- Policy coverage dates
- Days remaining calculation
- Max weekly payout
- Status badge
- Payout summary
- Recent claims history (5 items)
- Claim type and amount
- Status color coding

### Claims Screen
**Purpose**: Manage all claims
**Features**:
- Sortable list of claims
- Filter by status (ALL, PENDING, APPROVED, REJECTED)
- Claim type and amount display
- Status indicator
- Fraud score display
- File new claim button
- Refresh functionality

### Claim Detail Screen
**Purpose**: View claim details and assessment
**Features**:
- Claim ID and disruption type
- Timeline display
- Amount information (claimed vs approved)
- Payout status tracking
- Fraud assessment:
  - Visual progress bar
  - Risk level indicator
  - Color-coded risk assessment
- Rejection reason (if applicable)
- Support contact section

### File Claim Screen
**Purpose**: Submit new claim
**Features**:
- Policy selection modal
- Disruption type selection (6 types):
  - Heavy Rain
  - Extreme Heat
  - Accident
  - App Crash
  - Curfew
  - Other
- Claimed amount input
- Optional description field
- Form validation
- Amount limit checking
- Success confirmation

### Profile Screen
**Purpose**: User settings and information
**Features**:
- Worker avatar and name
- Platform information
- Operating zone
- Risk score
- Account status
- Settings options:
  - Notifications
  - Privacy & Security
  - Help & Support
  - About GigGuard
- Logout functionality

## Color Scheme

- **Primary Blue**: #1976D2 (Headers, buttons, links)
- **Success Green**: #4CAF50 (Approved claims)
- **Warning Orange**: #FF9800 (Pending claims)
- **Error Red**: #F44336 (Rejected claims)
- **Background**: #f5f5f5 (Light gray)
- **Card**: #ffffff (White)
- **Text Primary**: #333333 (Dark gray)
- **Text Secondary**: #666666 (Medium gray)
- **Border**: #ddd or #f0f0f0 (Light gray)

## Typography

- **Titles**: FontSize 22-32, FontWeight bold
- **Section Titles**: FontSize 16-18, FontWeight bold
- **Labels**: FontSize 12-14, FontWeight 500-600
- **Body**: FontSize 14, Color #666

## Component Patterns

### Card Component
```
{
  backgroundColor: '#fff',
  borderRadius: 12,
  padding: 16,
  elevation: 2,
  marginVertical: 10
}
```

### Button Component
```
{
  flexible layout with icon + text
  borderRadius: 8
  paddingVertical: 12-14
  backgroundColor: #1976D2
}
```

### Status Badge
```
Color-coded backgrounds based on status:
- APPROVED: #4CAF50 (green)
- PENDING: #FF9800 (orange)
- REJECTED: #F44336 (red)
padding: 6-10px
borderRadius: 20
```

## Navigation Flow

1. **Unauthenticated User**
   - Login Screen → Register or Login
   - Success → Main App

2. **Authenticated User**
   - Main App (Dashboard visible)
   - Tab Navigation to other sections
   - Stack navigation within each tab
   - Detail screens push on stack

3. **Logout**
   - Profile Screen → Logout button
   - Clear auth state and token
   - Back to Login Screen

## Data Flow

1. **Login**
   - User enters credentials
   - API call to backend
   - Token stored in SecureStore
   - Redux auth state updated
   - Navigation to Main App

2. **Load Policies**
   - Dashboard/Policies screen mounted
   - API call to get policies
   - Redux state updated
   - Safe rendering with loading states

3. **File Claim**
   - User selects policy and disruption type
   - Enters amount and description
   - Form validation
   - API call to create claim
   - Claim added to Redux state
   - Navigation to Claims list
   - Success notification

## Performance Optimizations

1. **Lazy Loading**
   - Screens load only when navigated to
   - Images loaded on demand

2. **Memoization**
   - Components wrapped with React.memo
   - Redux selectors optimized

3. **Bundle Size**
   - Code splitting by screen
   - Minimal dependencies
   - Tree-shaking enabled

4. **Network**
   - Request timeout: 10 seconds
   - Retry logic in error handling
   - Compression enabled

## Testing Checklist

- [ ] Login/registration flow
- [ ] Policy listing and detail view
- [ ] Claim filing with validation
- [ ] Claim status filtering
- [ ] Profile information display
- [ ] Logout functionality
- [ ] Error handling for failed API calls
- [ ] Offline state handling
- [ ] Screen rotation/responsive layout
- [ ] Touch sensitivities

## Future Enhancements

1. **Phase 2**
   - Push notifications
   - Document upload for claims
   - Real-time claim status updates
   - Chat support integration

2. **Phase 3**
   - Offline-first architecture
   - Biometric authentication
   - Advanced analytics
   - ML-based claim recommendations

## Accessibility Compliance

- **WCAG 2.1 Level AA**
- Minimum touch targets: 48x48dp
- Color contrast ratio: 4.5:1 for text
- Screen reader support
- Keyboard navigation

## Deployment

### Build for iOS
```bash
eas build --platform ios --auto-submit
```

### Build for Android
```bash
eas build --platform android --auto-submit
```

### CI/CD Pipeline
- Automated tests on push
- Build on release branches
- Staging deployment before production
- Version bump automation

## Security Considerations

1. **Token Management**
   - JWT tokens in SecureStore
   - Token refresh on 401 response
   - Logout clears token

2. **Data Privacy**
   - HTTPS only
   - No sensitive data in logs
   - Local data encryption

3. **Code Security**
   - Input validation
   - XSS prevention
   - CSRF token handling

## Monitoring & Analytics

- Crash reporting (Sentry)
- Event tracking (GA)
- Performance monitoring
- Error logging

---

**Last Updated**: March 2026
**Version**: 0.1.0
**Status**: In Development
