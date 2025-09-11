# REPORT GENERATION ALGORITHM
## Comprehensive Assessment Report Generation for Onyx Report

---

# REPORT GENERATION ALGORITHM

## **Phase 1: Data Collection & Validation**

### **1.1 Assessment Data Gathering**
```javascript
const generateAssessmentReport = async (assessmentId) => {
  // Collect core assessment data
  const assessment = await getAssessmentById(assessmentId);
  const building = await getBuildingById(assessment.building_id);
  const organization = await getOrganizationById(building.organization_id);
  const assessor = await getUserById(assessment.assigned_to);
  
  // Gather element ratings and deficiencies
  const elements = await getAssessmentElements(assessmentId);
  const deficiencies = await getAssessmentDeficiencies(assessmentId);
  
  // Validate data completeness
  validateReportData({ assessment, building, elements, deficiencies });
}
```

### **1.2 Data Validation Rules**
- **Assessment Status**: Must be "completed"
- **FCI Score**: Must be calculated and within 0-1 range
- **Element Ratings**: All selected elements must have condition ratings
- **Building Data**: Required fields (name, address, square footage, replacement value)
- **Deficiency Data**: All ratings 1-4 must have associated deficiencies

### **1.3 Missing Data Handling**
```javascript
const handleMissingData = (data) => {
  if (!data.building.replacement_value) {
    data.building.replacement_value = calculateReplacementValue(
      data.building.square_footage, 
      data.building.building_type
    );
  }
  
  if (!data.assessment.completion_date) {
    data.assessment.completion_date = new Date();
  }
  
  // Set defaults for missing optional fields
  return sanitizeReportData(data);
}
```

## **Phase 2: Analysis & Calculations**

### **2.1 FCI Analysis Algorithm**
```javascript
const calculateFCIAnalysis = (assessment, building, deficiencies) => {
  const totalDeficiencyCost = deficiencies.reduce((sum, def) => 
    sum + (def.estimated_cost || 0), 0
  );
  
  const replacementValue = building.replacement_value || 
    (building.square_footage * getCostPerSqft(building.building_type));
  
  const fciScore = totalDeficiencyCost / replacementValue;
  
  const fciInterpretation = {
    score: fciScore,
    condition: getFCICondition(fciScore),
    category: getFCICategory(fciScore),
    recommendation: getFCIRecommendation(fciScore),
    benchmarkComparison: getBenchmarkComparison(fciScore, building.building_type)
  };
  
  return fciInterpretation;
}

const getFCICondition = (fci) => {
  if (fci <= 0.10) return 'Excellent';
  if (fci <= 0.40) return 'Good'; 
  if (fci <= 0.70) return 'Fair';
  return 'Critical';
}
```

### **2.2 Priority Cost Distribution**
```javascript
const calculatePriorityCosts = (deficiencies) => {
  const priorities = {
    priority1: 0, // Immediate (0-1 year)
    priority2: 0, // Short-term (1-3 years)
    priority3: 0, // Medium-term (3-7 years)
    priority4: 0  // Long-term (7+ years)
  };
  
  deficiencies.forEach(def => {
    const cost = def.estimated_cost || 0;
    priorities[`priority${def.priority}`] += cost;
  });
  
  return {
    ...priorities,
    immediate: priorities.priority1,
    shortTerm: priorities.priority2,
    mediumTerm: priorities.priority3,
    longTerm: priorities.priority4,
    total: Object.values(priorities).reduce((sum, cost) => sum + cost, 0)
  };
}
```

