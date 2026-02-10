# Acme CRM — Ocula AI Knowledge Base

> This document is designed for Ocula AI to ingest and use for guiding users through the Acme CRM application.
> It contains structured information about every page, UI element, navigation path, and common user tasks.

---

## Application Overview

**Product Name**: Acme CRM  
**Type**: Customer Relationship Management (CRM) software  
**Users**: Sales teams, account managers, and business administrators  
**URL Structure**: Single-page HTML files (index.html, contacts.html, deals.html, reports.html, billing.html, settings.html)

---

## Global Navigation

### Sidebar (Left Panel — Always Visible)
The sidebar is **fixed on the left side** of every page. Width: 240px.

| Menu Item | Icon | URL | Description |
|-----------|------|-----|-------------|
| **Dashboard** | 📊 | `index.html` | Main overview with stats, revenue chart, activity feed |
| **Contacts** | 👥 | `contacts.html` | Contact list, search, import, add new contacts |
| **Deals** | 🤝 | `deals.html` | Kanban-style deal pipeline with drag-and-drop |
| **Reports** | 📈 | `reports.html` | Analytics, charts, export reports |
| **Billing** | 💳 | `billing.html` | Subscription plan, payment method, invoices |
| **Settings** | ⚙️ | `settings.html` | Account settings, team, notifications, integrations |

**Location**: The sidebar navigation links are stacked vertically in the left panel. The currently active page is highlighted in purple/indigo.

### Top Header Bar
Every page has a **sticky header** at the top containing:
- **Page title** (left side)
- **Search bar** (center-right area) — type to search
- **Action buttons** (right side) — context-specific (e.g., "+ New Deal", "Export")

---

## Page: Dashboard (index.html)

### Stats Cards (Top Row)
Four metric cards displayed in a horizontal grid at the top:

| Card | Position | Value | Icon |
|------|----------|-------|------|
| Total Contacts | Top-left (1st) | 847 | 👥 purple background |
| Active Deals | 2nd from left | 23 | 🤝 green background |
| Revenue (Feb) | 3rd from left | $58K | 💰 yellow background |
| Email Open Rate | Top-right (4th) | 92% | 📧 blue background |

### Monthly Revenue Chart (Left Column, Below Stats)
- A bar chart showing revenue from July to February
- Located in the left column of a 2-column grid
- Has an "Export" button in the card header (top-right of the chart card)

### Recent Activity Feed (Right Column, Below Stats)
- A list of recent team actions (deal updates, contacts added, emails sent, calls logged)
- Located in the right column, next to the revenue chart
- Shows timestamps (e.g., "2 min ago", "1 hour ago")
- Has a "View All" button in the card header

### Top Deals Table (Full Width, Bottom)
- A table showing the top 5 deals by value
- Columns: Deal Name, Contact, Value, Stage, Probability
- Has a "View All →" link to the Deals page (deals.html)

---

## Page: Contacts (contacts.html)

### Contact Stats (Top Row)
Three stat cards:
- Total Contacts: 847
- Active: 692
- Inactive: 155

### Actions Bar (Top Header)
- **Search bar**: Type to filter contacts by name, email, or company
- **Import button**: Opens CSV import flow
- **+ Add Contact button**: Primary purple button, top-right — opens form to create a new contact

### Contacts Table
Full-width table with columns:
| Column | Description |
|--------|-------------|
| Name | Contact's full name with avatar |
| Email | Email address |
| Phone | Phone number |
| Company | Company name |
| Role | Job title/role |
| Status | "Active" (green badge) or "Inactive" (gray badge) |
| Actions | "Edit" button |

**Search**: The search bar in the header filters the table in real-time as you type.

### How to Add a New Contact
1. Click the **"+ Add Contact"** button (top-right corner, purple button)
2. Fill in the form fields: Name, Email, Phone, Company, Role
3. Click "Save Contact"

### How to Import Contacts
1. Click the **"Import"** button (next to "+ Add Contact" in the header)
2. Upload a CSV file with columns: Name, Email, Phone, Company
3. Map the columns and click "Start Import"

### How to Export Contacts
1. Click the **"Export CSV"** button (in the table card header)
2. The file downloads automatically

---

## Page: Deals Pipeline (deals.html)

### Pipeline Stats (Top Row)
Four stat cards:
| Metric | Description |
|--------|-------------|
| Total Pipeline Value | Sum of all active (non-closed) deals |
| Weighted Value | Value × probability for each deal |
| Win Rate | Closed-won / (closed-won + closed-lost) percentage |
| Avg Deal Size | Average value of active deals |

### Kanban Board
A horizontal board with **6 columns** representing deal stages:

| Stage | Position (Left → Right) | Description |
|-------|------------------------|-------------|
| **Lead** | 1st column | Initial inquiry, not yet qualified |
| **Qualified** | 2nd column | Confirmed opportunity |
| **Proposal** | 3rd column | Proposal/quote has been sent |
| **Negotiation** | 4th column | Discussing terms and pricing |
| **Closed Won** ✅ | 5th column | Deal successfully closed |
| **Closed Lost** ❌ | 6th column | Deal was lost |

Each deal is shown as a **card** inside its stage column, displaying:
- Deal name (bold)
- Deal value (e.g., "$48,000")
- Contact name with small avatar

### How to Create a New Deal
1. Click the **"+ New Deal"** button (top-right corner, purple button)
2. Enter deal details: Name, Value, Contact, Stage
3. Click "Create Deal"

