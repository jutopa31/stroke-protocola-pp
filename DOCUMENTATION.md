# Protocolo Interactivo de Stroke - Documentation

## 1. Introduction

The **Protocolo Interactivo de Stroke** is a comprehensive web application designed to support healthcare professionals during stroke emergency protocols (Código ACV). The application provides a systematic approach to evaluate patients with suspected stroke, calculate critical medical scores, determine treatment eligibility, and manage the entire stroke care workflow from initial assessment to treatment decision-making.

### Main Technologies Used:
- **Next.js 15.2.4** - React-based web framework
- **React 19** - Frontend library with hooks for state management
- **TypeScript** - Type safety and enhanced development experience
- **Tailwind CSS** - Utility-first CSS framework for responsive design
- **Radix UI** - Accessible component primitives for dialogs, forms, and interactions
- **Lucide React** - Icon library for consistent visual elements

## 2. Application Structure

The application follows a single-page architecture with multiple tabs/sections, each handling specific aspects of stroke protocol assessment:

### Core Components:
- **Main App Component** (`stroke-protocol-app.tsx`) - Central component containing all application logic
- **UI Components** (`components/ui/`) - Reusable interface components built with Radix UI
- **Layout & Routing** (`app/layout.tsx`, `app/page.tsx`) - Next.js app structure
- **Configuration Files** - Tailwind, Next.js, and TypeScript configurations

### Tab-Based Navigation:
1. **Dashboard** - Overview, timer, patient data, and quick actions
2. **Checklist** - Inclusion/exclusion criteria for thrombolysis
3. **NIHSS** - National Institutes of Health Stroke Scale assessment
4. **ASPECTS** - Alberta Stroke Program Early CT Score evaluation
5. **Thrombectomy** - Mechanical thrombectomy eligibility criteria
6. **rtPA** - Tissue plasminogen activator dose calculator (access-controlled)
7. **Cases** - Historical case management and export functionality
8. **Emails** - Notification system configuration

## 3. Key Features

### 3.1 Code ACV Activation System
- **Timer-based protocol tracking** with automatic time calculations
- **Real-time progress monitoring** against standard time targets:
  - Initial evaluation: <10 minutes
  - Neuroimaging: <25 minutes  
  - Door-to-needle: <60 minutes
- **Automatic email notifications** to configured medical team contacts

### 3.2 Clinical Assessment Tools

#### NIHSS Scale Calculator
- **Complete 15-item neurological assessment** covering:
  - Level of consciousness (3 components)
  - Gaze, visual fields, facial palsy
  - Motor function (arms and legs)
  - Ataxia, sensory, language, dysarthria, extinction
- **Real-time score calculation** with clinical interpretation
- **Automated eligibility triggers** for treatment pathways

#### ASPECTS Score Evaluation
- **10-region brain territory assessment** for middle cerebral artery
- **Visual checklist interface** for identifying ischemic changes
- **Risk stratification** based on score ranges (≥6 for thrombectomy eligibility)

### 3.3 Treatment Decision Support

#### Thrombolysis Eligibility (rtPA)
- **Comprehensive inclusion/exclusion criteria** evaluation
- **Access-controlled calculator** - only available for eligible patients
- **Automated dose calculation** based on patient weight (0.9 mg/kg, max 90mg)
- **Detailed administration protocol** with monitoring guidelines

#### Thrombectomy Assessment  
- **Multi-criteria evaluation** including:
  - Time window analysis (0-6h standard, 6-24h with imaging)
  - Large vessel occlusion confirmation
  - Pre-morbid functional status (mRS scale)
  - Contraindication screening
- **Combined therapy recommendations** when both treatments are indicated

### 3.4 Workflow Management
- **Progressive access control** - tabs unlock as prerequisites are met
- **Data validation** ensuring complete information before case finalization
- **Case export functionality** with CSV format for record keeping
- **Email integration** for team communication and case summaries

## 4. Code Overview

### 4.1 State Management Architecture

The application uses React hooks for comprehensive state management:

```typescript
// Core protocol state
const [activeTab, setActiveTab] = useState("dashboard")
const [isCodeActivated, setIsCodeActivated] = useState(false)
const [protocolProgress, setProtocolProgress] = useState({
  nihssCompleted: false,
  checklistCompleted: false,
  aspectsCompleted: false,
  canFinishCase: false,
})

// Clinical assessment data
const [nihssScores, setNihssScores] = useState({...})
const [aspectsRegions, setAspectsRegions] = useState({...})
const [checklist, setChecklist] = useState({...})
const [patientData, setPatientData] = useState({...})
```

### 4.2 Critical Business Logic Functions

#### Treatment Eligibility Algorithms
```typescript
const getTrombolisisEligibility = () => {
  const nihssTotal = calculateNihssTotal()
  const reasons = []
  
  // Complex logic evaluating inclusion/exclusion criteria
  const hasInclusionCriteria = checklist.inclusionCriteria.timeWindow &&
    (checklist.inclusionCriteria.nihssOver5 || 
     (nihssTotal < 5 && checklist.inclusionCriteria.disablingSymptoms))
  
  const hasExclusionCriteria = Object.values(checklist.exclusionCriteria).some(Boolean)
  const eligible = hasInclusionCriteria && !hasExclusionCriteria
  
  return { eligible, reasons, hasInclusionCriteria, hasExclusionCriteria }
}
```

