import { StatusLineChart } from "@/components/dashboard/status-line-chart";
import { EmployeeDirectory } from "@/components/employees/employee-directory";
import { getAttendance, getEmployees, type Attendance, type Employee } from "@/lib/hr-api";
import { buildStatusMap, countAvailability, lastNDates, todayIsoDate } from "@/lib/hr-utils";

export default async function DashboardPage() {
  let errorMessage: string | null = null;
  let employees: Employee[] = [];
  let attendance: Attendance[] = [];

  try {
    [employees, attendance] = await Promise.all([getEmployees(), getAttendance()]);
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Unknown error";
  }

  if (errorMessage) {
    return (
      <section className="rounded-3xl border bg-[hsl(var(--card))] p-6">
        <h1 className="text-xl font-bold text-[hsl(var(--destructive))]">Unable to load dashboard data</h1>
        <p className="mt-2 text-sm text-[hsl(var(--destructive))]">{errorMessage}</p>
      </section>
    );
  }

  const today = todayIsoDate();
  const todayStatusMap = buildStatusMap(attendance, today);
  const totals = countAvailability(employees, todayStatusMap);

  const trendDates = lastNDates(7);
  const trend = trendDates.map((date) => {
    const statusMap = buildStatusMap(attendance, date);
    const counts = countAvailability(employees, statusMap);
    return {
      date,
      present: counts.present,
      absent: counts.absent,
      noInfo: counts.no_info,
    };
  });

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-3xl border bg-[hsl(var(--card))] p-5 shadow-sm">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">People Present</p>
          <p className="mt-3 text-4xl font-bold text-[hsl(var(--primary))]">{totals.present}</p>
        </article>

        <article className="rounded-3xl border bg-[hsl(var(--card))] p-5 shadow-sm">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">People Absent</p>
          <p className="mt-3 text-4xl font-bold text-[hsl(var(--secondary))]">{totals.absent}</p>
        </article>

        <article className="rounded-3xl border bg-[hsl(var(--card))] p-5 shadow-sm">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Location Unknown</p>
          <p className="mt-3 text-4xl font-bold text-[hsl(var(--foreground))]">{totals.no_info}</p>
        </article>
      </section>

      <StatusLineChart points={trend} />

      <EmployeeDirectory
        employees={employees}
        attendance={attendance}
        title="Employee Listing"
        subtitle="Showing 10 employees per page"
        pageSize={10}
        showFilters={false}
      />
    </div>
  );
}
