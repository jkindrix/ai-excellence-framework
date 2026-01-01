# Example: Full Setup with MCP

Enterprise application using the full preset with MCP memory persistence.

## Overview

Financial analytics platform processing real-time market data with compliance requirements.

## Tech Stack

- **Backend**: Node.js 22, Fastify, TimescaleDB
- **Frontend**: Next.js 14, TypeScript, Shadcn UI
- **Data**: Apache Kafka, Redis
- **ML**: Python 3.12, scikit-learn
- **Testing**: Vitest, Playwright
- **CI/CD**: GitHub Actions, ArgoCD

## Architecture

```
services/
├── api-gateway/          # Public API
├── data-ingestion/       # Kafka consumers
├── analytics-engine/     # Python ML service
├── notification-service/ # Alerts & notifications
└── compliance-audit/     # Audit logging

packages/
├── shared-types/         # TypeScript types
├── ui-components/        # React components
└── config/               # Shared configuration
```

## Conventions

### Code Style

- TypeScript strict mode with no `any`
- Python: Black + Ruff
- Conventional commits required
- PR reviews mandatory

### Testing

- Unit tests: 90% coverage
- Integration tests for all services
- E2E tests for critical paths
- Performance regression tests

### Security (SOX Compliance)

- All data access audited
- PII encrypted at rest and in transit
- Secrets via Vault, never in code
- Quarterly security reviews

### Documentation

- ADRs for architectural decisions
- API documentation via OpenAPI
- Runbooks for operations

## MCP Memory Configuration

```json
{
  "memory": {
    "decisions": true,
    "patterns": true,
    "context": true
  }
}
```

### Stored Decisions
- Architecture choices (use MCP to record)
- Technology selections
- Security trade-offs

### Stored Patterns
- Coding standards
- Error handling approaches
- Testing strategies

## Current State

### Completed
- API Gateway
- Data ingestion pipeline
- Core analytics models

### In Progress
- Compliance audit service
- Real-time alerting

### Blocked
- Payment integration (awaiting vendor API access)

### Known Tech Debt
- Legacy Python 3.10 service needs upgrade
- Kafka schema registry migration pending

## Session Instructions

### Before Starting
1. Read this file completely
2. Check MCP memory for recent decisions: `store_decision`
3. Review recent commits for context
4. Run test suite to verify baseline

### During Work
- Use `/plan` before any feature work
- Use `/assumptions` to surface hidden requirements
- Use `/security-review` for all data handling code
- Record architectural decisions in MCP memory
- Use `/verify` with skeptical falsification

### For Compliance Work
- Document all changes in audit log
- Use SOX checklist for financial features
- Request security review before merge

### Before Ending
- Run `/handoff` to document session
- Export MCP memory if significant decisions made
- Update "Current State" section
- Ensure all tests pass

## Dogfooding Notes

This example demonstrates:
- Complex multi-service architecture
- Compliance requirements documentation
- MCP memory integration
- Detailed session protocols
