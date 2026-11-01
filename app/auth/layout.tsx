import { ThemeToggle } from "@/components/shared/ThemeToggle";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div id="auth-shell" className="min-h-screen">
      <div className="fixed right-4 top-4 z-50">
        <ThemeToggle compact />
      </div>
      {children}
    </div>
  );
}
