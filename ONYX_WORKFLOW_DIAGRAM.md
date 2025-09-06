# 🔄 ONYX COMPLETE WORKFLOW DIAGRAM

**Visual representation of the complete building assessment workflow from creation to report generation**

## 📊 Complete System Flow

```mermaid
graph TB
    %% User Authentication
    A[User Login] --> B{Authenticated?}
    B -->|No| C[Login Form]
    C --> D[JWT Token Generated]
    D --> E[Dashboard Access]
    B -->|Yes| E
    
    %% Building Management Phase
    E --> F[Buildings Management]
    F --> G{Building Exists?}
    G -->|No| H[Create New Building]
    G -->|Yes| I[Select Existing Building]
    
    %% Building Creation Detail
    H --> H1[Building Form]
    H1 --> H2[Validation & Cost Calculation]
    H2 --> H3[Save to Database]
    H3 --> I
    
    %% Assessment Creation Phase
    I --> J[Start New Assessment]
    J --> K[Assessment Type Selection]
    K --> L[Pre-Assessment Phase]
    
    %% Pre-Assessment Detail
    L --> L1[Pre-Assessment Checklist]
    L1 --> L2[Element Selection]
    L2 --> L3[Scope Definition]
    L3 --> M{Checklist Complete?}
    M -->|No| L1
    M -->|Yes| N[Field Assessment Phase]
    
    %% Field Assessment Detail
    N --> N1[Element Evaluation Loop]
    N1 --> N2[Condition Rating 1-5]
    N2 --> N3[Deficiency Documentation]
    N3 --> N4[Photo Capture]
    N4 --> N5[Cost Estimation]
    N5 --> N6{More Elements?}
    N6 -->|Yes| N1
    N6 -->|No| O[Assessment Completion]
    
    %% Completion & Calculation
    O --> O1[Aggregate All Costs]
    O1 --> O2[Calculate FCI Score]
    O2 --> O3[Update Assessment Status]
    O3 --> P[Report Generation Trigger]
    
    %% Report Generation Detail
    P --> P1[Fetch Assessment Data]
    P1 --> P2[Fetch Building Data]
    P2 --> P3[Generate Report Record]
    P3 --> P4[Create PDF with PDFKit]
    P4 --> P5[Format Professional Report]
    P5 --> Q[PDF Ready for Download]
    
    %% Final Actions
    Q --> R[User Downloads Report]
    R --> S[Capital Planning Decisions]
    
    %% Styling
    classDef userAction fill:#e1f5fe
    classDef systemProcess fill:#f3e5f5
    classDef database fill:#e8f5e8
    classDef decision fill:#fff3e0
    
    class A,C,H1,L1,N2,N3,N4,R userAction
    class D,H2,L2,L3,N1,N5,O1,O2,P1,P2,P4,P5 systemProcess
    class H3,O3,P3 database
    class B,G,M,N6 decision
```

## 🏗️ Detailed Component Architecture

```mermaid
graph LR
    %% Frontend Components
    subgraph "Frontend (React + TypeScript)"
        A1[Authentication Pages]
        A2[Dashboard]
        A3[Building Management]
        A4[Assessment Workflow]
        A5[Report Management]
        
        A3 --> A3a[Building List]
        A3 --> A3b[New Building Form]
        A3 --> A3c[Building Details]
        
        A4 --> A4a[Assessment Creation]
        A4 --> A4b[Pre-Assessment]
        A4 --> A4c[Field Assessment]
        A4 --> A4d[Assessment Completion]
        
        A5 --> A5a[Report List]
        A5 --> A5b[Report Generation]
        A5 --> A5c[PDF Download]
    end
    
    %% API Layer
    subgraph "API Layer (Express + TypeScript)"
        B1[Auth Routes]
        B2[Buildings Routes]
        B3[Assessments Routes]
        B4[Reports Routes]
        B5[Elements Routes]
        
        B2 --> B2a[CRUD Operations]
        B2 --> B2b[Cost Calculations]
        
        B3 --> B3a[Assessment CRUD]
        B3 --> B3b[Element Management]
        B3 --> B3c[Completion Handler]
        
        B4 --> B4a[Report Generation]
        B4 --> B4b[PDF Creation]
        B4 --> B4c[Download Handler]
    end
    
    %% Database Layer
    subgraph "Database (PostgreSQL)"
        C1[(users)]
        C2[(organizations)]
        C3[(buildings)]
        C4[(assessments)]
        C5[(assessment_elements)]
        C6[(elements)]
        C7[(reports)]
        
        C2 --> C1
        C3 --> C2
        C4 --> C3
        C5 --> C4
        C5 --> C6
        C7 --> C4
    end
    
    %% Services
    subgraph "Services"
        D1[FCI Service]
        D2[PDF Generator]
        D3[Email Service]
        D4[File Storage]
    end
    
    %% Connections
    A1 --> B1
    A3 --> B2
    A4 --> B3
    A5 --> B4
    
    B2a --> C3
    B3a --> C4
    B3b --> C5
    B4a --> C7
    
    B3c --> D1
    B4b --> D2
```

