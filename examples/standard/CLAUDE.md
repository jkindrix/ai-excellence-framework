# Example: Standard Setup

A typical production application using the standard preset.

## Overview

E-commerce platform with user authentication, product catalog, and order management.

## Tech Stack

- **Backend**: Node.js 20+, Express, PostgreSQL
- **Frontend**: React 18, TypeScript, TailwindCSS
- **Testing**: Jest, React Testing Library
- **CI/CD**: GitHub Actions

## Architecture

```
src/
├── api/           # REST API routes
├── services/      # Business logic
├── models/        # Database models
├── middleware/    # Express middleware
└── utils/         # Shared utilities
```

## Conventions

### Code Style

- TypeScript strict mode
- ESLint + Prettier
- Conventional commits

### Testing

- Unit tests for all services
- Integration tests for API routes
- 80% coverage target

### Security

- All inputs validated with Zod
- SQL injection prevention via parameterized queries
- XSS prevention via React's default escaping

## Current State

### Completed
- User authentication
- Product catalog

### In Progress
- Order management

### Planned
- Payment integration

## Session Instructions

### Before Starting
1. Read this file completely
2. Run `npm install` if dependencies changed
3. Run `npm test` to verify baseline

### During Work
- Use `/plan` before implementing features
- Use `/security-review` for auth/payment code
- Use `/verify` before completing tasks

### Before Ending
- Run `/handoff` to document session state
- Commit work in progress
- Update "Current State" section
