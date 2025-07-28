# ONYX Subscription Model Strategy

## Executive Summary

This document outlines a simple, scalable subscription model for ONYX that balances value delivery with revenue generation while being straightforward to implement and understand.

---

## Recommended Subscription Tiers

### 1. **Starter** - $99/month
*Perfect for small property management companies and individual consultants*

**Limits:**
- Up to 10 buildings
- Up to 3 users
- 50 assessments per year
- 1GB storage
- Basic support (48hr response)

**Included Features:**
- Full assessment workflow
- Basic reporting (PDF only)
- Dashboard analytics
- Mobile web access
- 30-day data retention for completed assessments

### 2. **Professional** - $399/month ⭐ Most Popular
*Ideal for growing facility management teams*

**Limits:**
- Up to 50 buildings
- Up to 10 users
- Unlimited assessments
- 10GB storage
- Priority support (24hr response)

**Everything in Starter, plus:**
- Advanced reporting (PDF, Excel, Word)
- API access (1,000 calls/month)
- Custom branding on reports
- 1-year data retention
- Bulk import/export
- Email notifications
- Basic integrations (Google Drive, Dropbox)

### 3. **Enterprise** - $999/month
*For large organizations with extensive portfolios*

**Limits:**
- Unlimited buildings
- Up to 25 users
- Unlimited assessments
- 50GB storage
- Premium support (4hr response)

**Everything in Professional, plus:**
- Custom fields and workflows
- API access (10,000 calls/month)
- Advanced analytics & predictive insights
- Unlimited data retention
- Priority feature requests
- Dedicated account manager
- SSO/SAML authentication
- Advanced integrations (ERP, CMMS)

### 4. **Enterprise Plus** - Custom Pricing
*Tailored solutions for complex requirements*

**Everything in Enterprise, plus:**
- Unlimited users
- Unlimited storage
- Dedicated infrastructure
- Custom SLA
- On-premise deployment option
- Custom integrations
- Professional services
- Training programs

---

## Value Proposition by Tier

### Starter ($99/month)
**Target:** Small companies managing 5-10 properties
**Value:** Saves 20 hours/month on manual assessments
**ROI:** If hourly rate is $50, saves $1,000/month in labor

### Professional ($399/month)
**Target:** Mid-size firms with 20-50 properties
**Value:** Saves 80 hours/month, enables better capital planning
**ROI:** Saves $4,000/month in labor + prevents costly emergency repairs

### Enterprise ($999/month)
**Target:** Large portfolios with 100+ properties
**Value:** Complete digital transformation of assessment process
**ROI:** Saves $10,000+/month in labor + millions in optimized capital planning

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
1. **Database Schema Updates**
   ```sql
   -- Add to organizations table
   ALTER TABLE organizations ADD COLUMN subscription_plan VARCHAR(50) DEFAULT 'starter';
   ALTER TABLE organizations ADD COLUMN subscription_status VARCHAR(20) DEFAULT 'active';
   ALTER TABLE organizations ADD COLUMN subscription_expires_at TIMESTAMP;
   ALTER TABLE organizations ADD COLUMN stripe_customer_id VARCHAR(255);
   ALTER TABLE organizations ADD COLUMN stripe_subscription_id VARCHAR(255);
   
   -- Create subscription_limits table
   CREATE TABLE subscription_limits (
     plan_name VARCHAR(50) PRIMARY KEY,
     max_buildings INTEGER,
     max_users INTEGER,
     max_assessments_yearly INTEGER,
     max_storage_gb INTEGER,
     features JSONB
   );
   
   -- Create usage_tracking table
   CREATE TABLE usage_tracking (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     organization_id UUID REFERENCES organizations(id),
     metric_type VARCHAR(50),
     metric_value INTEGER,
     recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   ```

2. **Stripe Integration**
   - Create Stripe account
   - Set up products and prices
   - Install Stripe SDK
   - Create webhook endpoints

### Phase 2: Core Features (Week 3-4)
1. **Subscription Management API**
   ```typescript
   // Backend endpoints needed
   POST   /api/subscriptions/checkout
   POST   /api/subscriptions/portal
   GET    /api/subscriptions/current
   POST   /api/subscriptions/webhook
   GET    /api/subscriptions/usage
   ```

2. **Frontend Components**
   - Pricing page
   - Upgrade/downgrade flow
   - Usage dashboard
   - Billing history

### Phase 3: Enforcement (Week 5-6)
1. **Usage Limits**
   - Building count enforcement
   - User limit checks
   - Assessment quotas
   - Storage monitoring

2. **Grace Periods**
   - 7-day grace for expired subscriptions
   - Warning notifications at 80% usage
   - Soft limits with upgrade prompts

---

## Pricing Psychology & Strategy

### 1. **Anchor High**
- Show Enterprise first to make Professional look affordable
- Highlight "Most Popular" on Professional tier

### 2. **Value Metrics**
- Buildings: Most tangible limit
- Users: Controls team access
- Assessments: Usage-based value
- Storage: Technical necessity

### 3. **Upgrade Triggers**
- Hit building limit → Immediate need
- Need more users → Team growth
- Want advanced features → Value realization

---

## Technical Implementation Guide

### 1. **Stripe Setup**
```javascript
// Backend: Create checkout session
export const createCheckoutSession = async (req, res) => {
  const { planId, organizationId } = req.body;
  
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price: planId, // Stripe price ID
      quantity: 1,
    }],
    mode: 'subscription',
    success_url: `${CLIENT_URL}/billing/success`,
    cancel_url: `${CLIENT_URL}/billing/cancel`,
    metadata: {
      organizationId
    }
  });
  
  res.json({ url: session.url });
};
```