## 🔄 Assessment Workflow State Machine

```mermaid
stateDiagram-v2
    [*] --> NotStarted
    
    NotStarted --> PreAssessment : Create Assessment
    
    PreAssessment --> ChecklistValidation : Complete Checklist
    ChecklistValidation --> PreAssessment : Missing Items
    ChecklistValidation --> ElementSelection : All Items Complete
    
    ElementSelection --> ScopeDefinition : Elements Selected
    ScopeDefinition --> FieldAssessment : Scope Defined
    
    FieldAssessment --> ElementEvaluation : Start Field Work
    ElementEvaluation --> ConditionRating : Evaluate Element
    ConditionRating --> DeficiencyDoc : Rate Condition
    DeficiencyDoc --> PhotoCapture : Document Issues
    PhotoCapture --> CostEstimation : Add Photos
    CostEstimation --> ElementEvaluation : Estimate Costs
    ElementEvaluation --> CostAggregation : All Elements Done
    
    CostAggregation --> FCICalculation : Costs Aggregated
    FCICalculation --> AssessmentComplete : FCI Calculated
    
    AssessmentComplete --> ReportGeneration : Trigger Report
    ReportGeneration --> PDFReady : Report Generated
    
    PDFReady --> [*] : Download Complete
    
    %% Error States
    PreAssessment --> [*] : Cancel
    FieldAssessment --> [*] : Cancel
    ElementEvaluation --> [*] : Save Draft
```

## 📊 Database Entity Relationships

```mermaid
erDiagram
    ORGANIZATIONS {
        uuid id PK
        string name
        timestamp created_at
        timestamp updated_at
    }
    
    USERS {
        uuid id PK
        uuid organization_id FK
        string email
        string name
        string role
        timestamp created_at
    }
    
    BUILDINGS {
        uuid id PK
        uuid organization_id FK
        string name
        string type
        string street_address
        string city
        string state
        string zip_code
        integer year_built
        integer square_footage
        decimal replacement_value
        decimal cost_per_sqft
        timestamp created_at
        timestamp updated_at
    }
    
    ASSESSMENTS {
        uuid id PK
        uuid organization_id FK
        uuid building_id FK
        uuid assigned_to_user_id FK
        uuid created_by_user_id FK
        string type
        string status
        timestamp started_at
        timestamp completed_at
        decimal fci_score
        decimal total_repair_cost
        decimal replacement_value
        decimal immediate_repair_cost
        decimal short_term_repair_cost
        decimal long_term_repair_cost
        text notes
        timestamp created_at
        timestamp updated_at
    }
    
    ELEMENTS {
        uuid id PK
        string major_group
        string group_element
        string individual_element
        timestamp created_at
    }
    
    ASSESSMENT_ELEMENTS {
        uuid id PK
        uuid assessment_id FK
        uuid element_id FK
        integer condition_rating
        text notes
        json photo_urls
        string deficiency_category
        string deficiency_severity
        decimal repair_cost
        json deficiencies
        timestamp created_at
        timestamp updated_at
    }
    
    REPORTS {
        uuid id PK
        uuid assessment_id FK
        uuid building_id FK
        uuid created_by_user_id FK
        string title
        text description
        string report_type
        string status
        timestamp assessment_date
        timestamp report_date
        string assessor_name
        decimal fci_score
        decimal total_repair_cost
        decimal replacement_value
        decimal immediate_repair_cost
        decimal short_term_repair_cost
        decimal long_term_repair_cost
        integer element_count
        integer deficiency_count
        text executive_summary
        text recommendations
        json systems_data
        string pdf_url
        string excel_url
        timestamp created_at
        timestamp updated_at
    }
    
    %% Relationships
    ORGANIZATIONS ||--o{ USERS : "has many"
    ORGANIZATIONS ||--o{ BUILDINGS : "owns"
    ORGANIZATIONS ||--o{ ASSESSMENTS : "contains"
    
    BUILDINGS ||--o{ ASSESSMENTS : "assessed by"
    
    USERS ||--o{ ASSESSMENTS : "assigned to"
    USERS ||--o{ ASSESSMENTS : "created by"
    USERS ||--o{ REPORTS : "generated by"
    
    ASSESSMENTS ||--o{ ASSESSMENT_ELEMENTS : "contains"
    ASSESSMENTS ||--o{ REPORTS : "generates"
    
    ELEMENTS ||--o{ ASSESSMENT_ELEMENTS : "evaluated in"
    
    BUILDINGS ||--o{ REPORTS : "reported for"
```

## 🎯 FCI Calculation Flow

