"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, Check, LockKeyhole, ShieldCheck } from "lucide-react";
import { login, homeFor } from "@/lib/auth";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const user = await login(email, password);
      router.push(homeFor(user.role));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-brand-panel">
        <div className="brand">
          <span className="brand-mark"><Building2 size={21} strokeWidth={1.8} /></span>
          <div>
            <div className="brand-name">MUBAS Hostels</div>
            <div className="brand-caption">Residence services</div>
          </div>
        </div>
        <div>
          <div className="login-panel-eyebrow">A better residence experience</div>
          <h1 className="login-panel-heading">Your campus life,<br />made simpler.</h1>
          <p className="login-panel-copy">One secure place to manage your accommodation, stay informed, and connect with your hostel office.</p>
          <div className="login-benefits">
            <div><Check size={16} /> Manage your hostel services</div>
            <div><Check size={16} /> Keep important information together</div>
            <div><Check size={16} /> Reach the right support team</div>
          </div>
        </div>
        <div className="login-brand-footer"><ShieldCheck size={15} /> Secure portal for MUBAS residents</div>
        <div className="login-illustration" aria-hidden="true"><Building2 size={300} strokeWidth={.55} /></div>
      </section>

      <section className="login-form-panel">
        <div className="login-form-wrap">
          <div className="login-mobile-brand">
            <span className="brand-mark"><Building2 size={20} /></span>
            <div>
              <div className="brand-name">MUBAS Hostels</div>
              <div className="brand-caption">Residence services</div>
            </div>
          </div>
          <div className="login-heading">Welcome back</div>
          <p className="login-description">Sign in with the account details issued by your hostel office.</p>
          <form onSubmit={submit} className="login-form">
            <label className="login-field">
              <span className="login-label">University email</span>
              <Input type="email" autoComplete="username" placeholder="you@mubas.ac.mw" value={email}
                     onChange={(event) => setEmail(event.target.value)} required />
            </label>
            <label className="login-field">
              <span className="login-label">Password</span>
              <Input type="password" autoComplete="current-password" placeholder="Enter your password" value={password}
                     onChange={(event) => setPassword(event.target.value)} required />
            </label>
            {error && <p role="alert" className="login-error">{error}</p>}
            <Button type="submit" disabled={submitting}>
              <LockKeyhole size={16} />
              {submitting ? "Signing you in…" : "Sign in securely"}
              {!submitting && <ArrowRight size={16} />}
            </Button>
          </form>
          <div className="login-note">
            <ShieldCheck size={16} />
            <span>Your account is protected. For access help, contact the hostel office.</span>
          </div>
          <div className="login-footer">MUBAS · Malawi University of Business and Applied Sciences</div>
        </div>
      </section>
    </main>
  );
}
