# ONYX Simple Token Model (MVP)

## Overview

A single subscription type with token-based access control. Simple, clean, and easy to implement.

---

## The Single Subscription Model

### **ONYX Professional Access**
**Token Cost: 100 tokens/month**

**What You Get:**
- ✅ Unlimited buildings
- ✅ Up to 25 users per organization
- ✅ Unlimited assessments
- ✅ All features unlocked
- ✅ 50GB storage
- ✅ API access
- ✅ All report formats (PDF, Excel, Word)
- ✅ Email notifications
- ✅ Data export/import
- ✅ Priority support

**Simple Rule: Active = Full Access, Inactive = Read-Only**

---

## How It Works

### 1. Token Assignment (Admin)
```
Admin assigns 1,200 tokens to "ABC Property Management"
→ Organization can run for 12 months (100 tokens/month)
→ Automatic monthly deduction
→ When tokens = 0, becomes read-only
```

### 2. Organization States
- **Active**: Has tokens, full platform access
- **Grace Period**: 0 tokens, 7-day warning period
- **Read-Only**: No tokens, can view but not edit

---

## Simplified Database Schema

```sql
-- Modify organizations table
ALTER TABLE organizations 
ADD COLUMN subscription_status VARCHAR(20) DEFAULT 'inactive', -- 'active', 'grace_period', 'read_only'
ADD COLUMN token_balance INTEGER DEFAULT 0,
ADD COLUMN last_token_deduction TIMESTAMP,
ADD COLUMN grace_period_ends_at TIMESTAMP;

-- Simple token transactions table
CREATE TABLE token_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  transaction_type VARCHAR(20), -- 'credit', 'debit'
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  description TEXT,
  performed_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Token deduction job (runs daily)
CREATE TABLE token_deduction_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  deducted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  amount INTEGER DEFAULT 100
);
```

---

## Implementation

### 1. Backend Services

```typescript
// Simplified token service
export class TokenService {
  private readonly MONTHLY_COST = 100;
  private readonly GRACE_PERIOD_DAYS = 7;

  async assignTokens(
    organizationId: string, 
    amount: number, 
    adminId: string, 
    description?: string
  ) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get current balance
      const { rows } = await client.query(
        'SELECT token_balance FROM organizations WHERE id = $1',
        [organizationId]
      );
      
      const currentBalance = rows[0]?.token_balance || 0;
      const newBalance = currentBalance + amount;
      
      // Update balance and activate if needed
      await client.query(`
        UPDATE organizations 
        SET 
          token_balance = $1,
          subscription_status = CASE 
            WHEN $1 > 0 THEN 'active'
            ELSE subscription_status
          END
        WHERE id = $2
      `, [newBalance, organizationId]);
      
      // Record transaction
      await client.query(`
        INSERT INTO token_transactions 
        (organization_id, transaction_type, amount, balance_after, description, performed_by)
        VALUES ($1, 'credit', $2, $3, $4, $5)
      `, [organizationId, amount, newBalance, description, adminId]);
      
      await client.query('COMMIT');
      
      return { success: true, newBalance };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async monthlyDeduction() {
    // Run this via cron job monthly
    const activeOrgs = await pool.query(`
      SELECT id, token_balance, name 
      FROM organizations 
      WHERE subscription_status = 'active'
    `);

    for (const org of activeOrgs.rows) {
      if (org.token_balance >= this.MONTHLY_COST) {
        // Deduct tokens
        await this.deductTokens(org.id, this.MONTHLY_COST);
      } else if (org.token_balance > 0) {
        // Not enough for full month - use remaining and start grace
        await this.deductTokens(org.id, org.token_balance);
        await this.startGracePeriod(org.id);
      } else {
        // No tokens - start grace period
        await this.startGracePeriod(org.id);
      }
    }
  }

  async checkSubscriptionStatus(organizationId: string) {
    const { rows } = await pool.query(`
      SELECT subscription_status, token_balance, grace_period_ends_at
      FROM organizations
      WHERE id = $1
    `, [organizationId]);

    const org = rows[0];
    
    // Check if grace period expired
    if (org.subscription_status === 'grace_period' && 
        org.grace_period_ends_at < new Date()) {
      await pool.query(`
        UPDATE organizations 
        SET subscription_status = 'read_only'
        WHERE id = $1
      `, [organizationId]);
      
      return 'read_only';
    }

    return org.subscription_status;
  }
}
```

### 2. Simple Admin Interface

