# Frontend Integration Guide

This file describes how a frontend app can integrate with the HR Attendance backend API.

## Base URL

- Local: `http://127.0.0.1:8000`
- Swagger docs: `http://127.0.0.1:8000/docs`

## Authentication

- Current API routes are open (no auth middleware configured yet).
- If you add auth later, update this file with token requirements.

## Data Models

### Employee

```json
{
  "id": "uuid",
  "employee_id": "EMP-1001",
  "full_name": "Aarav Sharma",
  "email": "aarav.sharma@company.com",
  "department": "Engineering",
  "created_at": "2026-02-14T10:00:00+00:00"
}
```

### Attendance

```json
{
  "id": "uuid",
  "employee_id": "employee-uuid",
  "attendance_date": "2026-02-14",
  "status": "present",
  "created_at": "2026-02-14T10:00:00+00:00"
}
```

`status` allowed values:

- `present`
- `absent`

## API Endpoints

### Health

- `GET /health`

### Employees

- `POST /employees`
- `GET /employees`
- `GET /employees/{id}`
- `PUT /employees/{id}`
- `DELETE /employees/{id}`

Create employee request body:

```json
{
  "employee_id": "EMP-1006",
  "full_name": "Jane Doe",
  "email": "jane@company.com",
  "department": "Design"
}
```

Update employee request body (partial):

```json
{
  "full_name": "Jane A. Doe",
  "department": "Product Design"
}
```

### Attendance

- `POST /attendance`
- `GET /attendance`
- `GET /attendance/{id}`
- `PUT /attendance/{id}`
- `DELETE /attendance/{id}`

Create attendance request body:

```json
{
  "employee_id": "employee-uuid",
  "attendance_date": "2026-02-14",
  "status": "present"
}
```

Update attendance request body (partial):

```json
{
  "status": "absent"
}
```

List attendance supports optional query params:

- `employee_id` (UUID)
- `attendance_date` (YYYY-MM-DD)
- `status` (`present` or `absent`)

Example:

- `GET /attendance?status=present`
- `GET /attendance?employee_id=<uuid>&attendance_date=2026-02-14`

## Expected Error Codes

- `400` invalid update payload (empty body)
- `404` record not found
- `409` unique conflict (duplicate employee email/id or duplicate attendance for date)
- `422` validation or FK/check constraint errors
- `500` unexpected server/database error

## Frontend Notes

- `employees.employee_id` is a human-readable code (e.g., `EMP-1001`).
- `attendance.employee_id` must be the employee table UUID (`employees.id`).
- Use employee list response `id` for attendance create/update calls.

## Quick Fetch Example (JavaScript)

```js
const API_BASE = "http://127.0.0.1:8000";

async function getEmployees() {
  const res = await fetch(`${API_BASE}/employees`);
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  return res.json();
}

async function createAttendance(employeeUuid, date, status) {
  const res = await fetch(`${API_BASE}/attendance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      employee_id: employeeUuid,
      attendance_date: date,
      status,
    }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Request failed");
  }

  return res.json();
}
```