### **2.3 Category Analysis**
```javascript
const analyzeByCategoryAndSystem = (elements, deficiencies) => {
  const categoryBreakdown = {};
  const systemBreakdown = {};
  
  deficiencies.forEach(def => {
    // Category analysis
    if (!categoryBreakdown[def.category]) {
      categoryBreakdown[def.category] = {
        count: 0,
        cost: 0,
        averageSeverity: 0
      };
    }
    categoryBreakdown[def.category].count++;
    categoryBreakdown[def.category].cost += def.estimated_cost || 0;
    
    // System analysis (by Uniformat major group)
    const element = elements.find(el => el.id === def.element_id);
    const majorGroup = element?.major_group || 'Unknown';
    
    if (!systemBreakdown[majorGroup]) {
      systemBreakdown[majorGroup] = {
        elementCount: 0,
        deficiencyCount: 0,
        averageRating: 0,
        totalCost: 0
      };
    }
    systemBreakdown[majorGroup].deficiencyCount++;
    systemBreakdown[majorGroup].totalCost += def.estimated_cost || 0;
  });
  
  return { categoryBreakdown, systemBreakdown };
}
```

## **Phase 3: Executive Summary Generation**

### **3.1 AI-Powered Summary Algorithm**
```javascript
const generateExecutiveSummary = (reportData) => {
  const {
    building,
    assessment,
    fciAnalysis,
    priorityCosts,
    categoryAnalysis,
    systemAnalysis
  } = reportData;
  
  // Key findings identification
  const keyFindings = identifyKeyFindings(reportData);
  const criticalIssues = identifyCriticalIssues(reportData);
  const costHighlights = identifyCostHighlights(priorityCosts);
  
  // Generate narrative summary
  const summary = `
    This comprehensive facility condition assessment of ${building.name} 
    reveals an overall Facility Condition Index (FCI) of ${fciAnalysis.score.toFixed(3)}, 
    indicating ${fciAnalysis.condition.toLowerCase()} condition.
    
    ${generateConditionNarrative(fciAnalysis)}
    
    ${generateCriticalIssuesNarrative(criticalIssues)}
    
    ${generateInvestmentNarrative(priorityCosts, building.replacement_value)}
    
    ${generateRecommendationsNarrative(fciAnalysis, keyFindings)}
  `;
  
  return cleanAndFormatSummary(summary);
}

const generateConditionNarrative = (fciAnalysis) => {
  const narratives = {
    'Excellent': 'The facility is in excellent condition with minimal deficiencies requiring only routine maintenance.',
    'Good': 'The facility is in good condition with some minor maintenance needs that can be addressed through preventive measures.',
    'Fair': 'The facility shows signs of aging and requires systematic maintenance planning to prevent further deterioration.',
    'Critical': 'The facility requires immediate attention with significant capital investment to address critical deficiencies.'
  };
  
  return narratives[fciAnalysis.condition] || 'Assessment complete.';
}
```

### **3.2 Key Findings Algorithm**
```javascript
const identifyKeyFindings = (reportData) => {
  const findings = [];
  
  // Identify worst-performing systems
  const worstSystems = Object.entries(reportData.systemAnalysis)
    .sort((a, b) => b[1].deficiencyCount - a[1].deficiencyCount)
    .slice(0, 3)
    .map(([system, data]) => ({
      system,
      deficiencyCount: data.deficiencyCount,
      cost: data.totalCost
    }));
  
  // Identify highest cost categories
  const highestCostCategories = Object.entries(reportData.categoryAnalysis)
    .sort((a, b) => b[1].cost - a[1].cost)
    .slice(0, 3);
  
  // Age vs condition analysis
  const buildingAge = new Date().getFullYear() - reportData.building.year_built;
  const expectedFCI = calculateExpectedFCI(buildingAge, reportData.building.building_type);
  const fciVariance = reportData.fciAnalysis.score - expectedFCI;
  
  findings.push(
    ...worstSystems.map(system => `${system.system} system shows ${system.deficiencyCount} deficiencies requiring $${system.cost.toLocaleString()}`),
    ...highestCostCategories.map(([cat, data]) => `${cat} represents ${((data.cost / reportData.priorityCosts.total) * 100).toFixed(1)}% of total repair costs`),
    fciVariance > 0.05 ? 'Facility condition is below expected for building age' : 'Facility condition aligns with building age expectations'
  );
  
  return findings;
}
```

## **Phase 4: Report Structure & Layout**

