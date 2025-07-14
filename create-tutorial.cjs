const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } = require('docx');
const fs = require('fs');

// Create the tutorial document
const doc = new Document({
    sections: [{
        properties: {},
        children: [
            // Title
            new Paragraph({
                text: "ONYX PLATFORM",
                heading: HeadingLevel.TITLE,
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 }
            }),
            
            new Paragraph({
                text: "Building Condition Assessment Platform",
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 }
            }),
            
            new Paragraph({
                text: "Director's Guide to End-to-End Operations",
                heading: HeadingLevel.HEADING_2,
                alignment: AlignmentType.CENTER,
                spacing: { after: 600 }
            }),

            // Introduction
            new Paragraph({
                text: "Welcome to Onyx",
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 }
            }),
            
            new Paragraph({
                children: [
                    new TextRun({
                        text: "Onyx is a comprehensive building condition assessment platform designed to help organizations systematically evaluate, track, and manage the condition of their building portfolios. This guide will walk you through the entire assessment process, from initial setup to final reporting.",
                        size: 24
                    })
                ],
                spacing: { after: 400 }
            }),

            // Platform Overview
            new Paragraph({
                text: "Platform Overview",
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 }
            }),

            new Paragraph({
                children: [
                    new TextRun({
                        text: "The Onyx platform consists of several key modules:",
                        size: 24,
                        bold: true
                    })
                ],
                spacing: { after: 200 }
            }),

            new Paragraph({
                children: [
                    new TextRun({
                        text: "• Buildings Management: ",
                        size: 24,
                        bold: true
                    }),
                    new TextRun({
                        text: "Add and manage your building portfolio",
                        size: 24
                    })
                ],
                spacing: { after: 100 }
            }),

            new Paragraph({
                children: [
                    new TextRun({
                        text: "• Assessment Workflow: ",
                        size: 24,
                        bold: true
                    }),
                    new TextRun({
                        text: "Two-phase assessment process (Pre-assessment and Field Assessment)",
                        size: 24
                    })
                ],
                spacing: { after: 100 }
            }),

            new Paragraph({
                children: [
                    new TextRun({
                        text: "• Reports & Analytics: ",
                        size: 24,
                        bold: true
                    }),
                    new TextRun({
                        text: "Generate comprehensive reports and track FCI trends",
                        size: 24
                    })
                ],
                spacing: { after: 100 }
            }),

            new Paragraph({
                children: [
                    new TextRun({
                        text: "• Team Management: ",
                        size: 24,
                        bold: true
                    }),
                    new TextRun({
                        text: "Manage assessors and assign responsibilities",
                        size: 24
                    })
                ],
                spacing: { after: 400 }
            }),

            // Assessment Process
            new Paragraph({
                text: "The Assessment Process",
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 }
            }),

            new Paragraph({
                children: [
                    new TextRun({
                        text: "The Onyx assessment process follows a systematic two-phase approach to ensure thorough and accurate building condition evaluations:",
                        size: 24
                    })
                ],
                spacing: { after: 400 }
            }),

            // Pre-Assessment
            new Paragraph({
                text: "Phase 1: Pre-Assessment",
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 300, after: 200 }
            }),

            new Paragraph({
                children: [
                    new TextRun({
                        text: "What is Pre-Assessment?",
                        size: 24,
                        bold: true,
                        underline: {}
                    })
                ],
                spacing: { after: 200 }
            }),

            new Paragraph({
                children: [
                    new TextRun({
                        text: "Pre-assessment is the planning and preparation phase before conducting the actual field inspection. This critical phase ensures that assessors have all necessary information, permissions, and resources before visiting the building.",
                        size: 24
                    })
                ],
                spacing: { after: 300 }
            }),

            new Paragraph({
                children: [
                    new TextRun({
                        text: "Pre-Assessment Checklist includes:",
                        size: 24,
                        bold: true
                    })
                ],
                spacing: { after: 200 }
            }),

            new Paragraph({
                children: [
                    new TextRun({
                        text: "✓ Building Plans and Drawings - ",
                        size: 24,
                        bold: true
                    }),
                    new TextRun({
                        text: "Architectural, structural, and MEP drawings are available and reviewed",
                        size: 24
                    })
                ],
                spacing: { after: 100 }
            }),

            new Paragraph({
                children: [
                    new TextRun({
                        text: "✓ Access Permissions - ",
                        size: 24,
                        bold: true
                    }),
                    new TextRun({
                        text: "All necessary permissions and access arrangements are confirmed",
                        size: 24
                    })
                ],
                spacing: { after: 100 }
            }),

            new Paragraph({
                children: [
                    new TextRun({
                        text: "✓ Safety Equipment - ",
                        size: 24,
                        bold: true
                    }),
                    new TextRun({
                        text: "Personal protective equipment and safety gear are ready",
                        size: 24
                    })
                ],
                spacing: { after: 100 }
            }),

            new Paragraph({
                children: [
                    new TextRun({
                        text: "✓ Previous Assessment Reports - ",
                        size: 24,
                        bold: true
                    }),
                    new TextRun({
                        text: "Historical assessment data and maintenance records are gathered",
                        size: 24
                    })
                ],
                spacing: { after: 100 }
            }),

            new Paragraph({
                children: [
                    new TextRun({
                        text: "✓ Key Stakeholders Identified - ",
                        size: 24,
                        bold: true
                    }),
                    new TextRun({
                        text: "Building management and maintenance staff contacts are established",
                        size: 24
                    })
                ],
                spacing: { after: 100 }
            }),

            new Paragraph({
                children: [
                    new TextRun({
                        text: "✓ Weather Conditions Checked - ",
                        size: 24,
                        bold: true
                    }),
                    new TextRun({
                        text: "Weather forecast reviewed for assessment day planning",
                        size: 24
                    })
                ],
                spacing: { after: 100 }
            }),

            new Paragraph({
                children: [
                    new TextRun({
                        text: "✓ Emergency Procedures - ",
                        size: 24,
                        bold: true
                    }),
                    new TextRun({
                        text: "Emergency contacts and procedures are documented",
                        size: 24
                    })
                ],
                spacing: { after: 100 }
            }),

            new Paragraph({
                children: [
                    new TextRun({
                        text: "✓ Equipment Calibration - ",
                        size: 24,
                        bold: true
                    }),
                    new TextRun({
                        text: "All measurement and testing equipment is calibrated and functional",
                        size: 24
                    })
                ],
                spacing: { after: 300 }
            }),

            new Paragraph({
                children: [
                    new TextRun({
                        text: "Element Selection:",
                        size: 24,
                        bold: true,
                        underline: {}
                    })
                ],
                spacing: { after: 200 }
            }),

            new Paragraph({
                children: [
                    new TextRun({
                        text: "During pre-assessment, you must select which building elements will be evaluated. Onyx uses the Uniformat II classification system, which organizes building components into logical groups such as:",
                        size: 24
                    })
                ],
                spacing: { after: 100 }
            }),

            new Paragraph({
                children: [
                    new TextRun({
                        text: "• A10 - Foundations\n• B10 - Superstructure\n• B20 - Exterior Enclosure\n• C10 - Interior Construction\n• D20 - Plumbing\n• D30 - HVAC\n• D40 - Fire Protection\n• D50 - Electrical",
                        size: 24
                    })
                ],
                spacing: { after: 400 }
            }),

            // Field Assessment
            new Paragraph({
                text: "Phase 2: Field Assessment",
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 300, after: 200 }
            }),

            new Paragraph({
                children: [
                    new TextRun({
                        text: "What is Field Assessment?",
                        size: 24,
                        bold: true,
                        underline: {}
                    })
                ],
                spacing: { after: 200 }
            }),

            new Paragraph({
                children: [
                    new TextRun({
                        text: "Field assessment is the on-site inspection phase where assessors physically evaluate each building element selected during pre-assessment. This hands-on evaluation determines the actual condition of building components.",
                        size: 24
                    })
                ],
                spacing: { after: 300 }
            }),

            new Paragraph({
                children: [
                    new TextRun({
                        text: "For each element, assessors will:",
                        size: 24,
                        bold: true
                    })
                ],
                spacing: { after: 200 }
            }),

            new Paragraph({
                children: [
                    new TextRun({
                        text: "1. Assign a Condition Rating (1-5 scale):",
                        size: 24,
                        bold: true
                    })
                ],
                spacing: { after: 100 }
            }),

            new Paragraph({
                children: [
                    new TextRun({
                        text: "   • 5 - Excellent: Like new condition\n   • 4 - Good: Minor wear, fully functional\n   • 3 - Fair: Moderate wear, functional but needs attention\n   • 2 - Poor: Significant deterioration, needs major repair\n   • 1 - Failed: Non-functional, needs replacement",
                        size: 24
                    })
                ],
                spacing: { after: 200 }
            }),

            new Paragraph({
                children: [
                    new TextRun({
                        text: "2. Document Deficiencies:",
                        size: 24,
                        bold: true
                    }),
                    new TextRun({
                        text: " Record specific issues, damage, or maintenance needs",
                        size: 24
                    })
                ],
                spacing: { after: 100 }
            }),

            new Paragraph({
                children: [
                    new TextRun({
                        text: "3. Capture Photographic Evidence:",
                        size: 24,
                        bold: true
                    }),
                    new TextRun({
                        text: " Take photos to document conditions",
                        size: 24
                    })
                ],
                spacing: { after: 100 }
            }),

            new Paragraph({
                children: [
                    new TextRun({
                        text: "4. Add Notes:",
                        size: 24,
                        bold: true
                    }),
                    new TextRun({
                        text: " Provide additional context or recommendations",
                        size: 24
                    })
                ],
                spacing: { after: 400 }
            }),

            // FCI Calculation
            new Paragraph({
                text: "Understanding FCI (Facility Condition Index)",
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 }
            }),

            new Paragraph({
                children: [
                    new TextRun({
                        text: "What is FCI?",
                        size: 24,
                        bold: true,
                        underline: {}
                    })
                ],
                spacing: { after: 200 }
            }),

            new Paragraph({
                children: [
                    new TextRun({
                        text: "The Facility Condition Index (FCI) is a industry-standard metric that measures the relative condition of a building. It provides a numerical indicator of building health that helps prioritize maintenance and capital planning decisions.",
                        size: 24
                    })
                ],
                spacing: { after: 300 }
            }),

            new Paragraph({
                children: [
                    new TextRun({
                        text: "How FCI is Calculated:",
                        size: 24,
                        bold: true,
                        underline: {}
                    })
                ],
                spacing: { after: 200 }
            }),

            new Paragraph({
                children: [
                    new TextRun({
                        text: "FCI = Total Deficiency Cost ÷ Current Replacement Value",
                        size: 28,
                        bold: true,
                        highlight: "yellow"
                    })
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 300 }
            }),

            new Paragraph({
                children: [
                    new TextRun({
                        text: "Where:",
                        size: 24,
                        bold: true
                    })
                ],
                spacing: { after: 100 }
            }),

            new Paragraph({
                children: [
                    new TextRun({
                        text: "• Total Deficiency Cost = ",
                        size: 24,
                        bold: true
                    }),
                    new TextRun({
                        text: "Sum of all repair/replacement costs for elements rated below acceptable condition",
                        size: 24
                    })
                ],
                spacing: { after: 100 }
            }),

            new Paragraph({
                children: [
                    new TextRun({
                        text: "• Current Replacement Value = ",
                        size: 24,
                        bold: true
                    }),
                    new TextRun({
                        text: "Building Size (sq ft) × Cost per sq ft for building type",
                        size: 24
                    })
                ],
                spacing: { after: 300 }
            }),

            new Paragraph({
                children: [
                    new TextRun({
                        text: "FCI Interpretation:",
                        size: 24,
                        bold: true,
                        underline: {}
                    })
                ],
                spacing: { after: 200 }
            }),

            new Paragraph({
                children: [
                    new TextRun({
                        text: "• 0.00 - 0.1: ",
                        size: 24,
                        bold: true,
                        color: "00AA00"
                    }),
                    new TextRun({
                        text: "Excellent Condition - Representative of new building",
                        size: 24
                    })
                ],
                spacing: { after: 100 }
            }),

            new Paragraph({
                children: [
                    new TextRun({
                        text: "• 0.1 - 0.4: ",
                        size: 24,
                        bold: true,
                        color: "22C55E"
                    }),
                    new TextRun({
                        text: "Good Condition - Light investment needed",
                        size: 24
                    })
                ],
                spacing: { after: 100 }
            }),

            new Paragraph({
                children: [
                    new TextRun({
                        text: "• 0.4 - 0.7: ",
                        size: 24,
                        bold: true,
                        color: "F59E0B"
                    }),
                    new TextRun({
                        text: "Fair Condition - Need strong plan for renovation",
                        size: 24
                    })
                ],
                spacing: { after: 100 }
            }),

            new Paragraph({
                children: [
                    new TextRun({
                        text: "• 0.7 - 1: ",
                        size: 24,
                        bold: true,
                        color: "EF4444"
                    }),
                    new TextRun({
                        text: "Critical Condition - Consider demolition as cost of repair/replacement is at or close to 100% of new build",
                        size: 24
                    })
                ],
                spacing: { after: 400 }
            }),

            // Example
            new Paragraph({
                text: "FCI Calculation Example",
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 300, after: 200 }
            }),

            new Paragraph({
                children: [
                    new TextRun({
                        text: "Building: Corporate Office Building\nSize: 50,000 sq ft\nBuilding Type: Office ($350/sq ft)\nCurrent Replacement Value: 50,000 × $350 = $17,500,000",
                        size: 24
                    })
                ],
                spacing: { after: 200 }
            }),

            new Paragraph({
                children: [
                    new TextRun({
                        text: "Deficiencies Found:\n• Roof replacement needed: $500,000\n• HVAC system repairs: $250,000\n• Electrical upgrades: $100,000\n• Total Deficiency Cost: $850,000",
                        size: 24
                    })
                ],
                spacing: { after: 200 }
            }),

            new Paragraph({
                children: [
                    new TextRun({
                        text: "FCI = $850,000 ÷ $17,500,000 = 0.049",
                        size: 24,
                        bold: true
                    })
                ],
                spacing: { after: 100 }
            }),

            new Paragraph({
                children: [
                    new TextRun({
                        text: "Result: FCI of 0.049 indicates the building is in ",
                        size: 24
                    }),
                    new TextRun({
                        text: "Excellent Condition",
                        size: 24,
                        bold: true,
                        color: "00AA00"
                    })
                ],
                spacing: { after: 400 }
            }),

            // Quick Start Guide
            new Paragraph({
                text: "Quick Start Guide",
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 }
            }),

            new Paragraph({
                children: [
                    new TextRun({
                        text: "Step 1: Add a Building",
                        size: 24,
                        bold: true
                    })
                ],
                spacing: { after: 100 }
            }),

            new Paragraph({
                children: [
                    new TextRun({
                        text: "Navigate to Buildings → New Building → Enter building details → Save",
                        size: 24
                    })
                ],
                spacing: { after: 200 }
            }),

            new Paragraph({
                children: [
                    new TextRun({
                        text: "Step 2: Start an Assessment",
                        size: 24,
                        bold: true
                    })
                ],
                spacing: { after: 100 }
            }),

            new Paragraph({
                children: [
                    new TextRun({
                        text: "Go to Assessments → New Assessment → Select building → Create Assessment",
                        size: 24
                    })
                ],
                spacing: { after: 200 }
            }),

            new Paragraph({
                children: [
                    new TextRun({
                        text: "Step 3: Complete Pre-Assessment",
                        size: 24,
                        bold: true
                    })
                ],
                spacing: { after: 100 }
            }),

            new Paragraph({
                children: [
                    new TextRun({
                        text: "Fill checklist → Select building elements → Save and Continue",
                        size: 24
                    })
                ],
                spacing: { after: 200 }
            }),

            new Paragraph({
                children: [
                    new TextRun({
                        text: "Step 4: Conduct Field Assessment",
                        size: 24,
                        bold: true
                    })
                ],
                spacing: { after: 100 }
            }),

            new Paragraph({
                children: [
                    new TextRun({
                        text: "Rate each element → Document deficiencies → Add photos → Complete Assessment",
                        size: 24
                    })
                ],
                spacing: { after: 200 }
            }),

            new Paragraph({
                children: [
                    new TextRun({
                        text: "Step 5: Review Results",
                        size: 24,
                        bold: true
                    })
                ],
                spacing: { after: 100 }
            }),

            new Paragraph({
                children: [
                    new TextRun({
                        text: "View FCI score → Generate reports → Plan maintenance activities",
                        size: 24
                    })
                ],
                spacing: { after: 400 }
            }),

            // Best Practices
            new Paragraph({
                text: "Best Practices",
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 }
            }),

            new Paragraph({
                children: [
                    new TextRun({
                        text: "1. ",
                        size: 24,
                        bold: true
                    }),
                    new TextRun({
                        text: "Consistency is Key: ",
                        size: 24,
                        bold: true
                    }),
                    new TextRun({
                        text: "Ensure all assessors use the same rating criteria",
                        size: 24
                    })
                ],
                spacing: { after: 100 }
            }),

            new Paragraph({
                children: [
                    new TextRun({
                        text: "2. ",
                        size: 24,
                        bold: true
                    }),
                    new TextRun({
                        text: "Document Everything: ",
                        size: 24,
                        bold: true
                    }),
                    new TextRun({
                        text: "Photos and detailed notes support future decision-making",
                        size: 24
                    })
                ],
                spacing: { after: 100 }
            }),

            new Paragraph({
                children: [
                    new TextRun({
                        text: "3. ",
                        size: 24,
                        bold: true
                    }),
                    new TextRun({
                        text: "Regular Assessments: ",
                        size: 24,
                        bold: true
                    }),
                    new TextRun({
                        text: "Conduct assessments annually or bi-annually",
                        size: 24
                    })
                ],
                spacing: { after: 100 }
            }),

            new Paragraph({
                children: [
                    new TextRun({
                        text: "4. ",
                        size: 24,
                        bold: true
                    }),
                    new TextRun({
                        text: "Track Trends: ",
                        size: 24,
                        bold: true
                    }),
                    new TextRun({
                        text: "Monitor FCI changes over time to identify deterioration patterns",
                        size: 24
                    })
                ],
                spacing: { after: 100 }
            }),

            new Paragraph({
                children: [
                    new TextRun({
                        text: "5. ",
                        size: 24,
                        bold: true
                    }),
                    new TextRun({
                        text: "Prioritize Safety: ",
                        size: 24,
                        bold: true
                    }),
                    new TextRun({
                        text: "Always complete safety checks before field assessments",
                        size: 24
                    })
                ],
                spacing: { after: 400 }
            }),

            // Contact
            new Paragraph({
                text: "Need Help?",
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 }
            }),

            new Paragraph({
                children: [
                    new TextRun({
                        text: "For technical support or questions about the Onyx platform:\n\n• Email: support@onyxplatform.com\n• Documentation: docs.onyxplatform.com\n• Training Videos: training.onyxplatform.com",
                        size: 24
                    })
                ],
                spacing: { after: 200 }
            }),

            new Paragraph({
                children: [
                    new TextRun({
                        text: "\n\nWelcome to Onyx - Your partner in building condition assessment!",
                        size: 24,
                        bold: true,
                        italics: true
                    })
                ],
                alignment: AlignmentType.CENTER
            })
        ]
    }]
});

// Generate and save the document
Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("/Users/josephagunbiade/Desktop/studio/onyx/Onyx_Platform_Director_Tutorial.docx", buffer);
    console.log("✅ Tutorial document created successfully!");
    console.log("📄 File saved as: Onyx_Platform_Director_Tutorial.docx");
});