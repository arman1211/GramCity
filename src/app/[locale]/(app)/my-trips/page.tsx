import { redirect } from "@/i18n/navigation";

export default async function MyTripsRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect({ href: "/trips", locale });
}