### **4.1 Complete Report Structure**
```javascript
const reportSections = {
  1: 'Cover Page',
  2: 'Executive Summary',
  3: 'Building Information',
  4: 'Assessment Overview',
  5: 'FCI Analysis',
  6: 'System-by-System Analysis',
  7: 'Deficiency Summary',
  8: 'Capital Planning Recommendations',
  9: 'Maintenance Recommendations',
  10: 'Appendices'
};
```

### **4.2 Cover Page Algorithm**
```javascript
const generateCoverPage = (reportData) => ({
  title: 'FACILITY CONDITION ASSESSMENT REPORT',
  subtitle: reportData.building.name,
  buildingImage: reportData.building.image_url || defaultBuildingImage,
  reportDate: new Date().toLocaleDateString(),
  assessmentDate: new Date(reportData.assessment.completion_date).toLocaleDateString(),
  assessorName: reportData.assessor.name,
  organizationName: reportData.organization.name,
  organizationLogo: reportData.organization.logo_url,
  reportId: `ONX-${reportData.assessment.id.substring(0, 8).toUpperCase()}`,
  confidentialityNotice: 'CONFIDENTIAL - Property of ' + reportData.organization.name
});
```

### **4.3 Building Information Section**
```javascript
const generateBuildingInformation = (building) => ({
  basicInformation: {
    name: building.name,
    address: `${building.street_address}, ${building.city}, ${building.state} ${building.zip_code}`,
    buildingType: building.building_type || 'Not Specified',
    constructionType: building.construction_type || 'Not Specified',
    yearBuilt: building.year_built,
    age: new Date().getFullYear() - building.year_built,
    totalArea: building.square_footage?.toLocaleString() || 'Not Specified',
    floors: building.number_of_floors || 'Not Specified',
    primaryUse: building.primary_use || 'Not Specified'
  },
  
  financialInformation: {
    replacementValue: building.replacement_value?.toLocaleString() || 'Not Calculated',
    costPerSqFt: building.cost_per_sqft || 'Not Specified',
    annualOperatingCost: building.annual_operating_cost?.toLocaleString() || 'Not Available'
  },
  
  ownershipInformation: {
    ownerName: building.owner_name || 'Not Specified',
    ownerContact: building.owner_contact || 'Not Specified',
    managerName: building.manager_name || 'Not Specified',
    managerContact: building.manager_contact || 'Not Specified'
  }
});
```

### **4.4 Assessment Overview Section**
```javascript
const generateAssessmentOverview = (assessment, elements, deficiencies) => ({
  assessmentDetails: {
    type: assessment.assessment_type || 'Comprehensive',
    scope: `${elements.length} building elements assessed`,
    methodology: 'Uniformat II Classification System',
    standards: 'Industry best practices and building codes',
    assessmentDate: new Date(assessment.completion_date).toLocaleDateString(),
    assessor: assessment.assessor_name,
    weatherConditions: assessment.weather_conditions || 'Not recorded',
    temperature: assessment.temperature_f ? `${assessment.temperature_f}°F` : 'Not recorded'
  },
  
  scopeOfWork: {
    elementsAssessed: elements.length,
    deficienciesIdentified: deficiencies.length,
    systemsCovered: [...new Set(elements.map(el => el.major_group))].length,
    assessmentHours: 'Estimated based on building size',
    limitations: generateAssessmentLimitations(assessment)
  }
});
```

## **Phase 5: Data Visualization Generation**

