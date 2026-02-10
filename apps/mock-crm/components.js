/**
 * Acme CRM — Shared Components
 * Reusable sidebar and header HTML generators.
 */

function renderSidebar(activePage) {
  return `
    <aside class="sidebar">
      <div class="sidebar-brand">
        <div class="logo">A</div>
        <span>Acme CRM</span>
      </div>
      <nav class="sidebar-nav">
        <div class="sidebar-section-label">Main</div>
        <a href="index.html" class="${activePage === 'dashboard' ? 'active' : ''}">
          <span class="icon">📊</span> Dashboard
        </a>
        <a href="contacts.html" class="${activePage === 'contacts' ? 'active' : ''}">
          <span class="icon">👥</span> Contacts
        </a>
        <a href="deals.html" class="${activePage === 'deals' ? 'active' : ''}">
          <span class="icon">🤝</span> Deals
        </a>
        <a href="reports.html" class="${activePage === 'reports' ? 'active' : ''}">
          <span class="icon">📈</span> Reports
        </a>
        <div class="sidebar-section-label">Settings</div>
        <a href="billing.html" class="${activePage === 'billing' ? 'active' : ''}">
          <span class="icon">💳</span> Billing
        </a>
        <a href="settings.html" class="${activePage === 'settings' ? 'active' : ''}">
          <span class="icon">⚙️</span> Settings
        </a>
      </nav>
      <div class="sidebar-footer">
        <div style="display:flex;align-items:center;gap:8px;">
          <div class="avatar avatar-sm">JD</div>
          <div>
            <div style="font-size:13px;font-weight:600;color:var(--text-primary)">Jane Doe</div>
            <div style="font-size:11px;color:var(--text-muted)">Admin</div>
          </div>
        </div>
      </div>
    </aside>
  `;
}

function initPage(activePage, pageTitle) {
  // Inject sidebar
  document.getElementById('sidebar-root').innerHTML = renderSidebar(activePage);
  
  // Set page title
  document.title = `${pageTitle} — Acme CRM`;
}
