// Test script to verify frontend can connect to backend
// Run this with: node test-frontend-api.js

async function testFrontendAPI() {
  try {
    console.log('🧪 Testing Frontend → Backend API Connection...\n');
    
    // Test 1: Login
    console.log('1️⃣ Testing login...');
    const loginResponse = await fetch('http://localhost:5001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@onyx.com',
        password: 'password123'
      })
    });
    
    const loginData = await loginResponse.json();
    if (loginData.success) {
      console.log('✅ Login successful');
    } else {
      throw new Error('Login failed');
    }
    
    const token = loginData.data.tokens.accessToken;
    
    // Test 2: Get Buildings
    console.log('2️⃣ Testing buildings API...');
    const buildingsResponse = await fetch('http://localhost:5001/api/buildings', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const buildingsData = await buildingsResponse.json();
    if (buildingsData.success && buildingsData.data.buildings.length > 0) {
      console.log(`✅ Found ${buildingsData.data.buildings.length} buildings`);
      const buildingId = buildingsData.data.buildings[0].id;
      const buildingName = buildingsData.data.buildings[0].name;
      console.log(`   Using building: ${buildingName}`);
      
      // Test 3: Get Assessments for Building
      console.log('3️⃣ Testing assessments API...');
      const assessmentsResponse = await fetch(`http://localhost:5001/api/assessments?building_id=${buildingId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const assessmentsData = await assessmentsResponse.json();
      if (assessmentsData.success) {
        console.log(`✅ Found ${assessmentsData.data.assessments.length} assessments`);
        
        // Find a completed assessment
        const completedAssessment = assessmentsData.data.assessments.find(a => a.status === 'completed');
        
        if (completedAssessment) {
          console.log(`   Found completed assessment: ${completedAssessment.id}`);
          
          // Test 4: Generate Report
          console.log('4️⃣ Testing report generation...');
          const reportResponse = await fetch(`http://localhost:5001/api/reports/generate/${completedAssessment.id}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          const reportData = await reportResponse.json();
          if (reportData.success) {
            console.log('✅ Report generated successfully');
            
            // Test 5: Download PDF
            console.log('5️⃣ Testing PDF download...');
            const pdfResponse = await fetch(`http://localhost:5001/api/reports/download/assessment/${completedAssessment.id}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (pdfResponse.ok) {
              const buffer = await pdfResponse.arrayBuffer();
              console.log(`✅ PDF downloaded (${buffer.byteLength} bytes)`);
              
              // Save PDF
              const fs = await import('fs');
              fs.writeFileSync('test-frontend-report.pdf', Buffer.from(buffer));
              console.log('💾 PDF saved as test-frontend-report.pdf');
              
            } else {
              console.log('❌ PDF download failed:', await pdfResponse.text());
            }
          } else {
            console.log('❌ Report generation failed:', reportData.message);
          }
        } else {
          console.log('⚠️ No completed assessments found for testing report generation');
        }
      } else {
        console.log('❌ Failed to get assessments:', assessmentsData.message);
      }
    } else {
      console.log('❌ No buildings found or API failed');
    }
    
    console.log('\n🎉 Frontend API test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  }
}

testFrontendAPI();