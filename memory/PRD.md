# Keeps - Financial Dashboard PRD

## Original Problem Statement
Build "Keeps" (formerly TaxFlow Pro) - a premium financial dashboard for freelancers with Invoice Engine, Tax Management, AI Advisor, Project Management, Tax Vault, and Global Compliance Checker.

## Architecture
- **Frontend**: React 19, Tailwind CSS, Shadcn UI, Recharts, Lucide icons
- **Backend**: FastAPI (Python), MongoDB via Motor async driver
- **AI**: Gemini 3 Flash via Emergent Integrations library
- **Auth**: JWT session tokens + Emergent-managed Google OAuth
- **FX Rates**: open.er-api.com (free, unlimited)

## User Personas
- Modern Freelancers managing invoices and taxes
- Digital Nomads needing multi-currency support
- Creative Agencies tracking projects and profitability

## Core Requirements
- Dark glassmorphism UI theme (ultra-dark #09090C background)
- Multi-currency invoicing with line items
- Tax calculators (VAT, Withholding, Income brackets)
- AI tax/finance advisor chatbot
- Project management with milestones
- Tax Sinking Fund vault visualization

## What's Been Implemented (April 7, 2026)
- Full auth system (register, login, logout, Google OAuth, session management)
- Dashboard with stats cards, revenue chart, recent invoices
- Invoice CRUD with multi-currency, line items, tax calculations, status management
- Tax calculators (VAT/KDV, Withholding/Stopaj, Progressive Income Tax)
- Tax Vault with circular progress, deposit/withdraw, target setting
- Project management with CRUD and milestone tracking
- AI Advisor (Gemini 3 Flash) as floating glass panel
- FX rates endpoint with fallback data
- Full dark glassmorphism design system (Outfit + Inter fonts)

## Prioritized Backlog
### P0 (Critical)
- (All P0 delivered)

### P1 (High Priority)
- PDF invoice generation/download
- Digital signature support
- OCR receipt scanning for AI advisor
- Global Compliance Checker feature
- Client portals

### P2 (Medium Priority)
- Email notifications for invoice status
- Expense tracking module
- Dashboard date range filters
- Invoice templates
- Recurring invoices

### P3 (Nice to Have)
- Biometric authentication
- Multi-tenant subscription architecture
- AES-256 encryption at rest
- Invoice payment links
- Mobile-responsive sidebar drawer

## Next Tasks
1. Implement PDF invoice generation endpoint
2. Add Global Compliance Checker
3. Build expense tracking module
4. Add invoice email sending
