import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { Pool } from 'pg';

dotenv.config();

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

class ApiEndpointTester {
  private apiUrl: string;
  private pool: Pool;
  private authToken: string = '';
  private testUser = {
    email: 'admin@onyx.com',
    password: 'password123'
  };

  constructor() {
    this.apiUrl = process.env.API_URL || 'http://localhost:5001/api';
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
  }

  async runTests(): Promise<void> {
    console.log('🧪 Starting API Endpoint Tests...\n');
    console.log(`API URL: ${this.apiUrl}`);
    console.log(`Database: ${process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'localhost'}\n`);

    const results: TestResult[] = [];

    try {
      // Test 1: Database Connection
      results.push(await this.testDatabaseConnection());
      
      // Test 2: Health Check
      results.push(await this.testHealthEndpoint());
      
      // Test 3: Authentication
      results.push(await this.testAuthentication());
      
      // Test 4: Protected Endpoints (if auth successful)
      if (this.authToken) {
        results.push(await this.testBuildingsEndpoint());
        results.push(await this.testAssessmentsEndpoint());
        results.push(await this.testElementsEndpoint());
        results.push(await this.testReportsEndpoint());
        results.push(await this.testUsersEndpoint());
      }

      // Test 5: CRUD Operations
      if (this.authToken) {
        results.push(await this.testBuildingCRUD());
        results.push(await this.testAssessmentCRUD());
      }

    } catch (error) {
      console.error('Test execution error:', error);
    } finally {
      await this.pool.end();
    }

    // Print results
    this.printResults(results);
  }

  private async testDatabaseConnection(): Promise<TestResult> {
    try {
      const result = await this.pool.query('SELECT NOW() as timestamp, VERSION() as version');
      return {
        name: 'Database Connection',
        status: 'pass',
        message: 'Successfully connected to database',
        details: {
          timestamp: result.rows[0].timestamp,
          version: result.rows[0].version.split(' ')[0]
        }
      };
    } catch (error) {
      return {
        name: 'Database Connection',
        status: 'fail',
        message: 'Failed to connect to database',
        details: error instanceof Error ? error.message : error
      };
    }
  }

  private async testHealthEndpoint(): Promise<TestResult> {
    try {
      const response = await fetch(`${this.apiUrl}/health`);
      const data = await response.json() as any;

      if (response.ok && data.status === 'healthy') {
        return {
          name: 'Health Check',
          status: 'pass',
          message: 'API is healthy',
          details: data
        };
      } else {
        return {
          name: 'Health Check',
          status: 'warning',
          message: 'API health check returned non-healthy status',
          details: data
        };
      }
    } catch (error) {
      return {
        name: 'Health Check',
        status: 'fail',
        message: 'Health endpoint not accessible',
        details: error instanceof Error ? error.message : error
      };
    }
  }

