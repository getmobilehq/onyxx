-- Create reports table to store facility condition reports
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
    building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    report_type VARCHAR(50) DEFAULT 'facility_condition' CHECK (report_type IN ('facility_condition', 'maintenance_plan', 'capital_assessment')),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    
    -- Report metadata
    assessment_date DATE,
    report_date DATE DEFAULT CURRENT_DATE,
    created_by_user_id UUID NOT NULL REFERENCES users(id),
    assessor_name VARCHAR(100),
    
    -- FCI and financial data
    fci_score DECIMAL(5, 4),
    total_repair_cost DECIMAL(12, 2),
    replacement_value DECIMAL(12, 2),
    immediate_repair_cost DECIMAL(12, 2),
    short_term_repair_cost DECIMAL(12, 2),
    long_term_repair_cost DECIMAL(12, 2),
    
    -- Assessment summary
    element_count INTEGER DEFAULT 0,
    deficiency_count INTEGER DEFAULT 0,
    
    -- Report content (structured data)
    executive_summary TEXT,
    recommendations JSONB,
    systems_data JSONB,
    
    -- File references
    pdf_url TEXT,
    excel_url TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reports_building_id ON reports(building_id);
CREATE INDEX IF NOT EXISTS idx_reports_assessment_id ON reports(assessment_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_by ON reports(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_report_date ON reports(report_date);

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_reports_updated_at
    BEFORE UPDATE ON reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments to describe the table and important columns
COMMENT ON TABLE reports IS 'Stores facility condition assessment reports with FCI calculations and recommendations';
COMMENT ON COLUMN reports.fci_score IS 'Facility Condition Index (0.0-1.0)';
COMMENT ON COLUMN reports.recommendations IS 'JSON array of maintenance and repair recommendations';
COMMENT ON COLUMN reports.systems_data IS 'JSON object containing condition data for building systems';