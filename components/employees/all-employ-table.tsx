"use client";

import { Fragment, useMemo, useState } from "react";
import type { Employee } from "@/lib/hr-api";
import { formatDisplayDate } from "@/lib/hr-utils";

type AllEmployTableProps = {
  employees: Employee[];
};

type EmployeeFormState = {
  employee_id: string;
  full_name: string;
  email: string;
  department: string;
};

const emptyEmployeeForm: EmployeeFormState = {
  employee_id: "",
  full_name: "",
  email: "",
  department: "",
};

function getInitialForm(employee: Employee): EmployeeFormState {
  return {
    employee_id: employee.employee_id,
    full_name: employee.full_name,
    email: employee.email,
    department: employee.department,
  };
}

function normalizeApiError(value: unknown, fallbackMessage: string): string {
  if (!value || typeof value !== "object") return fallbackMessage;
  const maybeDetail = (value as { detail?: unknown }).detail;
  if (typeof maybeDetail === "string") return maybeDetail;
  if (Array.isArray(maybeDetail)) {
    const detailText = maybeDetail
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && "msg" in item) {
          const msg = (item as { msg?: unknown }).msg;
          return typeof msg === "string" ? msg : "";
        }
        return "";
    })
      .filter(Boolean)
      .join(", ");
    if (detailText) return detailText;
  }
  return fallbackMessage;
}

