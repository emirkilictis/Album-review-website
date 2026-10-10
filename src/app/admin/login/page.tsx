import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/login-form";
import { Logo } from "@/components/site-chrome";

export const metadata: Metadata = { title: "Admin login", robots: { index: false } };

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-sm py-12">
      <div className="space-y-6 border border-ink p-8">
        <div className="space-y-1 text-center">
          <Logo className="mx-auto w-40" />
          <p className="text-sm text-muted">Admin panel</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
