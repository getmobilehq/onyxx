-- Email Logs Table
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    template_id VARCHAR(100) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('sent', 'failed', 'pending')) DEFAULT 'pending',
    mailgun_message_id VARCHAR(255),
    error_message TEXT,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email Templates Table
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    subject VARCHAR(500) NOT NULL,
    html_template TEXT NOT NULL,
    text_template TEXT,
    category VARCHAR(50) CHECK (category IN ('security', 'notification', 'marketing', 'system')) DEFAULT 'system',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email Subscriptions Table (for automated reports)
CREATE TABLE IF NOT EXISTS email_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    subscription_type VARCHAR(50) NOT NULL, -- 'security_alerts', 'reports', 'notifications'
    frequency VARCHAR(20) CHECK (frequency IN ('immediate', 'daily', 'weekly', 'monthly')) DEFAULT 'daily',
    filters JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Report Subscriptions Table (enhanced)
CREATE TABLE IF NOT EXISTS report_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    report_type VARCHAR(50) CHECK (report_type IN ('summary', 'detailed', 'critical_only', 'custom')) DEFAULT 'summary',
    frequency VARCHAR(20) CHECK (frequency IN ('daily', 'weekly', 'monthly')) DEFAULT 'weekly',
    filters JSONB,
    email_format VARCHAR(20) CHECK (email_format IN ('excel', 'pdf', 'csv')) DEFAULT 'excel',
    is_active BOOLEAN DEFAULT true,
    last_sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email Delivery Tracking
CREATE TABLE IF NOT EXISTS email_delivery_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email_log_id UUID REFERENCES email_logs(id) ON DELETE CASCADE,
    mailgun_event_type VARCHAR(50), -- 'delivered', 'opened', 'clicked', 'bounced', 'complained'
    event_timestamp TIMESTAMP,
    event_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email Security Events
CREATE TABLE IF NOT EXISTS email_security_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email_log_id UUID REFERENCES email_logs(id) ON DELETE CASCADE,
    security_event_type VARCHAR(100), -- 'phishing_attempt', 'suspicious_link', 'malware_detected'
    severity VARCHAR(20) CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')) DEFAULT 'LOW',
    description TEXT,
    remediation_action TEXT,
    is_resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_email_logs_recipient ON email_logs(recipient_email);
CREATE INDEX idx_email_logs_status ON email_logs(status);
CREATE INDEX idx_email_logs_template ON email_logs(template_id);
CREATE INDEX idx_email_logs_sent_at ON email_logs(sent_at DESC);

CREATE INDEX idx_email_templates_category ON email_templates(category);
CREATE INDEX idx_email_templates_active ON email_templates(is_active);

CREATE INDEX idx_email_subscriptions_user ON email_subscriptions(user_id);
CREATE INDEX idx_email_subscriptions_type ON email_subscriptions(subscription_type);
CREATE INDEX idx_email_subscriptions_active ON email_subscriptions(is_active);

CREATE INDEX idx_report_subscriptions_user ON report_subscriptions(user_id);
CREATE INDEX idx_report_subscriptions_frequency ON report_subscriptions(frequency);
CREATE INDEX idx_report_subscriptions_active ON report_subscriptions(is_active);

CREATE INDEX idx_email_delivery_tracking_event ON email_delivery_tracking(mailgun_event_type);
CREATE INDEX idx_email_delivery_tracking_timestamp ON email_delivery_tracking(event_timestamp DESC);

CREATE INDEX idx_email_security_events_type ON email_security_events(security_event_type);
CREATE INDEX idx_email_security_events_severity ON email_security_events(severity);
CREATE INDEX idx_email_security_events_resolved ON email_security_events(is_resolved);

-- Insert default email templates
INSERT INTO email_templates (name, subject, html_template, category) VALUES
('welcome', 'Welcome to ONYX Platform', '<!DOCTYPE html><html><body><h1>Welcome!</h1><p>Your account has been created.</p></body></html>', 'system'),
('password_reset', 'Reset Your Password', '<!DOCTYPE html><html><body><h1>Password Reset</h1><p>Click the link to reset your password.</p></body></html>', 'security'),
('security_alert', 'Security Alert', '<!DOCTYPE html><html><body><h1>Security Alert</h1><p>A security event has been detected.</p></body></html>', 'security'),
('2fa_enabled', 'Two-Factor Authentication Enabled', '<!DOCTYPE html><html><body><h1>2FA Enabled</h1><p>Two-factor authentication has been enabled for your account.</p></body></html>', 'security'),
('assessment_report', 'Assessment Report Ready', '<!DOCTYPE html><html><body><h1>Report Ready</h1><p>Your assessment report is attached.</p></body></html>', 'notification')
ON CONFLICT (name) DO NOTHING;

-- Insert default email subscriptions for security alerts (for admins)
INSERT INTO email_subscriptions (user_id, subscription_type, frequency, is_active)
SELECT id, 'security_alerts', 'immediate', true
FROM users 
WHERE role = 'admin'
ON CONFLICT DO NOTHING;

-- Add email preferences to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_marketing BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_security_alerts BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_reports BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_email_format VARCHAR(20) DEFAULT 'html';

-- Function to update email subscription timestamps
CREATE OR REPLACE FUNCTION update_email_subscription_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the trigger to email subscription tables
CREATE TRIGGER update_email_subscriptions_updated_at BEFORE UPDATE ON email_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_email_subscription_timestamp();

CREATE TRIGGER update_report_subscriptions_updated_at BEFORE UPDATE ON report_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_email_subscription_timestamp();

CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates
    FOR EACH ROW EXECUTE FUNCTION update_email_subscription_timestamp();

-- Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE ON email_logs TO PUBLIC;
GRANT SELECT ON email_templates TO PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON email_subscriptions TO PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON report_subscriptions TO PUBLIC;
GRANT SELECT, INSERT ON email_delivery_tracking TO PUBLIC;
GRANT SELECT, INSERT, UPDATE ON email_security_events TO PUBLIC;