### How to Move a Deal Between Stages
1. **Drag** the deal card from one column to another
2. OR click the deal card → change the Stage dropdown → click "Update"

---

## Page: Reports & Analytics (reports.html)

### KPI Cards (Top Row)
| Metric | Value | Trend |
|--------|-------|-------|
| Total Revenue (YTD) | $348K | ↑ 24% |
| Win Rate | 67% | ↑ 5% |
| Avg Sales Cycle | 18 days | ↑ 3 days faster |
| Avg Deal Size | $28.5K | ↑ 12% |

### Revenue Trend Chart (Left Column)
- Bar chart showing monthly revenue trend
- Same data as dashboard but with more detail

### Pipeline Breakdown (Right Column)
- Horizontal progress bars for each pipeline stage
- Shows deal count and total value per stage

### Team Activity Table (Bottom, Full Width)
Metrics comparison table with columns:
- Metric name (Emails Sent, Calls Made, Meetings Held, Deals Created, Deals Closed)
- This Month value
- Last Month value
- Percentage change (green = up, red = down)

### How to Generate a Report
1. Click **"Reports"** in the sidebar navigation (📈 icon)
2. Select the date range from the **dropdown** in the top-right (e.g., "Last 30 Days", "Last 90 Days")
3. Click the **"Generate Report"** button (purple button, top-right)

### How to Export a Report
1. **First generate the report** (see above)
2. Click the **"📥 Export PDF"** button (top header, next to the date picker)
3. The file downloads automatically as PDF
4. **Note**: The Export button is in the **top header bar**, not inside the report card

---

## Page: Billing & Subscription (billing.html)

### Location
Click **"Billing"** in the sidebar (💳 icon) — it's under the "Settings" section label, second from bottom.

### Current Plan Section (Top Card)
- Shows current plan name: **"Pro Plan"**
- Price: **$299/month**
- Next billing date
- **"Change Plan"** button and **"Cancel"** button (red)

### Plan Comparison Grid (3 Columns)
Three plan cards side by side:

| Plan | Price | Key Features |
|------|-------|-------------|
| **Free** | $0/mo | 100 contacts, basic pipeline, email support, 1 member |
| **Pro** (current) | $299/mo | Unlimited contacts, advanced pipeline, priority support, 10 members, custom reports, API |
| **Enterprise** | $899/mo | Everything in Pro + unlimited members, SSO, dedicated support, custom integrations, SLA |

The current plan card has a **purple border glow**.

### Payment Method Section
- Shows saved payment card: **Visa ending in 4242**
- Expiration date: 12/2028
- **"Update"** button to change payment method

### Invoice History Table
| Column | Description |
|--------|-------------|
| Invoice | Invoice ID (e.g., INV-2026-042) |
| Date | Invoice date |
| Amount | Amount charged |
| Status | "Paid" (green badge) |
| Action | "Download" button |

---

## Page: Settings (settings.html)

### Account Settings (Left Column)
Form fields:
- **Full Name**: text input (currently "Jane Doe")
- **Email Address**: email input
- **Role**: dropdown (Admin, Manager, Member)
- **Timezone**: dropdown with common timezones
- **"Change Password"** button at the bottom

### Notifications (Right Column)
Toggle switches for:
- Email Notifications (on/off)
- Deal Alerts (on/off)
- Weekly Digest (on/off)
- Slack Notifications (on/off)

### Team Members Table (Below, Full Width)
Shows all team members with:
- Name + avatar
- Email
- Role (Admin = blue, Manager = yellow, Member = gray)
- Status (Active = green, Invited = gray)
- Actions (Edit or Resend invite)
- **"+ Invite Member"** button (purple, top-right of card)

### Integrations Grid (Below Team)
2×2 grid of integration cards:
| Integration | Status |
|-------------|--------|
| Gmail | Connected ✅ |
| Google Calendar | Connected ✅ |
| Slack | Not connected (has "Connect" button) |
| Zapier | Not connected (has "Connect" button) |

### Danger Zone (Bottom Card, Red Border)
- **"Delete Account"** button (red) — permanently deletes the account
- Warning text: "This action cannot be undone"

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` | Quick search (focuses search bar) |
| `Ctrl+N` | New contact |
| `Ctrl+D` | New deal |
| `Ctrl+R` | Open reports |
| `Esc` | Close modal/panel |

---

## Common User Questions & Answers

**Q: Where is the billing page?**
A: Click "Billing" in the left sidebar (💳 icon). It's under the "Settings" section, second item from the bottom.

**Q: How do I add a new contact?**
A: Go to Contacts page → Click the purple "+ Add Contact" button in the top-right corner.

**Q: How do I export a report?**
A: Go to Reports page → Select date range → Click "Generate Report" → Then click the "📥 Export PDF" button in the top header.

**Q: Where do I change my subscription plan?**
A: Billing page → Under "Current Plan", click the "Change Plan" button. Or scroll down to see all plan options.

**Q: How do I invite a team member?**
A: Settings page → Scroll to "Team Members" section → Click the purple "+ Invite Member" button.

**Q: Where are integrations?**
A: Settings page → Scroll down past Team Members to the "Integrations" section.

**Q: How do I update my payment method?**
A: Billing page → Scroll to "Payment Method" section → Click the "Update" button.

**Q: Where can I see my deals pipeline?**
A: Click "Deals" in the left sidebar (🤝 icon). You'll see a Kanban board with columns for each stage.
