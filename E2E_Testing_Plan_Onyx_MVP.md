# End-to-End Testing Plan - Onyx MVP

**Project:** Onyx Facility Condition Assessment Platform  
**Version:** 1.0 MVP  
**Date:** August 30, 2025  
**Environment:** Production (https://onyxreport.com)  

---

## 📋 Testing Overview

### **Objective**
Conduct comprehensive end-to-end testing to ensure all critical features work correctly before MVP launch.

### **Scope**
- Core application functionality
- User workflows and experience
- Cross-browser compatibility
- Mobile responsiveness
- Performance and reliability
- Error handling

### **Test Environment**
- **Frontend:** https://onyxreport.com
- **Backend API:** https://onyx-backend-f7vh.onrender.com/api
- **Database:** PostgreSQL (Production)
- **Test User:** admin@onyx.com / password123

---

## 🧪 Test Scenarios & Acceptance Criteria

### **1. Authentication & Onboarding Flow**

#### **Test Scenarios:**
- [ ] New user registration with valid invitation token
- [ ] Login with correct credentials
- [ ] Login with incorrect credentials  
- [ ] Password reset flow
- [ ] Session persistence after browser refresh
- [ ] Auto-logout after token expiration
- [ ] First-time user dashboard experience (no welcome screen)
- [ ] Logout and re-login functionality

#### **User Acceptance Criteria:**
- ✅ New users can register successfully with invitation token
- ✅ Login redirects directly to dashboard (bypasses welcome screen)
- ✅ Invalid credentials show clear, user-friendly error messages
- ✅ Session persists across browser tabs and page refreshes
- ✅ Users can logout and login again seamlessly
- ✅ Token expiration redirects to login with appropriate message
- ✅ Password reset sends email and allows password change

#### **Expected Results:**
- Login time: < 2 seconds
- Error messages are clear and actionable
- No broken authentication states

---

### **2. Dashboard Experience**

#### **Test Scenarios:**
- [ ] New user with 0 buildings (empty state)
- [ ] Returning user with buildings and assessments (populated state)
- [ ] Dashboard metrics calculation accuracy
- [ ] Quick actions functionality (4 action cards)
- [ ] Refresh button updates data
- [ ] Time-based greeting display
- [ ] FCI status color coding

#### **User Acceptance Criteria:**
- ✅ Empty state shows clear CTAs (Add Building, Invite Team)
- ✅ Metrics cards display correct data:
  - Total Buildings count
  - Assessments YTD count
  - Average FCI with status label
  - Estimated Repairs with proper formatting
- ✅ FCI status indicators use correct colors:
  - Excellent (≤0.05): Green
  - Good (0.05-0.10): Yellow  
  - Fair (0.10-0.30): Orange
  - Critical (>0.30): Red
- ✅ Quick action cards navigate to correct pages
- ✅ Refresh button updates data without page reload
- ✅ Buildings at Risk section shows high FCI buildings
- ✅ Recent/Upcoming assessments display correctly

#### **Expected Results:**
- Dashboard loads in < 3 seconds
- All metrics are mathematically accurate
- Visual hierarchy is clear and intuitive

---

### **3. Building Management (Core Feature)**

#### **Test Scenarios:**
- [ ] Add new building with all required fields
- [ ] Add building with minimal required fields only
- [ ] Edit existing building information
- [ ] Delete building (admin role only)
- [ ] View building details page
- [ ] Search buildings by name
- [ ] Filter buildings by various criteria
- [ ] Upload building images (JPG, PNG)
- [ ] Handle large building lists (50+ buildings)

#### **User Acceptance Criteria:**
- ✅ All building fields save correctly:
  - Name (required)
  - Address (required)
  - Square footage
  - Year built
  - Building type
  - Replacement value
- ✅ Form validation prevents submission with missing required fields
- ✅ Image upload works with common formats (JPG, PNG, max 5MB)
- ✅ Building list shows search results accurately
- ✅ Filter functionality works for all filter options
- ✅ Delete functionality only available to admin users
- ✅ Building details page shows complete information and assessment history
- ✅ Building edit preserves all existing data

#### **Expected Results:**
- Form submission time: < 1 second
- Image upload time: < 10 seconds
- Search results appear instantly
- No data loss during edit operations

---

### **4. Assessment Workflow (Critical Path)**

#### **Test Scenarios:**
- [ ] Pre-assessment: Select building from list
- [ ] Pre-assessment: Select elements from Uniformat II list
- [ ] Pre-assessment: Save and proceed to field assessment
- [ ] Field assessment: Rate elements (1-5 scale)
- [ ] Field assessment: Add deficiencies with categories
- [ ] Field assessment: Upload deficiency photos
- [ ] Field assessment: Add notes for elements
- [ ] Assessment completion and FCI auto-calculation
- [ ] Assessment status transitions (pending → in_progress → completed)
- [ ] Multiple assessments per building
- [ ] Resume incomplete assessment

#### **User Acceptance Criteria:**
- ✅ User can select building and proceed to element selection
- ✅ All 64 Uniformat II elements load correctly and are categorized
- ✅ Element selection saves and persists
- ✅ Condition ratings (1-5) save for each selected element
- ✅ Deficiency categories display all 6 options:
  - Life Safety & Code Compliance
  - Critical Systems
  - Energy Efficiency
  - Asset Life Cycle
  - User Experience
  - Equity & Accessibility
- ✅ Deficiency photos upload successfully (multiple per deficiency)
- ✅ FCI calculates automatically upon assessment completion
- ✅ FCI calculation uses correct formula: (Total Deficiency Cost / Replacement Value)
- ✅ Assessment status updates correctly throughout workflow
- ✅ Assessment data persists throughout entire workflow
- ✅ Completed assessment appears in dashboard and reports

#### **Expected Results:**
- Pre-assessment completion: < 5 minutes
- Field assessment saves progress continuously
- Photo upload: < 5 seconds per image
- FCI calculation: < 1 second after completion

---

### **5. Reports Generation**

#### **Test Scenarios:**
- [ ] View reports list with all completed assessments
- [ ] Filter reports by status (Published, Draft, Archived)
- [ ] Filter reports by FCI range
- [ ] Search reports by building name, location, or assessor
- [ ] Generate PDF report from completed assessment
- [ ] Export reports to Excel format
- [ ] View report details page
- [ ] Share report functionality
- [ ] Delete report (admin only)

#### **User Acceptance Criteria:**
- ✅ Reports list displays all completed assessments with correct data:
  - Building name
  - Location
  - Assessment date
  - FCI score with status label
  - Assessor name
  - Report status
- ✅ PDF generation includes comprehensive data:
  - Executive summary
  - Building information
  - Assessment methodology
  - Element condition ratings
  - Deficiency photos and descriptions
  - FCI calculation breakdown
  - Recommendations
- ✅ Excel export contains tabular data with all key metrics
- ✅ Report filters work correctly (status, date range, FCI range)
- ✅ Search functionality finds reports by multiple criteria
- ✅ Report details show complete assessment information
- ✅ Generated reports maintain professional formatting

#### **Expected Results:**
- Reports list loads: < 2 seconds
- PDF generation: < 10 seconds
- Excel export: < 5 seconds
- All generated reports are accurate and complete

---

### **6. Analytics Dashboard**

#### **Test Scenarios:**
- [ ] Age vs FCI correlation chart displays data
- [ ] Cost efficiency rankings show buildings
- [ ] Cost trends over time (6-month trend)
- [ ] Performance metrics scatter plot
- [ ] FCI distribution by category
- [ ] Analytics refresh with time range selector
- [ ] Handle empty analytics states

#### **User Acceptance Criteria:**
- ✅ Charts render with actual data (no empty placeholder states)
- ✅ FCI distribution shows correct categories:
  - Excellent (0.00-0.05)
  - Good (0.05-0.10)
  - Fair (0.10-0.30)
  - Critical (>0.30)
- ✅ Building efficiency rankings sort by accurate calculations
- ✅ Cost trends display monthly data with proper scaling
- ✅ Age vs FCI correlation uses building age and latest FCI scores
- ✅ Performance scatter plot shows meaningful correlations
- ✅ Time range selector (6, 12, 24 months) updates all charts
- ✅ Analytics refresh button updates data without page reload

#### **Expected Results:**
- Analytics page loads: < 3 seconds
- Charts render: < 2 seconds
- All calculations are mathematically correct
- Visual representations are clear and intuitive

---

### **7. Team Management & Roles**

#### **Test Scenarios:**
- [ ] Admin creates invitation tokens for team members
- [ ] Team members register using valid tokens
- [ ] Role-based permissions enforcement:
  - Admin: Full access, can delete buildings/assessments
  - Manager: Can view reports, cannot delete
  - Assessor: Can conduct assessments, limited access
- [ ] Multi-tenant data isolation
- [ ] User profile management
- [ ] Token expiration and management

#### **User Acceptance Criteria:**
- ✅ Admin can generate invitation tokens with role specification
- ✅ Generated tokens work for new user registration
- ✅ Team members successfully register with valid tokens
- ✅ Role permissions are correctly enforced:
  - Assessors can conduct assessments but cannot delete buildings
  - Managers can view all reports but cannot manage users
  - Admins have full system access
- ✅ Multi-tenant isolation ensures users only see their organization's data
- ✅ User profiles can be updated (name, email, password)
- ✅ Invitation tokens have appropriate expiration

#### **Expected Results:**
- Token generation: < 1 second
- Registration with token: < 5 seconds
- Permission checks work consistently across all features
- No data leakage between organizations

---

### **8. Mobile Responsiveness**

#### **Test Scenarios:**
- [ ] Dashboard layout on mobile devices (320px-768px)
- [ ] Building management forms on mobile
- [ ] Assessment workflow on tablets and phones
- [ ] Navigation menu on mobile
- [ ] Touch interactions and gestures
- [ ] Charts and tables on small screens
- [ ] Image upload from mobile camera

#### **User Acceptance Criteria:**
- ✅ All pages are fully responsive across device sizes (320px to 1920px)
- ✅ Touch targets are minimum 44px for comfortable interaction
- ✅ Forms are fully usable with mobile keyboards
- ✅ Charts and tables adapt appropriately to smaller screens
- ✅ Mobile navigation menu provides access to all features
- ✅ Assessment workflow maintains usability on mobile
- ✅ Image capture and upload works from mobile devices
- ✅ Text remains readable at all screen sizes

#### **Expected Results:**
- No horizontal scrolling on mobile
- All features accessible and usable on mobile
- Touch interactions feel natural and responsive

---

### **9. Error Handling & Edge Cases**

#### **Test Scenarios:**
- [ ] Network connectivity interruptions
- [ ] Server errors (500, 502, 503)
- [ ] Invalid data submission attempts
- [ ] Large file upload failures
- [ ] Concurrent user actions (multiple users, same data)
- [ ] Browser back/forward button behavior
- [ ] Session timeout scenarios
- [ ] API rate limiting responses

#### **User Acceptance Criteria:**
- ✅ Clear, actionable error messages for all failure scenarios
- ✅ Application handles network disconnection gracefully
- ✅ Form validation prevents invalid data submissions
- ✅ Loading states display for all asynchronous operations
- ✅ No data loss during network interruptions
- ✅ Concurrent user actions don't create data conflicts
- ✅ Browser navigation doesn't break application state
- ✅ Session timeout provides clear re-authentication path
- ✅ Rate limiting shows appropriate retry messaging

#### **Expected Results:**
- Users never see technical error details
- All error states have recovery options
- Application remains stable under stress conditions

---

### **10. Performance & Reliability**

#### **Test Scenarios:**
- [ ] Dashboard load time with 50+ buildings
- [ ] Assessment workflow with 100+ elements
- [ ] Large file upload performance (5MB images)
- [ ] Chart rendering with large datasets (100+ data points)
- [ ] Concurrent user load testing
- [ ] Memory usage monitoring
- [ ] Database query performance

#### **User Acceptance Criteria:**
- ✅ Dashboard loads in < 3 seconds with 50+ buildings
- ✅ Assessment pages load in < 2 seconds
- ✅ Image uploads complete in < 10 seconds (5MB)
- ✅ Charts render smoothly with 100+ data points
- ✅ Application supports 10+ concurrent users
- ✅ No memory leaks or performance degradation over time
- ✅ Database queries execute efficiently

#### **Expected Results:**
- All performance benchmarks met consistently
- Application remains responsive under normal load
- No performance regression over extended use

---

## 🌐 Cross-Browser & Device Testing Matrix

### **Browsers:**
- [ ] Chrome (latest)
- [ ] Firefox (latest)  
- [ ] Safari (latest)
- [ ] Edge (latest)

### **Devices:**
- [ ] Desktop (1920x1080, 1366x768)
- [ ] Tablet (768x1024, 1024x768)
- [ ] Mobile (375x667, 390x844, 360x640)

### **Operating Systems:**
- [ ] Windows 10/11
- [ ] macOS (latest)
- [ ] iOS (latest)
- [ ] Android (latest)

---

## 🚀 Testing Execution Priority

### **Phase 1: Critical Path (Blocking)**
1. **Authentication Flow** - Must work for all other testing
2. **Dashboard Experience** - First impression and core navigation
3. **Building Management** - Core feature for data entry
4. **Assessment Workflow** - Primary value proposition

### **Phase 2: Core Features (High Priority)**
5. **Reports Generation** - Key deliverable output
6. **Team Management** - Multi-user functionality
7. **Analytics Dashboard** - Business intelligence features

### **Phase 3: Quality Assurance (Medium Priority)**
8. **Mobile Responsiveness** - User experience across devices
9. **Error Handling** - Application stability
10. **Performance Testing** - Scalability and speed

---

## 📊 Test Results Template

### **Test Execution Summary:**
- **Total Test Scenarios:** 75
- **Passed:** ___
- **Failed:** ___
- **Blocked:** ___
- **Not Executed:** ___

### **Critical Issues Log:**
| Issue ID | Severity | Feature | Description | Status |
|----------|----------|---------|-------------|--------|
| E2E-001  | Critical | Login   | [Description] | Open   |

### **Performance Results:**
| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Dashboard Load | < 3s | ___s | ✅/❌ |
| Assessment Load | < 2s | ___s | ✅/❌ |

### **Browser Compatibility:**
| Browser | Version | Status | Notes |
|---------|---------|--------|-------|
| Chrome  | Latest  | ✅/❌   |       |
| Firefox | Latest  | ✅/❌   |       |

---

## 🔍 Post-Testing Actions

### **Before MVP Launch:**
- [ ] All critical and high-severity issues resolved
- [ ] Performance benchmarks met
- [ ] Cross-browser compatibility confirmed
- [ ] Mobile responsiveness verified
- [ ] Security testing completed

### **Documentation Updates:**
- [ ] User documentation reflects actual application behavior
- [ ] API documentation is current
- [ ] Known issues documented
- [ ] Release notes prepared

### **Go/No-Go Decision Criteria:**
- [ ] Authentication flow: 100% pass rate
- [ ] Building management: 100% pass rate  
- [ ] Assessment workflow: 100% pass rate
- [ ] Reports generation: 100% pass rate
- [ ] No critical or high-severity issues remain
- [ ] Performance targets achieved

---

**Testing Team:** Claude Code Assistant  
**Review Date:** August 30, 2025  
**Approval:** [Pending Test Execution]