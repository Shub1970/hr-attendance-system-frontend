export type Employee = {
  id: string;
  employee_id: string;
  full_name: string;
  email: string;
  department: string;
  created_at: string;
};

export type Attendance = {
  id: string;
  employee_id: string;
  attendance_date: string;
  status: "present" | "absent";
  created_at: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:8000";

async function fetchFromApi<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Request to ${path} failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function getEmployees(): Promise<Employee[]> {
  return fetchFromApi<Employee[]>("/employees");
}

export async function getAttendance(params?: {
  employee_id?: string;
  attendance_date?: string;
  status?: "present" | "absent";
}): Promise<Attendance[]> {
  const query = new URLSearchParams();

  if (params?.employee_id) query.set("employee_id", params.employee_id);
  if (params?.attendance_date) query.set("attendance_date", params.attendance_date);
  if (params?.status) query.set("status", params.status);

  const queryString = query.toString();

  return fetchFromApi<Attendance[]>(`/attendance${queryString ? `?${queryString}` : ""}`);
}
