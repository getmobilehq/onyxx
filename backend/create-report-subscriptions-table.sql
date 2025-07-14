-- Create report subscriptions table for scheduled email reports
CREATE TABLE IF NOT EXISTS report_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
    report_type VARCHAR(20) NOT NULL CHECK (report_type IN ('summary', 'detailed', 'critical_only')),
    filters JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add index for efficient queries
CREATE INDEX IF NOT EXISTS idx_report_subscriptions_user_id ON report_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_report_subscriptions_frequency ON report_subscriptions(frequency);
CREATE INDEX IF NOT EXISTS idx_report_subscriptions_active ON report_subscriptions(is_active);

-- Add trigger to update updated_at column
CREATE OR REPLACE FUNCTION update_report_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_report_subscriptions_updated_at
    BEFORE UPDATE ON report_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_report_subscriptions_updated_at();

-- Insert sample subscriptions for testing
INSERT INTO report_subscriptions (user_id, frequency, report_type, filters) 
SELECT 
    u.id,
    'weekly',
    'summary',
    '{}'
FROM users u 
WHERE u.role = 'facility_manager'
ON CONFLICT DO NOTHING;

INSERT INTO report_subscriptions (user_id, frequency, report_type, filters) 
SELECT 
    u.id,
    'monthly',
    'detailed',
    '{}'
FROM users u 
WHERE u.role = 'admin'
ON CONFLICT DO NOTHING;