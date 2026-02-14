import type { Attendance, Employee } from "@/lib/hr-api";

export type EmployeeAvailability = "active" | "leave" | "no_info";

export function todayIsoDate(): string {
  return toIsoDate(new Date());
}

export function toIsoDate(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function buildStatusMap(
  attendance: Attendance[],
  selectedDate: string,
): Map<string, EmployeeAvailability> {
  const statusMap = new Map<string, EmployeeAvailability>();

  attendance.forEach((record) => {
    if (record.attendance_date !== selectedDate) return;
    statusMap.set(record.employee_id, record.status === "present" ? "active" : "leave");
  });

  return statusMap;
}

export function countAvailability(
  employees: Employee[],
  statusMap: Map<string, EmployeeAvailability>,
): Record<EmployeeAvailability, number> {
  return employees.reduce(
    (acc, employee) => {
      const status = statusMap.get(employee.id) ?? "no_info";
      acc[status] += 1;
      return acc;
    },
    { active: 0, leave: 0, no_info: 0 } as Record<EmployeeAvailability, number>,
  );
}

export function formatDisplayDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

export function shortDateLabel(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(parsed);
}

export function lastNDates(days: number): string[] {
  return Array.from({ length: days }, (_, index) => {
    const current = new Date();
    current.setDate(current.getDate() - (days - 1 - index));
    return toIsoDate(current);
  });
}
