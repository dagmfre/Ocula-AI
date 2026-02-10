/**
 * Acme CRM — Mock Data
 * Realistic-looking sample data for the demo CRM application.
 */

const CONTACTS = [
  { id: 1, name: "Sarah Chen", email: "sarah.chen@techcorp.io", phone: "+1 (555) 234-5678", company: "TechCorp", role: "VP Engineering", status: "active", avatar: "SC" },
  { id: 2, name: "James Wilson", email: "j.wilson@growthly.com", phone: "+1 (555) 345-6789", company: "Growthly", role: "CEO", status: "active", avatar: "JW" },
  { id: 3, name: "Maria Garcia", email: "maria@designhub.co", phone: "+1 (555) 456-7890", company: "DesignHub", role: "Product Manager", status: "active", avatar: "MG" },
  { id: 4, name: "Alex Thompson", email: "alex.t@startupxyz.com", phone: "+1 (555) 567-8901", company: "StartupXYZ", role: "CTO", status: "inactive", avatar: "AT" },
  { id: 5, name: "Emily Nakamura", email: "emily@cloudpeak.io", phone: "+1 (555) 678-9012", company: "CloudPeak", role: "Head of Sales", status: "active", avatar: "EN" },
  { id: 6, name: "David Park", email: "dpark@nexgen.com", phone: "+1 (555) 789-0123", company: "NexGen AI", role: "Founder", status: "active", avatar: "DP" },
  { id: 7, name: "Lisa Johnson", email: "lisa.j@mediaflow.co", phone: "+1 (555) 890-1234", company: "MediaFlow", role: "Marketing Director", status: "active", avatar: "LJ" },
  { id: 8, name: "Robert Kim", email: "r.kim@financeplus.com", phone: "+1 (555) 901-2345", company: "FinancePlus", role: "CFO", status: "inactive", avatar: "RK" },
];

const DEALS = [
  { id: 1, name: "TechCorp Enterprise License", value: 48000, contact: "Sarah Chen", stage: "proposal", probability: 70 },
  { id: 2, name: "Growthly Annual Plan", value: 24000, contact: "James Wilson", stage: "negotiation", probability: 85 },
  { id: 3, name: "DesignHub Team Upgrade", value: 12000, contact: "Maria Garcia", stage: "qualified", probability: 50 },
  { id: 4, name: "StartupXYZ Pilot Program", value: 6000, contact: "Alex Thompson", stage: "lead", probability: 20 },
  { id: 5, name: "CloudPeak Multi-Year", value: 96000, contact: "Emily Nakamura", stage: "negotiation", probability: 90 },
  { id: 6, name: "NexGen AI Integration", value: 36000, contact: "David Park", stage: "proposal", probability: 60 },
  { id: 7, name: "MediaFlow Pro Bundle", value: 18000, contact: "Lisa Johnson", stage: "qualified", probability: 45 },
  { id: 8, name: "FinancePlus Compliance Add-on", value: 8500, contact: "Robert Kim", stage: "lead", probability: 15 },
  { id: 9, name: "TechCorp Support Tier", value: 15000, contact: "Sarah Chen", stage: "closed-won", probability: 100 },
  { id: 10, name: "Growthly Starter Pack", value: 4800, contact: "James Wilson", stage: "closed-lost", probability: 0 },
];

const ACTIVITY_FEED = [
  { type: "deal", text: "CloudPeak Multi-Year moved to Negotiation", time: "2 min ago", icon: "🤝" },
  { type: "contact", text: "New contact added: David Park (NexGen AI)", time: "15 min ago", icon: "👤" },
  { type: "email", text: "Email sent to Sarah Chen — follow-up proposal", time: "1 hour ago", icon: "📧" },
  { type: "call", text: "Call logged with James Wilson (32 min)", time: "2 hours ago", icon: "📞" },
  { type: "deal", text: "TechCorp Support Tier — Closed Won! 🎉", time: "3 hours ago", icon: "✅" },
  { type: "note", text: "Note added to Maria Garcia's profile", time: "5 hours ago", icon: "📝" },
  { type: "meeting", text: "Meeting scheduled with Emily Nakamura", time: "Yesterday", icon: "📅" },
];

const MONTHLY_REVENUE = [
  { month: "Jul", value: 28000 },
  { month: "Aug", value: 32000 },
  { month: "Sep", value: 35000 },
  { month: "Oct", value: 41000 },
  { month: "Nov", value: 38000 },
  { month: "Dec", value: 45000 },
  { month: "Jan", value: 52000 },
  { month: "Feb", value: 58000 },
];

const INVOICES = [
  { id: "INV-2026-042", date: "Feb 1, 2026", amount: "$299.00", status: "paid" },
  { id: "INV-2026-031", date: "Jan 1, 2026", amount: "$299.00", status: "paid" },
  { id: "INV-2025-12", date: "Dec 1, 2025", amount: "$199.00", status: "paid" },
  { id: "INV-2025-11", date: "Nov 1, 2025", amount: "$199.00", status: "paid" },
  { id: "INV-2025-10", date: "Oct 1, 2025", amount: "$199.00", status: "paid" },
];

const PIPELINE_STAGES = ["lead", "qualified", "proposal", "negotiation", "closed-won", "closed-lost"];

const STAGE_LABELS = {
  "lead": "Lead",
  "qualified": "Qualified",
  "proposal": "Proposal",
  "negotiation": "Negotiation",
  "closed-won": "Closed Won",
  "closed-lost": "Closed Lost"
};