  private async testAuthentication(): Promise<TestResult> {
    try {
      const response = await fetch(`${this.apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.testUser)
      });

      const data = await response.json() as any;

      if (response.ok && data.success && data.data?.tokens?.accessToken) {
        this.authToken = data.data.tokens.accessToken;
        return {
          name: 'Authentication',
          status: 'pass',
          message: 'Successfully authenticated',
          details: {
            userId: data.data.user?.id,
            email: data.data.user?.email,
            role: data.data.user?.role
          }
        };
      } else {
        return {
          name: 'Authentication',
          status: 'fail',
          message: 'Failed to authenticate',
          details: data
        };
      }
    } catch (error) {
      return {
        name: 'Authentication',
        status: 'fail',
        message: 'Authentication endpoint error',
        details: error instanceof Error ? error.message : error
      };
    }
  }

  private async testBuildingsEndpoint(): Promise<TestResult> {
    try {
      const response = await fetch(`${this.apiUrl}/buildings`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
        }
      });

      const data = await response.json() as any;

      if (response.ok && data.success) {
        return {
          name: 'Buildings Endpoint',
          status: 'pass',
          message: 'Buildings endpoint accessible',
          details: {
            buildingCount: data.data?.length || 0,
            hasData: data.data && data.data.length > 0
          }
        };
      } else {
        return {
          name: 'Buildings Endpoint',
          status: 'fail',
          message: 'Buildings endpoint failed',
          details: data
        };
      }
    } catch (error) {
      return {
        name: 'Buildings Endpoint',
        status: 'fail',
        message: 'Buildings endpoint error',
        details: error instanceof Error ? error.message : error
      };
    }
  }

  private async testAssessmentsEndpoint(): Promise<TestResult> {
    try {
      const response = await fetch(`${this.apiUrl}/assessments`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
        }
      });

      const data = await response.json() as any;

      if (response.ok && data.success) {
        return {
          name: 'Assessments Endpoint',
          status: 'pass',
          message: 'Assessments endpoint accessible',
          details: {
            assessmentCount: data.data?.length || 0,
            hasData: data.data && data.data.length > 0
          }
        };
      } else {
        return {
          name: 'Assessments Endpoint',
          status: 'fail',
          message: 'Assessments endpoint failed',
          details: data
        };
      }
    } catch (error) {
      return {
        name: 'Assessments Endpoint',
        status: 'fail',
        message: 'Assessments endpoint error',
        details: error instanceof Error ? error.message : error
      };
    }
  }

  private async testElementsEndpoint(): Promise<TestResult> {
    try {
      const response = await fetch(`${this.apiUrl}/elements`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
        }
      });

      const data = await response.json() as any;

      if (response.ok && data.success) {
        return {
          name: 'Elements Endpoint',
          status: 'pass',
          message: 'Elements endpoint accessible',
          details: {
            elementCount: data.data?.length || 0,
            hasData: data.data && data.data.length > 0
          }
        };
      } else {
        return {
          name: 'Elements Endpoint',
          status: 'fail',
          message: 'Elements endpoint failed',
          details: data
        };
      }
    } catch (error) {
      return {
        name: 'Elements Endpoint',
        status: 'fail',
        message: 'Elements endpoint error',
        details: error instanceof Error ? error.message : error
      };
    }
  }

  private async testReportsEndpoint(): Promise<TestResult> {
    try {
      const response = await fetch(`${this.apiUrl}/reports`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
        }
      });

      const data = await response.json() as any;

      if (response.ok && data.success) {
        return {
          name: 'Reports Endpoint',
          status: 'pass',
          message: 'Reports endpoint accessible',
          details: {
            reportCount: data.data?.length || 0,
            hasData: data.data && data.data.length > 0
          }
        };
      } else {
        return {
          name: 'Reports Endpoint',
          status: 'fail',
          message: 'Reports endpoint failed',
          details: data
        };
      }
    } catch (error) {
      return {
        name: 'Reports Endpoint',
        status: 'fail',
        message: 'Reports endpoint error',
        details: error instanceof Error ? error.message : error
      };
    }
  }

  private async testUsersEndpoint(): Promise<TestResult> {
    try {
      const response = await fetch(`${this.apiUrl}/users`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
        }
      });

      const data = await response.json() as any;

      if (response.ok && data.success) {
        return {
          name: 'Users Endpoint',
          status: 'pass',
          message: 'Users endpoint accessible',
          details: {
            userCount: data.data?.length || 0,
            hasData: data.data && data.data.length > 0
          }
        };
      } else {
        return {
          name: 'Users Endpoint',
          status: 'fail',
          message: 'Users endpoint failed',
          details: data
        };
      }
    } catch (error) {
      return {
        name: 'Users Endpoint',
        status: 'fail',
        message: 'Users endpoint error',
        details: error instanceof Error ? error.message : error
      };
    }
  }

  private async testBuildingCRUD(): Promise<TestResult> {
    let createdBuildingId: string | null = null;

    try {
      // Create building
      const createData = {
        name: 'Test Building - API Test',
        type: 'office',
        building_type: 'Office',
        square_footage: 10000,
        year_built: 2020,
        city: 'Test City',
        state: 'Test State'
      };

      const createResponse = await fetch(`${this.apiUrl}/buildings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createData)
      });

      const createResult = await createResponse.json() as any;

      if (!createResponse.ok || !createResult.success) {
        return {
          name: 'Building CRUD - Create',
          status: 'fail',
          message: 'Failed to create building',
          details: createResult
        };
      }

      createdBuildingId = createResult.data.id;

