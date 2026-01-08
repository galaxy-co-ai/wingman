# Document Dependencies

This graph shows which docs must be complete before others can start.

```
00 Project Setup ─────────────────────────────────┐
       │                                          │
01 Vision ──► 02 Personas ──► 03 PRD ──► 04 Features
                                              │
                    ┌─────────────────────────┴──────────────────┐
                    ▼                                            ▼
            05 UI/UX Design                              07 Tech Architecture
                    │                                            │
        ┌───────────┼───────────┐                    ┌───────────┼───────────┐
        ▼           ▼           ▼                    ▼           ▼           ▼
   16 Design    06 Component   13 A11y         08 Data     09 API      15 File
   Tokens       Specs                          Models      Contracts   Architecture
        │           │                              │           │           │
        └───────────┴──────────────────────────────┴───────────┴───────────┘
                                        │
                                        ▼
                              17 Code Patterns (needs all above)
                                        │
                    ┌───────────────────┼───────────────────┐
                    ▼                   ▼                   ▼
              10 Error            11 Security         12 Testing
              Handling                                Strategy
                    │                   │                   │
                    └───────────────────┼───────────────────┘
                                        ▼
                              14 Performance Goals
                                        │
                                        ▼
                              18 Decision Log (ongoing)
```

## Dependency Rules

### Can Start Immediately
- **00-project-setup.md** - No dependencies

### Requires 00
- **01-vision-and-goals.md** - Needs project to exist

### Linear Chain (Complete in Order)
```
01 Vision → 02 Personas → 03 PRD → 04 Features
```

### Branches After 04 (Can Parallelize)
After 04 is complete, two branches can proceed in parallel:

**UI Branch:**
- 05 UI/UX Design
- Then: 06 Component Specs, 16 Design Tokens, 13 Accessibility

**Technical Branch:**
- 07 Technical Architecture
- Then: 08 Data Models, 09 API Contracts, 15 File Architecture

### Convergence Point
**17 Code Patterns** requires ALL of these complete:
- 06 Component Specs
- 08 Data Models
- 09 API Contracts
- 15 File Architecture
- 16 Design Tokens

### Final Docs (After 17)
These can be done in parallel after 17:
- 10 Error Handling
- 11 Security Considerations
- 12 Testing Strategy

### Last
- **14 Performance Goals** - After 10, 11, 12
- **18 Decision Log** - Ongoing, updated throughout

## Quick Reference: What Can I Work On?

| If This Is Done | You Can Start |
|-----------------|---------------|
| Nothing | 00 Project Setup |
| 00 | 01 Vision |
| 01 | 02 Personas |
| 02 | 03 PRD |
| 03 | 04 Features |
| 04 | 05 UI/UX Design, 07 Tech Architecture |
| 05 | 06 Components, 16 Design Tokens, 13 A11y |
| 07 | 08 Data Models, 09 API Contracts, 15 File Arch |
| 06 + 08 + 09 + 15 + 16 | 17 Code Patterns |
| 17 | 10 Error, 11 Security, 12 Testing |
| 10 + 11 + 12 | 14 Performance |
