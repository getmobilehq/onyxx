-- Create assessment_deficiencies table to store detailed deficiency data for each assessment element
CREATE TABLE IF NOT EXISTS assessment_deficiencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_element_id UUID NOT NULL REFERENCES assessment_elements(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    cost DECIMAL(12, 2) DEFAULT 0,
    category VARCHAR(50) NOT NULL,
    photos JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_assessment_deficiencies_element_id ON assessment_deficiencies(assessment_element_id);
CREATE INDEX IF NOT EXISTS idx_assessment_deficiencies_category ON assessment_deficiencies(category);

-- Add constraint for valid categories
ALTER TABLE assessment_deficiencies 
ADD CONSTRAINT assessment_deficiencies_category_check 
CHECK (category IN (
    'Life Safety & Code Compliance',
    'Critical Systems',
    'Energy Efficiency',
    'Asset Life Cycle',
    'User Experience',
    'Equity & Accessibility'
));

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_assessment_deficiencies_updated_at
    BEFORE UPDATE ON assessment_deficiencies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comment to describe the table
COMMENT ON TABLE assessment_deficiencies IS 'Stores individual deficiencies for each assessment element with cost, category, and photos';