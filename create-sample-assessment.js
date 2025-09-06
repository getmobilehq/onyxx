import fs from 'fs';

async function createSampleAssessment() {
  try {
    console.log('🚀 Starting sample assessment creation...\n');
    
    // Step 1: Login
    console.log('1️⃣ Logging in...');
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
    console.log('✅ Login successful\n');
    
    // Step 2: Get or Create a Building
    console.log('2️⃣ Getting buildings...');
    const buildingsResponse = await fetch('http://localhost:5001/api/buildings', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const buildingsData = await buildingsResponse.json();
    
    let buildingId;
    if (buildingsData.success && buildingsData.data.buildings.length > 0) {
      buildingId = buildingsData.data.buildings[0].id;
      console.log(`✅ Using existing building: ${buildingsData.data.buildings[0].name}\n`);
    } else {
      // Create a new building
      console.log('Creating new building...');
      const newBuildingResponse = await fetch('http://localhost:5001/api/buildings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: 'Sample Office Building',
          type: 'office',
          construction_type: 'steel_frame',
          square_footage: 50000,
          street_address: '123 Main Street',
          city: 'San Francisco',
          state: 'CA',
          zip_code: '94105',
          year_built: 2000,
          replacement_value: 15000000,
          cost_per_sqft: 300
        })
      });
      const newBuildingData = await newBuildingResponse.json();
      console.log('Building creation response:', newBuildingData);
      if (!newBuildingData.success) {
        throw new Error(`Failed to create building: ${newBuildingData.message}`);
      }
      buildingId = newBuildingData.data.building.id || newBuildingData.data.id;
      console.log(`✅ Created new building: Sample Office Building with ID: ${buildingId}\n`);
    }
    
    // Step 3: Get Elements
    console.log('3️⃣ Getting elements...');
    const elementsResponse = await fetch('http://localhost:5001/api/elements', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const elementsData = await elementsResponse.json();
    console.log('Elements response:', JSON.stringify(elementsData, null, 2).substring(0, 500));
    const elements = elementsData.data?.elements || elementsData.data || elementsData || [];
    console.log(`✅ Found ${elements.length} elements\n`);
    
    // Step 4: Create Assessment
    console.log('4️⃣ Creating assessment...');
    const assessmentResponse = await fetch('http://localhost:5001/api/assessments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        building_id: buildingId,
        type: 'field_assessment',
        status: 'in_progress',
        notes: 'Sample assessment for demonstrating report generation',
        start_date: new Date().toISOString()
      })
    });
    
    const assessmentData = await assessmentResponse.json();
    console.log('Assessment response:', assessmentData);
    if (!assessmentData.success) {
      throw new Error(`Failed to create assessment: ${assessmentData.message}`);
    }
    const assessmentId = assessmentData.data?.id || assessmentData.data?.assessment?.id;
    console.log(`✅ Created assessment: ${assessmentId}\n`);
    
    // Step 5: Add Assessment Elements with various conditions
    console.log('5️⃣ Adding assessment elements with deficiencies...');
    
    const sampleElements = [
      // Life Safety Issues
      {
        element_id: elements[0]?.id,
        condition_score: 2,
        notes: 'Fire alarm system needs immediate replacement',
        deficiency_category: 'Life Safety & Code Compliance',
        deficiency_severity: 'high',
        repair_cost: 75000,
        photos: []
      },
      // Critical Systems
      {
        element_id: elements[1]?.id,
        condition_score: 3,
        notes: 'HVAC system showing signs of wear, needs major repairs',
        deficiency_category: 'Critical Systems',
        deficiency_severity: 'medium',
        repair_cost: 125000,
        photos: []
      },
      // Energy Efficiency
      {
        element_id: elements[2]?.id,
        condition_score: 4,
        notes: 'Windows are single-pane, poor energy efficiency',
        deficiency_category: 'Energy Efficiency',
        deficiency_severity: 'low',
        repair_cost: 85000,
        photos: []
      },
      // Asset Life Cycle
      {
        element_id: elements[3]?.id,
        condition_score: 3,
        notes: 'Roof membrane approaching end of service life',
        deficiency_category: 'Asset Life Cycle',
        deficiency_severity: 'medium',
        repair_cost: 200000,
        photos: []
      },
      // User Experience
      {
        element_id: elements[4]?.id,
        condition_score: 4,
        notes: 'Interior finishes outdated, impacting tenant satisfaction',
        deficiency_category: 'User Experience',
        deficiency_severity: 'low',
        repair_cost: 50000,
        photos: []
      },
      // Good condition elements
      {
        element_id: elements[5]?.id,
        condition_score: 8,
        notes: 'Recently renovated, in excellent condition',
        repair_cost: 0,
        photos: []
      },
      {
        element_id: elements[6]?.id,
        condition_score: 7,
        notes: 'Good condition, minor maintenance needed',
        repair_cost: 5000,
        photos: []
      }
    ];
    
    for (const element of sampleElements) {
      if (element.element_id) {
        await fetch(`http://localhost:5001/api/assessments/${assessmentId}/elements`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(element)
        });
      }
    }
    console.log(`✅ Added ${sampleElements.length} assessment elements\n`);
    
    // Step 6: Calculate totals and complete assessment
    console.log('6️⃣ Completing assessment...');
    const totalRepairCost = sampleElements.reduce((sum, el) => sum + (el.repair_cost || 0), 0);
    const replacementValue = 15000000;
    const fciScore = totalRepairCost / replacementValue;
    
    // First update the assessment with costs
    const updateResponse = await fetch(`http://localhost:5001/api/assessments/${assessmentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        status: 'in_progress',
        fci_score: fciScore,
        total_repair_cost: totalRepairCost,
        immediate_repair_cost: 75000,  // Life Safety (Priority 1)
        short_term_repair_cost: 125000, // Critical Systems (Priority 2)
        long_term_repair_cost: 285000,  // Other repairs
        replacement_value: replacementValue
      })
    });
    
    // Then complete the assessment
    const completeResponse = await fetch(`http://localhost:5001/api/assessments/${assessmentId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({})
    });
    
    const completeData = await completeResponse.json();
    console.log('Complete response:', completeData);
    console.log(`✅ Assessment completed with FCI score: ${(fciScore * 100).toFixed(2)}%\n`);
    
    // Step 7: Generate Report
    console.log('7️⃣ Generating report...');
    const reportResponse = await fetch(`http://localhost:5001/api/reports/generate/${assessmentId}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const reportData = await reportResponse.json();
    if (reportData.success) {
      console.log(`✅ Report generated successfully\n`);
      
      // Step 8: Download PDF
      console.log('8️⃣ Downloading PDF report...');
      const pdfResponse = await fetch(`http://localhost:5001/api/reports/download/assessment/${assessmentId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (pdfResponse.ok) {
        const buffer = await pdfResponse.arrayBuffer();
        const pdfPath = 'sample_assessment_report.pdf';
        fs.writeFileSync(pdfPath, Buffer.from(buffer));
        console.log(`✅ PDF report saved as: ${pdfPath}\n`);
        console.log('📊 Report Summary:');
        console.log(`   - Building: ${buildingsData.data?.buildings[0]?.name || 'Sample Office Building'}`);
        console.log(`   - FCI Score: ${(fciScore * 100).toFixed(2)}%`);
        console.log(`   - Total Repair Cost: $${totalRepairCost.toLocaleString()}`);
        console.log(`   - Replacement Value: $${replacementValue.toLocaleString()}`);
        console.log(`   - Assessment Status: Completed`);
        console.log('\n🎉 Sample report generation complete! Open sample_assessment_report.pdf to view the report.');
      } else {
        console.log('❌ Failed to download PDF:', await pdfResponse.text());
      }
    } else {
      console.log('❌ Failed to generate report:', reportData);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

createSampleAssessment();