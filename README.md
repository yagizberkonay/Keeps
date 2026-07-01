# ⚡ Keeps – Modern Freelancer & Agency Operating System

<div align="center">
  <img src="https://via.placeholder.com/1200x600?text=Keeps+Dashboard+Preview" alt="Keeps Dashboard Preview" />
</div>

<br />

**Keeps** is a next-generation financial, invoicing, and tax management platform built specifically for freelancers, consultants, and digital agencies. Featuring a modern dark-mode bento-grid interface, advanced global compliance checks, and a seamless user experience, Keeps centralizes your entire financial workflow into a single, powerful operating system.

---

## 📑 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Available Scripts](#-available-scripts)
- [Project Structure](#-project-structure)
- [Environment Variables](#-environment-variables)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### 📊 Dashboard & Overview
* **Financial KPIs:** Track Total Revenue, Expenses, Tax Collected, and Net Profit at a glance.
* **Dynamic Charts:** Visualize your monthly revenue and tax overview using responsive, interactive charts.

### 🧾 Advanced Invoicing & Billing
* **Multi-Currency Support:** Create invoices in various currencies (TRY, EUR, USD, etc.).
* **Payment Integration:** Allow clients to pay directly via the **Pay with Stripe** portal.
* **PDF & Sharing:** Download professional PDF invoices or copy a secure portal link for your clients.
* **Digital Signatures:** Attach legally binding digital signatures to your invoices using the built-in touch/mouse-supported signature pad.
* **Recurring Invoices:** Automate your cash flow by creating and managing active recurring invoice templates for subscription-based clients.

### 🏦 Tax Center & Tax Vault
* **Automated Calculations:** Instantly calculate VAT (KDV), withholding, and income tax based on your revenue.
* **The Tax Vault:** A unique feature allowing you to set a tax savings target (e.g., $5,000) and virtually deposit/withdraw funds to ensure you are always prepared for tax season.

### 🌍 Global Compliance Engine
* **Automated Audits:** Run compliance checks on your invoices against target country regulations (Turkey, United States, UK, Germany, France, etc.).
* **Score System:** Automatically grades your invoice (e.g., 80% Score) and flags missing legal requirements like Seller/Buyer Addresses, Tax IDs (VKN/TCKN), and VAT breakdowns.

### 👥 Clients, Projects & Expenses
* **Client Directory:** Manage your client roster, contact information, and linked billing data.
* **Project Tracking:** Monitor active projects, track profitability against allocated budgets, and manage specific project milestones.
* **Expense Management:** Categorize and track all business transactions to accurately calculate net profit.

### 🤝 Accountant Portal
* **Read-Only Access:** Generate a secure, unique link (`/accountant/...`) to share with your tax advisor or accountant.
* **Restricted View:** Allows them to view invoices, expenses, tax calculations, and financial reports without giving them access to your account settings or the ability to modify data.

---

## 🛠 Tech Stack

Built with a highly scalable, modern frontend architecture optimized for performance and maintainability:

* **Core:** React 19, Create React App (CRA) customized with CRACO
* **Routing:** React Router DOM v7
* **Styling & UI:** Tailwind CSS, Radix UI Primitives, shadcn/ui components
* **Animations:** Framer Motion, tailwindcss-animate
* **Forms & Validation:** React Hook Form, Zod, Hookform Resolvers
* **Data Fetching:** Axios
* **Data Visualization:** Recharts
* **Package Manager:** Yarn

---

## 🚀 Getting Started

Follow these instructions to set up the project locally for development and testing.

### 1. Clone the Repository
```bash
git clone [https://github.com/yagizberkonay/Keeps.git](https://github.com/yagizberkonay/Keeps.git)
cd Keeps

2. Install Dependencies

This project uses Yarn. Run the following command to install all required dependencies:
Bash

yarn install

3. Setup Environment Variables

Create a .env file in the root directory:
Bash

cp .env.example .env

Populate the .env file with your specific configuration (see the Environment Variables section below).
4. Start the Development Server

Run the application locally using CRACO:
Bash

yarn start

Open http://localhost:3000 in your browser to view the application.
📜 Available Scripts

In the project directory, you can run:

    yarn start - Runs the app in the development mode.

    yarn build - Builds the app for production to the build folder. It correctly bundles React in production mode and optimizes the build for the best performance.

    yarn test - Launches the test runner in the interactive watch mode.

📂 Project Structure
Plaintext

Keeps/
├── public/               # Static assets (images, fonts, index.html)
├── src/
│   ├── components/       # Reusable UI components (shadcn/ui, layout, cards)
│   ├── pages/            # Application routes (Overview, Invoices, Tax Center, etc.)
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions, helpers, and Axios configurations
│   ├── styles/           # Global styles and Tailwind configuration
│   └── App.tsx           # Main application entry point and router setup
├── craco.config.js       # CRA configuration overrides (Path aliases, Tailwind)
├── tailwind.config.js    # Tailwind CSS design system configuration
├── package.json          # Project dependencies and scripts
└── README.md             # Project documentation

🔐 Environment Variables

To run this project, you will need to add the following environment variables to your .env file:
Kod snippet'i

# API Configuration
REACT_APP_API_URL="http://localhost:8000/api"

# Stripe Integration
REACT_APP_STRIPE_PUBLIC_KEY="pk_test_your_stripe_key"

# App URL (For Accountant Portal Links & Webhooks)
REACT_APP_BASE_URL="http://localhost:3000"

🤝 Contributing

We welcome contributions to improve Keeps! If you have suggestions or bug reports, please:

    Open an Issue to discuss your proposed changes.

    Fork the repository and create a new branch (git checkout -b feature/AmazingFeature).

    Commit your changes (git commit -m 'Add some AmazingFeature').

    Push to the branch (git push origin feature/AmazingFeature).

    Open a Pull Request.

📄 License

Copyright © 2026 Yağız Berk Önay / Hermes Software Inc. All rights reserved.

This source code is licensed for commercial and private use. It may not be copied, distributed, or published as open-source without prior written consent from the author.
