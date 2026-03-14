# Portal Feature Audit - Design & Architecture Document

## Overview

The Portal Feature Audit is a comprehensive web performance auditing system that allows users to create, submit, and view detailed performance audits. The feature provides a seamless user experience from audit creation to results visualization, with state persistence and real-time progress tracking.

## User Journey & User Stories

### Primary User Stories

#### 1. Audit Creation and Submission
**As a** user,  
**I want to** create and submit a web performance audit  
**so that** I can analyze the performance of a website and receive detailed results.

**Acceptance Criteria:**
- I can access an audit creation form
- I can configure audit parameters (URL, device type, etc.)
- I can submit the audit request
- I receive confirmation when the audit is successfully submitted
- I receive clear error messages if submission fails

#### 2. Form State Persistence
**As a** user,  
**I want to** have my audit configuration automatically saved in the URL  
**so that** I can share my audit setup with others or return to it later.

**Acceptance Criteria:**
- My form state is reflected in the URL query parameters
- I can share the URL and others see the same configuration
- I can bookmark the URL to return to my work later
- Browser back/forward navigation preserves my form state

#### 3. Real-time Audit Progress
**As a** user,  
**I want to** see real-time updates on my audit progress  
**so that** I know when the audit will complete and can plan accordingly.

**Acceptance Criteria:**
- I see a loading indicator when the audit is processing
- I receive real-time progress updates
- I can see the current stage of the audit process
- I'm notified when the audit completes

#### 4. Audit Results Viewing
**As a** user,  
**I want to** view comprehensive audit results  
**so that** I can analyze website performance and identify improvement opportunities.

**Acceptance Criteria:**
- I can view detailed performance metrics
- I can see screenshots and visual evidence
- I can navigate through step-by-step results
- I can access recommendations for improvements

### Supporting User Stories

1. **State Persistence**: As a user, I want my audit configuration to be saved in the URL so I can bookmark, share, or return to my work later.

2. **Real-time Progress**: As a user, I want to see real-time updates on my audit progress so I know when it will complete.

3. **Audit Results**: As a user, I want to view comprehensive audit results with detailed metrics, screenshots, and recommendations.

4. **Audit Lookup**: As a user, I want to look up existing audits by ID to view previous results.

## Technical Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Builder       │    │   Scheduler     │    │   Viewer        │
│   Component     │───▶│   Service       │───▶│   Component     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   NgRx Store    │    │   WebSocket     │    │   Audit Data    │
│   (State Mgmt)  │    │   Connection    │    │   (S3/API)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Component Architecture

#### 1. Builder Components
- **Purpose**: Handles audit configuration and form management
- **Key Components**:
  - `BuilderComponent`: Main container for audit creation
  - `AuditBuilderComponent`: Form component for audit configuration
  - **State Management**: NgRx store with `auditBuilderFeature`

#### 2. Viewer Components
- **Purpose**: Displays audit results and detailed analysis
- **Key Components**:
  - `AuditViewerContainer`: Main viewer container that handles audit data fetching and display
  - `AuditSummaryComponent`: Displays audit overview with metrics
  - `ViewerStepDetailComponent`: Shows detailed step-by-step results

#### 3. Shared Components
- **Stage Indicator**: Shows audit progress and current stage
- **Loading Components**: Provides user feedback during operations

### State Management

#### NgRx Store Structure
```typescript
interface AuditBuilderState {
  audit: AuditDetails;           // Current audit configuration
  error: string | null;          // Error messages
  status: 'pending' | 'loading' | 'error' | 'success';
}
```

#### Key Actions
- `loadAuditDetails`: Load audit details from URL or defaults
- `updateAuditDetails`: Update audit configuration
- `submitAuditRequest`: Submit audit to backend
- `loadAuditDetailsSuccess`: Handle successful audit loading

#### Effects
- **URL Persistence**: Automatically syncs form state with URL query parameters
- **Debounced Updates**: Prevents excessive URL updates during typing
- **Error Handling**: Graceful fallback to default values on parsing errors

### Data Flow

#### 1. Audit Creation Flow
```
User Input → Form Validation → State Update → URL Sync → Submit Request → Audit ID
```

#### 2. Audit Progress Flow
```
Audit ID → WebSocket Connection → Progress Updates → Stage Indicator → Completion
```

