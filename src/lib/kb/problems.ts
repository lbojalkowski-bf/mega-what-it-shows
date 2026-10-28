// The problems inside a merged ticket. causes.ts files a report by its tenant; a report whose body
// says the date moved by one day (desk-notes.json) is not a month flip, so it is its own problem.
import { causeOf, uniqueById, type Cause, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = Cause | 'one-day' | 'unplaced';

export const PROBLEM_LABEL: Record<Problem, string> = {
  parser: 'shared parser reads day-first dates month first',
  hint: 'booking-v3 form hints MM/DD to day-first tenants',
  'one-day': 'date moves by one day between time zones',
  unplaced: 'no tenant on file',
};

export function problemOf(r: Report, t: Tenant | undefined, oneDay: readonly string[]): Problem {
  if (oneDay.includes(r.id)) return 'one-day';
  return causeOf(r, t) ?? 'unplaced';
}

export type ProblemGroup = {
  problem: Problem;
  reports: Report[];
  tenants: number;
  firstSeen: string;
  lastSeen: string;
  // Reports whose intake tag names a different cause than the one they belong to.
  mistagged: number;
};

export function groupByProblem(
  rows: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  oneDay: readonly string[],
): ProblemGroup[] {
  const merged = uniqueById(rows).filter((r) => r.mergedInto === ticket);
  const byProblem = new Map<Problem, Report[]>();
  for (const r of merged) {
    const p = problemOf(r, tenantOf(r), oneDay);
    byProblem.set(p, [...(byProblem.get(p) ?? []), r]);
  }
  return [...byProblem.entries()]
    .map(([problem, rs]) => {
      const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
      return {
        problem,
        reports: rs,
        tenants: new Set(rs.map((r) => r.tenant)).size,
        firstSeen: days[0],
        lastSeen: days[days.length - 1],
        mistagged: rs.filter((r) => (problem === 'parser' || problem === 'hint') && r.meta.intakeTag !== problem).length,
      };
    })
    .sort((a, b) => b.reports.length - a.reports.length);
}
