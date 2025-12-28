# Montte

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](CONTRIBUTING.md)

**Montte** is a modern, open-source finance tracker designed to help you manage your personal and shared expenses with ease. Built on a powerful and scalable monorepo architecture, it features a fast, reactive dashboard and a robust backend.

---

## ✨ Key Features

### 💳 Core Financial Management
-   **Transaction Management**:
    -   Complete CRUD operations for income, expenses, and transfers
    -   **Split Categorization**: Divide single transactions across multiple categories
    -   **File Attachments**: Upload receipts and documents (PDF, Images)
    -   **Bulk Operations**: Bulk delete, categorize, and transfer linking
    -   **Smart Transfer Matching**: Automatic linking of outgoing/incoming transfers
-   **Bank Accounts**:
    -   Manage checking, savings, and investment accounts
    -   **OFX Integration**: Import/export OFX files with deduplication
    -   **BrasilAPI**: Fetch Brazilian bank data automatically
    -   Account archiving without data loss
-   **Bills & Receivables**:
    -   Track payable and receivable bills (Pending, Paid, Overdue)
    -   **Flexible Recurrence**: Monthly, quarterly, semiannual, annual patterns
    -   **Installment Plans**: Equal or custom installment amounts
    -   **Interest & Penalties**: Automated calculation with configurable templates
    -   **Monetary Correction**: Support for IPCA, SELIC, CDI indices

### 📊 Planning & Control
-   **Budget Management**:
    -   Set targets by categories, tags, or cost centers
    -   **Personal vs Business Modes**: Gamified/simple vs strict budgeting
    -   **Budget Rollover**: Carry balances between periods
    -   **Smart Alerts**: Configurable notification thresholds
    -   **Visual Progress**: Progress bars and spending forecasts
-   **Organization Tools**:
    -   Hierarchical categories with custom colors and icons
    -   Flexible tagging system
    -   Cost centers for business expense allocation

### 🤖 Automation & Intelligence
-   **Rules Engine**:
    -   **Visual Builder**: React Flow-based rule creation interface
    -   **Triggers**: Transaction created/updated events
    -   **Complex Conditions**: AND/OR logic groups with multiple criteria
    -   **Automated Actions**: Categorize, tag, set cost centers, modify descriptions
    -   **Notifications**: Send push notifications and emails
    -   **Execution Logs**: Detailed history of automation runs

### 📈 Analytics & Reporting
-   **Dashboard**: Net balance overview, income vs expenses, recent activity
-   **Financial Reports**:
    -   **DRE Gerencial**: Managerial income statements
    -   **DRE Fiscal**: Fiscal statements with planned vs realized analysis
    -   **PDF Export**: Generate downloadable report versions
-   **Interactive Charts**:
    -   Cash flow evolution
    -   Category breakdown (pie/bar charts)
    -   Monthly trends
    -   Payment performance analysis

### 🔐 Administration & Security
-   **Authentication**:
    -   Email/password and Google OAuth via Better Auth
    -   Email verification and password recovery
    -   Magic link authentication
    -   Session management with device tracking
-   **Multi-tenant Architecture**:
    -   Organization workspaces
    -   Team management and member invitations
    -   Role-based access control (Owner, Admin, Member)
-   **Billing Integration**: Stripe-powered subscription management
-   **Settings & Preferences**:
    -   Theme switching (Light/Dark/System)
    -   Language support (pt-BR)
    -   Telemetry opt-in/out (PostHog)
    -   Web push notification controls

## 🚀 Tech Stack

The Montte project is a full-stack application built within an **Nx** monorepo using **Bun**.

| Category       | Technology                                                                                                      |
| :------------- | :-------------------------------------------------------------------------------------------------------------- |
| **Frontend**   | **React**, **Vite**, **TypeScript**, **TanStack Router**, **TanStack Query**, **shadcn/ui**, **Tailwind CSS**   |
| **Backend**    | **ElysiaJS**, **Bun**, **tRPC**, **Drizzle ORM**, **PostgreSQL**                                                |
| **Auth**       | **Better Auth**                                                                                                 |
| **Jobs**       | **BullMQ**, **Redis**                                                                                           |
| **Storage**    | **MinIO** (S3 compatible for file/logo storage)                                                                 |
| **Security**   | **Arcjet** (Rate limiting & DDoS protection)                                                                    |
| **Analytics**  | **PostHog**                                                                                                     |
| **Email**      | **Resend** (Transactional emails)                                                                               |
| **Landing**    | **Astro** (Static marketing site)                                                                               |
| **Tooling**    | **Nx**, **Biome**, **Docker**, **Husky**                                                                        |