### **5.1 Chart Generation Algorithm**
```javascript
const generateReportCharts = (reportData) => {
  return {
    fciTrendChart: generateFCITrendChart(reportData),
    priorityCostChart: generatePriorityCostPieChart(reportData.priorityCosts),
    systemConditionChart: generateSystemConditionBarChart(reportData.systemAnalysis),
    categoryBreakdownChart: generateCategoryBreakdownChart(reportData.categoryAnalysis),
    ageVsConditionChart: generateAgeConditionScatterChart(reportData),
    maintenanceTimelineChart: generateMaintenanceTimelineChart(reportData.deficiencies)
  };
}

const generateFCITrendChart = (reportData) => ({
  type: 'line',
  title: 'FCI Trend Analysis',
  data: {
    current: reportData.fciAnalysis.score,
    projected1Year: projectFCI(reportData, 1),
    projected5Year: projectFCI(reportData, 5),
    projected10Year: projectFCI(reportData, 10),
    benchmark: getBenchmarkFCI(reportData.building.building_type, reportData.building.age)
  },
  colors: ['#3b82f6', '#ef4444', '#f59e0b'],
  labels: ['Current', '1 Year', '5 Years', '10 Years']
});

const generatePriorityCostPieChart = (priorityCosts) => ({
  type: 'pie',
  title: 'Capital Investment by Priority',
  data: [
    { label: 'Immediate (0-1 year)', value: priorityCosts.priority1, color: '#ef4444' },
    { label: 'Short-term (1-3 years)', value: priorityCosts.priority2, color: '#f97316' },
    { label: 'Medium-term (3-7 years)', value: priorityCosts.priority3, color: '#eab308' },
    { label: 'Long-term (7+ years)', value: priorityCosts.priority4, color: '#22c55e' }
  ],
  showPercentages: true,
  showValues: true
});
```

### **5.2 System Analysis Visualization**
```javascript
const generateSystemConditionBarChart = (systemAnalysis) => {
  const systems = Object.entries(systemAnalysis).map(([system, data]) => ({
    system: system.replace(/^[A-G] - /, ''), // Remove Uniformat prefix
    averageCondition: calculateAverageCondition(data),
    deficiencyCount: data.deficiencyCount,
    cost: data.totalCost,
    color: getConditionColor(calculateAverageCondition(data))
  }));
  
  return {
    type: 'horizontalBar',
    title: 'System Condition Overview',
    xAxis: 'Average Condition Rating',
    yAxis: 'Building Systems',
    data: systems.sort((a, b) => a.averageCondition - b.averageCondition),
    colorScale: {
      1: '#dc2626', // Critical - Red
      2: '#ea580c', // Poor - Orange
      3: '#ca8a04', // Fair - Yellow
      4: '#16a34a', // Good - Green
      5: '#059669'  // Excellent - Emerald
    }
  };
}
```

## **Phase 6: Recommendations Engine**

### **6.1 Capital Planning Recommendations**
```javascript
const generateCapitalPlanningRecommendations = (reportData) => {
  const recommendations = [];
  
  // Immediate actions (Priority 1)
  const immediateItems = reportData.deficiencies
    .filter(def => def.priority === 1)
    .sort((a, b) => (b.estimated_cost || 0) - (a.estimated_cost || 0));
  
  if (immediateItems.length > 0) {
    recommendations.push({
      category: 'Immediate Actions (0-1 Year)',
      priority: 1,
      totalCost: immediateItems.reduce((sum, item) => sum + (item.estimated_cost || 0), 0),
      items: immediateItems.slice(0, 10), // Top 10 items
      narrative: generateImmediateActionsNarrative(immediateItems)
    });
  }
  
  // Strategic planning (5-10 year outlook)
  const strategicPlan = generateStrategicPlan(reportData);
  recommendations.push(strategicPlan);
  
  // Budget planning recommendations
  const budgetPlan = generateBudgetPlan(reportData.priorityCosts, reportData.building.replacement_value);
  recommendations.push(budgetPlan);
  
  return recommendations;
}

const generateStrategicPlan = (reportData) => ({
  category: 'Strategic Capital Planning (5-10 Years)',
  totalInvestment: reportData.priorityCosts.total,
  percentageOfReplacementValue: ((reportData.priorityCosts.total / reportData.building.replacement_value) * 100).toFixed(1),
  recommendations: [
    generateSystemReplacementPlan(reportData.systemAnalysis),
    generateEnergyEfficiencyPlan(reportData.categoryAnalysis),
    generateAccessibilityPlan(reportData.deficiencies),
    generateSafetyUpgradePlan(reportData.deficiencies)
  ]
});
```

