import { EmployeeDirectory } from "@/components/employees/employee-directory";
import { getAttendance, getEmployees, type Attendance, type Employee } from "@/lib/hr-api";

export default async function AttendancePage() {
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
        <h1 className="text-xl font-bold text-[hsl(var(--destructive))]">Unable to load attendance data</h1>
        <p className="mt-2 text-sm text-[hsl(var(--destructive))]">{errorMessage}</p>
      </section>
    );
  }

  return (
    <EmployeeDirectory
      employees={employees}
      attendance={attendance}
      title="Attendance"
      subtitle="Track daily employee availability and presence"
      pageSize={10}
      showFilters
    />
  );
}
