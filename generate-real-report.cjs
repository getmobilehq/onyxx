const axios = require('axios');
const fs = require('fs');

async function generateRealReport() {
  const assessmentId = 'da5031dc-9e28-490f-82fe-a426a96d7396';
  const apiUrl = 'https://manage.onyxreport.com/api';
  
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
    
    const assessmentData = assessmentResponse.data.data.assessment;
    console.log('✅ Assessment details retrieved!');
    
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
    
    // Calculate costs and FCI from the actual data
    const totalRepairCost = parseFloat(assessmentData.total_deficiency_cost) || 0;
    const immediateCost = parseFloat(assessmentData.priority_1_cost) || 0;
    const shortTermCost = parseFloat(assessmentData.priority_2_cost) || 0;
    const longTermCost = parseFloat(assessmentData.priority_3_cost) + parseFloat(assessmentData.priority_4_cost) || 0;
    
    // Calculate replacement cost (typical cost per sqft for office buildings)
    const costPerSqft = 150; // High-end executive office typical cost
    const replacementCost = assessmentData.square_footage * costPerSqft;
    const fciScore = totalRepairCost / replacementCost;
    
    // Build the complete report data with actual information
    const reportData = {
      assessment: {
        id: assessmentId,
        building_name: assessmentData.building_name,
        building_type: assessmentData.building_type,
        year_built: assessmentData.year_built,
        square_footage: assessmentData.square_footage,
        replacement_value: replacementCost,
        status: assessmentData.status,
        street_address: assessmentData.street_address,
        city: assessmentData.city,
        state: assessmentData.state,
        completed_at: assessmentData.completed_at
      },
      fci_results: {
        fci_score: fciScore,
        condition_rating: getFCIRating(fciScore),
        total_repair_cost: totalRepairCost,
        replacement_cost: replacementCost,
        immediate_repair_cost: immediateCost,
        short_term_repair_cost: shortTermCost,
        long_term_repair_cost: longTermCost
      },
      elements: elements.map(el => ({
        element_name: el.element_name || 'Unknown Element',
        condition_rating: el.condition_rating,
        repair_cost: el.repair_cost || 0,
        priority: el.priority,
        notes: el.notes,
        deficiency_category: el.deficiency_category
      })),
      generated_at: new Date().toISOString(),
      generated_by: 'System Administrator'
    };
    
    console.log('\n📊 ACTUAL REPORT DATA:');
    console.log('=====================================');
    console.log(`Building: ${reportData.assessment.building_name}`);
    console.log(`Type: ${reportData.assessment.building_type}`);
    console.log(`Address: ${reportData.assessment.street_address}, ${reportData.assessment.city}, ${reportData.assessment.state}`);
    console.log(`Year Built: ${reportData.assessment.year_built}`);
    console.log(`Square Footage: ${reportData.assessment.square_footage?.toLocaleString()}`);
    console.log(`FCI Score: ${(reportData.fci_results.fci_score * 100).toFixed(4)}%`);
    console.log(`Condition: ${reportData.fci_results.condition_rating}`);
    console.log(`Total Repair Cost: $${reportData.fci_results.total_repair_cost.toLocaleString()}`);
    console.log(`Replacement Cost: $${reportData.fci_results.replacement_cost.toLocaleString()}`);
    console.log(`Elements Assessed: ${reportData.elements.length}`);
    console.log('=====================================');
    
    // Generate HTML report with actual data
    const htmlContent = generateReportHTML(reportData);
    
    const htmlFileName = `actual-assessment-report-${assessmentId}.html`;
    fs.writeFileSync(htmlFileName, htmlContent);
    
    console.log(`✅ HTML report with ACTUAL data generated successfully!`);
    console.log(`💾 HTML report saved as: ${htmlFileName}`);
    console.log('📄 You can open this file in a browser and print to PDF');
    
    // Also save JSON data
    const jsonFileName = `actual-assessment-data-${assessmentId}.json`;
    fs.writeFileSync(jsonFileName, JSON.stringify(reportData, null, 2));
    console.log(`💾 JSON data saved as: ${jsonFileName}`);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

function getFCIRating(fciScore) {
  if (fciScore <= 0.1) return 'Excellent';
  if (fciScore <= 0.4) return 'Good';  
  if (fciScore <= 0.7) return 'Fair';
  return 'Poor';
}

function generateReportHTML(report) {
  const fciInterpretation = getFCIInterpretation(report.fci_results.fci_score);
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Building Assessment Report - ${report.assessment.building_name}</title>
    <style>
        @media print {
            body { margin: 0; }
            .no-print { display: none; }
        }
        
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #fff;
        }
        
        .header {
            text-align: center;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        
        .header h1 {
            color: #2563eb;
            font-size: 2.5em;
            margin: 0;
        }
        
        .header .subtitle {
            color: #64748b;
            font-size: 1.2em;
            margin-top: 10px;
        }
        
        .section {
            margin-bottom: 30px;
            padding: 20px;
            background-color: #f8fafc;
            border-radius: 8px;
            border-left: 4px solid #2563eb;
            page-break-inside: avoid;
        }
        
        .section h2 {
            color: #1e40af;
            font-size: 1.5em;
            margin-top: 0;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 15px;
        }
        
        .info-item {
            background: white;
            padding: 12px;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
        }
        
        .info-label {
            font-weight: bold;
            color: #475569;
            font-size: 0.9em;
            margin-bottom: 4px;
        }
        
        .info-value {
            color: #1f2937;
            font-size: 1.1em;
        }
        
        .fci-score {
            text-align: center;
            background: linear-gradient(135deg, #2563eb, #3b82f6);
            color: white;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
        }
        
        .fci-score .score {
            font-size: 3em;
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        .fci-score .rating {
            font-size: 1.3em;
            font-weight: bold;
        }
        
        .status-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 0.9em;
            font-weight: bold;
            text-transform: uppercase;
        }
        
        .status-excellent { background-color: #dcfce7; color: #166534; }
        .status-good { background-color: #dbeafe; color: #1d4ed8; }
        .status-fair { background-color: #fef3c7; color: #d97706; }
        .status-poor { background-color: #fee2e2; color: #dc2626; }
        
        .element-item {
            background: white;
            padding: 15px;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
            margin-bottom: 10px;
        }
        
        .element-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }
        
        .element-name {
            font-weight: bold;
            color: #374151;
        }
        
        .element-condition {
            background-color: #f1f5f9;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.9em;
        }
        
        .cost-breakdown {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin: 20px 0;
        }
        
        .cost-item {
            text-align: center;
            background: white;
            padding: 15px;
            border-radius: 8px;
            border: 2px solid #e5e7eb;
        }
        
        .cost-label {
            font-size: 0.9em;
            color: #6b7280;
            margin-bottom: 8px;
        }
        
        .cost-value {
            font-size: 1.3em;
            font-weight: bold;
            color: #1f2937;
        }
        
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 0.9em;
        }
        
        .icon {
            margin-right: 8px;
        }
        
        .print-button {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #2563eb;
            color: white;
            padding: 12px 20px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: bold;
            z-index: 1000;
        }
        
        .print-button:hover {
            background: #1d4ed8;
        }
        
        .address {
            font-style: italic;
            color: #64748b;
            margin-top: 5px;
        }
    </style>
</head>
<body>
    <button class="print-button no-print" onclick="window.print()">🖨️ Print to PDF</button>
    
    <div class="header">
        <h1>🏢 Building Assessment Report</h1>
        <div class="subtitle">Facility Condition Assessment & Capital Planning</div>
        <div class="subtitle">Assessment ID: ${report.assessment.id}</div>
    </div>

    <div class="section">
        <h2><span class="icon">🏢</span>Building Information</h2>
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">Building Name</div>
                <div class="info-value">${report.assessment.building_name}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Building Type</div>
                <div class="info-value">${report.assessment.building_type}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Year Built</div>
                <div class="info-value">${report.assessment.year_built}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Square Footage</div>
                <div class="info-value">${report.assessment.square_footage?.toLocaleString()}</div>
            </div>
        </div>
        <div class="info-item" style="margin-top: 15px;">
            <div class="info-label">Address</div>
            <div class="info-value">${report.assessment.street_address}<br>
            <span class="address">${report.assessment.city}, ${report.assessment.state}</span></div>
        </div>
        <div class="info-item" style="margin-top: 15px;">
            <div class="info-label">Replacement Value</div>
            <div class="info-value">$${parseFloat(report.assessment.replacement_value).toLocaleString()}</div>
        </div>
    </div>

    <div class="section">
        <h2><span class="icon">📊</span>FCI Results</h2>
        <div class="fci-score">
            <div class="score">${(report.fci_results.fci_score * 100).toFixed(4)}%</div>
            <div class="rating">${fciInterpretation.status}</div>
            <div style="font-size: 1em; margin-top: 10px; opacity: 0.9;">
                ${fciInterpretation.description}
            </div>
        </div>
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">FCI Score</div>
                <div class="info-value">${report.fci_results.fci_score.toFixed(6)}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Condition Rating</div>
                <div class="info-value">
                    <span class="status-badge status-${fciInterpretation.statusClass}">
                        ${report.fci_results.condition_rating}
                    </span>
                </div>
            </div>
            <div class="info-item">
                <div class="info-label">Total Repair Cost</div>
                <div class="info-value">$${report.fci_results.total_repair_cost.toLocaleString()}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Replacement Cost</div>
                <div class="info-value">$${report.fci_results.replacement_cost.toLocaleString()}</div>
            </div>
        </div>
    </div>

    <div class="section">
        <h2><span class="icon">💰</span>Cost Breakdown</h2>
        <div class="cost-breakdown">
            <div class="cost-item">
                <div class="cost-label">Immediate (0-1 year)</div>
                <div class="cost-value">$${report.fci_results.immediate_repair_cost.toLocaleString()}</div>
            </div>
            <div class="cost-item">
                <div class="cost-label">Short-term (1-3 years)</div>
                <div class="cost-value">$${report.fci_results.short_term_repair_cost.toLocaleString()}</div>
            </div>
            <div class="cost-item">
                <div class="cost-label">Long-term (3-10 years)</div>
                <div class="cost-value">$${report.fci_results.long_term_repair_cost.toLocaleString()}</div>
            </div>
        </div>
    </div>

    <div class="section">
        <h2><span class="icon">🔧</span>Elements Assessed</h2>
        ${report.elements && report.elements.length > 0 ? 
          report.elements.map((element, index) => `
            <div class="element-item">
                <div class="element-header">
                    <span class="element-name">${element.element_name}</span>
                    <span class="element-condition">Condition: ${element.condition_rating || 'N/A'}/5</span>
                </div>
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">Repair Cost</div>
                        <div class="info-value">$${element.repair_cost?.toLocaleString() || '0'}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Priority</div>
                        <div class="info-value">${element.priority || 'Not specified'}</div>
                    </div>
                </div>
                ${element.notes ? `
                <div class="info-item" style="margin-top: 10px;">
                    <div class="info-label">Notes</div>
                    <div class="info-value">${element.notes}</div>
                </div>
                ` : ''}
                ${element.deficiency_category ? `
                <div class="info-item" style="margin-top: 10px;">
                    <div class="info-label">Category</div>
                    <div class="info-value">${element.deficiency_category}</div>
                </div>
                ` : ''}
            </div>
          `).join('') : 
          '<p>No element assessment details available in the system.</p>'
        }
    </div>

    <div class="section">
        <h2><span class="icon">📈</span>Assessment Summary</h2>
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">Assessment Status</div>
                <div class="info-value">${report.assessment.status}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Completed Date</div>
                <div class="info-value">${new Date(report.assessment.completed_at).toLocaleString()}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Report Generated</div>
                <div class="info-value">${new Date(report.generated_at).toLocaleString()}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Generated By</div>
                <div class="info-value">${report.generated_by}</div>
            </div>
        </div>
    </div>

    <div class="footer">
        <p>🤖 Generated with Onyx Building Assessment System</p>
        <p><strong>${report.assessment.building_name}</strong> | Assessment ID: ${report.assessment.id}</p>
        <p>Report generated on ${new Date(report.generated_at).toLocaleDateString()}</p>
    </div>
</body>
</html>
  `;
}

function getFCIInterpretation(fciScore) {
  if (fciScore <= 0.05) {
    return {
      status: 'EXCELLENT',
      statusClass: 'excellent',
      description: 'Building is in excellent condition with minimal repair needs'
    };
  } else if (fciScore <= 0.10) {
    return {
      status: 'GOOD',
      statusClass: 'good', 
      description: 'Building is in good condition with minor repairs needed'
    };
  } else if (fciScore <= 0.30) {
    return {
      status: 'FAIR',
      statusClass: 'fair',
      description: 'Building requires moderate repairs and maintenance'
    };
  } else {
    return {
      status: 'POOR',
      statusClass: 'poor',
      description: 'Building requires significant repairs or replacement consideration'
    };
  }
}

generateRealReport();