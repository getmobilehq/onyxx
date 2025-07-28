# ONYX Token-Based Subscription Model (MVP)

## Overview

This document outlines a simplified token-based subscription system for ONYX MVP that allows admin-controlled access without payment gateway complexity.

---

## Subscription Tiers (3 Tiers)

### 1. **Starter Plan**
**Token Cost: 100 tokens/month**

**Limits:**
- Up to 10 buildings
- Up to 3 users
- 50 assessments per year
- 1GB storage
- Basic features only

**Features:**
- ✅ Building management
- ✅ Basic assessments
- ✅ PDF reports
- ✅ Dashboard analytics
- ❌ API access
- ❌ Custom branding
- ❌ Advanced analytics

### 2. **Professional Plan**
**Token Cost: 500 tokens/month**

**Limits:**
- Up to 50 buildings
- Up to 10 users
- Unlimited assessments
- 10GB storage
- All standard features

**Features:**
- ✅ Everything in Starter
- ✅ Excel/Word reports
- ✅ API access (1,000 calls/month)
- ✅ Custom branding
- ✅ Email notifications
- ✅ Data export/import
- ❌ Advanced analytics
- ❌ Custom workflows

### 3. **Enterprise Plan**
**Token Cost: 1,000 tokens/month**

**Limits:**
- Unlimited buildings
- Up to 25 users
- Unlimited assessments
- 50GB storage
- All features unlocked

**Features:**
- ✅ Everything in Professional
- ✅ Advanced analytics
- ✅ Custom fields
- ✅ API access (10,000 calls/month)
- ✅ Priority support
- ✅ Unlimited data retention
- ✅ Bulk operations
- ✅ Advanced integrations

---

## Token System Design

### How It Works

1. **Token Assignment**
   - Super Admin assigns tokens to organizations
   - Tokens are consumed monthly based on active plan
   - Organizations can upgrade/downgrade anytime

2. **Token Lifecycle**
   ```
   Admin assigns 1,000 tokens → Organization activates Professional (500/month)
   → After 2 months, organization has 0 tokens → Access reverts to read-only
   ```

3. **Grace Period**
   - 7-day grace period when tokens run out
   - Email notifications at 30, 7, and 0 tokens remaining
   - Read-only access after grace period

---

## Database Schema

```sql
-- Add to organizations table
ALTER TABLE organizations 
ADD COLUMN subscription_plan VARCHAR(50) DEFAULT 'starter',
ADD COLUMN subscription_status VARCHAR(20) DEFAULT 'inactive',
ADD COLUMN subscription_activated_at TIMESTAMP,
ADD COLUMN subscription_expires_at TIMESTAMP,
ADD COLUMN token_balance INTEGER DEFAULT 0,
ADD COLUMN grace_period_ends_at TIMESTAMP;

-- Create subscription_plans table
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  token_cost INTEGER NOT NULL,
  max_buildings INTEGER,
  max_users INTEGER,
  max_assessments_yearly INTEGER,
  max_storage_gb INTEGER,
  features JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create token_transactions table
CREATE TABLE token_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  transaction_type VARCHAR(50), -- 'credit', 'debit', 'refund'
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  description TEXT,
  performed_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create subscription_history table
CREATE TABLE subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  plan_name VARCHAR(50),
  action VARCHAR(50), -- 'activated', 'upgraded', 'downgraded', 'expired'
  tokens_consumed INTEGER,
  performed_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default plans
INSERT INTO subscription_plans (name, display_name, token_cost, max_buildings, max_users, max_assessments_yearly, max_storage_gb, features) VALUES
('starter', 'Starter Plan', 100, 10, 3, 50, 1, '{"pdf_reports": true, "api_access": false, "custom_branding": false}'),
('professional', 'Professional Plan', 500, 50, 10, null, 10, '{"pdf_reports": true, "excel_reports": true, "api_access": true, "custom_branding": true}'),
('enterprise', 'Enterprise Plan', 1000, null, 25, null, 50, '{"all_features": true}');
```

---

## Implementation Guide

### 1. Backend API Endpoints

