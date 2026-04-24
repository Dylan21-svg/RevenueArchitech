# RevenueArchitect AI - Week 2: Shopify Integration

## Overview
Week 2 adds complete Shopify integration to the Sting Engine MVP, enabling OAuth authentication, Admin API access for theme data, automated fix injection, and persistent audit storage.

## Key Features Implemented

### 1. Shopify OAuth Handshake
- **Endpoint**: `POST /auth/initiate`
- **Callback**: `GET /auth/callback`
- **Scopes**: `read_themes`, `write_themes`, `read_content`, `write_content`
- **Storage**: Access tokens stored securely in PostgreSQL

### 2. Admin API Theme Access
- **Endpoint**: `GET /themes/{store_id}`
- **Functionality**: Fetch all themes from connected Shopify stores
- **Data**: Theme ID, name, role, and metadata

### 3. Fix Engine for CSS/Liquid Injection
- **Manual Fixes**: `POST /fix/{store_id}`
- **Auto Fixes**: `POST /fix/auto/{store_id}`
- **Types**:
  - CSS Injection: Direct stylesheet modifications
  - Liquid Injection: Template code injection
- **Smart Fixes**:
  - Thumb zone optimization (minimum touch targets)
  - Hero section enhancement
  - Accessibility improvements

### 4. Persistent Audit Storage
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Tables**:
  - `shopify_stores`: Store connections and tokens
  - `audits`: Complete audit history with artifacts
  - `theme_fixes`: Fix application tracking
- **Background Storage**: Audits stored asynchronously

## API Endpoints

### Authentication
```bash
# Initiate OAuth flow
curl -X POST http://localhost:8000/auth/initiate \
  -H "Content-Type: application/json" \
  -d '{"shop_domain": "your-store.myshopify.com"}'

# OAuth callback handled automatically
# Returns: {"store_id": 1, "message": "Shopify store connected successfully"}
```

### Theme Management
```bash
# Get themes for store
curl http://localhost:8000/themes/1

# Response:
{
  "themes": [
    {"id": "123456789", "name": "Dawn", "role": "main"},
    {"id": "987654321", "name": "Backup Theme", "role": "unpublished"}
  ]
}
```

### Fix Application
```bash
# Manual CSS fix
curl -X POST http://localhost:8000/fix/1 \
  -H "Content-Type: application/json" \
  -d '{
    "theme_id": "123456789",
    "fix_type": "css_injection",
    "css_injection": ".my-button { min-height: 44px !important; }"
  }'

# Auto-fix based on audit
curl -X POST http://localhost:8000/fix/auto/1 \
  -d "theme_id=123456789&audit_url=https://your-store.com"
```

### Enhanced Audit
```bash
# Run audit (now with DB storage)
curl -X POST http://localhost:8000/audit \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-store.com", "daily_ad_spend": 1000}'
```

## Database Schema

### Shopify Stores
```sql
CREATE TABLE shopify_stores (
    id SERIAL PRIMARY KEY,
    shop_domain VARCHAR UNIQUE NOT NULL,
    access_token VARCHAR NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Audits
```sql
CREATE TABLE audits (
    id SERIAL PRIMARY KEY,
    store_id INTEGER REFERENCES shopify_stores(id),
    url VARCHAR NOT NULL,
    raw_artifacts JSONB,
    audit_result JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Theme Fixes
```sql
CREATE TABLE theme_fixes (
    id SERIAL PRIMARY KEY,
    store_id INTEGER REFERENCES shopify_stores(id),
    theme_id VARCHAR NOT NULL,
    fix_type VARCHAR NOT NULL,
    original_content TEXT,
    modified_content TEXT,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Setup Instructions

### 1. Environment Variables
```bash
cp .env.example .env
# Edit .env with your Shopify app credentials
```

### 2. Shopify App Setup
1. Create a Shopify app in your Partner dashboard
2. Set redirect URI: `http://localhost:8000/auth/callback`
3. Copy API key and secret to `.env`

### 3. Database Setup
```bash
docker-compose up -d postgres
# Database tables created automatically on first run
```

### 4. Run Application
```bash
# Development
python main_week2.py

# Production
docker-compose up -d
```

## Fix Engine Details

### CSS Injection
- Targets: `assets/theme.css` or `assets/theme.scss`
- Injection point: End of file with `/* Sting Engine Fix */` comment
- Examples:
  - Button sizing: `min-height: 44px; min-width: 44px;`
  - Color contrast: Enhanced background/foreground colors
  - Spacing: Improved padding and margins

### Liquid Injection
- Targets: `templates/index.liquid`, `templates/product.liquid`
- Injection points:
  - `before_closing_body`: Before `</body>`
  - `after_opening_body`: After `<body>`
- Examples:
  - Hero section overlays
  - Conversion tracking scripts
  - Accessibility enhancements

### Auto-Fix Logic
- **Thumb Zone**: Applied when accessibility score < 0.7
- **Hero Optimization**: Applied when hero score is "Needs optimization"
- **Load Time**: CSS optimizations for slow-loading pages

## Security Considerations

### Token Storage
- Access tokens encrypted in database
- JWT tokens for API authentication (future enhancement)
- Environment variables for sensitive config

### API Rate Limiting
- 10 audits/minute for free tier
- Configurable via `API_RATE_LIMIT` environment variable

### Shopify Scopes
- Minimal required scopes for theme access
- No customer data access
- Read/write only for themes and content

## Testing

### Manual Testing
```bash
# Health check
curl http://localhost:8000/health

# Test OAuth flow (requires Shopify app setup)
# Test theme fetching
# Test fix application
```

### Database Verification
```bash
# Connect to postgres container
docker exec -it sting-postgres psql -U audit_user -d sting_engine

# Check tables
\dt

# View recent audits
SELECT url, created_at FROM audits ORDER BY created_at DESC LIMIT 5;
```

## Next Steps (Week 3+)
1. **Frontend Integration**: React dashboard for audit visualization
2. **Real-time Fixes**: WebSocket updates during fix application
3. **A/B Testing**: Compare fix performance metrics
4. **Multi-store Support**: Manage multiple Shopify stores per user
5. **Advanced Analytics**: Revenue attribution and ROI tracking

## Performance Targets
- ✅ OAuth handshake: <5s
- ✅ Theme fetching: <3s
- ✅ Fix injection: <10s
- ✅ Audit storage: <1s (background)
- ✅ API response: <30s (audit) + <5s (other endpoints)

## Risk Mitigation
✅ **Shopify API Limits**: Respect rate limits with exponential backoff
✅ **Theme Corruption**: Backup original content before modifications
✅ **Token Security**: Encrypted storage with rotation capability
✅ **Audit Reliability**: Background storage doesn't block audit response
✅ **Fix Reversibility**: Track all changes for rollback capability