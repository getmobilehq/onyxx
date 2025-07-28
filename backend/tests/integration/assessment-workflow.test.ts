import request from 'supertest';
import { Pool } from 'pg';

// This is an integration test that tests the complete assessment workflow
// It requires a test database to be set up

describe('Assessment Workflow Integration Tests', () => {
  let app: any;
  let authToken: string;
  let userId: string;
  let buildingId: string;
  let assessmentId: string;
  let preAssessmentId: string;

  beforeAll(async () => {
    // Import app after setting up mocks
    app = require('../../src/server').default;
    
    // Create a test user and get auth token
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Assessor',
        email: 'assessor@test.com',
        password: 'password123',
        role: 'assessor'
      });

    expect(registerResponse.status).toBe(201);
    authToken = registerResponse.body.data.token;
    userId = registerResponse.body.data.user.id;
  });

  afterAll(async () => {
    // Clean up test data
    if (buildingId) {
      await request(app)
        .delete(`/api/buildings/${buildingId}`)
        .set('Authorization', `Bearer ${authToken}`);
    }
  });

  describe('Complete Assessment Workflow', () => {
    it('should complete the full assessment workflow', async () => {
      // Step 1: Create a building
      const buildingResponse = await request(app)
        .post('/api/buildings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Integration Test Building',
          type: 'Office',
          construction_type: 'Steel Frame',
          year_built: 2020,
          square_footage: 50000,
          state: 'California',
          city: 'San Francisco',
          zip_code: '94105',
          street_address: '123 Integration Test Street',
          cost_per_sqft: 300
        });

      expect(buildingResponse.status).toBe(201);
      buildingId = buildingResponse.body.data.building.id;

      // Step 2: Create an assessment
      const assessmentResponse = await request(app)
        .post('/api/assessments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          building_id: buildingId,
          type: 'field_assessment',
          description: 'Integration test assessment',
          scheduled_date: new Date(Date.now() + 86400000).toISOString() // Tomorrow
        });

      expect(assessmentResponse.status).toBe(201);
      assessmentId = assessmentResponse.body.data.assessment.id;

      // Step 3: Create pre-assessment
      const preAssessmentResponse = await request(app)
        .post('/api/pre-assessments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          assessment_id: assessmentId,
          building_id: buildingId,
          assessment_type: 'Annual',
          assessment_date: new Date().toISOString().split('T')[0],
          assessment_scope: 'Full',
          building_size: 50000,
          building_type: 'Office',
          replacement_value: 12500000,
          selected_elements: [
            {
              id: 'B1010',
              name: 'Roof Coverings',
              group: 'B10 - Superstructure',
              majorGroup: 'B - Building Shell'
            },
            {
              id: 'D3010',
              name: 'Energy Supply',
              group: 'D30 - HVAC',
              majorGroup: 'D - Services'
            }
          ],
          checklist: {
            buildingPlans: true,
            accessPermissions: true,
            safetyEquipment: true,
            previousReports: false,
            keyStakeholders: true,
            weatherConditions: true,
            emergencyProcedures: true,
            equipmentCalibration: true
          },
          additional_notes: 'Integration test pre-assessment',
          assessor_name: 'Test Assessor'
        });

      expect(preAssessmentResponse.status).toBe(201);
      preAssessmentId = preAssessmentResponse.body.data.preAssessment.id;

      // Step 4: Add assessment elements
      const element1Response = await request(app)
        .post('/api/assessments/elements')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          assessment_id: assessmentId,
          element_id: 'B1010',
          quantity: 1,
          unit_cost: 50000,
          condition_rating: 3,
          useful_life: 20,
          remaining_life: 15,
          notes: 'Roof showing minor wear'
        });

      expect(element1Response.status).toBe(201);
      const elementId1 = element1Response.body.data.assessmentElement.id;

      const element2Response = await request(app)
        .post('/api/assessments/elements')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          assessment_id: assessmentId,
          element_id: 'D3010',
          quantity: 1,
          unit_cost: 75000,
          condition_rating: 2,
          useful_life: 15,
          remaining_life: 5,
          notes: 'HVAC system needs attention'
        });

      expect(element2Response.status).toBe(201);
      const elementId2 = element2Response.body.data.assessmentElement.id;

      // Step 5: Add deficiencies
      const deficiency1Response = await request(app)
        .post('/api/assessments/deficiencies')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          assessment_element_id: elementId1,
          description: 'Minor roof membrane damage',
          cost: 15000,
          category: 'Critical Systems',
          severity: 'medium'
        });

      expect(deficiency1Response.status).toBe(201);

      const deficiency2Response = await request(app)
        .post('/api/assessments/deficiencies')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          assessment_element_id: elementId2,
          description: 'HVAC unit requires replacement',
          cost: 45000,
          category: 'Critical Systems',
          severity: 'high'
        });

      expect(deficiency2Response.status).toBe(201);

      // Step 6: Complete the assessment
      const completeResponse = await request(app)
        .put(`/api/assessments/${assessmentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'completed',
          completed_at: new Date().toISOString(),
          notes: 'Assessment completed successfully'
        });

      expect(completeResponse.status).toBe(200);

      // Step 7: Generate report
      const reportResponse = await request(app)
        .post(`/api/reports/generate/${assessmentId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(reportResponse.status).toBe(201);
      const reportId = reportResponse.body.data.report.id;

      // Step 8: Verify the complete workflow
      // Get the assessment with all related data
      const finalAssessmentResponse = await request(app)
        .get(`/api/assessments/${assessmentId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(finalAssessmentResponse.status).toBe(200);
      const finalAssessment = finalAssessmentResponse.body.data.assessment;
      
      expect(finalAssessment.status).toBe('completed');
      expect(finalAssessment.total_repair_cost).toBe(60000); // 15000 + 45000
      expect(finalAssessment.fci_score).toBe(60000 / 12500000); // repair cost / replacement value

      // Get the report
      const finalReportResponse = await request(app)
        .get(`/api/reports/${reportId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(finalReportResponse.status).toBe(200);
      const finalReport = finalReportResponse.body.data.report;
      
      expect(finalReport.assessment_id).toBe(assessmentId);
      expect(finalReport.total_repair_cost).toBe(60000);
      expect(finalReport.element_count).toBe(2);
      expect(finalReport.deficiency_count).toBe(2);

      // Get assessment elements with deficiencies
      const elementsResponse = await request(app)
        .get(`/api/assessments/${assessmentId}/elements`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(elementsResponse.status).toBe(200);
      const elements = elementsResponse.body.data.assessmentElements;
      
      expect(elements).toHaveLength(2);
      expect(elements[0].deficiencies).toHaveLength(1);
      expect(elements[1].deficiencies).toHaveLength(1);

      // Verify pre-assessment is linked
      const preAssessmentCheckResponse = await request(app)
        .get(`/api/pre-assessments/assessment/${assessmentId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(preAssessmentCheckResponse.status).toBe(200);
      expect(preAssessmentCheckResponse.body.data.preAssessment.id).toBe(preAssessmentId);
    });

    it('should handle assessment workflow errors gracefully', async () => {
      // Test error handling when trying to complete assessment without elements
      const assessmentResponse = await request(app)
        .post('/api/assessments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          building_id: buildingId,
          type: 'field_assessment',
          description: 'Test assessment without elements'
        });

      const emptyAssessmentId = assessmentResponse.body.data.assessment.id;

      // Try to generate report without assessment elements
      const reportResponse = await request(app)
        .post(`/api/reports/generate/${emptyAssessmentId}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Should still create report but with zero values
      expect(reportResponse.status).toBe(201);
      expect(reportResponse.body.data.report.element_count).toBe(0);
      expect(reportResponse.body.data.report.total_repair_cost).toBe(0);
    });
  });

  describe('Data Integrity Tests', () => {
    it('should maintain referential integrity when deleting assessment', async () => {
      // Create a minimal assessment
      const assessmentResponse = await request(app)
        .post('/api/assessments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          building_id: buildingId,
          type: 'field_assessment',
          description: 'Test assessment for deletion'
        });

      const testAssessmentId = assessmentResponse.body.data.assessment.id;

      // Add pre-assessment
      await request(app)
        .post('/api/pre-assessments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          assessment_id: testAssessmentId,
          building_id: buildingId,
          assessment_type: 'Annual',
          assessment_date: new Date().toISOString().split('T')[0],
          assessment_scope: 'Partial',
          building_size: 50000,
          selected_elements: []
        });

      // Delete assessment - should cascade delete pre-assessment
      const deleteResponse = await request(app)
        .delete(`/api/assessments/${testAssessmentId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(deleteResponse.status).toBe(200);

      // Verify pre-assessment was also deleted
      const preAssessmentResponse = await request(app)
        .get(`/api/pre-assessments/assessment/${testAssessmentId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(preAssessmentResponse.status).toBe(404);
    });

    it('should prevent building deletion when assessments exist', async () => {
      // Try to delete building with existing assessments
      const deleteResponse = await request(app)
        .delete(`/api/buildings/${buildingId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(deleteResponse.status).toBe(400);
      expect(deleteResponse.body.message).toContain('existing assessments');
    });
  });
});