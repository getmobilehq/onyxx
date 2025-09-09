const fs = require('fs');

function generateHTMLReport() {
  const assessmentId = 'da5031dc-9e28-490f-82fe-a426a96d7396';
  
  try {
    console.log('📊 Generating HTML report...');
    
    // Report data based on our successful API call
    const report = {
      assessment: {
        id: assessmentId,
        building_name: 'Two Story Bank',
        building_type: 'Bank',
        year_built: 1950,
        square_footage: 20000,
        replacement_value: 2000000
      },
      fci_results: {
        fci_score: 0.0280,
        condition_rating: 'Good',
        total_repair_cost: 56000,
        replacement_cost: 2000000,
        immediate_repair_cost: 16000,
        short_term_repair_cost: 20000,
        long_term_repair_cost: 20000
      },
      elements: [
        {
          element_name: 'Structural Foundation',
          condition_rating: 2,
          repair_cost: 50000,
          notes: 'Rusted basement requiring immediate attention'
        },
        {
          element_name: 'Electrical Systems', 
          condition_rating: 4,
          repair_cost: 6000,
          notes: 'Minor electrical updates needed'
        }
      ],
      generated_at: new Date().toISOString(),
      generated_by: 'System Administrator'
    };
    
    // Generate HTML content
    const htmlContent = generateReportHTML(report);
    
    const htmlFileName = `assessment-report-${assessmentId}.html`;
    fs.writeFileSync(htmlFileName, htmlContent);
    
    console.log('✅ HTML report generated successfully!');
    console.log(`💾 HTML report saved as: ${htmlFileName}`);
    console.log('📄 You can open this file in a browser and print to PDF');
    
  } catch (error) {
    console.error('❌ Error generating HTML report:', error.message);
  }
}

function generateReportHTML(report) {
  const fciInterpretation = getFCIInterpretation(report.fci_results.fci_score);
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Building Assessment Report</title>
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
    </style>
</head>
<body>
    <button class="print-button no-print" onclick="window.print()">🖨️ Print to PDF</button>
    
    <div class="header">
        <h1>🏢 Building Assessment Report</h1>
        <div class="subtitle">Facility Condition Assessment & Capital Planning</div>
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
                <div class="info-value">${report.assessment.square_footage?.toLocaleString() || 'N/A'}</div>
            </div>
        </div>
        <div class="info-item" style="margin-top: 15px;">
            <div class="info-label">Replacement Value</div>
            <div class="info-value">$${parseFloat(report.assessment.replacement_value).toLocaleString()}</div>
        </div>
    </div>

    <div class="section">
        <h2><span class="icon">📊</span>FCI Results</h2>
        <div class="fci-score">
            <div class="score">${(report.fci_results.fci_score * 100).toFixed(2)}%</div>
            <div class="rating">${fciInterpretation.status}</div>
            <div style="font-size: 1em; margin-top: 10px; opacity: 0.9;">
                ${fciInterpretation.description}
            </div>
        </div>
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">FCI Score</div>
                <div class="info-value">${report.fci_results.fci_score.toFixed(4)}</div>
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
                    <span class="element-name">${element.element_name || 'Unknown Element'}</span>
                    <span class="element-condition">Condition: ${element.condition_rating}/5</span>
                </div>
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">Repair Cost</div>
                        <div class="info-value">$${element.repair_cost?.toLocaleString() || '0'}</div>
                    </div>
                    ${element.notes ? `
                    <div class="info-item">
                        <div class="info-label">Notes</div>
                        <div class="info-value">${element.notes}</div>
                    </div>
                    ` : '<div></div>'}
                </div>
            </div>
          `).join('') : 
          '<p>No element details available</p>'
        }
    </div>

    <div class="section">
        <h2><span class="icon">📈</span>Summary</h2>
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">Generated At</div>
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
        <p>Assessment ID: ${report.assessment.id}</p>
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
      description: 'Building is in excellent condition'
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

generateHTMLReport();