### 2. **Usage Tracking Middleware**
```typescript
// Middleware to check limits
export const checkBuildingLimit = async (req, res, next) => {
  const org = await getOrganization(req.user.organization_id);
  const currentCount = await getBuildingCount(org.id);
  const limit = PLAN_LIMITS[org.subscription_plan].max_buildings;
  
  if (currentCount >= limit) {
    return res.status(403).json({
      error: 'Building limit reached',
      upgrade_url: '/pricing'
    });
  }
  
  next();
};
```

### 3. **Frontend Limit Display**
```tsx
// Usage indicator component
export function UsageIndicator({ metric, current, limit }) {
  const percentage = (current / limit) * 100;
  const isNearLimit = percentage > 80;
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>{metric}</span>
        <span className={isNearLimit ? 'text-orange-500' : ''}>
          {current} / {limit}
        </span>
      </div>
      <Progress value={percentage} className={isNearLimit ? 'bg-orange-100' : ''} />
      {isNearLimit && (
        <p className="text-xs text-orange-500">
          Approaching limit. <Link to="/pricing">Upgrade now</Link>
        </p>
      )}
    </div>
  );
}
```

---

## Revenue Projections

### Conservative Scenario (Year 1)
- **Month 1-3**: 10 Starter, 5 Professional = $2,485/month
- **Month 4-6**: 20 Starter, 15 Professional, 2 Enterprise = $9,373/month
- **Month 7-12**: 40 Starter, 30 Professional, 5 Enterprise = $20,935/month

**Year 1 Total**: ~$180,000

### Growth Scenario (Year 1)
- **Month 1-3**: 20 Starter, 10 Professional = $5,970/month
- **Month 4-6**: 50 Starter, 25 Professional, 5 Enterprise = $19,870/month
- **Month 7-12**: 100 Starter, 50 Professional, 10 Enterprise = $39,840/month

**Year 1 Total**: ~$360,000

---

## Marketing & Positioning

### 1. **Free Trial Strategy**
- 14-day free trial of Professional tier
- No credit card required
- Automated onboarding emails
- Demo data pre-loaded

### 2. **Launch Promotions**
- 20% off first 3 months
- Annual billing discount (2 months free)
- Referral program (1 month free per referral)

### 3. **Target Markets**
- **Primary**: Property management companies
- **Secondary**: Facility management consultants
- **Tertiary**: Government/education facilities

---

## Competitive Analysis

### Market Positioning
- **ONYX Starter ($99)**: 50% below competitors
- **ONYX Professional ($399)**: Competitive with market
- **ONYX Enterprise ($999)**: Premium features at mid-market price

### Key Differentiators
1. Modern, intuitive interface
2. Mobile-first design
3. Real-time collaboration
4. Transparent pricing
5. No setup fees

---

## Migration Strategy for Existing Users

### Current Users
1. Give 60-day notice of pricing changes
2. Grandfather existing users at 50% discount for 6 months
3. Provide migration assistance
4. Highlight new features and value

### Communication Plan
- Email 1: Announce exciting new features
- Email 2: Explain subscription benefits
- Email 3: Personal migration support offer
- Email 4: Final reminder with special offer

---

## Success Metrics

### Key Performance Indicators
1. **MRR (Monthly Recurring Revenue)**
   - Target: $20,000 by month 6
   - Growth rate: 20% month-over-month

2. **Conversion Metrics**
   - Trial to paid: >25%
   - Starter to Professional: >30% within 6 months
   - Churn rate: <5% monthly

3. **Usage Metrics**
   - Average buildings per account
   - Assessments per month
   - Feature adoption rates

---

## FAQ for Sales

**Q: Why should I pay when there are free alternatives?**
A: ONYX saves 20+ hours monthly through automation, provides professional reports, and ensures compliance with industry standards. The ROI is typically 10x the subscription cost.

**Q: Can I change plans anytime?**
A: Yes! Upgrade immediately with prorated billing. Downgrades take effect at the next billing cycle.

**Q: What happens if I exceed limits?**
A: We'll notify you at 80% usage and provide a grace period to upgrade. We never delete your data.

**Q: Is there an annual discount?**
A: Yes! Save 20% with annual billing (pay for 10 months, get 12).

**Q: Do you offer non-profit discounts?**
A: Yes, qualified non-profits receive 30% off any plan.

---

## Implementation Checklist

### Week 1-2
- [ ] Set up Stripe account and products
- [ ] Update database schema
- [ ] Create subscription service layer
- [ ] Implement webhook handlers

### Week 3-4
- [ ] Build pricing page UI
- [ ] Create billing dashboard
- [ ] Implement usage tracking
- [ ] Add upgrade/downgrade flows

### Week 5-6
- [ ] Enforce limits in API
- [ ] Add usage warnings
- [ ] Create billing emails
- [ ] Test payment flows

### Launch Preparation
- [ ] Update marketing website
- [ ] Prepare documentation
- [ ] Train support team
- [ ] Create promotional materials

---

## Conclusion

This subscription model provides:
1. **Clear value** at each tier
2. **Simple implementation** path
3. **Predictable revenue** growth
4. **Room to scale** with customer needs

Start with this foundation and iterate based on customer feedback and usage patterns. The key is to launch quickly and refine based on real data.

---

*Remember: The best subscription model is one that aligns customer success with revenue growth. When customers succeed with ONYX, the business succeeds.*