#### Dose Calculation Engine
```typescript
const calculateRtPADose = () => {
  const weight = Number.parseFloat(patientData.weight)
  if (!weight) return null
  
  const totalDose = Math.min(weight * 0.9, 90)  // Max 90mg
  const bolus = totalDose * 0.1      // 10% IV bolus
  const infusion = totalDose * 0.9   // 90% over 60 minutes
  
  return { total: totalDose.toFixed(1), bolus: bolus.toFixed(1), infusion: infusion.toFixed(1) }
}
```

### 4.3 Progressive Access Control
The application implements sophisticated access control ensuring clinical workflow integrity:

```typescript
const canAccessTab = (tabId) => {
  switch (tabId) {
    case "rtpa":
      return getTrombolisisEligibility().eligible  // Only if thrombolysis eligible
    case "thrombectomy":
      return protocolProgress.nihssCompleted       // Only after NIHSS completion
    case "aspects":
      return protocolProgress.nihssCompleted       // Only after NIHSS completion
    default:
      return true
  }
}
```

### 4.4 Real-time Progress Monitoring
```typescript
useEffect(() => {
  const nihssCompleted = calculateNihssTotal() > 0 || Object.values(nihssScores).some(score => score > 0)
  const checklistCompleted = Object.values(checklist.inclusionCriteria).some(Boolean) ||
                             Object.values(checklist.exclusionCriteria).some(Boolean)
  const canFinishCase = nihssCompleted && checklistCompleted && patientData.age && patientData.weight
  
  setProtocolProgress({ nihssCompleted, checklistCompleted, aspectsCompleted, canFinishCase })
}, [nihssScores, checklist, aspectsRegions, patientData])
```

## 5. Dependencies and Technologies

### Core Framework Dependencies
- **next@15.2.4** - React framework for production applications
- **react@^19** & **react-dom@^19** - Latest React with concurrent features
- **typescript@^5** - Type safety and enhanced developer experience

### UI and Styling
- **tailwindcss@^3.4.17** - Utility-first CSS framework
- **@radix-ui/** (multiple packages) - Accessible, unstyled UI primitives
- **lucide-react@^0.454.0** - Consistent icon system
- **class-variance-authority@^0.7.1** - Component variant management
- **tailwind-merge@^2.5.5** - Intelligent Tailwind class merging

### Form and Data Management
- **react-hook-form@^7.54.1** - Performant forms with validation
- **@hookform/resolvers@^3.9.1** - Form validation resolvers
- **zod@^3.24.1** - TypeScript-first schema validation
- **date-fns@^4.0.0** - Modern date utility library

### Interactive Components
- **react-day-picker@^9.0.0** - Date picker component
- **recharts@2.15.0** - Data visualization library
- **cmdk@1.0.4** - Command menu component
- **sonner@^1.7.1** - Toast notification system

### Development Tools
- **@types/** packages - TypeScript definitions
- **postcss@^8.5** - CSS processing
- **autoprefixer@^10.4.20** - CSS vendor prefixing

## 6. Setup and Installation

### Prerequisites
- Node.js 18+ 
- npm or pnpm package manager

### Installation Steps

1. **Clone or navigate to the project directory:**
```bash
cd "C:\Users\julia\OneDrive\Documentos\Proyectos\Protocolo Stroke\stroke-protocola-pp"
```

2. **Install dependencies:**
```bash
npm install --legacy-peer-deps
```
*Note: The `--legacy-peer-deps` flag is required due to React 19 compatibility with some dependencies*

3. **Start the development server:**
```bash
npm run dev
```

4. **Access the application:**
- Local: `http://localhost:3000`
- Network: `http://192.168.0.177:3000`

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint code analysis

### Configuration Notes
- **ESLint and TypeScript errors** are ignored during builds for rapid deployment
- **Images are unoptimized** for simplified hosting
- **Legacy peer dependencies** required for React 19 compatibility

## 7. Conclusion

The Protocolo Interactivo de Stroke represents a sophisticated medical decision support system that transforms complex stroke protocols into an intuitive, guided workflow. The application successfully integrates multiple clinical assessment tools, treatment algorithms, and workflow management features into a cohesive platform that supports healthcare professionals during critical stroke interventions.

### Key Strengths:
- **Evidence-based algorithms** following international stroke guidelines
- **Progressive workflow design** preventing incomplete assessments
- **Real-time decision support** with immediate eligibility feedback
- **Comprehensive data capture** and export capabilities
- **Responsive, accessible interface** suitable for emergency department use

### Areas for Future Development:
Based on the FUNCIONALIDADES.md roadmap, planned enhancements include:
- **Modal-based calculator integration** within the checklist workflow
- **Enhanced accessibility features** for better keyboard navigation
- **Improved user flow** with centralized scale calculations
- **Advanced tooltip systems** for clinical guidance

### Technical Architecture Benefits:
- **Modern React patterns** with hooks and functional components
- **Type-safe development** with comprehensive TypeScript implementation
- **Scalable component architecture** with reusable UI primitives
- **Production-ready configuration** with optimized build processes

This application demonstrates how modern web technologies can be effectively applied to create sophisticated medical tools that enhance clinical decision-making while maintaining the rigor and safety requirements essential in healthcare environments.