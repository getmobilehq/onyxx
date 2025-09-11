import { test, expect, Page } from '@playwright/test';

/**
 * Critical Workflow E2E Tests
 * Tests the core user journeys that are essential for Onyx Report functionality
 * 
 * These tests validate the workflows that, if broken, would prevent users
 * from completing essential tasks and cause "7 Barriers" type issues.
 */

// Test user credentials
const TEST_USER = {
  email: 'admin@onyx.com',
  password: 'password123'
};

// Test data
const TEST_BUILDING = {
  name: 'E2E Test Building',
  type: 'office',
  building_type: 'Office',
  square_footage: 50000,
  year_built: 2020,
  city: 'Test City',
  state: 'Test State',
  street_address: '123 Test Street'
};

test.describe('Critical Workflow Tests', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Set viewport to desktop size
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Navigate to login page
    await page.goto('/login');
  });

  test.afterEach(async () => {
    await page.close();
  });

  test.describe('Authentication Workflow', () => {
    test('should allow user to login successfully', async () => {
      // Fill login form
      await page.fill('input[type="email"]', TEST_USER.email);
      await page.fill('input[type="password"]', TEST_USER.password);
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Should redirect to dashboard
      await expect(page).toHaveURL('/dashboard');
      
      // Should see welcome message or user name
      await expect(page.locator('text=Dashboard')).toBeVisible();
      
      // Should see navigation elements
      await expect(page.locator('nav')).toBeVisible();
    });

    test('should show error for invalid credentials', async () => {
      // Fill login form with invalid credentials
      await page.fill('input[type="email"]', 'invalid@test.com');
      await page.fill('input[type="password"]', 'wrongpassword');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Should show error message
      await expect(page.locator('text=Invalid')).toBeVisible();
      
      // Should remain on login page
      await expect(page).toHaveURL('/login');
    });

    test('should allow user to logout', async () => {
      // Login first
      await loginUser(page);
      
      // Click logout (assuming it's in a menu or header)
      await page.click('[data-testid="user-menu"]');
      await page.click('text=Logout');
      
      // Should redirect to login page
      await expect(page).toHaveURL('/login');
      
      // Should not be able to access protected route
      await page.goto('/dashboard');
      await expect(page).toHaveURL('/login');
    });
  });

  test.describe('Building Management Workflow', () => {
    test.beforeEach(async () => {
      await loginUser(page);
    });

    test('should create a new building successfully', async () => {
      // Navigate to buildings
      await page.click('text=Buildings');
      await expect(page).toHaveURL(/\/buildings/);
      
      // Click add building button
      await page.click('text=Add Building');
      
      // Fill building form
      await page.fill('input[name="name"]', TEST_BUILDING.name);
      await page.selectOption('select[name="type"]', TEST_BUILDING.type);
      await page.fill('input[name="square_footage"]', TEST_BUILDING.square_footage.toString());
      await page.fill('input[name="year_built"]', TEST_BUILDING.year_built.toString());
      await page.fill('input[name="city"]', TEST_BUILDING.city);
      await page.fill('input[name="state"]', TEST_BUILDING.state);
      await page.fill('input[name="street_address"]', TEST_BUILDING.street_address);
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Should show success message
      await expect(page.locator('text=Building created')).toBeVisible();
      
      // Should see the building in the list
      await expect(page.locator(`text=${TEST_BUILDING.name}`)).toBeVisible();
    });

    test('should view building details', async () => {
      // Assuming there's at least one building in the system
      await page.click('text=Buildings');
      
      // Click on first building in list
      await page.click('[data-testid="building-item"]:first-child');
      
      // Should be on building details page
      await expect(page).toHaveURL(/\/buildings\/[a-f0-9-]+/);
      
      // Should see building information
      await expect(page.locator('[data-testid="building-name"]')).toBeVisible();
      await expect(page.locator('[data-testid="building-type"]')).toBeVisible();
    });

    test('should edit building information', async () => {
      await page.click('text=Buildings');
      
      // Click edit button on first building
      await page.click('[data-testid="building-edit"]:first-child');
      
      // Update building name
      const newName = 'Updated Building Name';
      await page.fill('input[name="name"]', newName);
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Should show success message
      await expect(page.locator('text=Building updated')).toBeVisible();
      
      // Should see updated name
      await expect(page.locator(`text=${newName}`)).toBeVisible();
    });
  });

  test.describe('Assessment Workflow - Complete End-to-End', () => {
    test.beforeEach(async () => {
      await loginUser(page);
    });

    test('should complete full assessment workflow', async () => {
      // Step 1: Navigate to assessments
      await page.click('text=Assessments');
      await expect(page).toHaveURL(/\/assessments/);
      
      // Step 2: Start new assessment
      await page.click('text=New Assessment');
      await expect(page).toHaveURL(/\/assessments\/new/);
      
      // Step 3: Pre-Assessment Phase
      await page.selectOption('select[name="building_id"]', { index: 1 }); // Select first building
      await page.selectOption('select[name="assessment_type"]', 'Annual');
      await page.fill('input[name="assessment_scope"]', 'Complete Building Assessment');
      await page.fill('input[name="assessor_name"]', 'Test Assessor');
      
      // Fill assessment date (today)
      const today = new Date().toISOString().split('T')[0];
      await page.fill('input[name="assessment_date"]', today);
      
      // Select elements for assessment
      await page.check('input[data-testid="element-checkbox"]:first-child');
      await page.check('input[data-testid="element-checkbox"]:nth-child(2)');
      
      // Complete checklist
      await page.check('input[name="buildingPlans"]');
      await page.check('input[name="safetyEquipment"]');
      await page.check('input[name="accessPermissions"]');
      
      // Submit pre-assessment
      await page.click('button[type="submit"]');
      
      // Step 4: Field Assessment Phase
      await expect(page.locator('text=Field Assessment')).toBeVisible();
      
      // Rate first element
      await page.click('[data-testid="element-rating-3"]:first-child'); // Rate as 3 (Fair)
      await page.fill('textarea[data-testid="element-notes"]:first-child', 'Shows signs of wear but functional');
      
      // Add deficiency for fair-rated element
      await page.click('[data-testid="add-deficiency"]:first-child');
      await page.fill('input[data-testid="deficiency-description"]', 'Minor paint chipping on walls');
      await page.selectOption('select[data-testid="deficiency-category"]', 'user_experience');
      await page.fill('input[data-testid="deficiency-cost"]', '5000');
      
      // Rate second element as good
      await page.click('[data-testid="element-rating-4"]:nth-child(2)'); // Rate as 4 (Good)
      
      // Complete field assessment
      await page.click('button[data-testid="complete-assessment"]');
      
      // Step 5: Assessment Completion
      await expect(page.locator('text=Assessment Completed')).toBeVisible();
      
      // Should see FCI score
      await expect(page.locator('[data-testid="fci-score"]')).toBeVisible();
      
      // Should see total repair cost
      await expect(page.locator('[data-testid="total-repair-cost"]')).toBeVisible();
      
      // Step 6: Generate Report
      await page.click('button[text="Generate Report"]');
      
      // Should see report generation success
      await expect(page.locator('text=Report generated')).toBeVisible();
      
      // Should be able to navigate to reports
      await page.click('text=View Reports');
      await expect(page).toHaveURL(/\/reports/);
      
      // Should see the generated report in the list
      await expect(page.locator('[data-testid="report-item"]')).toBeVisible();
    });

    test('should handle assessment errors gracefully', async () => {
      // Navigate to new assessment
      await page.click('text=Assessments');
      await page.click('text=New Assessment');
      
      // Try to submit without required fields
      await page.click('button[type="submit"]');
      
      // Should show validation errors
      await expect(page.locator('text=required')).toBeVisible();
      
      // Should remain on the same page
      await expect(page).toHaveURL(/\/assessments\/new/);
    });
  });

  test.describe('Dashboard & Navigation', () => {
    test.beforeEach(async () => {
      await loginUser(page);
    });

    test('should display dashboard with key metrics', async () => {
      // Should be on dashboard after login
      await expect(page).toHaveURL('/dashboard');
      
      // Should see key metrics cards
      await expect(page.locator('[data-testid="total-buildings"]')).toBeVisible();
      await expect(page.locator('[data-testid="total-assessments"]')).toBeVisible();
      await expect(page.locator('[data-testid="average-fci"]')).toBeVisible();
      
      // Should see recent activity or charts
      await expect(page.locator('[data-testid="dashboard-chart"]')).toBeVisible();
    });

    test('should navigate between all main sections', async () => {
      const sections = [
        { name: 'Dashboard', url: '/dashboard' },
        { name: 'Buildings', url: '/buildings' },
        { name: 'Assessments', url: '/assessments' },
        { name: 'Reports', url: '/reports' }
      ];

      for (const section of sections) {
        await page.click(`text=${section.name}`);
        await expect(page).toHaveURL(new RegExp(section.url));
        await expect(page.locator(`text=${section.name}`)).toBeVisible();
      }
    });
  });

  test.describe('Error Boundary & Recovery', () => {
    test.beforeEach(async () => {
      await loginUser(page);
    });

    test('should handle API errors gracefully', async () => {
      // Mock a 500 server error
      await page.route('**/api/buildings', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' })
        });
      });

      // Navigate to buildings
      await page.click('text=Buildings');
      
      // Should show error message instead of crashing
      await expect(page.locator('text=error')).toBeVisible();
      
      // Should have retry option
      await expect(page.locator('button[text*="Retry"]')).toBeVisible();
    });

    test('should handle network errors', async () => {
      // Mock network failure
      await page.route('**/api/**', route => {
        route.abort('failed');
      });

      // Try to perform an action that requires API
      await page.click('text=Buildings');
      
      // Should show network error message
      await expect(page.locator('text=connection')).toBeVisible();
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test.beforeEach(async ({ browser }) => {
      // Create mobile context
      const context = await browser.newContext({
        viewport: { width: 375, height: 667 } // iPhone SE size
      });
      page = await context.newPage();
      await loginUser(page);
    });

    test('should be usable on mobile devices', async () => {
      // Dashboard should be visible and usable
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
      
      // Should be able to navigate via mobile menu
      await page.click('[data-testid="mobile-menu"]');
      await page.click('text=Buildings');
      
      // Buildings list should be mobile-friendly
      await expect(page.locator('[data-testid="building-item"]')).toBeVisible();
    });
  });
});

/**
 * Helper function to login user
 */
async function loginUser(page: Page) {
  await page.goto('/login');
  await page.fill('input[type="email"]', TEST_USER.email);
  await page.fill('input[type="password"]', TEST_USER.password);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');
}