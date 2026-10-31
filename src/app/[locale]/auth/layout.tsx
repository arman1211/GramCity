import { DemoBanner } from "@/components/layout/demo-banner";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Link } from "@/i18n/navigation";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <DemoBanner />
      <header className="mx-auto flex w-full max-w-md items-center justify-between px-4 py-4">
        <Link
          href="/"
          className="text-sm font-semibold text-emerald-800 hover:underline"
        >
          ← GramCity Express
        </Link>
        <LanguageSwitcher />
      </header>
      <main className="flex flex-1 flex-col items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-sm">
          {children}
        </div>
      </main>
    </div>
  );
}
