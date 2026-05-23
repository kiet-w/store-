# Design Spec: Auth Module Documentation Update

**Topic:** Update `docs/html/auth.html` with deep-dive analysis and individual Mermaid diagrams for every handler and method.
**Date:** 2026-05-21

## 1. Overview
Transform the existing `auth.html` into a comprehensive technical reference for the Auth module. The new version will feature individual "Tech Cards" for every method in the Controller and Service, including detailed metadata and specific Mermaid diagrams.

## 2. Requirements Check
- [x] EVERY Controller handler (register, login, refresh, logout, getMe) must have its own diagram.
- [x] EVERY Public Service method (register, login, handleRefresh, handleLogout, logout, validateAccessToken) must have its own diagram.
- [x] EVERY Private Helper (setCookies, generateTokens, updateRefreshToken) must have its own diagram.
- [x] Controller fields: Method+Path, Function, Decorators, Input, Output, Calls.
- [x] Service fields: Name, Input, Output, Internal Calls / Called By, Side Effects, Logic Description.
- [x] "THÔNG TIN MODULE" template at the top.
- [x] Style: VSCode Dark Theme.
- [x] Full file write (No truncation).

## 3. Architecture & Structure

### Header: THÔNG TIN MODULE
| Field | Value |
|-------|-------|
| Module | AuthModule |
| Path | `src/auth/` |
| Role | Authentication & JWT Management |
| Security | HttpOnly Cookies, Bcrypt Hashing, JWT Rotation |

### Sections
1. **Introduction**: Brief overview of the Auth flow.
2. **Controller: AuthController**: Individual Tech Cards for each handler.
3. **Service: AuthService (Public)**: Individual Tech Cards for public business logic.
4. **Service: AuthService (Private)**: Individual Tech Cards for internal helpers.
5. **Guard: AuthGuard**: Explanation of the access control layer.
6. **Data Flow**: High-level sequence diagram of the entire login process.

## 4. Method Details & Diagrams (Internal Plan)

### AuthController
- **register**: POST `/auth/register`. Logic: Calls `authService.register`. Diagram: Simple flow from Request -> Controller -> Service -> Response.
- **login**: POST `/auth/login`. Logic: Calls `authService.login`. Diagram: Flow including Cookie setting and Serializer.
- **refresh**: POST `/auth/refresh`. Logic: Extracts cookie, calls `authService.handleRefresh`.
- **logout**: POST `/auth/logout`. Logic: Extracts cookie, calls `authService.handleLogout`.
- **me**: GET `/auth/me`. Logic: Uses `AuthGuard`, returns mapped user info.

### AuthService
- **register**: Checks existing, hashes pwd, creates user.
- **login**: Validates credentials, generates tokens, updates RT in DB, sets cookies.
- **handleRefresh**: Verifies RT, checks DB, rotates tokens (generates new pair), sets cookies.
- **handleLogout**: Validates AT, calls `logout` (clear DB), clears cookies.
- **logout**: Internal DB update to set RT to null.
- **validateAccessToken**: JWT verify helper.

### Private Helpers
- **setCookies**: Sets AT and RT cookies with security flags.
- **generateTokens**: Signs JWTs for AT and RT.
- **updateRefreshToken**: Hashes RT and updates user in DB.

## 5. Visual Style
- **Background**: `#1e1e1e` (VSCode Dark)
- **Cards**: `#252526` with border `#404040`
- **Text**: `#d4d4d4`
- **Keywords**: `#569cd6` (Blue)
- **Functions**: `#dcdcaa` (Yellow)
- **Types**: `#4ec9b0` (Teal)
- **Mermaid Theme**: `dark`

## 6. Verification Plan
- [ ] Check all 14 methods (5 Controller + 6 Service Public + 3 Service Private) have cards and diagrams.
- [ ] Verify Mermaid syntax for each diagram.
- [ ] Ensure all fields (Input, Output, etc.) are accurately populated from source code.
- [ ] Validate CSS styling for VSCode Dark theme.
