# Keeps - Financial Dashboard PRD

## Original Problem Statement
Build "Keeps" - a premium financial dashboard for freelancers with Invoice Engine, Tax Management, AI Advisor, Project Management, Tax Vault, and Global Compliance Checker. Dark glassmorphism theme.

## Architecture
- **Frontend**: React 19, Tailwind CSS, Shadcn UI, Recharts, Lucide icons
- **Backend**: FastAPI (Python), MongoDB via Motor async driver
- **AI**: Gemini 3 Flash via Emergent Integrations library
- **Auth**: JWT session tokens + Emergent-managed Google OAuth
- **PDF**: ReportLab (server-side PDF generation)
- **FX Rates**: open.er-api.com (free, unlimited)

## User Personas
- Modern Freelancers managing invoices and taxes
- Digital Nomads needing multi-currency support
- Creative Agencies tracking projects and profitability

## What's Been Implemented

### Phase 1 (April 7, 2026)
- Full auth system (register, login, logout, Google OAuth)
- Dashboard with stats cards, revenue chart, recent invoices
- Invoice CRUD with multi-currency, line items, tax calculations
- Tax calculators (VAT/KDV, Withholding/Stopaj, Income Tax)
- Tax Vault with circular progress widget
- Project management with milestones
- AI Advisor (Gemini 3 Flash) floating glass panel
- FX rates endpoint

### Phase 2 (April 8, 2026)
- Full-page invoice creation with live preview (replaced popup)
- Invoice detail page with beautiful document view
- Invoice PDF generation and download (ReportLab)
- Full-page project creation with milestones, timeline, priority
- Full clients management page with detailed fields
- Comprehensive Settings page (Profile, Password, Data Export, Data Delete, Account Delete)
- Responsive design (mobile sidebar drawer, hamburger menu, responsive grids)
- Enhanced invoice fields (client address, phone, payment terms)
- Enhanced client fields (address, website, notes)

## Prioritized Backlog
### P1 (High Priority)
- Digital signature support on invoices
- OCR receipt scanning for AI advisor
- Global Compliance Checker feature
- Client portals with invoice viewing

### P2 (Medium Priority)
- Email notifications for invoice status
- Expense tracking module
- Dashboard date range filters
- Invoice templates & recurring invoices
- Multi-language support

### P3 (Nice to Have)
- Biometric authentication
- Multi-tenant subscription architecture
- Payment links on invoices
