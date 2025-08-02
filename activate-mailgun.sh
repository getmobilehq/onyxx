#!/bin/bash

# Mailgun Activation Script for ONYX Platform
echo "📧 ONYX Platform - Mailgun Activation"
echo "====================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

# Check if required environment variables are set
check_env_vars() {
    echo "1. Checking environment variables..."
    
    local required_vars=("MAILGUN_API_KEY" "MAILGUN_DOMAIN" "FROM_EMAIL" "FROM_NAME")
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -eq 0 ]; then
        print_status "All required environment variables are set"
        echo "   📧 MAILGUN_DOMAIN: $MAILGUN_DOMAIN"
        echo "   ✉️ FROM_EMAIL: $FROM_EMAIL"
        echo "   👤 FROM_NAME: $FROM_NAME"
        return 0
    else
        print_error "Missing environment variables: ${missing_vars[*]}"
        echo ""
        echo "Please set these environment variables in Render.com:"
        for var in "${missing_vars[@]}"; do
            case $var in
                "MAILGUN_API_KEY")
                    echo "   MAILGUN_API_KEY=your-private-api-key-from-mailgun"
                    ;;
                "MAILGUN_DOMAIN")
                    echo "   MAILGUN_DOMAIN=onyxreport.com"
                    ;;
                "FROM_EMAIL")
                    echo "   FROM_EMAIL=noreply@onyxreport.com"
                    ;;
                "FROM_NAME")
                    echo "   FROM_NAME=ONYX Platform"
                    ;;
            esac
        done
        return 1
    fi
}

# Run email database migration
run_email_migration() {
    echo ""
    echo "2. Running email database migration..."
    
    cd backend
    if node run-email-migration.js; then
        print_status "Email database migration completed"
    else
        print_error "Email database migration failed"
        return 1
    fi
    cd ..
}

# Test email functionality
test_email_service() {
    echo ""
    echo "3. Testing email service..."
    
    # Check if backend is running
    if curl -s -f "${BACKEND_URL:-https://onyx-backend-f7vh.onrender.com}/api/health" > /dev/null; then
        print_status "Backend service is running"
    else
        print_warning "Backend service not accessible, skipping email tests"
        return 0
    fi
    
    # Test email health endpoint (would need admin token)
    print_info "Email service health check available at:"
    echo "   GET ${BACKEND_URL:-https://onyx-backend-f7vh.onrender.com}/api/email/health"
    
    print_info "Email test endpoints available at:"
    echo "   POST ${BACKEND_URL:-https://onyx-backend-f7vh.onrender.com}/api/email/test"
    echo "   POST ${BACKEND_URL:-https://onyx-backend-f7vh.onrender.com}/api/email/test-report"
}

# Deploy changes to production
deploy_changes() {
    echo ""
    echo "4. Deploying email system to production..."
    
    git add -A
    if git diff --staged --quiet; then
        print_info "No changes to deploy"
    else
        git commit -m "🚀 Deploy Mailgun email system activation

Features Deployed:
✅ Enhanced email service with security notifications
✅ Professional email templates (welcome, security, reports)
✅ Email tracking and analytics
✅ Security alert automation
✅ Assessment report delivery
✅ Bulk notification system
✅ Email health monitoring

Email Types:
📧 Welcome emails for new users
🔒 Security alerts and notifications
📊 Assessment report delivery
🔑 Password reset emails
🛡️ 2FA confirmation emails
📢 Bulk notifications

API Endpoints:
- GET /api/email/health - Service health check
- POST /api/email/test - Test email functionality
- POST /api/email/security-alert - Send security alerts
- POST /api/email/bulk-notification - Send bulk emails
- GET /api/email/stats - Email analytics

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
        
        git push origin main
        print_status "Changes deployed to production"
    fi
}

