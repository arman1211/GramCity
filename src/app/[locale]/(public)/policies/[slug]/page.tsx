import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

const POLICY_SLUGS = ["terms", "privacy", "community"] as const;
type PolicySlug = (typeof POLICY_SLUGS)[number];

function isPolicySlug(slug: string): slug is PolicySlug {
  return (POLICY_SLUGS as readonly string[]).includes(slug);
}

export function generateStaticParams() {
  return POLICY_SLUGS.map((slug) => ({ slug }));
}

export default async function PolicyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isPolicySlug(slug)) {
    notFound();
  }

  const t = await getTranslations("policies");
  const title = t(slug);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
        {t("draftNotice")}
      </p>
      <h1 className="mt-6 text-2xl font-bold text-slate-900">{title}</h1>
      <article className="prose prose-slate mt-6 max-w-none text-sm leading-relaxed text-slate-600">
        <p>
          This placeholder page reserves space for the full {slug.replace("_", " ")}{" "}
          document. Content here is not legally binding and exists only for product
          demonstration.
        </p>
        <p>
          Before launch, GramCity Express will publish reviewed legal text in both
          Bangla and English, aligned with applicable regulations in Bangladesh.
        </p>
      </article>
    </div>
  );
}