```mermaid
graph TD
    A[Assessment Elements Completed] --> B[Collect All Repair Costs]
    B --> C[Sum by Priority Categories]
    
    C --> D[Priority 1: Life Safety<br/>$75,000]
    C --> E[Priority 2: Critical Systems<br/>$125,000]
    C --> F[Priority 3: Energy Efficiency<br/>$85,000]
    C --> G[Priority 4: Asset Lifecycle<br/>$200,000]
    C --> H[Priority 5: User Experience<br/>$50,000]
    
    D --> I[Total Repair Cost<br/>$535,000]
    E --> I
    F --> I
    G --> I
    H --> I
    
    I --> J[Get Building Replacement Value<br/>$15,000,000]
    
    I --> K[Calculate FCI]
    J --> K
    K --> L[FCI = $535,000 ÷ $15,000,000<br/>= 0.0357 = 3.57%]
    
    L --> M{FCI Interpretation}
    M --> N[0.00-0.10: Excellent<br/>0.10-0.40: Good<br/>0.40-0.70: Fair<br/>0.70+: Critical]
    
    N --> O[Result: EXCELLENT<br/>Light maintenance investment needed]
    
    O --> P[Store FCI in Database]
    P --> Q[Update Assessment Status]
    Q --> R[Trigger Report Generation]
    
    %% Styling
    classDef calculation fill:#e3f2fd
    classDef cost fill:#fff3e0
    classDef result fill:#e8f5e8
    
    class A,B,C,K,L calculation
    class D,E,F,G,H,I,J cost
    class O,P,Q,R result
```

## 📄 Report Generation Pipeline

```mermaid
graph LR
    A[Assessment Completed] --> B[Fetch Assessment Data]
    
    B --> C[Get Building Info]
    B --> D[Get Element Assessments]
    B --> E[Get Deficiencies]
    B --> F[Get Photos/Notes]
    
    C --> G[Create Report Record]
    D --> G
    E --> G
    F --> G
    
    G --> H[Initialize PDF Document]
    
    H --> I1[Generate Cover Page]
    H --> I2[Generate Table of Contents]
    H --> I3[Generate Executive Summary]
    H --> I4[Generate Building Info Section]
    H --> I5[Generate FCI Analysis]
    H --> I6[Generate System Conditions]
    H --> I7[Generate Deficiency Details]
    H --> I8[Generate Cost Analysis]
    H --> I9[Generate Recommendations]
    H --> I10[Generate Appendices]
    
    I1 --> J[Combine All Sections]
    I2 --> J
    I3 --> J
    I4 --> J
    I5 --> J
    I6 --> J
    I7 --> J
    I8 --> J
    I9 --> J
    I10 --> J
    
    J --> K[Format Professional PDF]
    K --> L[Save to Storage]
    L --> M[Update Report Record]
    M --> N[Return Download URL]
    N --> O[User Downloads PDF]
    
    %% Styling
    classDef data fill:#e1f5fe
    classDef process fill:#f3e5f5
    classDef output fill:#e8f5e8
    
    class B,C,D,E,F data
    class G,H,I1,I2,I3,I4,I5,I6,I7,I8,I9,I10,J,K process
    class L,M,N,O output
```

## 🔧 Technology Integration Map

```mermaid
graph TB
    %% Client Layer
    subgraph "Client Layer"
        A1[Web Browser]
        A2[Mobile Browser]
        A3[Tablet Browser]
    end
    
    %% Frontend Layer
    subgraph "Frontend (React)"
        B1[Authentication]
        B2[Dashboard]
        B3[Building Mgmt]
        B4[Assessment Flow]
        B5[Reports]
        B6[ShadCN UI]
        B7[Tailwind CSS]
        B8[React Router]
        B9[React Hook Form]
    end
    
    %% API Gateway Layer
    subgraph "API Layer (Express)"
        C1[Auth Middleware]
        C2[Rate Limiting]
        C3[CORS]
        C4[Input Validation]
        C5[Error Handling]
    end
    
    %% Business Logic Layer
    subgraph "Business Logic"
        D1[Building Controller]
        D2[Assessment Controller]
        D3[Report Controller]
        D4[User Controller]
        D5[FCI Service]
        D6[PDF Service]
        D7[Email Service]
    end
    
    %% Data Layer
    subgraph "Data Layer"
        E1[(PostgreSQL)]
        E2[Connection Pool]
        E3[Query Builder]
        E4[Migrations]
    end
    
    %% External Services
    subgraph "External Services"
        F1[Cloudinary - File Storage]
        F2[Mailgun - Email]
        F3[Sentry - Monitoring]
        F4[Render - Hosting]
    end
    
    %% Connections
    A1 --> B1
    A2 --> B1
    A3 --> B1
    
    B1 --> C1
    B2 --> C1
    B3 --> C1
    B4 --> C1
    B5 --> C1
    
    C1 --> D1
    C1 --> D2
    C1 --> D3
    C1 --> D4
    
    D2 --> D5
    D3 --> D6
    D4 --> D7
    
    D1 --> E1
    D2 --> E1
    D3 --> E1
    D4 --> E1
    
    D6 --> F1
    D7 --> F2
    D1 --> F3
    D2 --> F3
    D3 --> F3
```

This comprehensive architectural blueprint and workflow diagram shows exactly how Onyx works from building creation through report generation, including all the components, data flows, and integrations that make the system function seamlessly.