### **6.2 Maintenance Recommendations**
```javascript
const generateMaintenanceRecommendations = (reportData) => {
  const maintenanceItems = [];
  
  // Preventive maintenance for good condition items
  const goodConditionItems = reportData.elements.filter(el => el.condition_rating >= 4);
  
  goodConditionItems.forEach(element => {
    const maintenanceSchedule = getMaintenanceSchedule(element.major_group, element.condition_rating);
    maintenanceItems.push({
      element: element.individual_element,
      currentCondition: element.condition_rating,
      recommendedFrequency: maintenanceSchedule.frequency,
      nextServiceDate: calculateNextServiceDate(maintenanceSchedule.frequency),
      estimatedCost: maintenanceSchedule.cost,
      description: maintenanceSchedule.description
    });
  });
  
  return {
    routine: maintenanceItems.filter(item => item.recommendedFrequency.includes('monthly')),
    quarterly: maintenanceItems.filter(item => item.recommendedFrequency.includes('quarterly')),
    annual: maintenanceItems.filter(item => item.recommendedFrequency.includes('annual')),
    totalAnnualCost: maintenanceItems.reduce((sum, item) => sum + (item.estimatedCost || 0), 0)
  };
}
```

## **Phase 7: PDF Generation & Formatting**

### **7.1 PDF Generation Algorithm**
```javascript
const generatePDFReport = async (reportData) => {
  const pdf = new PDFDocument({
    size: 'A4',
    margins: { top: 50, bottom: 50, left: 50, right: 50 }
  });
  
  // Cover page
  await addCoverPage(pdf, reportData.coverPage);
  
  // Table of contents
  await addTableOfContents(pdf, reportData.sections);
  
  // Executive summary
  await addExecutiveSummary(pdf, reportData.executiveSummary);
  
  // Building information
  await addBuildingInformation(pdf, reportData.buildingInfo);
  
  // Assessment overview
  await addAssessmentOverview(pdf, reportData.assessmentOverview);
  
  // FCI analysis with charts
  await addFCIAnalysis(pdf, reportData.fciAnalysis, reportData.charts.fciTrendChart);
  
  // System-by-system analysis
  await addSystemAnalysis(pdf, reportData.systemAnalysis, reportData.charts.systemConditionChart);
  
  // Deficiency summary
  await addDeficiencySummary(pdf, reportData.deficiencies, reportData.charts.priorityCostChart);
  
  // Recommendations
  await addRecommendations(pdf, reportData.recommendations);
  
  // Appendices
  await addAppendices(pdf, reportData.appendices);
  
  return pdf;
}
```

### **7.2 Report Styling & Branding**
```javascript
const reportStyling = {
  colors: {
    primary: '#1e40af',      // Blue
    secondary: '#64748b',    // Slate
    success: '#059669',      // Emerald
    warning: '#ca8a04',      // Yellow
    danger: '#dc2626',       // Red
    neutral: '#374151'       // Gray
  },
  
  fonts: {
    title: { size: 24, weight: 'bold' },
    heading1: { size: 18, weight: 'bold' },
    heading2: { size: 16, weight: 'bold' },
    heading3: { size: 14, weight: 'bold' },
    body: { size: 12, weight: 'normal' },
    caption: { size: 10, weight: 'normal' }
  },
  
  spacing: {
    section: 20,
    paragraph: 12,
    line: 8
  },
  
  layout: {
    pageMargin: 50,
    columnWidth: 250,
    chartHeight: 200,
    tableRowHeight: 25
  }
};
```

## **Phase 8: Report Delivery & Distribution**

### **8.1 Report Finalization**
```javascript
const finalizeReport = async (reportData, pdf) => {
  // Generate final filename
  const filename = generateReportFilename(reportData);
  
  // Save to storage
  const filePath = await savePDFToStorage(pdf, filename);
  
  // Update database record
  await updateReportRecord(reportData.assessment.id, {
    status: 'completed',
    pdf_url: filePath,
    generated_at: new Date(),
    file_size: pdf.length
  });
  
  // Generate download link
  const downloadUrl = generateSecureDownloadLink(filePath);
  
  return {
    filename,
    filePath,
    downloadUrl,
    fileSize: pdf.length,
    pageCount: pdf.pageCount
  };
}

const generateReportFilename = (reportData) => {
  const buildingName = reportData.building.name.replace(/[^a-zA-Z0-9]/g, '_');
  const date = new Date().toISOString().split('T')[0];
  const reportId = reportData.assessment.id.substring(0, 8);
  
  return `FCA_Report_${buildingName}_${date}_${reportId}.pdf`;
}
```

