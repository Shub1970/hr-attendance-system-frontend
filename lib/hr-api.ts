export type Employee = {
  id: string;
  employee_id: string;
  full_name: string;
  email: string;
  department: string;
  created_at: string;
  employment_type?: string;
  employ_type?: string;
  role?: string;
  phone?: string;
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
  const url = `${API_BASE}${path}`;
  const startedAt = Date.now();

  console.log(`[HR API] -> GET ${url}`);

  try {
    const response = await fetch(url, { cache: "no-store" });
    const durationMs = Date.now() - startedAt;

    if (!response.ok) {
      console.error(`[HR API] !! ${response.status} ${url} (${durationMs}ms)`);
      throw new Error(`Request to ${path} failed with status ${response.status}`);
    }

    console.log(`[HR API] <- ${response.status} ${url} (${durationMs}ms)`);
    return response.json() as Promise<T>;
  } catch (error) {
    const durationMs = Date.now() - startedAt;

    if (error instanceof Error) {
      console.error(`[HR API] xx ${url} (${durationMs}ms) ${error.message}`);
    } else {
      console.error(`[HR API] xx ${url} (${durationMs}ms) Unknown error`);
    }

    throw error;
  }
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
