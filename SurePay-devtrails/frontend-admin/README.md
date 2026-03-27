# Admin Dashboard - Complete Frontend

## Features Implemented

### 1. **Authentication System**
- Login page with email/password
- JWT token management with localStorage
- Auto redirect to login if token expires
- Profile menu with logout

### 2. **Dashboard**
- Real-time metrics display (claims, approvals, fraud blocks, payouts)
- Claims trend chart (Bar chart)
- Claims status distribution (Pie chart)
- API integration with mock data fallback

### 3. **Claims Management**
- List all claims with pagination (5, 10, 25, 50 rows)
- Filter by status (Filed, Under Review, Approved, Rejected, Paid)
- Filter by disruption type (Rain, Heat, AQI, Curfew, Outage)
- Click claim ID to view details in dialog
- Approve/Reject claims with reason/notes
- Color-coded fraud score indicators
- Risk assessment visualization

### 4. **Policies Management**
- List all worker policies with pagination
- Filter by status (Active, Expired, Cancelled)
- Display premium amounts with currency formatting
- Show coverage period (start/end dates)
- Track claims filed per policy

### 5. **Workers Management**
- List all workers with pagination
- Filter by KYC status (Verified, Under Review, Rejected, Pending)
- Filter by platform (Zomato, Swiggy, Blinkit)
- Display risk scores with color-coded indicators
- Show active policies count

### 6. **Components**
- **TopBar**: Fixed header with logout
- **Sidebar**: Fixed navigation drawer
- **ActionDialog**: Reusable approval/rejection dialog
- **ClaimDetailsDialog**: Detailed claim inspection modal
- **ConfirmDialog**: Generic confirmation dialog

### 7. **Utilities & Hooks**
- **helpers.js**: Date formatting, currency conversion, color utilities
- **useTable.js**: Pagination and filter hooks
- **api.js**: Centralized API client with interceptors

### 8. **Styling & UX**
- Material-UI components throughout
- Professional color scheme (#1e3a8a primary)
- Responsive grid layout
- Hover effects and smooth transitions
- Error handling and loading states

## Setup & Running

```bash
# Install dependencies
cd frontend-admin
npm install

# Create .env file (already included)
cat .env.example > .env

# Start development server
npm start
```

## Directory Structure

```
frontend-admin/
├── src/
│   ├── components/
│   │   ├── Sidebar.js
│   │   ├── TopBar.js
│   │   ├── ActionDialog.js
│   │   ├── ClaimDetailsDialog.js
│   │   └── ConfirmDialog.js
│   ├── pages/
│   │   ├── Login.js
│   │   ├── Dashboard.js
│   │   ├── ClaimsManagement.js
│   │   ├── PoliciesManagement.js
│   │   └── WorkersManagement.js
│   ├── services/
│   │   └── api.js
│   ├── store/
│   │   └── authStore.js
│   ├── hooks/
│   │   └── useTable.js
│   ├── utils/
│   │   └── helpers.js
│   ├── App.js
│   ├── index.js
│   └── index.css
├── public/
│   └── index.html
├── package.json
├── .env.example
└── .env
```

## API Integration Points

The frontend expects these endpoints from the backend:

- `POST /auth/admin-login` - Admin login
- `GET /admin/dashboard` - Dashboard metrics
- `GET /admin/claims` - List claims with filters
- `POST /claims/{id}/approve` - Approve claim
- `POST /claims/{id}/reject` - Reject claim
- `GET /admin/policies` - List policies
- `GET /admin/workers` - List workers

## Demo Credentials

```
Email: admin@gigguard.io
Password: demo123
```

## Next Steps

1. Backend API implementation (if not done)
2. Database seeding with demo data
3. WebSocket integration for real-time updates
4. Export reports feature
5. Advanced analytics and dashboards
6. Mobile responsive optimization
7. Dark mode theme option