```typescript
// Token Management (Admin Only)
POST   /api/admin/tokens/assign
POST   /api/admin/tokens/revoke
GET    /api/admin/tokens/transactions
GET    /api/admin/tokens/balance/:organizationId

// Subscription Management
POST   /api/subscriptions/activate
POST   /api/subscriptions/change-plan
GET    /api/subscriptions/current
GET    /api/subscriptions/available-plans
GET    /api/subscriptions/history

// Usage Tracking
GET    /api/usage/current
GET    /api/usage/limits
```

### 2. Admin Token Management Interface

```typescript
// Admin component for assigning tokens
export function TokenManagement({ organization }) {
  const [tokenAmount, setTokenAmount] = useState(1000);
  const [description, setDescription] = useState('');

  const assignTokens = async () => {
    await api.post('/admin/tokens/assign', {
      organizationId: organization.id,
      amount: tokenAmount,
      description
    });
    toast.success(`${tokenAmount} tokens assigned successfully`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Token Management</CardTitle>
        <CardDescription>
          Current Balance: {organization.token_balance} tokens
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label>Tokens to Assign</Label>
            <Input 
              type="number" 
              value={tokenAmount}
              onChange={(e) => setTokenAmount(e.target.value)}
            />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Reason for token assignment"
            />
          </div>
          <Button onClick={assignTokens}>
            Assign Tokens
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

### 3. Organization Subscription Management

```typescript
// Organization's subscription page
export function SubscriptionPage() {
  const { currentOrg } = useOrg();
  const [plans, setPlans] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);

  const activatePlan = async (planName: string) => {
    try {
      await api.post('/subscriptions/activate', { 
        planName,
        organizationId: currentOrg.id 
      });
      toast.success('Plan activated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to activate plan');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Current Subscription</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p>Plan: <strong>{currentPlan?.display_name}</strong></p>
            <p>Status: <Badge>{currentOrg.subscription_status}</Badge></p>
            <p>Token Balance: <strong>{currentOrg.token_balance}</strong></p>
            <p>Monthly Cost: <strong>{currentPlan?.token_cost} tokens</strong></p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map(plan => (
          <Card key={plan.name} className={currentPlan?.name === plan.name ? 'border-primary' : ''}>
            <CardHeader>
              <CardTitle>{plan.display_name}</CardTitle>
              <CardDescription>{plan.token_cost} tokens/month</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li>✓ {plan.max_buildings || 'Unlimited'} buildings</li>
                <li>✓ {plan.max_users} users</li>
                <li>✓ {plan.max_assessments_yearly || 'Unlimited'} assessments</li>
                <li>✓ {plan.max_storage_gb}GB storage</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={() => activatePlan(plan.name)}
                disabled={currentOrg.token_balance < plan.token_cost}
                className="w-full"
              >
                {currentPlan?.name === plan.name ? 'Current Plan' : 'Activate'}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

### 4. Backend Token Service

```typescript
// Token management service
export class TokenService {
  async assignTokens(organizationId: string, amount: number, performedBy: string, description?: string) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get current balance
      const orgResult = await client.query(
        'SELECT token_balance FROM organizations WHERE id = $1',
        [organizationId]
      );
      
      const currentBalance = orgResult.rows[0]?.token_balance || 0;
      const newBalance = currentBalance + amount;
      
      // Update organization balance
      await client.query(
        'UPDATE organizations SET token_balance = $1 WHERE id = $2',
        [newBalance, organizationId]
      );
      
      // Record transaction
      await client.query(
        `INSERT INTO token_transactions 
         (organization_id, transaction_type, amount, balance_after, description, performed_by)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [organizationId, 'credit', amount, newBalance, description, performedBy]
      );
      
      await client.query('COMMIT');
      
      return { success: true, newBalance };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async consumeTokens(organizationId: string, planName: string) {
    // Called monthly by cron job or manually
    const plan = await this.getPlan(planName);
    const org = await this.getOrganization(organizationId);
    
    if (org.token_balance < plan.token_cost) {
      // Not enough tokens - start grace period
      await this.startGracePeriod(organizationId);
      return { success: false, reason: 'insufficient_tokens' };
    }
    
    // Deduct tokens
    const newBalance = org.token_balance - plan.token_cost;
    await this.updateTokenBalance(organizationId, newBalance, 'debit', 'Monthly subscription');
    
    // Extend subscription
    await this.extendSubscription(organizationId, 30); // 30 days
    
    return { success: true, newBalance };
  }
}
```

### 5. Middleware for Plan Enforcement

```typescript
// Check subscription status middleware
export const checkSubscription = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const org = await getOrganization(req.user.organization_id);
  
  if (org.subscription_status === 'inactive') {
    return res.status(403).json({
      success: false,
      message: 'Subscription inactive. Please contact your administrator.',
      code: 'SUBSCRIPTION_INACTIVE'
    });
  }
  
  if (org.subscription_status === 'grace_period') {
    // Add warning header
    res.setHeader('X-Subscription-Warning', 'Grace period active');
  }
  
  next();
};

// Check feature access
export const requireFeature = (feature: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const org = await getOrganization(req.user.organization_id);
    const plan = await getPlan(org.subscription_plan);
    
    if (!plan.features[feature]) {
      return res.status(403).json({
        success: false,
        message: `Feature "${feature}" not available in your plan`,
        upgrade_required: true
      });
    }
    
    next();
  };
};
```

---

## Admin Dashboard Features

### 1. Token Overview
```typescript
// Show all organizations and their token status
export function AdminTokenDashboard() {
  return (
    <div>
      <DataTable
        columns={[
          { header: 'Organization', accessor: 'name' },
          { header: 'Plan', accessor: 'subscription_plan' },
          { header: 'Token Balance', accessor: 'token_balance' },
          { header: 'Status', accessor: 'subscription_status' },
          { header: 'Expires', accessor: 'subscription_expires_at' },
          { header: 'Actions', accessor: 'actions' }
        ]}
        data={organizations}
      />
    </div>
  );
}
```

### 2. Quick Actions
- Assign tokens in bulk
- Activate/deactivate plans
- View token transaction history
- Export usage reports

---

## Advantages of Token System

1. **No Payment Gateway Complexity**
   - No PCI compliance needed
   - No payment failures
   - No chargebacks

2. **Full Control**
   - Admin controls all access
   - Can give free trials easily
   - Emergency access possible

3. **Flexible Pricing**
   - Can offer discounts via extra tokens
   - Bundle deals possible
   - Custom arrangements easy

4. **Simple Implementation**
   - Just database operations
   - No external dependencies
   - Quick to build and test

---

## Migration Path to Paid Subscriptions

When ready to add payment gateway:

1. **Keep Token System**
   - Payment gateway purchases tokens
   - Tokens continue to control access
   - Smooth transition

2. **Hybrid Model**
   - Some customers pay with card
   - Others use manual tokens
   - Same underlying system

3. **Easy Upgrade**
   ```typescript
   // Future: Stripe webhook adds tokens
   async handleStripeWebhook(event) {
     if (event.type === 'payment_succeeded') {
       await tokenService.assignTokens(
         event.metadata.organizationId,
         event.metadata.tokenAmount,
         'stripe_system',
         'Automated purchase'
       );
     }
   }
   ```

---

## Implementation Timeline

### Week 1
- [ ] Create database tables
- [ ] Build token service
- [ ] Add subscription plans

### Week 2  
- [ ] Build admin UI for token management
- [ ] Create organization subscription page
- [ ] Implement plan activation

### Week 3
- [ ] Add usage tracking
- [ ] Implement plan limits
- [ ] Create warning notifications

### Week 4
- [ ] Testing and refinement
- [ ] Documentation
- [ ] Admin training

---

## Success Metrics

1. **Adoption Rate**
   - Organizations with active subscriptions
   - Token consumption rate
   - Plan distribution

2. **Usage Patterns**
   - Feature adoption by plan
   - Upgrade/downgrade frequency
   - Token purchase patterns

3. **System Health**
   - Failed activations
   - Grace period entries
   - Support tickets

---

This token-based system provides a perfect MVP solution that can evolve into a full payment system when needed!