      // Read building
      const readResponse = await fetch(`${this.apiUrl}/buildings/${createdBuildingId}`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
        }
      });

      const readResult = await readResponse.json() as any;

      if (!readResponse.ok || !readResult.success) {
        return {
          name: 'Building CRUD - Read',
          status: 'fail',
          message: 'Failed to read building',
          details: readResult
        };
      }

      // Update building
      const updateData = {
        name: 'Test Building - Updated',
        square_footage: 12000
      };

      const updateResponse = await fetch(`${this.apiUrl}/buildings/${createdBuildingId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      const updateResult = await updateResponse.json() as any;

      if (!updateResponse.ok || !updateResult.success) {
        return {
          name: 'Building CRUD - Update',
          status: 'fail',
          message: 'Failed to update building',
          details: updateResult
        };
      }

      // Delete building
      const deleteResponse = await fetch(`${this.apiUrl}/buildings/${createdBuildingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
        }
      });

      if (deleteResponse.ok) {
        return {
          name: 'Building CRUD Operations',
          status: 'pass',
          message: 'All CRUD operations successful',
          details: {
            created: createResult.data.id,
            read: readResult.data.name,
            updated: updateResult.data.name,
            deleted: true
          }
        };
      } else {
        return {
          name: 'Building CRUD - Delete',
          status: 'fail',
          message: 'Failed to delete building',
          details: await deleteResponse.json()
        };
      }

    } catch (error) {
      // Cleanup in case of error
      if (createdBuildingId) {
        try {
          await fetch(`${this.apiUrl}/buildings/${createdBuildingId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${this.authToken}`,
            }
          });
        } catch (cleanupError) {
          console.warn('Failed to cleanup test building:', cleanupError);
        }
      }

      return {
        name: 'Building CRUD Operations',
        status: 'fail',
        message: 'CRUD operations failed',
        details: error instanceof Error ? error.message : error
      };
    }
  }

  private async testAssessmentCRUD(): Promise<TestResult> {
    try {
      // First get a building ID
      const buildingsResponse = await fetch(`${this.apiUrl}/buildings`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
        }
      });

      const buildingsData = await buildingsResponse.json() as any;

      if (!buildingsResponse.ok || !buildingsData.success || !buildingsData.data?.length) {
        return {
          name: 'Assessment CRUD',
          status: 'warning',
          message: 'No buildings available for assessment test',
          details: 'Skipping assessment CRUD test'
        };
      }

      const buildingId = buildingsData.data[0].id;

      // Create assessment
      const createData = {
        building_id: buildingId,
        type: 'condition',
        description: 'Test Assessment - API Test',
        assessor_name: 'Test Assessor'
      };

      const createResponse = await fetch(`${this.apiUrl}/assessments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createData)
      });

      const createResult = await createResponse.json() as any;

      if (createResponse.ok && createResult.success) {
        return {
          name: 'Assessment CRUD',
          status: 'pass',
          message: 'Assessment creation successful',
          details: {
            assessmentId: createResult.data.id,
            buildingId: buildingId,
            status: createResult.data.status
          }
        };
      } else {
        return {
          name: 'Assessment CRUD',
          status: 'fail',
          message: 'Failed to create assessment',
          details: createResult
        };
      }

    } catch (error) {
      return {
        name: 'Assessment CRUD',
        status: 'fail',
        message: 'Assessment CRUD test failed',
        details: error instanceof Error ? error.message : error
      };
    }
  }

  private printResults(results: TestResult[]): void {
    console.log('\n' + '='.repeat(60));
    console.log('TEST RESULTS SUMMARY');
    console.log('='.repeat(60));

    let passCount = 0;
    let failCount = 0;
    let warningCount = 0;

    results.forEach((result, index) => {
      const icon = result.status === 'pass' ? '✅' : 
                   result.status === 'warning' ? '⚠️' : '❌';
      
      console.log(`\n${index + 1}. ${icon} ${result.name}`);
      console.log(`   Status: ${result.status.toUpperCase()}`);
      console.log(`   Message: ${result.message}`);
      
      if (result.details) {
        console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`);
      }

      if (result.status === 'pass') passCount++;
      else if (result.status === 'warning') warningCount++;
      else failCount++;
    });

    console.log('\n' + '='.repeat(60));
    console.log('FINAL SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${passCount}`);
    console.log(`⚠️  Warnings: ${warningCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`📊 Total: ${results.length}`);

    const successRate = Math.round((passCount / results.length) * 100);
    console.log(`🎯 Success Rate: ${successRate}%`);

    if (failCount === 0) {
      console.log('\n🎉 All tests passed! The API is functioning correctly.');
    } else if (failCount < results.length / 2) {
      console.log('\n⚠️  Some tests failed. Review the issues above.');
    } else {
      console.log('\n🚨 Major issues detected. Immediate attention required.');
    }

    console.log('\n');
  }
}

// Run the tests
const tester = new ApiEndpointTester();
tester.runTests().catch(console.error);