-- Update pre_assessments table to store comprehensive pre-assessment data
-- Drop the existing limited table if it exists
DROP TABLE IF EXISTS pre_assessments CASCADE;

-- Create the updated pre_assessments table with comprehensive data storage
CREATE TABLE IF NOT EXISTS pre_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    
    -- Assessment Configuration
    assessment_type VARCHAR(50) NOT NULL DEFAULT 'Annual',
    assessment_date DATE NOT NULL,
    assessment_scope VARCHAR(100) NOT NULL,
    building_size INTEGER NOT NULL,
    building_type VARCHAR(100),
    replacement_value DECIMAL(12, 2),
    
    -- Selected Elements (JSONB for flexibility)
    selected_elements JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Pre-assessment Checklist
    checklist JSONB NOT NULL DEFAULT '{
        "buildingPlans": false,
        "accessPermissions": false,
        "safetyEquipment": false,
        "previousReports": false,
        "keyStakeholders": false,
        "weatherConditions": false,
        "emergencyProcedures": false,
        "equipmentCalibration": false
    }'::jsonb,
    
    -- Additional Information
    additional_notes TEXT,
    assessor_name VARCHAR(100),
    
    -- Status and Timestamps
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'completed')),
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by_user_id UUID REFERENCES users(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pre_assessments_assessment_id ON pre_assessments(assessment_id);
CREATE INDEX IF NOT EXISTS idx_pre_assessments_building_id ON pre_assessments(building_id);
CREATE INDEX IF NOT EXISTS idx_pre_assessments_status ON pre_assessments(status);
CREATE INDEX IF NOT EXISTS idx_pre_assessments_assessment_date ON pre_assessments(assessment_date);

-- Create GIN index for JSONB fields for faster queries
CREATE INDEX IF NOT EXISTS idx_pre_assessments_selected_elements ON pre_assessments USING GIN (selected_elements);
CREATE INDEX IF NOT EXISTS idx_pre_assessments_checklist ON pre_assessments USING GIN (checklist);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pre_assessments_updated_at 
    BEFORE UPDATE ON pre_assessments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE pre_assessments IS 'Stores comprehensive pre-assessment configuration and data';
COMMENT ON COLUMN pre_assessments.selected_elements IS 'JSON array of selected building elements with their properties';
COMMENT ON COLUMN pre_assessments.checklist IS 'JSON object containing pre-assessment checklist completion status';
COMMENT ON COLUMN pre_assessments.replacement_value IS 'Calculated replacement value based on building size and type';