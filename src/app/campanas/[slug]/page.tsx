import { notFound } from "next/navigation";
import Link from "next/link";
import { getCampaign } from "@/lib/campaigns";
import { countries } from "@/lib/countries";
import { CampaignOnboarding } from "@/components/campaign-onboarding";

export default async function CampaignPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ meli?: string; error?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const campaign = getCampaign(slug);
  if (!campaign) notFound();

  const country = countries[campaign.country];

  return (
    <main id="contenido" className="campaign-shell">
      <header className="site-header compact">
        <Link className="brand" href="/"><span className="brand-mark">D</span>DOMUP · SUPER PRO</Link>
        <span className="pill">{campaign.name}</span>
      </header>

      <section className="campaign-layout">
        <div className="campaign-copy">
          <p className="eyebrow">Desafío oficial del evento</p>
          <h1>Validá tu cuenta. Demostrá lo que sabés.</h1>
          <p>
            Tu participación será única para {country.name}. Validaremos tu WhatsApp,
            tu seller de Mercado Libre y una publicación activa que te pertenezca.
          </p>
          <dl className="event-facts">
            <div><dt>Fecha</dt><dd>{new Intl.DateTimeFormat(country.locale, { dateStyle: "long" }).format(new Date(campaign.eventDate))}</dd></div>
            <div><dt>Preguntas</dt><dd>25</dd></div>
            <div><dt>Niveles</dt><dd>5</dd></div>
          </dl>
        </div>

        <CampaignOnboarding
          campaign={campaign}
          meliVerified={query.meli === "verified"}
          initialError={query.error}
        />
      </section>
    </main>
  );
}
