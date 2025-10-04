import request from 'supertest';
import app from '../../src/app';

const runLiveIntegration = process.env.ENABLE_LIVE_INTEGRATION === 'true';

(runLiveIntegration ? describe : describe.skip)('Assessment Workflow Integration Tests', () => {
  let authToken: string;

  const withAuth = () => ({ Authorization: `Bearer ${authToken}` });

  const createBuilding = async (nameSuffix: string) => {
    const response = await request(app)
      .post('/api/buildings')
      .set(withAuth())
      .send({
        name: `Integration Building ${nameSuffix}`,
        type: 'Office',
        construction_type: 'Steel Frame',
        year_built: 2020,
        square_footage: 45000,
        state: 'California',
        city: 'San Francisco',
        zip_code: '94105',
        street_address: '123 Integration Way',
        cost_per_sqft: 275,
      });

    expect(response.status).toBe(201);
    return response.body.data.building.id as string;
  };

  const createAssessment = async (buildingId: string, description: string) => {
    const response = await request(app)
      .post('/api/assessments')
      .set(withAuth())
      .send({
        building_id: buildingId,
        type: 'field_assessment',
        description,
        scheduled_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });

    expect(response.status).toBe(201);
    return response.body.data.assessment.id as string;
  };

  const deleteAssessment = async (assessmentId: string) => {
    const response = await request(app)
      .delete(`/api/assessments/${assessmentId}`)
      .set(withAuth());

    expect(response.status).toBe(200);
  };

  const deleteBuilding = async (buildingId: string) => {
    const response = await request(app)
      .delete(`/api/buildings/${buildingId}`)
      .set(withAuth());

    expect(response.status).toBe(200);
  };

  beforeAll(async () => {
    const uniqueSuffix = Date.now();
    const payload = {
      name: 'Integration Tester',
      email: `integration-${uniqueSuffix}@example.com`,
      password: 'Password123!',
      organization_name: `Integration Org ${uniqueSuffix}`,
    };

    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(payload);

    if (registerResponse.status !== 201) {
      console.error('Registration failed', registerResponse.body);
    }

    expect(registerResponse.status).toBe(201);
    authToken = registerResponse.body.data.tokens.accessToken;
    expect(authToken).toBeTruthy();
  });

  describe('Complete Assessment Workflow', () => {
    it('creates and completes an assessment for a new building', async () => {
      const buildingId = await createBuilding('Workflow');
      const assessmentId = await createAssessment(buildingId, 'Integration assessment');

      const completeResponse = await request(app)
        .put(`/api/assessments/${assessmentId}`)
        .set(withAuth())
        .send({
          status: 'completed',
          notes: 'Workflow completed successfully',
        });

      expect(completeResponse.status).toBe(200);

      const fetchResponse = await request(app)
        .get(`/api/assessments/${assessmentId}`)
        .set(withAuth());

      expect(fetchResponse.status).toBe(200);
      expect(fetchResponse.body.data.assessment.status).toBe('completed');

      await deleteAssessment(assessmentId);
      await deleteBuilding(buildingId);
    });

    it('prevents deleting a building while assessments exist and allows cleanup afterwards', async () => {
      const buildingId = await createBuilding('Guard');
      const assessmentId = await createAssessment(buildingId, 'Deletion guard assessment');

      const deleteAttempt = await request(app)
        .delete(`/api/buildings/${buildingId}`)
        .set(withAuth());

      expect(deleteAttempt.status).toBe(400);
      expect(deleteAttempt.body.message).toMatch(/assessments/i);

      await deleteAssessment(assessmentId);
      await deleteBuilding(buildingId);
    });
  });
});
