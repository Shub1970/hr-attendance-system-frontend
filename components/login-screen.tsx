import Link from "next/link";

export function LoginScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <section className="w-full max-w-lg rounded-3xl border bg-[hsl(var(--card))] px-8 py-12 text-center shadow-xl shadow-[hsl(var(--primary)/0.2)]">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">HR Portal</p>
        <h1 className="mt-5 text-3xl font-bold text-[hsl(var(--card-foreground))]">Human Resource Dashboard</h1>
        <p className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">Manage people status, leave, and attendance in one place.</p>

        <Link
          href="/dashboard"
          className="mt-10 inline-flex w-full items-center justify-center rounded-2xl bg-[hsl(var(--primary))] px-6 py-4 text-base font-semibold text-[hsl(var(--primary-foreground))] transition hover:brightness-95"
        >
          Login as admin
        </Link>
      </section>
    </main>
  );
}
