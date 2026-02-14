"use client";

import { useMemo, useState } from "react";
import type { Attendance, Employee } from "@/lib/hr-api";
import {
  buildStatusMap,
  countAvailability,
  formatDisplayDate,
  todayIsoDate,
  type EmployeeAvailability,
} from "@/lib/hr-utils";

type EmployeeDirectoryProps = {
  employees: Employee[];
  attendance: Attendance[];
  title: string;
  subtitle: string;
  pageSize?: number;
  showFilters?: boolean;
  enableAttendanceActions?: boolean;
};

type EmployeeRow = {
  employee: Employee;
  availability: EmployeeAvailability;
};

type EmployeeFilterTab = EmployeeAvailability | "all";

const filterTabs: Array<{ id: EmployeeFilterTab; label: string }> = [
  { id: "all", label: "All" },
  { id: "present", label: "Present" },
  { id: "absent", label: "Absent" },
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function EmployeeDirectory({
  employees,
  attendance,
  title,
  subtitle,
  pageSize = 10,
  showFilters = true,
  enableAttendanceActions = false,
}: EmployeeDirectoryProps) {
  const [attendanceRows, setAttendanceRows] = useState(attendance);
  const [query, setQuery] = useState("");
  const [date, setDate] = useState(todayIsoDate());
  const [selectedTab, setSelectedTab] = useState<EmployeeFilterTab>("all");
  const [page, setPage] = useState(1);
  const [updatingEmployeeId, setUpdatingEmployeeId] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const statusMap = useMemo(() => buildStatusMap(attendanceRows, date), [attendanceRows, date]);
  const attendanceByEmployeeForDate = useMemo(() => {
    const records = new Map<string, Attendance>();
    attendanceRows.forEach((record) => {
      if (record.attendance_date !== date) return;
      records.set(record.employee_id, record);
    });
    return records;
  }, [attendanceRows, date]);

  const allRows = useMemo<EmployeeRow[]>(() => {
    return employees.map((employee) => ({
      employee,
      availability: statusMap.get(employee.id) ?? "no_info",
    }));
  }, [employees, statusMap]);

  const searchedRows = useMemo(() => {
    const lowerCaseQuery = query.trim().toLowerCase();
    if (!lowerCaseQuery) return allRows;

    return allRows.filter(({ employee }) => {
      return [employee.full_name, employee.email, employee.employee_id, employee.department]
        .join(" ")
        .toLowerCase()
        .includes(lowerCaseQuery);
    });
  }, [allRows, query]);

  const filteredRows = useMemo(() => {
    if (!showFilters) return searchedRows;
    if (selectedTab === "all") return searchedRows;
    return searchedRows.filter((row) => row.availability === selectedTab);
  }, [searchedRows, selectedTab, showFilters]);

  const pages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(page, pages);
  const pagedRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const availabilityCounts = countAvailability(employees, statusMap);

  async function updateAttendanceStatus(employeeId: string, status: Attendance["status"]) {
    setUpdatingEmployeeId(employeeId);
    setMutationError(null);

    const existingRecord = attendanceByEmployeeForDate.get(employeeId);
    const url = existingRecord ? `/api/attendance/${existingRecord.id}` : "/api/attendance";
    const method = existingRecord ? "PUT" : "POST";
    const payload = existingRecord ? { status } : { employee_id: employeeId, attendance_date: date, status };

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json().catch(() => ({}))) as Partial<Attendance> & { detail?: unknown };
      if (!response.ok) {
        const detail = typeof data.detail === "string" ? data.detail : "Failed to update attendance.";
        throw new Error(detail);
      }

      const savedRecord: Attendance = {
        id: String(data.id ?? existingRecord?.id ?? `${employeeId}-${date}`),
        employee_id: String(data.employee_id ?? employeeId),
        attendance_date: String(data.attendance_date ?? date),
        status: (data.status ?? status) as Attendance["status"],
        created_at: String(data.created_at ?? existingRecord?.created_at ?? new Date().toISOString()),
      };

      setAttendanceRows((current) => {
        if (existingRecord) {
          return current.map((record) => (record.id === existingRecord.id ? savedRecord : record));
        }
        return [...current, savedRecord];
      });
    } catch (error) {
      setMutationError(error instanceof Error ? error.message : "Failed to update attendance.");
    } finally {
      setUpdatingEmployeeId(null);
    }
  }

  const goToPage = (nextPage: number) => {
    const safePage = Math.max(1, Math.min(nextPage, pages));
    setPage(safePage);
  };

  return (
    <section className="rounded-3xl border bg-[hsl(var(--card))] p-4 shadow-sm md:p-6">
      <div className="mb-5 flex flex-col gap-4 md:mb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--card-foreground))]">{title}</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">{subtitle}</p>
        </div>

        <div className="grid w-full gap-3 sm:grid-cols-2 md:w-auto">
          <input
            type="text"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Search employee"
            className="rounded-xl border bg-[hsl(var(--background))] px-4 py-2.5 text-sm outline-none ring-[hsl(var(--ring)/0.35)] transition focus:ring-4"
          />
          <input
            type="date"
            value={date}
            onChange={(event) => {
              setDate(event.target.value);
              setPage(1);
            }}
            className="rounded-xl border bg-[hsl(var(--background))] px-4 py-2.5 text-sm outline-none ring-[hsl(var(--ring)/0.35)] transition focus:ring-4"
          />
        </div>
      </div>

      {showFilters ? (
        <div className="mb-5 flex flex-wrap gap-2 md:mb-6">
          {filterTabs.map((tab) => {
            const active = tab.id === selectedTab;
            const badgeCount = tab.id === "all" ? searchedRows.length : availabilityCounts[tab.id];
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setSelectedTab(tab.id);
                  setPage(1);
                }}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                  active
                    ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                    : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:brightness-95"
                }`}
              >
                {tab.label} ({badgeCount})
              </button>
            );
          })}
        </div>
      ) : null}

      {mutationError ? <p className="mb-4 text-sm text-[hsl(var(--destructive))]">{mutationError}</p> : null}

      <div className="overflow-hidden rounded-2xl border">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Department</th>
                 <th className="px-4 py-3 font-semibold">Status</th>
               </tr>
             </thead>
            <tbody>
              {pagedRows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-sm text-[hsl(var(--muted-foreground))]">
                    No employees found for this filter.
                  </td>
                </tr>
              ) : (
                pagedRows.map(({ employee, availability }) => (
                  <tr key={employee.id} className="border-t text-[hsl(var(--foreground))]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[hsl(var(--muted))] text-xs font-bold text-[hsl(var(--foreground))]">
                          {getInitials(employee.full_name)}
                        </div>
                        <div>
                          <p className="font-semibold text-[hsl(var(--card-foreground))]">{employee.full_name}</p>
                          <p className="text-xs text-[hsl(var(--muted-foreground))]">{employee.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{formatDisplayDate(employee.created_at)}</td>
                    <td className="px-4 py-3">{employee.department}</td>
                     <td className="px-4 py-3">
                      {enableAttendanceActions ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => void updateAttendanceStatus(employee.id, "present")}
                            disabled={updatingEmployeeId === employee.id}
                            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                              availability === "present"
                                ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                                : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
                            } disabled:cursor-not-allowed disabled:opacity-50`}
                          >
                            Present
                          </button>
                          <button
                            type="button"
                            onClick={() => void updateAttendanceStatus(employee.id, "absent")}
                            disabled={updatingEmployeeId === employee.id}
                            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                              availability === "absent"
                                ? "bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]"
                                : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
                            } disabled:cursor-not-allowed disabled:opacity-50`}
                          >
                            Absent
                          </button>
                        </div>
                      ) : (
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            availability === "present"
                              ? "bg-[hsl(var(--primary)/0.16)] text-[hsl(var(--foreground))]"
                              : availability === "absent"
                                ? "bg-[hsl(var(--secondary)/0.16)] text-[hsl(var(--foreground))]"
                                : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
                          }`}
                        >
                          {availability === "present"
                            ? "Present"
                            : availability === "absent"
                              ? "Absent"
                              : "No info"}
                        </span>
                      )}
                     </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 text-sm text-[hsl(var(--muted-foreground))]">
        <p>
          Page {currentPage} of {pages}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="rounded-lg border px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === pages}
            className="rounded-lg border px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
