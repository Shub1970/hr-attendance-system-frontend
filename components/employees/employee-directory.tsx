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
};

type EmployeeRow = {
  employee: Employee;
  availability: EmployeeAvailability;
};

const filterTabs: Array<{ id: EmployeeAvailability; label: string }> = [
  { id: "active", label: "Active" },
  { id: "leave", label: "Leave" },
  { id: "no_info", label: "No info" },
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
}: EmployeeDirectoryProps) {
  const [query, setQuery] = useState("");
  const [date, setDate] = useState(todayIsoDate());
  const [selectedTab, setSelectedTab] = useState<EmployeeAvailability>("active");
  const [page, setPage] = useState(1);

  const statusMap = useMemo(() => buildStatusMap(attendance, date), [attendance, date]);

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
    return searchedRows.filter((row) => row.availability === selectedTab);
  }, [searchedRows, selectedTab, showFilters]);

  const pages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(page, pages);
  const pagedRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const availabilityCounts = countAvailability(employees, statusMap);

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
            const badgeCount = availabilityCounts[tab.id];
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
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          availability === "active"
                            ? "bg-[hsl(var(--primary)/0.16)] text-[hsl(var(--foreground))]"
                            : availability === "leave"
                              ? "bg-[hsl(var(--secondary)/0.16)] text-[hsl(var(--foreground))]"
                              : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
                        }`}
                      >
                        {availability === "active"
                          ? "Active"
                          : availability === "leave"
                            ? "Leave"
                            : "No info"}
                      </span>
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
