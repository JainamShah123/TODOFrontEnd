const now = Date.now()
const minutesAgo = (minutes) => new Date(now - minutes * 60 * 1000).toISOString()
const hoursAgo = (hours) => new Date(now - hours * 60 * 60 * 1000).toISOString()
const daysAgo = (days) => new Date(now - days * 24 * 60 * 60 * 1000).toISOString()

export const INITIAL_NOTES = [
  {
    id: 'note-1',
    title: 'Client Onboarding Checklist & Credentials',
    contentHtml: `
      <h3 class="font-headline-sm text-headline-sm text-on-surface font-semibold text-primary">Primary Onboarding Protocols</h3>
      <p>Verify that all <strong class="font-bold text-primary">API keys</strong> and admin credentials have been rotated prior to handoff. The provisioned accounts must adhere strictly to zero-trust access control policy.</p>
      <div class="flex flex-col gap-2 my-2 bg-surface-container-low/50 p-unit-md rounded-lg">
        <label class="flex items-center gap-4 cursor-pointer group">
          <input type="checkbox" checked class="h-4 w-4 rounded accent-primary cursor-pointer" />
          <span class="line-through opacity-70 group-hover:opacity-100 transition-opacity">Generate scoped service credentials</span>
        </label>
        <label class="flex items-center gap-4 cursor-pointer group">
          <input type="checkbox" checked class="h-4 w-4 rounded accent-primary cursor-pointer" />
          <span class="line-through opacity-70 group-hover:opacity-100 transition-opacity">Configure role-based access control (RBAC)</span>
        </label>
        <label class="flex items-center gap-4 cursor-pointer group">
          <input type="checkbox" class="h-4 w-4 rounded accent-primary cursor-pointer" />
          <span class="font-medium">Deliver documentation in secure vault</span>
        </label>
      </div>
      <pre class="bg-surface-subtle text-on-surface p-unit-md rounded-lg font-mono text-sm overflow-x-auto shadow-inner">auth_token = "sec_prod_89f02a0149c7bc299e44"
tenant_id  = "master-tenant-cluster-eu-west-1"
expire_ts  = 1735689600 # Valid until Year End</pre>
      <blockquote class="bg-surface-container-low p-unit-md rounded-r-lg text-on-surface-variant italic">Note: Client NDA is active until Dec 2026. Data handling adheres strictly to ISO-27001 parameters.</blockquote>
    `,
    pinned: true,
    archived: false,
    updatedAt: minutesAgo(15),
  },
  {
    id: 'note-2',
    title: 'Q3 Financial Audit Preparation Steps',
    contentHtml: `
      <p>Review ledger reconciliations, cross-verify departmental cost centers, and verify cloud compute invoices before the close-out meeting.</p>
      <ul class="list-disc pl-6">
        <li>Reconcile Q3 vendor invoices against purchase orders</li>
        <li>Cross-check departmental budget variance reports</li>
        <li>Confirm cloud infrastructure spend against forecast</li>
      </ul>
    `,
    pinned: true,
    archived: false,
    updatedAt: hoursAgo(20),
  },
  {
    id: 'note-3',
    title: 'Team Meeting Summary & Action Items',
    contentHtml: `
      <p>Sprint retrospective concluded with 94% velocity. Action items prioritized for API throughput optimization and database indexing.</p>
      <ol class="list-decimal pl-6">
        <li>Profile the /tasks endpoint under load</li>
        <li>Add composite index on (assignee, due_date)</li>
        <li>Schedule follow-up sync for next Thursday</li>
      </ol>
    `,
    pinned: false,
    archived: false,
    updatedAt: daysAgo(4),
  },
  {
    id: 'note-4',
    title: 'Code Review Best Practices & Guidelines',
    contentHtml: `
      <p>Every PR requires unit coverage &gt;85%. Enforce explicit null assertions and async thread profiling before staging merge.</p>
      <blockquote class="bg-surface-container-low p-unit-md rounded-r-lg text-on-surface-variant italic">Reviewers should block merges lacking regression tests for bug fixes.</blockquote>
    `,
    pinned: false,
    archived: false,
    updatedAt: daysAgo(9),
  },
  {
    id: 'note-5',
    title: 'Legacy Vendor Contact List',
    contentHtml: '<p>Archived after the Q1 vendor consolidation. Kept for reference only.</p>',
    pinned: false,
    archived: true,
    updatedAt: daysAgo(40),
  },
]
