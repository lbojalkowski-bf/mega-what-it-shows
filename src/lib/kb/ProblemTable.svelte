<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import { uniqueById, type Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';
  import { groupByProblem, PROBLEM_LABEL, type Problem } from '#lib/kb/problems';

  // links: problem → URL of the ticket filed for it.
  let { ticket, links = {} }: { ticket: number; links?: Partial<Record<Problem, string>> } = $props();

  const rows = reports as Report[];
  const groups = $derived(groupByProblem(rows, ticket, tenantOf, notes.oneDayMove));
  const total = $derived(groups.reduce((n, g) => n + g.reports.length, 0));
  const exported = rows.length;
  const unique = uniqueById(rows).length;
  const mistagged = $derived(groups.reduce((n, g) => n + g.mistagged, 0));
</script>

<p class="sum">
  <strong>{total}</strong> reports merged into #{ticket} · <strong>{groups.length}</strong>
  {groups.length === 1 ? 'problem' : 'problems'}
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>tenants</th><th>seen</th><th>ticket</th></tr>
  </thead>
  <tbody>
    {#each groups as g (g.problem)}
      <tr>
        <td><code>{g.problem}</code><br /><span class="muted">{PROBLEM_LABEL[g.problem]}</span></td>
        <td>{g.reports.length}</td>
        <td>{g.tenants}</td>
        <td>{g.firstSeen} → {g.lastSeen}</td>
        <td>{#if links[g.problem]}<a href={links[g.problem]}>{links[g.problem]?.replace(/^.*\/issues\//, 'issue #')}</a>{:else}—{/if}</td>
      </tr>
    {/each}
  </tbody>
</table>

<p class="muted">
  The export has {exported} rows for {unique} reports: {exported - unique} rows came twice from overlapping pages and are
  counted once. Intake tagged {mistagged} of them with the other cause.
</p>

<style>
  .sum { font-size: 1.1rem; }
  .muted { color: var(--muted); font-size: 0.85em; }
</style>
