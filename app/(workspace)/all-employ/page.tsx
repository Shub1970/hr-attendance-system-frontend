import { AllEmployTable } from "@/components/employees/all-employ-table";
import { getEmployees, type Employee } from "@/lib/hr-api";

export default async function AllEmployPage() {
  let errorMessage: string | null = null;
  let employees: Employee[] = [];

  try {
    employees = await getEmployees();
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Unknown error";
  }

  if (errorMessage) {
    return (
      <section className="rounded-3xl border bg-[hsl(var(--card))] p-6">
        <h1 className="text-xl font-bold text-[hsl(var(--destructive))]">Unable to load employee list</h1>
        <p className="mt-2 text-sm text-[hsl(var(--destructive))]">{errorMessage}</p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border bg-[hsl(var(--card))] p-4 shadow-sm md:p-6">
      <AllEmployTable employees={employees} />
    </section>
  );
}