## 📂 Project Structure

This project is a monorepo managed by Nx.

### Apps (`apps/`)

The deployable applications and websites.

```
apps/
├── dashboard/     # React/Vite SPA - main user interface
├── server/        # Elysia backend API server
├── worker/        # BullMQ background job processor
└── landing-page/  # Astro marketing website
```

-   **`dashboard`**: The core finance tracking single-page application (SPA) built with React, featuring file-based routing with TanStack Router and PWA support.
-   **`server`**: The ElysiaJS backend server providing the tRPC API, authentication endpoints, and file storage integration.
-   **`worker`**: Background job processor using BullMQ for handling async tasks like email delivery, notifications, and data processing.
-   **`landing-page`**: Astro-based static marketing site with i18n support (Portuguese/English).

### Packages (`packages/`)

Shared internal libraries organized by concern. All packages use explicit exports in `package.json`.

#### Core Services

| Package          | Purpose                                           |
| ---------------- | ------------------------------------------------- |
| `api`            | tRPC routers and type-safe API layer              |
| `authentication` | Better Auth setup with OAuth, magic links, 2FA    |
| `database`       | Drizzle ORM schemas and repositories              |
| `environment`    | Zod-validated environment variables               |
| `logging`        | Structured logging with Pino and Logtail          |

#### External Integrations

| Package        | Purpose                                |
| -------------- | -------------------------------------- |
| `arcjet`       | Rate limiting and DDoS protection      |
| `brasil-api`   | Brazilian bank data API integration    |
| `cache`        | Redis caching layer                    |
| `files`        | MinIO S3-compatible file storage       |
| `posthog`      | Analytics tracking (client & server)   |
| `queue`        | BullMQ job queue abstractions          |
| `stripe`       | Stripe payments SDK wrapper            |
| `transactional`| React Email templates with Resend      |

#### Feature Modules

| Package        | Purpose                                |
| -------------- | -------------------------------------- |
| `csv`          | CSV parsing and batch processing       |
| `encryption`   | E2E encryption with NaCl (TweetNaCl)   |
| `notifications`| Push notifications and alerts          |
| `ofx`          | OFX file parsing and processing        |
| `pdf`          | PDF report generation                  |
| `workflows`    | Visual automation rule engine          |

#### Frontend

| Package        | Purpose                                |
| -------------- | -------------------------------------- |
| `localization` | i18next with en-US/pt-BR support       |
| `ui`           | Radix + Tailwind component library     |

#### Utilities

| Package | Purpose                                     |
| ------- | ------------------------------------------- |
| `utils` | Shared utilities (dates, money, errors)     |

### Dashboard Features (`apps/dashboard/src/features/`)

The dashboard organizes functionality into feature modules, each with its own hooks, UI components, and utilities.

| Feature           | Purpose                                      |
| ----------------- | -------------------------------------------- |
| `bank-account`    | Bank account CRUD and selection              |
| `bill`            | Bill tracking with recurrence and installments |
| `category`        | Transaction type and category selection      |
| `cookie-consent`  | GDPR cookie consent banner                   |
| `custom-report`   | Custom financial report builder              |
| `encryption`      | E2E encryption setup and unlock UI           |
| `error-report`    | User error feedback modal                    |
| `expense-split`   | Team expense splitting and settlements       |
| `export`          | Multi-format data export wizard              |
| `file-upload`     | File uploads with compression                |
| `icon-selector`   | Icon picker for categories/accounts          |
| `import`          | CSV/OFX import with duplicate detection      |
| `notifications`   | Push notification preferences                |
| `organization`    | Team and member management                   |
| `permissions`     | Bank account access control                  |
| `stripe-disclosure` | Stripe payment disclaimer                  |
| `transaction`     | Transaction CRUD with categorization         |

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are greatly appreciated.

Please read our [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📜 License

This project is licensed under the Apache-2.0 License. See the [LICENSE.md](LICENSE.md) file for details.