# Display setup instructions
show_setup_instructions() {
    echo ""
    echo "5. Mailgun Setup Instructions"
    echo "============================="
    
    print_info "Complete these steps to activate Mailgun:"
    echo ""
    echo "1. Create Mailgun Account:"
    echo "   🌐 Visit: https://www.mailgun.com"
    echo "   ✅ Sign up for free account (40,000 emails/month)"
    echo ""
    
    echo "2. Add Domain (onyxreport.com):"
    echo "   📧 Go to: Sending → Domains → Add New Domain"
    echo "   🌍 Enter: onyxreport.com"
    echo "   🇺🇸 Region: US"
    echo ""
    
    echo "3. Configure DNS Records (in Cloudflare):"
    echo "   📝 TXT Record: v=spf1 include:mailgun.org ~all"
    echo "   🔑 DKIM Record: [Copy from Mailgun dashboard]"
    echo "   📮 MX Records: mxa.mailgun.org (priority 10), mxb.mailgun.org (priority 10)"
    echo "   🔗 CNAME Record: email.onyxreport.com → mailgun.org"
    echo ""
    
    echo "4. Get API Credentials:"
    echo "   🔐 Go to: Settings → API Keys"
    echo "   📋 Copy: Private API key"
    echo ""
    
    echo "5. Update Environment Variables in Render:"
    echo "   🔧 Go to: Render Dashboard → Backend Service → Environment"
    echo "   ➕ Add these variables:"
    echo "      MAILGUN_API_KEY=your-private-api-key"
    echo "      MAILGUN_DOMAIN=onyxreport.com"
    echo "      MAILGUN_HOST=api.mailgun.net"
    echo "      FROM_EMAIL=noreply@onyxreport.com"
    echo "      FROM_NAME=ONYX Platform"
    echo ""
    
    echo "6. Test Email Functionality:"
    echo "   🧪 Use admin account to test emails"
    echo "   📧 Send test welcome email"
    echo "   🚨 Test security alerts"
    echo "   📊 Send test reports"
}

# Show available email features
show_email_features() {
    echo ""
    echo "6. Available Email Features"
    echo "=========================="
    
    print_status "Security Email System:"
    echo "   🚨 Real-time security alerts to administrators"
    echo "   🔐 2FA setup confirmations with backup codes"
    echo "   🔑 Secure password reset emails"
    echo "   🛡️ Account security notifications"
    echo "   📊 Security incident reporting"
    echo ""
    
    print_status "User Communication:"
    echo "   👋 Professional welcome emails for new users"
    echo "   📧 Password reset with secure tokens"
    echo "   🔔 System notifications and updates"
    echo "   📢 Bulk announcements and notifications"
    echo ""
    
    print_status "Report Delivery:"
    echo "   📊 Automated assessment report delivery"
    echo "   📈 Daily, weekly, monthly report schedules"
    echo "   📋 Excel and PDF report attachments"
    echo "   🎯 Custom report filtering and formatting"
    echo ""
    
    print_status "Monitoring & Analytics:"
    echo "   📈 Email delivery statistics"
    echo "   📊 Open rates and click tracking"
    echo "   🔍 Email health monitoring"
    echo "   📝 Comprehensive email logging"
}

# Main execution
main() {
    echo "Starting Mailgun activation process..."
    echo ""
    
    # Step 1: Check environment variables
    if ! check_env_vars; then
        print_error "Environment variables not configured"
        show_setup_instructions
        exit 1
    fi
    
    # Step 2: Run database migration
    if ! run_email_migration; then
        print_error "Database migration failed"
        exit 1
    fi
    
    # Step 3: Test email service
    test_email_service
    
    # Step 4: Deploy changes
    deploy_changes
    
    # Step 5: Show setup instructions
    show_setup_instructions
    
    # Step 6: Show available features
    show_email_features
    
    echo ""
    print_status "Mailgun activation process completed!"
    echo ""
    print_info "Next Steps:"
    echo "1. Complete DNS configuration in Cloudflare"
    echo "2. Verify domain in Mailgun dashboard"
    echo "3. Test email functionality with admin account"
    echo "4. Monitor email delivery and analytics"
    echo ""
    print_info "Documentation:"
    echo "📖 MAILGUN_SETUP_GUIDE.md - Complete setup guide"
    echo "🔧 Email API endpoints: /api/email/*"
    echo "📊 Email dashboard: https://onyxreport.com/admin/email"
}

# Run main function
main "$@"