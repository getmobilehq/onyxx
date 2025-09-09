const axios = require('axios');

async function fetchActualAssessmentData() {
  const assessmentId = 'da5031dc-9e28-490f-82fe-a426a96d7396';
  const apiUrl = 'https://onyx-backend-f7vh.onrender.com/api';
  
  try {
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post(`${apiUrl}/auth/login`, {
      email: 'admin@onyx.com',
      password: 'password123'
    });
    
    const { accessToken } = loginResponse.data.data.tokens;
    console.log('✅ Login successful');
    
    // Get the assessment details
    console.log(`📋 Fetching assessment details...`);
    const assessmentResponse = await axios.get(
      `${apiUrl}/assessments/${assessmentId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const assessment = assessmentResponse.data.data;
    console.log('✅ Assessment details retrieved!');
    
    // Get the building details
    console.log(`🏢 Fetching building details...`);
    const buildingResponse = await axios.get(
      `${apiUrl}/buildings/${assessment.building_id}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const building = buildingResponse.data.data;
    console.log('✅ Building details retrieved!');
    
    // Get the assessment elements
    console.log(`🔧 Fetching assessment elements...`);
    const elementsResponse = await axios.get(
      `${apiUrl}/assessments/${assessmentId}/elements`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const elements = elementsResponse.data.data || [];
    console.log(`✅ Found ${elements.length} assessment elements!`);
    
    // Calculate FCI
    const totalRepairCost = elements.reduce((sum, el) => sum + (el.repair_cost || 0), 0);
    const replacementCost = building.square_footage * (building.cost_per_sqft || 100);
    const fciScore = totalRepairCost / replacementCost;
    
    // Build the complete report data
    const reportData = {
      assessment: {
        id: assessmentId,
        building_name: building.name,
        building_type: building.type,
        year_built: building.year_built,
        square_footage: building.square_footage,
        replacement_value: replacementCost,
        status: assessment.status,
        created_at: assessment.created_at,
        completed_at: assessment.completed_at
      },
      fci_results: {
        fci_score: fciScore,
        condition_rating: getFCIRating(fciScore),
        total_repair_cost: totalRepairCost,
        replacement_cost: replacementCost,
        immediate_repair_cost: elements.filter(el => el.priority === 'immediate').reduce((sum, el) => sum + (el.repair_cost || 0), 0),
        short_term_repair_cost: elements.filter(el => el.priority === 'short_term').reduce((sum, el) => sum + (el.repair_cost || 0), 0),
        long_term_repair_cost: elements.filter(el => el.priority === 'long_term').reduce((sum, el) => sum + (el.repair_cost || 0), 0)
      },
      elements: elements.map(el => ({
        element_name: el.element_name,
        condition_rating: el.condition_rating,
        repair_cost: el.repair_cost,
        priority: el.priority,
        notes: el.notes,
        deficiency_category: el.deficiency_category
      })),
      generated_at: new Date().toISOString(),
      generated_by: 'Admin User'
    };
    
    console.log('\n📊 ACTUAL ASSESSMENT DATA:');
    console.log('=====================================');
    console.log(`Building: ${reportData.assessment.building_name}`);
    console.log(`Type: ${reportData.assessment.building_type}`);
    console.log(`Year Built: ${reportData.assessment.year_built}`);
    console.log(`Square Footage: ${reportData.assessment.square_footage?.toLocaleString()}`);
    console.log(`FCI Score: ${(reportData.fci_results.fci_score * 100).toFixed(2)}%`);
    console.log(`Condition: ${reportData.fci_results.condition_rating}`);
    console.log(`Total Repair Cost: $${reportData.fci_results.total_repair_cost.toLocaleString()}`);
    console.log(`Elements Assessed: ${reportData.elements.length}`);
    console.log('=====================================');
    
    // Save the actual data
    const fs = require('fs');
    const filename = `actual-assessment-data-${assessmentId}.json`;
    fs.writeFileSync(filename, JSON.stringify(reportData, null, 2));
    console.log(`💾 Actual data saved to: ${filename}`);
    
    return reportData;
    
  } catch (error) {
    console.error('❌ Error fetching actual data:', error.response?.data || error.message);
    if (error.response?.status === 404) {
      console.error('   Assessment or building not found');
    }
  }
}

function getFCIRating(fciScore) {
  if (fciScore <= 0.1) return 'Excellent';
  if (fciScore <= 0.4) return 'Good';  
  if (fciScore <= 0.7) return 'Fair';
  return 'Poor';
}

fetchActualAssessmentData();