#### 3. Results Display Flow
```
Audit ID → API Request → S3 Data Fetch → Results Processing → Viewer Display
```

## Implementation Guidelines

### URL State Management

The form state is persisted in URL query parameters using the following pattern:

```typescript
// URL: /audit?audit-details={"url":"https://example.com","device":"desktop"}
const auditDetailsQuery = activatedRoute.snapshot.queryParams['audit-details'];
```

**Benefits**:
- Shareable audit configurations
- Browser back/forward navigation support
- Bookmarkable audit setups
- Deep linking capabilities

### Error Handling Strategy

1. **URL Parsing Errors**: Fallback to default audit details
2. **Network Errors**: Display user-friendly error messages
3. **Validation Errors**: Inline form validation with clear feedback
4. **Audit Failures**: Graceful degradation with retry options

### Performance Considerations

1. **Debounced URL Updates**: 500ms delay to prevent excessive navigation
2. **Lazy Loading**: Viewer components loaded only when needed
3. **Image Optimization**: Screenshots and thumbnails optimized for display
4. **Caching**: Audit results cached to prevent redundant API calls

### Accessibility Features

1. **Keyboard Navigation**: Full keyboard support for form interactions
2. **Screen Reader Support**: Proper ARIA labels and descriptions
3. **Color Contrast**: WCAG compliant color schemes
4. **Responsive Design**: Mobile-first approach with touch-friendly interfaces

## Component Development Guidelines

### Builder Components

When developing builder components:

1. **Form Validation**: Implement comprehensive client-side validation
2. **State Sync**: Ensure all form changes update the NgRx store
3. **URL Persistence**: All form state should be reflected in URL parameters
4. **User Feedback**: Provide clear feedback for all user actions

### Viewer Components

When developing viewer components:

1. **Data Loading**: Implement proper loading states and error handling
2. **Performance**: Optimize for large audit datasets
3. **Navigation**: Support step-by-step navigation through audit results
4. **Export**: Consider data export capabilities for audit results

### State Management

When working with NgRx:

1. **Actions**: Use descriptive action names with proper typing
2. **Effects**: Keep effects focused and testable
3. **Selectors**: Create efficient selectors for component data access
4. **Error Handling**: Implement comprehensive error handling in effects

## Testing Strategy

### Unit Testing
- Component logic and state management
- Service methods and API interactions
- Effect handling and side effects
- Form validation and user interactions

### Integration Testing
- End-to-end audit creation flow
- URL state persistence
- WebSocket connection handling
- Data fetching and display

### Performance Testing
- Large audit result rendering
- Memory usage during long audit sessions
- Network request optimization

## Future Enhancements

### Planned Features
1. **Audit Templates**: Pre-configured audit setups for common scenarios
2. **Batch Auditing**: Multiple URL auditing in sequence
3. **Custom Metrics**: User-defined performance metrics
4. **Export Options**: PDF, CSV, and API export capabilities
5. **Audit History**: Persistent audit history and comparison tools

### Technical Improvements
1. **Offline Support**: Progressive Web App capabilities
2. **Real-time Collaboration**: Multi-user audit sharing
3. **Advanced Analytics**: Trend analysis and performance insights
4. **Integration APIs**: Third-party tool integrations

## Dependencies

### Core Dependencies
- **Angular**: Framework for component development
- **NgRx**: State management and effects
- **RxJS**: Reactive programming and async operations
- **Lighthouse**: Core auditing engine integration

### UI Dependencies
- **Angular Material**: Component library
- **Swiper**: Touch-enabled carousel for audit summaries
- **Custom UI Components**: Specialized audit-specific components

### Data Dependencies
- **S3**: Audit result storage
- **WebSocket**: Real-time progress updates
- **REST API**: Audit submission and management

## Getting Started

### Development Setup
1. Ensure all dependencies are installed
2. Configure environment variables for API endpoints
3. Set up WebSocket connection for real-time updates
4. Configure S3 access for audit result retrieval

### Component Usage
```typescript
// Basic audit builder usage
<ui-audit-builder
  (modified)="updateAuditDetails($event)"
  [initialAudit]="auditDetails"
  (submitAudit)="submitAudit($event)"
/>

// Basic audit viewer usage
<viewer-container [auditId]="auditId" />
```

This document serves as the primary guide for understanding, developing, and maintaining the Portal Feature Audit system. It should be updated as the feature evolves and new requirements are identified.
