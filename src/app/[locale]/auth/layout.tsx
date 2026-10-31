import { DemoBanner } from "@/components/layout/demo-banner";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { LogoMark } from "@/components/brand/logo-mark";
import { Link } from "@/i18n/navigation";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <DemoBanner />
      <div className="relative flex flex-1 flex-col">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgb(16_185_129/0.18),transparent)]"
          aria-hidden
        />
        <header className="relative mx-auto flex w-full max-w-md items-center justify-between px-4 py-5">
          <Link href="/" className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <LogoMark size="sm" />
          </Link>
          <LanguageSwitcher />
        </header>
        <main className="relative flex flex-1 flex-col items-center px-4 pb-16 pt-2">
          <div className="w-full max-w-md rounded-2xl border border-emerald-100/80 bg-card p-6 shadow-sm shadow-emerald-900/5 sm:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
