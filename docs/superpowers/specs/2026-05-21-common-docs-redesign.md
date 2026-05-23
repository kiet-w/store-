# Design Spec: Redesign Common Module Documentation (`common.html`)

**Date**: 2026-05-21
**Topic**: Technical Documentation Redesign for Common Module
**Status**: Draft

## 1. Overview
Update `docs/html/common.html` based on `docs/explanations/common.md` and `src/common/` source code. The goal is to provide a high-fidelity, interactive documentation page that explains the system-wide utilities and logic.

## 2. Requirements
- VSCode Dark Theme styling.
- "THÔNG TIN MODULE" template at the top.
- Individual Mermaid/SVG diagrams for every key component.
- Detailed breakdown: Logic Flow, Input, Output, Side Effects.
- Inclusion of logic components (Guards, Filters, Decorators, Utils) and Configuration (Constants).
- Full file write, no placeholders.

## 3. Component Details

### 3.1. RolesGuard (`src/common/guards/roles.guard.ts`)
- **Logic Flow**: 
    1. Read metadata from `ROLES_KEY` using `Reflector`.
    2. Check if roles are required.
    3. Extract `user` from request object (populated by AuthGuard).
    4. Compare user role with required roles.
    5. Allow or throw `ForbiddenException`.
- **Input**: `ExecutionContext` (Context of the request).
- **Output**: `boolean` (true to allow).
- **Side Effects**: Throws `ForbiddenException` on unauthorized access.
- **Diagram**: Mermaid flowchart showing the decision tree.

### 3.2. AllExceptionsFilter (`src/common/filters/all-exceptions.filter.ts`)
- **Logic Flow**:
    1. Catch any exception.
    2. Identify status code (HttpException vs 500).
    3. Log detailed error (stack trace) to server logs.
    4. Format user-friendly message for client.
    5. Send JSON response.
- **Input**: `exception: unknown`, `host: ArgumentsHost`.
- **Output**: Standardized JSON response to client.
- **Side Effects**: Server-side logging using `Logger`.
- **Diagram**: Mermaid flowchart showing exception handling and formatting paths.

### 3.3. Roles Decorator (`src/common/decorators/roles.decorator.ts`)
- **Logic Flow**: Binds role requirements to controllers/methods using `SetMetadata`.
- **Input**: Array of `UserRole`.
- **Output**: Metadata assignment.
- **Side Effects**: None (declarative).
- **Diagram**: Diagram showing the binding between Decorator and Controller/Method.

### 3.4. API Response Utils (`src/common/utils/api-response.util.ts`)
- **Logic Flow**: Wraps data in `ApiResponse` or `PaginatedApiResponse` structures.
- **Input**: Data `T`, optional pagination params (total, page, limit).
- **Output**: Formatted object with `success`, `data`, and `meta`.
- **Side Effects**: None.
- **Diagram**: Mermaid showing the transformation from raw data to wrapped response.

### 3.5. Standardized Constants (`src/common/constants/cache.constants.ts`)
- List of `CACHE_KEYS` and `CACHE_TTL` for centralized cache management.

## 4. Visual Design
- **Background**: `#1e1e1e` (VSCode Default Dark).
- **Syntax Highlighting**: Prism.js or manual CSS classes for code blocks.
- **Diagrams**: Centered Mermaid diagrams with themed colors.

## 5. Success Criteria
- [ ] Every component has a diagram.
- [ ] Detailed breakdowns are provided for each.
- [ ] The page matches VSCode Dark theme.
- [ ] No placeholders are used.
