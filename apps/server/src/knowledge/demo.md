# Acme CRM - Knowledge Base

> Hardcoded demo knowledge base for Ocula AI MVP.
> In production, this would be fetched from the host SaaS platform's docs.

---

## Getting Started

### Dashboard Overview
The main dashboard shows your key metrics at a glance:
- **Total Contacts**: Top-left card showing your total contact count
- **Active Deals**: Top-center card with deals in your pipeline
- **Revenue**: Top-right card showing monthly revenue
- **Activity Feed**: Bottom section with recent team activity

### Navigation
The sidebar on the left contains all main sections:
- **Dashboard** (home icon) - Main overview
- **Contacts** (people icon) - Manage your contacts
- **Deals** (handshake icon) - Sales pipeline
- **Reports** (chart icon) - Analytics and reporting
- **Settings** (gear icon) - Account and app settings

---

## Contacts

### Adding a New Contact
1. Click **Contacts** in the sidebar
2. Click the **+ Add Contact** button (top-right corner)
3. Fill in the required fields: Name, Email, Phone
4. Optionally add Company, Role, and Tags
5. Click **Save Contact**

### Importing Contacts
1. Go to **Contacts** page
2. Click the **Import** button (next to Add Contact)
3. Upload a CSV file with columns: Name, Email, Phone, Company
4. Map the columns to the correct fields
5. Click **Start Import**

### Searching Contacts
Use the search bar at the top of the Contacts page. You can search by:
- Name
- Email
- Company
- Tags

---

## Deals & Pipeline

### Creating a Deal
1. Navigate to **Deals** in the sidebar
2. Click **+ New Deal** button
3. Enter deal details: Name, Value, Contact, Stage
4. Click **Create Deal**

### Pipeline Stages
Deals move through these stages (drag to reorder):
1. **Lead** - Initial inquiry
2. **Qualified** - Confirmed opportunity
3. **Proposal** - Sent proposal/quote
4. **Negotiation** - Discussing terms
5. **Closed Won** ✅ - Deal completed
6. **Closed Lost** ❌ - Deal lost

### Moving a Deal
Drag the deal card between columns, or:
1. Click the deal card to open details
2. Click the **Stage** dropdown
3. Select the new stage
4. Click **Update**

---

## Reports & Analytics

### Generating a Report
1. Click **Reports** in the sidebar
2. Select report type: Sales, Activity, Pipeline, Revenue
3. Choose date range using the date picker (top-right)
4. Click **Generate Report**

### Exporting Reports
1. Generate a report first
2. Click the **Export** button (top-right of report)
3. Choose format: PDF, CSV, or Excel
4. The file will download automatically

### Available Report Types
- **Sales Report**: Revenue by period, top deals, win rate
- **Activity Report**: Team actions, calls, emails, meetings
- **Pipeline Report**: Deals by stage, conversion rates
- **Revenue Forecast**: Predicted revenue based on pipeline

---

## Settings

### Account Settings
Navigate to **Settings > Account** to update:
- Profile name and avatar
- Email address
- Password
- Timezone and language

### Billing
Navigate to **Settings > Billing** to:
- View current plan (Free, Pro, Enterprise)
- Upgrade or downgrade plan
- Update payment method
- View invoices and payment history
- The **Billing** section is in the Settings sidebar, usually second from top

### Team Management
Navigate to **Settings > Team** to:
- Invite team members via email
- Set roles: Admin, Manager, Member
- Remove team members
- View team activity

### Integrations
Navigate to **Settings > Integrations** to connect:
- Email (Gmail, Outlook)
- Calendar (Google Calendar, Outlook)
- Slack notifications
- Zapier webhooks

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` | Quick search |
| `Ctrl+N` | New contact |
| `Ctrl+D` | New deal |
| `Ctrl+R` | Open reports |
| `Esc` | Close modal/panel |

---

## Troubleshooting

### Common Issues

**Can't find the export button?**
The Export button appears only after generating a report. Make sure you've clicked "Generate Report" first.

**Contacts not importing?**
Check that your CSV file has the correct column headers: Name, Email, Phone, Company.

**Dashboard not loading?**
Try refreshing the page. If the issue persists, check your internet connection or contact support.

**Can't change deal stage?**
Make sure you have the right permissions. Only Admins and Managers can modify deal stages.