### **8.2 Email Delivery System**
```javascript
const deliverReport = async (reportData, recipients) => {
  const emailTemplate = generateReportEmailTemplate(reportData);
  
  const emailData = {
    to: recipients,
    subject: `Facility Condition Assessment Report - ${reportData.building.name}`,
    template: emailTemplate,
    attachments: [{
      filename: reportData.filename,
      path: reportData.filePath,
      contentType: 'application/pdf'
    }]
  };
  
  await sendEmail(emailData);
  
  // Log delivery
  await logReportDelivery(reportData.assessment.id, recipients);
}
```

## **Phase 9: Report Validation & Quality Control**

### **9.1 Data Validation Checklist**
```javascript
const validateReportQuality = (reportData) => {
  const validationResults = {
    dataCompleteness: checkDataCompleteness(reportData),
    calculationAccuracy: validateCalculations(reportData),
    consistencyCheck: checkDataConsistency(reportData),
    formattingQuality: checkFormattingQuality(reportData),
    recommendations: validateRecommendations(reportData)
  };
  
  const overallScore = Object.values(validationResults)
    .reduce((sum, result) => sum + (result.passed ? 1 : 0), 0) / 5;
  
  return {
    ...validationResults,
    overallScore,
    passed: overallScore >= 0.8,
    issues: Object.entries(validationResults)
      .filter(([key, result]) => !result.passed)
      .map(([key, result]) => ({ section: key, issues: result.issues }))
  };
}
```

### **9.2 Report Metrics & Analytics**
```javascript
const generateReportMetrics = (reportData) => ({
  reportStatistics: {
    totalPages: reportData.pdf.pageCount,
    elementsAssessed: reportData.elements.length,
    deficienciesIdentified: reportData.deficiencies.length,
    totalInvestmentRequired: reportData.priorityCosts.total,
    fciScore: reportData.fciAnalysis.score,
    generationTime: reportData.processingTime
  },
  
  qualityMetrics: {
    dataCompletenessScore: calculateCompletenessScore(reportData),
    recommendationCount: reportData.recommendations.length,
    chartCount: Object.keys(reportData.charts).length,
    photoCount: countPhotosInReport(reportData)
  },
  
  businessMetrics: {
    costPerSquareFoot: reportData.priorityCosts.total / reportData.building.square_footage,
    fciVsBenchmark: compareFCIToBenchmark(reportData.fciAnalysis.score, reportData.building),
    maintenanceEfficiency: calculateMaintenanceEfficiencyScore(reportData)
  }
});
```

---

# REPORT VISUAL LAYOUT

## **Sample Report Structure**

### **Page 1: Cover Page**
```
[ORGANIZATION LOGO]                    [BUILDING PHOTO]

           FACILITY CONDITION ASSESSMENT REPORT
                    [Building Name]
                   [Building Address]

Assessment Date: [Date]               Report ID: ONX-[ID]
Assessor: [Name]                      Report Date: [Date]

                    CONFIDENTIAL
            Property of [Organization Name]
```

### **Pages 2-3: Executive Summary**
```
EXECUTIVE SUMMARY

Building Overview
┌─────────────────────────────────────────────────────────────┐
│ Building: [Name]           Year Built: [Year]              │
│ Address: [Full Address]    Square Footage: [Number]        │
│ Type: [Building Type]      Replacement Value: $[Amount]    │
└─────────────────────────────────────────────────────────────┘

Facility Condition Index (FCI): [0.XXX] - [CONDITION RATING]
[FCI GAUGE VISUALIZATION]

Key Findings:
• [Finding 1 with cost impact]
• [Finding 2 with timeline]
• [Finding 3 with priority level]

Investment Summary:
┌─────────────────┬─────────────────┬─────────────────────────┐
│ Priority Level  │ Investment      │ Timeline                │
├─────────────────┼─────────────────┼─────────────────────────┤
│ Immediate       │ $[Amount]       │ 0-1 Year               │
│ Short-term      │ $[Amount]       │ 1-3 Years              │
│ Medium-term     │ $[Amount]       │ 3-7 Years              │
│ Long-term       │ $[Amount]       │ 7+ Years               │
└─────────────────┴─────────────────┴─────────────────────────┘

[PRIORITY COST PIE CHART]
```

