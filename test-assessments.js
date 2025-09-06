const fetch = require('node-fetch');

async function testAssessments() {
  try {
    // Login first
    const loginResponse = await fetch('http://localhost:5001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@onyx.com',
        password: 'password123'
      })
    });
    
    const loginData = await loginResponse.json();
    const token = loginData.data.tokens.accessToken;
    console.log('Login successful');
    
    // Create a test assessment
    const buildingResponse = await fetch('http://localhost:5001/api/buildings', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const buildingData = await buildingResponse.json();
    
    if (buildingData.success && buildingData.data.buildings.length > 0) {
      const buildingId = buildingData.data.buildings[0].id;
      console.log('Found building:', buildingData.data.buildings[0].name);
      
      // Create an assessment
      const assessmentResponse = await fetch('http://localhost:5001/api/assessments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          building_id: buildingId,
          type: 'facility_condition',
          status: 'completed',
          notes: 'Test assessment for report generation',
          start_date: new Date().toISOString(),
          end_date: new Date().toISOString(),
          fci_score: 0.25,
          total_repair_cost: 150000,
          priority_1_cost: 50000,
          priority_2_cost: 50000,
          priority_3_cost: 30000,
          priority_4_cost: 15000,
          priority_5_cost: 5000
        })
      });
      
      const assessmentData = await assessmentResponse.json();
      
      if (assessmentData.success) {
        console.log('Assessment created:', assessmentData.data.id);
        
        // Generate report
        const reportResponse = await fetch(`http://localhost:5001/api/reports/generate/${assessmentData.data.id}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const reportData = await reportResponse.json();
        console.log('Report generation response:', reportData);
        
        if (reportData.success) {
          // Download PDF
          const pdfResponse = await fetch(`http://localhost:5001/api/reports/download/assessment/${assessmentData.data.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (pdfResponse.ok) {
            const buffer = await pdfResponse.buffer();
            require('fs').writeFileSync('assessment_report.pdf', buffer);
            console.log('PDF report saved as assessment_report.pdf');
          }
        }
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testAssessments();