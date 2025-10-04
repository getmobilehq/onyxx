-- Create pre_assessments table if it doesn't exist

CREATE TABLE IF NOT EXISTS pre_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
    building_id UUID REFERENCES buildings(id) ON DELETE CASCADE,
    assessment_type VARCHAR(100),
    assessment_date DATE,
    assessment_scope VARCHAR(100),
    building_size NUMERIC(12, 2),
    building_type VARCHAR(100),
    replacement_value NUMERIC(15, 2),
    selected_elements JSONB DEFAULT '[]'::jsonb,
    checklist JSONB DEFAULT '{}'::jsonb,
    additional_notes TEXT,
    assessor_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'draft',
    completed_at TIMESTAMP,
    created_by_user_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(assessment_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_pre_assessments_assessment_id ON pre_assessments(assessment_id);
CREATE INDEX IF NOT EXISTS idx_pre_assessments_building_id ON pre_assessments(building_id);
CREATE INDEX IF NOT EXISTS idx_pre_assessments_status ON pre_assessments(status);

COMMENT ON TABLE pre_assessments IS 'Stores pre-assessment data including checklists and element selection';
