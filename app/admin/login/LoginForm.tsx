"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useSearchParams } from "next/navigation";

export default function LoginForm() {
  const params = useSearchParams();
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="a-card space-y-4 !p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setErr("");
        const fd = new FormData(e.currentTarget);
        const res = await signIn("credentials", { username: fd.get("username"), password: fd.get("password"), redirect: false });
        if (res?.ok) window.location.href = params.get("callbackUrl") || "/admin";
        else { setErr("Wrong username or password"); setBusy(false); }
      }}
    >
      <div>
        <label className="label" htmlFor="u">Username</label>
        <input id="u" name="username" className="a-input" defaultValue="sachin" autoComplete="username" required />
      </div>
      <div>
        <label className="label" htmlFor="p">Password</label>
        <input id="p" name="password" type="password" className="a-input" autoComplete="current-password" required />
      </div>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <button className="a-btn w-full !py-2.5" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
    </form>
  );
}