export function AllEmployTable({ employees }: AllEmployTableProps) {
  const [rows, setRows] = useState(employees);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EmployeeFormState | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState<EmployeeFormState>(emptyEmployeeForm);
  const [isCreating, setIsCreating] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "error" | "success"; message: string } | null>(null);

  const filteredRows = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) return rows;

    return rows.filter((employee) =>
      [
        employee.employee_id,
        employee.full_name,
        employee.email,
        employee.department,
        employee.employment_type,
        employee.employ_type,
        employee.role,
        employee.phone,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [rows, searchQuery]);

  const rowCountLabel = useMemo(() => {
    if (!searchQuery.trim()) return `${rows.length} employee${rows.length === 1 ? "" : "s"}`;
    return `${filteredRows.length} of ${rows.length} employees`;
  }, [filteredRows.length, rows.length, searchQuery]);

  async function saveEdit(id: string) {
    if (!form) return;
    setSavingId(id);
    setFeedback(null);

    try {
      const response = await fetch(`/api/employees/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const payload = (await response.json().catch(() => ({}))) as Partial<Employee> & { detail?: unknown };

      if (!response.ok) {
        throw new Error(normalizeApiError(payload, "Failed to update employee."));
      }

      setRows((current) =>
        current.map((employee) =>
          employee.id === id
            ? {
                ...employee,
                employee_id: payload.employee_id ?? form.employee_id,
                full_name: payload.full_name ?? form.full_name,
                email: payload.email ?? form.email,
                department: payload.department ?? form.department,
              }
            : employee,
        ),
      );

      setEditingId(null);
      setForm(null);
      setFeedback({ kind: "success", message: "Employee updated successfully." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update employee.";
      setFeedback({ kind: "error", message });
    } finally {
      setSavingId(null);
    }
  }

  async function createEmployee() {
    if (!createForm.employee_id || !createForm.full_name || !createForm.email || !createForm.department) {
      setFeedback({ kind: "error", message: "Please fill employee ID, name, email, and department." });
      return;
    }

    setIsCreating(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });

      const payload = (await response.json().catch(() => ({}))) as Partial<Employee> & { detail?: unknown };
      if (!response.ok) {
        throw new Error(normalizeApiError(payload, "Failed to add employee."));
      }

      const createdEmployee: Employee = {
        id: String(payload.id ?? crypto.randomUUID()),
        employee_id: String(payload.employee_id ?? createForm.employee_id),
        full_name: String(payload.full_name ?? createForm.full_name),
        email: String(payload.email ?? createForm.email),
        department: String(payload.department ?? createForm.department),
        created_at: String(payload.created_at ?? new Date().toISOString()),
      };

      setRows((current) => [createdEmployee, ...current]);
      setCreateForm(emptyEmployeeForm);
      setShowCreateForm(false);
      setFeedback({ kind: "success", message: "Employee added successfully." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to add employee.";
      setFeedback({ kind: "error", message });
    } finally {
      setIsCreating(false);
    }
  }

  async function deleteEmployee(id: string) {
    setDeletingId(id);
    setFeedback(null);

    try {
      const response = await fetch(`/api/employees/${id}`, { method: "DELETE" });
      const payload = (await response.json().catch(() => ({}))) as { detail?: unknown };

      if (!response.ok) {
        throw new Error(normalizeApiError(payload, "Failed to delete employee."));
      }

      setRows((current) => current.filter((employee) => employee.id !== id));
      setViewingId((current) => (current === id ? null : current));
      setEditingId((current) => (current === id ? null : current));
      if (editingId === id) {
        setForm(null);
      }
      setFeedback({ kind: "success", message: "Employee deleted successfully." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete employee.";
      setFeedback({ kind: "error", message });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2 md:mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--card-foreground))]">All Employ</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Update employee profile details from one list</p>
        </div>
        <div className="flex items-center gap-2">
          <p className="rounded-lg border px-3 py-1.5 text-xs font-semibold text-[hsl(var(--muted-foreground))]">{rowCountLabel}</p>
          <button
            type="button"
            onClick={() => {
              setShowCreateForm((current) => !current);
              setFeedback(null);
            }}
            className="rounded-lg bg-[hsl(var(--primary))] px-3 py-1.5 text-xs font-semibold text-[hsl(var(--primary-foreground))]"
          >
            {showCreateForm ? "Close" : "Add Employ"}
          </button>
        </div>
      </div>

      {showCreateForm ? (
        <div className="mb-4 rounded-2xl border p-4">
          <p className="mb-3 text-sm font-semibold text-[hsl(var(--card-foreground))]">Add New Employee</p>
          <div className="grid gap-3 md:grid-cols-2">
            <input
              value={createForm.employee_id}
              onChange={(event) => setCreateForm((current) => ({ ...current, employee_id: event.target.value }))}
              placeholder="Employee ID"
              className="rounded-lg border bg-[hsl(var(--background))] px-3 py-2 text-sm outline-none ring-[hsl(var(--ring)/0.35)] transition focus:ring-4"
            />
            <input
              value={createForm.full_name}
              onChange={(event) => setCreateForm((current) => ({ ...current, full_name: event.target.value }))}
              placeholder="Full name"
              className="rounded-lg border bg-[hsl(var(--background))] px-3 py-2 text-sm outline-none ring-[hsl(var(--ring)/0.35)] transition focus:ring-4"
            />
            <input
              value={createForm.email}
              onChange={(event) => setCreateForm((current) => ({ ...current, email: event.target.value }))}
              placeholder="Email"
              className="rounded-lg border bg-[hsl(var(--background))] px-3 py-2 text-sm outline-none ring-[hsl(var(--ring)/0.35)] transition focus:ring-4"
            />
            <input
              value={createForm.department}
              onChange={(event) => setCreateForm((current) => ({ ...current, department: event.target.value }))}
              placeholder="Department"
              className="rounded-lg border bg-[hsl(var(--background))] px-3 py-2 text-sm outline-none ring-[hsl(var(--ring)/0.35)] transition focus:ring-4"
            />
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => void createEmployee()}
              disabled={isCreating}
              className="rounded-lg bg-[hsl(var(--primary))] px-3 py-1.5 text-xs font-semibold text-[hsl(var(--primary-foreground))] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isCreating ? "Adding..." : "Create"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCreateForm(false);
                setCreateForm(emptyEmployeeForm);
                setFeedback(null);
              }}
              disabled={isCreating}
              className="rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      <div className="mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search by ID, name, email, department..."
          className="w-full rounded-lg border bg-[hsl(var(--background))] px-3 py-2 text-sm outline-none ring-[hsl(var(--ring)/0.35)] transition focus:ring-4 md:max-w-md"
        />
      </div>

      {feedback ? (
        <p
          className={`mb-4 rounded-xl border px-4 py-2 text-sm ${
            feedback.kind === "error"
              ? "border-[hsl(var(--destructive)/0.4)] text-[hsl(var(--destructive))]"
              : "border-[hsl(var(--primary)/0.4)] text-[hsl(var(--primary))]"
          }`}
        >
          {feedback.message}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-2xl border">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
              <tr>
                <th className="px-4 py-3 font-semibold">Emp ID</th>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Department</th>
                <th className="px-4 py-3 font-semibold">Joined</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-[hsl(var(--muted-foreground))]">
                    No employees found.
                  </td>
                </tr>
              ) : (
                filteredRows.map((employee) => {
                  const isEditing = editingId === employee.id;
                  const isSaving = savingId === employee.id;
                  const isDeleting = deletingId === employee.id;
                  const isViewing = viewingId === employee.id;

                  return (
                    <Fragment key={employee.id}>
                      <tr className="border-t text-[hsl(var(--foreground))]">
                        <td className="px-4 py-3 font-medium">
                          {isEditing ? (
                            <input
                              value={form?.employee_id ?? ""}
                              onChange={(event) =>
                                setForm((current) =>
                                  current ? { ...current, employee_id: event.target.value } : current,
                                )
                              }
                              className="w-40 rounded-lg border bg-[hsl(var(--background))] px-2 py-1.5 text-sm outline-none ring-[hsl(var(--ring)/0.35)] transition focus:ring-4"
                            />
                          ) : (
                            employee.employee_id
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <input
                              value={form?.full_name ?? ""}
                              onChange={(event) =>
                                setForm((current) =>
                                  current ? { ...current, full_name: event.target.value } : current,
                                )
                              }
                              className="w-52 rounded-lg border bg-[hsl(var(--background))] px-2 py-1.5 text-sm outline-none ring-[hsl(var(--ring)/0.35)] transition focus:ring-4"
                            />
                          ) : (
                            employee.full_name
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <input
                              value={form?.email ?? ""}
                              onChange={(event) =>
                                setForm((current) =>
                                  current ? { ...current, email: event.target.value } : current,
                                )
                              }
                              className="w-64 rounded-lg border bg-[hsl(var(--background))] px-2 py-1.5 text-sm outline-none ring-[hsl(var(--ring)/0.35)] transition focus:ring-4"
                            />
                          ) : (
                            employee.email
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <input
                              value={form?.department ?? ""}
                              onChange={(event) =>
                                setForm((current) =>
                                  current ? { ...current, department: event.target.value } : current,
                                )
                              }
                              className="w-44 rounded-lg border bg-[hsl(var(--background))] px-2 py-1.5 text-sm outline-none ring-[hsl(var(--ring)/0.35)] transition focus:ring-4"
                            />
                          ) : (
                            employee.department
                          )}
                        </td>
                        <td className="px-4 py-3">{formatDisplayDate(employee.created_at)}</td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => void saveEdit(employee.id)}
                                disabled={isSaving}
                                className="rounded-lg bg-[hsl(var(--primary))] px-3 py-1.5 text-xs font-semibold text-[hsl(var(--primary-foreground))] disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {isSaving ? "Saving..." : "Save"}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingId(null);
                                  setForm(null);
                                  setFeedback(null);
                                }}
                                disabled={isSaving}
                                className="rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setViewingId((current) => (current === employee.id ? null : employee.id))}
                                className="rounded-lg border px-3 py-1.5 text-xs font-semibold"
                              >
                                {isViewing ? "Hide" : "View"}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingId(employee.id);
                                  setForm(getInitialForm(employee));
                                  setFeedback(null);
                                }}
                                className="rounded-lg border px-3 py-1.5 text-xs font-semibold"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const approved = window.confirm(
                                    `Delete employee ${employee.full_name}? This cannot be undone.`,
                                  );
                                  if (approved) {
                                    void deleteEmployee(employee.id);
                                  }
                                }}
                                disabled={isDeleting}
                                className="rounded-lg border border-[hsl(var(--destructive)/0.4)] px-3 py-1.5 text-xs font-semibold text-[hsl(var(--destructive))] disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {isDeleting ? "Deleting..." : "Delete"}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>

                      {isViewing ? (
                        <tr className="border-t bg-[hsl(var(--muted)/0.3)] text-[hsl(var(--foreground))]">
                          <td colSpan={6} className="px-4 py-4">
                            <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                              <p>
                                <span className="font-semibold">Employee ID:</span> {employee.employee_id}
                              </p>
                              <p>
                                <span className="font-semibold">Full Name:</span> {employee.full_name}
                              </p>
                              <p>
                                <span className="font-semibold">Email:</span> {employee.email}
                              </p>
                              <p>
                                <span className="font-semibold">Department:</span> {employee.department}
                              </p>
                              <p>
                                <span className="font-semibold">Employ Type:</span>{" "}
                                {employee.employment_type ?? employee.employ_type ?? "Not set"}
                              </p>
                              <p>
                                <span className="font-semibold">Role:</span> {employee.role ?? "Not set"}
                              </p>
                              <p>
                                <span className="font-semibold">Phone:</span> {employee.phone ?? "Not set"}
                              </p>
                              <p>
                                <span className="font-semibold">Joined:</span> {formatDisplayDate(employee.created_at)}
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
