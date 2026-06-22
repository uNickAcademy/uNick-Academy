import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Log in — uNick Academy",
  description: "Log in to your uNick Academy account as a student, teacher, or admin.",
};

async function handleLogin(formData) {
  "use server";

  const email = formData.get("email");
  const password = formData.get("password");
  const role = formData.get("role");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}&role=${role}`);
  }

  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (profile?.is_admin) {
    redirect("/academy/admin");
  }

  switch (role) {
    case "teacher":
      redirect("/academy/library");
    case "admin":
      redirect("/academy/admin");
    default:
      redirect("/academy/dashboard");
  }
}

export default async function UnifiedLoginPage({ searchParams }) {
  const params = await searchParams;
  const error = params?.error;
  const selectedRole = params?.role || "student";

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-warm-white)",
        padding: "24px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "4px 5px",
                borderRadius: 14,
                background: "var(--color-warm-white)",
                border: "1px solid var(--color-border)",
              }}
            >
              <Image src="/brand/shield.png" alt="" width={26} height={33} />
            </span>
            <span
              style={{
                fontFamily: "var(--font-display), serif",
                fontWeight: 700,
                fontSize: 22,
                color: "var(--color-blue)",
              }}
            >
              <span style={{ color: "var(--color-red)" }}>uNick</span> Academy
            </span>
          </Link>
          <h1
            style={{
              fontFamily: "var(--font-display), serif",
              fontSize: 28,
              color: "var(--color-blue)",
              marginTop: 20,
              marginBottom: 8,
            }}
          >
            Log in to your account
          </h1>
          <p style={{ color: "var(--color-muted)", fontSize: 15 }}>
            Students, teachers and admins — all in one place.
          </p>
        </div>

        {error && (
          <p
            style={{
              background: "var(--color-red-soft)",
              color: "var(--color-red)",
              fontSize: 14,
              borderRadius: 12,
              padding: "12px 16px",
              marginBottom: 16,
            }}
          >
            {error}
          </p>
        )}

        <form
          action={handleLogin}
          style={{
            background: "var(--color-white)",
            border: "1px solid var(--color-border)",
            borderRadius: 24,
            padding: 28,
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          <div>
            <label
              htmlFor="role"
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--color-blue)",
                marginBottom: 6,
              }}
            >
              I am a...
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { value: "student", label: "Student" },
                { value: "teacher", label: "Teacher" },
                { value: "admin", label: "Admin" },
              ].map((r) => (
                <label
                  key={r.value}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: `1.5px solid ${selectedRole === r.value ? "var(--color-red)" : "var(--color-border)"}`,
                    background: selectedRole === r.value ? "var(--color-red-soft)" : "transparent",
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: 600,
                    color: selectedRole === r.value ? "var(--color-red)" : "var(--color-ink-soft)",
                    transition: "all 0.2s",
                  }}
                >
                  <input
                    type="radio"
                    name="role"
                    value={r.value}
                    defaultChecked={selectedRole === r.value}
                    style={{ display: "none" }}
                  />
                  {r.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="email"
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--color-blue)",
                marginBottom: 6,
              }}
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 12,
                border: "1.5px solid var(--color-border)",
                fontSize: 15,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--color-blue)",
                marginBottom: 6,
              }}
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 12,
                border: "1.5px solid var(--color-border)",
                fontSize: 15,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              width: "100%",
              padding: "13px",
              borderRadius: 999,
              border: "none",
              background: "var(--color-red)",
              color: "var(--color-warm-white)",
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
              marginTop: 4,
            }}
          >
            Log in
          </button>
        </form>

        <p
          style={{
            textAlign: "center",
            fontSize: 14,
            color: "var(--color-muted)",
            marginTop: 20,
          }}
        >
          Don&apos;t have an account?{" "}
          <Link
            href="/academy/signup"
            style={{ color: "var(--color-blue)", fontWeight: 600 }}
          >
            Sign up
          </Link>
        </p>

        <p style={{ textAlign: "center", marginTop: 12 }}>
          <Link
            href="/"
            style={{ fontSize: 13, color: "var(--color-muted)" }}
          >
            &larr; Back to homepage
          </Link>
        </p>
      </div>
    </div>
  );
}
