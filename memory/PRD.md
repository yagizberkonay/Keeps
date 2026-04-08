# Keeps - Financial Dashboard PRD

## Architecture
- **Frontend**: React 19, Tailwind CSS, Shadcn UI, Recharts, Lucide
- **Backend**: FastAPI, MongoDB (Motor), ReportLab (PDF)
- **AI**: Gemini 3 Flash via Emergent Integrations (text + vision/OCR)
- **Auth**: JWT + Emergent Google OAuth

## Implemented Features (3 Phases)

### Phase 1 - Core MVP
- Auth (register/login/Google OAuth), Dashboard, Invoice CRUD, Tax Calculators (VAT/Withholding/Income), Tax Vault, Project Management, AI Advisor, FX Rates

### Phase 2 - Enhancement
- Full-page forms (invoice/project/client), Invoice PDF generation, Settings (profile/password/data/account), Responsive design (mobile sidebar)

### Phase 3 - Advanced Features (April 8, 2026)
- Digital Signature: Canvas-based drawing, saved in profile, embedded in invoice PDFs
- OCR Receipt Scanning: Upload receipt images, Gemini Vision extracts vendor/amount/category/date
- Global Compliance Checker: 10 countries (US/GB/DE/FR/TR/JP/AU/CA/NL/BR), requirement checks, scoring
- Expense Tracking: Full CRUD with 14 categories, receipt scanning, pie charts, monthly trends

## Remaining Backlog
### P1
- Recurring invoices with auto-send
- Client portals for invoice viewing
- Email notifications

### P2
- Invoice templates
- Multi-language support
- Dashboard date range filters
- Payment link integration