### **Pages 4-5: FCI Analysis**
```
FCI ANALYSIS

Current FCI Score: [X.XXX]
Condition Rating: [EXCELLENT/GOOD/FAIR/CRITICAL]

[FCI TREND CHART - Line graph showing current, projected]

Interpretation:
[Detailed explanation of FCI score meaning and implications]

Benchmark Comparison:
┌─────────────────────────────────────────────────────────────┐
│ Your Building: [X.XXX]                                     │
│ Industry Average ([Building Type]): [X.XXX]                │
│ Age-Adjusted Benchmark: [X.XXX]                            │
│ Variance from Benchmark: [+/- X.XXX]                       │
└─────────────────────────────────────────────────────────────┘

10-Year Projection:
[Explanation of projected FCI changes with and without investment]
```

### **Pages 6-10: System Analysis**
```
SYSTEM-BY-SYSTEM ANALYSIS

[SYSTEM CONDITION BAR CHART]

A - SUBSTRUCTURE                               Rating: [X.X]/5.0
┌─────────────────────────────────────────────────────────────┐
│ Elements Assessed: [Number]                                 │
│ Deficiencies Found: [Number]                               │
│ Estimated Repair Cost: $[Amount]                           │
│ Key Issues: [List of major deficiencies]                   │
│ Recommended Actions: [Specific recommendations]            │
└─────────────────────────────────────────────────────────────┘
[Photo of representative condition]

B - SHELL                                      Rating: [X.X]/5.0
[Similar format for each Uniformat system...]

[Continue for all assessed systems]
```

### **Pages 11-15: Deficiency Summary**
```
DEFICIENCY SUMMARY

Total Deficiencies Identified: [Number]
Total Estimated Cost: $[Amount]

By Category:
[CATEGORY BREAKDOWN CHART]

Critical Deficiencies (Priority 1):
┌─────────────────┬─────────────────┬─────────────────────────┐
│ Item            │ Location        │ Estimated Cost          │
├─────────────────┼─────────────────┼─────────────────────────┤
│ [Description]   │ [Location]      │ $[Amount]              │
│ [Description]   │ [Location]      │ $[Amount]              │
└─────────────────┴─────────────────┴─────────────────────────┘

[MAINTENANCE TIMELINE CHART]

Detailed Deficiency List:
[Comprehensive table with all deficiencies, organized by priority]
```

### **Pages 16-20: Recommendations**
```
CAPITAL PLANNING RECOMMENDATIONS

Immediate Actions (0-1 Year) - Total: $[Amount]
• [Action item with cost and justification]
• [Action item with cost and justification]

Strategic Planning (5-10 Year Outlook)
[Investment strategy recommendations with timeline]

Budget Planning:
┌─────────────────────────────────────────────────────────────┐
│ Annual Capital Budget Recommendation: $[Amount]             │
│ Percentage of Replacement Value: [X.X]%                    │
│ Return on Investment: [Analysis]                           │
└─────────────────────────────────────────────────────────────┘

MAINTENANCE RECOMMENDATIONS

Preventive Maintenance Schedule:
┌─────────────────┬─────────────────┬─────────────────────────┐
│ System          │ Frequency       │ Annual Cost             │
├─────────────────┼─────────────────┼─────────────────────────┤
│ HVAC            │ Quarterly       │ $[Amount]              │
│ Electrical      │ Annual          │ $[Amount]              │
└─────────────────┴─────────────────┴─────────────────────────┘
```

---

**Document Version**: 1.0  
**Last Updated**: January 2025  
**Source**: Onyx Report System Specifications  
**Application**: Report Generation Engine Development