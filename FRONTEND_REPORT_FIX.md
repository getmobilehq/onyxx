# Frontend Report Generation Fix Guide

## Current Status
The frontend already has most of the correct API calls in place. The main issues are:
1. Backend database schema mismatches (already fixed)
2. Proper sequencing of assessment completion → report generation
3. Ensuring report generation is triggered after assessment completion

## Frontend Files Already Correct

### ✅ API Service (`src/services/api.ts`)
```javascript
// These are already correct:
completeAssessment: (assessmentId: string) => 
  api.post(`/assessments/${assessmentId}/complete`),
  
generateFromAssessment: (assessmentId: string) => 
  api.post(`/reports/generate/${assessmentId}`),
  
downloadAssessmentPDF: (assessmentId: string) => 
  api.get(`/reports/download/assessment/${assessmentId}`, { responseType: 'blob' }),
```

## Key Frontend Fix Required

### In `src/pages/assessments/field-assessment.tsx`

The assessment completion process needs to ensure report generation happens after successful completion:

```javascript
// Around line 428-470, after completing the assessment:
const completionResult = await completeAssessmentAPI(assessmentId);
console.log('✅ Assessment completion result:', completionResult);

// ADD THIS: Automatically generate report after successful completion
if (completionResult && completionResult.assessment) {
  try {
    console.log('📄 Generating report for assessment:', assessmentId);
    const reportResult = await reportsAPI.generateFromAssessment(assessmentId);
    console.log('✅ Report generated successfully:', reportResult);
    
    // Optional: Auto-download the PDF
    if (reportResult.success) {
      const pdfBlob = await reportsAPI.downloadAssessmentPDF(assessmentId);
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `assessment-report-${assessmentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Report PDF downloaded successfully');
    }
  } catch (error) {
    console.error('Failed to generate report:', error);
    toast.error('Assessment completed but report generation failed');
  }
}
```

## Backend Requirements (Already Fixed)

The backend controllers have been updated to use the correct column names:
- ✅ `building_type` → `type`
- ✅ `address` → `street_address`
- ✅ `assessment_type` → `type`
- ✅ `assigned_to` → `assigned_to_user_id`
- ✅ `completion_date` → `completed_at`
- ✅ `generated_by` → `created_by_user_id`

## Testing Checklist

1. **Start Frontend Dev Server**
   ```bash
   npm run dev
   ```

2. **Login**
   - Use: admin@onyx.com / password123

3. **Create or Select Building**
   - Ensure building has replacement value set

4. **Start New Assessment**
   - Select "Field Assessment" type
   - Complete pre-assessment checklist

5. **Field Assessment**
   - Assess at least one element
   - Add deficiencies with costs
   - Click "Complete Assessment"

6. **Verify Report Generation**
   - Check console for success messages
   - PDF should auto-download
   - Check Reports page for new entry

## Common Issues and Solutions

### Issue: "Assessment must be completed"
**Solution**: Ensure the assessment status is 'completed' before generating report. The completion endpoint should be called first.

### Issue: PDF download fails silently
**Solution**: Check browser console for CORS errors. Ensure the backend allows the frontend origin.

### Issue: "Column X does not exist"
**Solution**: Backend needs the schema fixes applied. Restart the backend server after applying fixes.

### Issue: No replacement value
**Solution**: Ensure the building has a replacement_value set. This is required for FCI calculation.

## Quick Test Script

You can test the complete flow using the browser console:

```javascript
// Run this in browser console after logging in
async function testReportGeneration() {
  const api = window.api; // Assuming api is available globally
  
  // Get first building
  const buildings = await api.get('/buildings');
  const buildingId = buildings.data.buildings[0].id;
  
  // Create assessment
  const assessment = await api.post('/assessments', {
    building_id: buildingId,
    type: 'field_assessment',
    status: 'pending'
  });
  
  const assessmentId = assessment.data.assessment.id;
  
  // Add sample element
  await api.post(`/assessments/${assessmentId}/elements`, {
    element_id: 'some-element-id',
    condition_rating: 3,
    notes: 'Test',
    deficiencies: [{
      description: 'Test deficiency',
      cost: 10000,
      category: 'Critical Systems'
    }]
  });
  
  // Complete assessment
  await api.post(`/assessments/${assessmentId}/complete`);
  
  // Generate report
  await api.post(`/reports/generate/${assessmentId}`);
  
  // Download PDF
  const pdf = await api.get(`/reports/download/assessment/${assessmentId}`, {
    responseType: 'blob'
  });
  
  console.log('✅ All steps completed successfully!');
  return pdf;
}

testReportGeneration().then(console.log).catch(console.error);
```

## Summary

The frontend is mostly ready. The main changes needed are:
1. ✅ Backend schema fixes (completed)
2. ⚠️ Add automatic report generation after assessment completion
3. ⚠️ Optional: Add auto-download of PDF after generation
4. ✅ API endpoints are already correct

The backend fixes are the critical part - once those are applied and the server is restarted, report generation should work properly.