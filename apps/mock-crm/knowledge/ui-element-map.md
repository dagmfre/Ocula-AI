# Acme CRM — UI Element Map

> This document provides precise UI element locations for Ocula AI's visual grounding system.
> Each entry maps a user intent to the exact screen location where the relevant element can be found.

---

## Sidebar Navigation Elements

| Element | Page | Approximate Position | Visual Description |
|---------|------|---------------------|-------------------|
| Dashboard link | All pages | Left sidebar, 1st item under "Main" | Icon: 📊, text "Dashboard" |
| Contacts link | All pages | Left sidebar, 2nd item under "Main" | Icon: 👥, text "Contacts" |
| Deals link | All pages | Left sidebar, 3rd item under "Main" | Icon: 🤝, text "Deals" |
| Reports link | All pages | Left sidebar, 4th item under "Main" | Icon: 📈, text "Reports" |
| Billing link | All pages | Left sidebar, 1st item under "Settings" | Icon: 💳, text "Billing" |
| Settings link | All pages | Left sidebar, 2nd item under "Settings" | Icon: ⚙️, text "Settings" |

## Dashboard Page Elements

| Element | Position | Visual Description |
|---------|----------|-------------------|
| Total Contacts stat | Top row, 1st card | Large number "847" with purple icon |
| Active Deals stat | Top row, 2nd card | Large number "23" with green icon |
| Revenue stat | Top row, 3rd card | Large number "$58K" with yellow icon |
| Email Open Rate stat | Top row, 4th card | Large number "92%" with blue icon |
| Revenue chart | Middle-left | Bar chart with monthly labels |
| Export button (chart) | Revenue chart card, top-right | Text "Export" in secondary button |
| Activity Feed | Middle-right | List of recent actions with timestamps |
| View All (activity) | Activity card, top-right | Text "View All" in secondary button |
| Top Deals table | Bottom, full-width | Table with deal rows |
| View All deals link | Top Deals card, top-right | Text "View All →" link |
| Search bar | Top header, center-right | Input with 🔍 icon and placeholder text |
| + New Deal button | Top header, far right | Purple button |

## Contacts Page Elements

| Element | Position | Visual Description |
|---------|----------|-------------------|
| Search contacts | Top header, center-right | Input with placeholder "Search contacts…" |
| Import button | Top header, before Add button | Gray "Import" button |
| + Add Contact button | Top header, far right | Purple button, most prominent |
| Export CSV button | Table card header, right | Gray "Export CSV" button |
| Filter button | Table card header, left of Export | Gray "Filter" button |
| Contact table | Main content area | Full-width table with name, email, phone columns |

## Deals Page Elements

| Element | Position | Visual Description |
|---------|----------|-------------------|
| + New Deal button | Top header, far right | Purple button |
| Pipeline stats | Top row, 4 cards | Total value, weighted value, win rate, avg deal |
| Lead column | Kanban board, 1st column | Header "Lead" with count |
| Qualified column | Kanban board, 2nd column | Header "Qualified" with count |
| Proposal column | Kanban board, 3rd column | Header "Proposal" with count |
| Negotiation column | Kanban board, 4th column | Header "Negotiation" with count |
| Closed Won column | Kanban board, 5th column | Header "Closed Won" with count |
| Closed Lost column | Kanban board, 6th column | Header "Closed Lost" with count |
| Deal cards | Inside each column | Cards with deal name, value, and contact |

## Reports Page Elements

| Element | Position | Visual Description |
|---------|----------|-------------------|
| Date range picker | Top header, center | Dropdown: "Last 30 Days", "Last 90 Days", etc. |
| Export PDF button | Top header, right of date picker | Gray button with 📥 icon |
| Generate Report button | Top header, far right | Purple "Generate Report" button |
| Revenue trend chart | Middle-left | Bar chart with monthly data |
| Pipeline breakdown | Middle-right | Horizontal progress bars by stage |
| Team Activity table | Bottom, full-width | Metrics comparison table |

## Billing Page Elements

| Element | Position | Visual Description |
|---------|----------|-------------------|
| Current Plan card | Top section | Shows "Pro Plan", $299/month |
| Change Plan button | Current Plan card, right side | Gray "Change Plan" button |
| Cancel button | Current Plan card, right of Change Plan | Red "Cancel" button |
| Free plan card | Plan grid, 1st column | $0/mo with "Downgrade" button |
| Pro plan card | Plan grid, 2nd column | $299/mo with purple border glow, "Current Plan" disabled |
| Enterprise plan card | Plan grid, 3rd column | $899/mo with "Upgrade" button |
| Payment method | Below plans | Credit card icon, "Visa ending in 4242" |
| Update payment button | Payment section, right | Gray "Update" button |
| Invoice history table | Bottom | Table with invoice ID, date, amount, download |
| Download All Invoices | Top header, right | Gray button |

## Settings Page Elements

| Element | Position | Visual Description |
|---------|----------|-------------------|
| Account form | Left column | Form with name, email, role, timezone fields |
| Change Password button | Below account form | Gray "Change Password" button |
| Notifications toggles | Right column | Checkboxes for email, deal alerts, digest, Slack |
| Team Members table | Below forms, full-width | Table with member name, role, status |
| + Invite Member button | Team card, top-right | Purple button |
| Integrations grid | Below Team | 2×2 grid with Gmail, Calendar, Slack, Zapier |
| Gmail integration | Integrations, top-left | Shows "Connected" badge |
| Slack integration | Integrations, bottom-left | Shows "Connect" button |
| Delete Account button | Very bottom, red border card | Red "Delete Account" button |
| Save Changes button | Top header, far right | Purple "Save Changes" button |