```typescript
// Admin token management page
export function TokenManagement() {
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [tokenAmount, setTokenAmount] = useState(1200); // Default 1 year

  const assignTokens = async () => {
    if (!selectedOrg) return;

    await api.post('/admin/tokens/assign', {
      organizationId: selectedOrg.id,
      amount: tokenAmount,
      description: `Assigned ${tokenAmount} tokens`
    });

    toast.success('Tokens assigned successfully');
    refreshOrganizations();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Token Management</CardTitle>
          <CardDescription>
            Assign tokens to organizations (100 tokens = 1 month of access)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Select Organization</Label>
              <Select value={selectedOrg?.id} onValueChange={setSelectedOrg}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose organization" />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map(org => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name} (Balance: {org.token_balance} tokens)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Tokens to Assign</Label>
              <div className="flex gap-2">
                <Input 
                  type="number" 
                  value={tokenAmount}
                  onChange={(e) => setTokenAmount(Number(e.target.value))}
                />
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setTokenAmount(100)}>
                    1 Month
                  </Button>
                  <Button variant="outline" onClick={() => setTokenAmount(300)}>
                    3 Months
                  </Button>
                  <Button variant="outline" onClick={() => setTokenAmount(600)}>
                    6 Months
                  </Button>
                  <Button variant="outline" onClick={() => setTokenAmount(1200)}>
                    1 Year
                  </Button>
                </div>
              </div>
            </div>

            <Button onClick={assignTokens} className="w-full">
              Assign Tokens
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Organization Status Table */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Token Balance</TableHead>
                <TableHead>Months Remaining</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizations.map(org => (
                <TableRow key={org.id}>
                  <TableCell>{org.name}</TableCell>
                  <TableCell>
                    <Badge variant={
                      org.subscription_status === 'active' ? 'success' :
                      org.subscription_status === 'grace_period' ? 'warning' :
                      'secondary'
                    }>
                      {org.subscription_status}
                    </Badge>
                  </TableCell>
                  <TableCell>{org.token_balance}</TableCell>
                  <TableCell>{Math.floor(org.token_balance / 100)}</TableCell>
                  <TableCell>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setSelectedOrg(org)}
                    >
                      Add Tokens
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 3. Organization View

```typescript
// Simple subscription status for organizations
export function SubscriptionStatus() {
  const { currentOrg } = useOrg();
  const monthsRemaining = Math.floor(currentOrg.token_balance / 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Status</span>
          <Badge variant={
            currentOrg.subscription_status === 'active' ? 'success' :
            currentOrg.subscription_status === 'grace_period' ? 'warning' :
            'secondary'
          }>
            {currentOrg.subscription_status === 'active' ? 'Active' :
             currentOrg.subscription_status === 'grace_period' ? 'Grace Period' :
             'Read Only'}
          </Badge>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Token Balance</span>
          <span className="font-semibold">{currentOrg.token_balance} tokens</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Time Remaining</span>
          <span className="font-semibold">
            {monthsRemaining} month{monthsRemaining !== 1 ? 's' : ''}
          </span>
        </div>

        {currentOrg.subscription_status === 'grace_period' && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Grace Period Active</AlertTitle>
            <AlertDescription>
              Your subscription will become read-only in 7 days. 
              Please contact your administrator.
            </AlertDescription>
          </Alert>
        )}

        {currentOrg.subscription_status === 'read_only' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Read-Only Mode</AlertTitle>
            <AlertDescription>
              Your subscription has expired. You can view data but cannot make changes.
              Contact your administrator to restore access.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
```

### 4. Simple Middleware

```typescript
// Single middleware to check access
export const requireActiveSubscription = async (req: AuthRequest, res: Response, next: NextFunction) => {
  // Skip for GET requests (read-only access)
  if (req.method === 'GET') {
    return next();
  }

  const org = await getOrganization(req.user.organization_id);
  
  if (org.subscription_status !== 'active') {
    return res.status(403).json({
      success: false,
      message: 'Active subscription required for this action',
      subscription_status: org.subscription_status
    });
  }

  next();
};

// Apply to all routes except auth
app.use('/api', requireActiveSubscription);
```

---

## Monthly Token Deduction Script

```typescript
// Run this as a cron job on the 1st of each month
import cron from 'node-cron';

// Schedule for 1st of each month at midnight
cron.schedule('0 0 1 * *', async () => {
  console.log('Running monthly token deduction...');
  
  try {
    const tokenService = new TokenService();
    await tokenService.monthlyDeduction();
    
    console.log('Monthly token deduction completed');
  } catch (error) {
    console.error('Token deduction failed:', error);
    // Send alert to admin
  }
});
```

---

## Benefits of Single Subscription

1. **Ultra Simple**
   - One price point
   - No plan confusion
   - Easy to explain

2. **Predictable**
   - 100 tokens = 1 month
   - Clear value proposition
   - Simple calculations

3. **Flexible**
   - Give trials easily (free tokens)
   - Bulk discounts via extra tokens
   - Special arrangements simple

4. **Fast Implementation**
   - Minimal UI needed
   - Simple logic
   - Less testing required

---

## Quick Start Checklist

### Week 1
- [ ] Add columns to organizations table
- [ ] Create token_transactions table
- [ ] Build TokenService class
- [ ] Add monthly deduction cron job

### Week 2
- [ ] Create admin token management page
- [ ] Add organization subscription status component
- [ ] Implement access control middleware
- [ ] Test token assignment and deduction

### Week 3
- [ ] Add email notifications for low tokens
- [ ] Create token transaction history view
- [ ] Test grace period flow
- [ ] Documentation and training

---

## Future Enhancements

When ready to expand:
1. **Add payment gateway** - Purchases just buy tokens
2. **Volume discounts** - More tokens = lower per-token cost
3. **Feature toggles** - Use same token system with feature flags
4. **Usage-based** - Deduct tokens per assessment instead of monthly

This simple model gets you to market fast while building a foundation for future growth!