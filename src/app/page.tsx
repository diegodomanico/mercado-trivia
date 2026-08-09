import Link from "next/link";
import { countries } from "@/lib/countries";
import { launchCampaigns } from "@/lib/campaigns";

const competencies = [
  "Oferta y catálogo",
  "Tráfico y conversión",
  "Operación y logística",
  "Servicio y reputación",
  "Rentabilidad y data",
];

export default function HomePage() {
  return (
    <main id="contenido">
      <header className="site-header">
        <Link className="brand" href="/" aria-label="Vendedor Super Pro, inicio">
          <span className="brand-mark">D</span>
          <span>DOMUP · SUPER PRO</span>
        </Link>
        <span className="partner-note">Entrenamiento para el ecosistema Mercado Libre</span>
      </header>

      <section className="hero">
        <div className="hero-copy reveal">
          <p className="eyebrow">La trivia que mide decisiones reales</p>
          <h1>¿Qué tan preparado está tu negocio para vender más?</h1>
          <p className="hero-lead">
            Poné a prueba tu operación, detectá oportunidades y llevate un plan de
            mejora aplicable a tu cuenta.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/practica?country=CL">
              Entrar en modo práctica
            </Link>
            <a className="button button-ghost" href="#eventos">Ver eventos MELIXP</a>
          </div>
        </div>

        <div className="score-card reveal reveal-delay" aria-label="Competencias evaluadas">
          <p className="score-kicker">Tu tablero de crecimiento</p>
          <div className="score-number">5</div>
          <p className="score-label">competencias críticas</p>
          <ol className="competency-list">
            {competencies.map((competency, index) => (
              <li key={competency}>
                <span>{String(index + 1).padStart(2, "0")}</span>{competency}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mode-section" aria-labelledby="elige-modo">
        <div>
          <p className="eyebrow">Dos experiencias, una misma meta</p>
          <h2 id="elige-modo">Elegí cómo jugar</h2>
        </div>
        <div className="mode-grid">
          <article className="mode-card">
            <span className="mode-index">01</span>
            <h3>Práctica abierta</h3>
            <p>Sin registro, sin límites y con devolución educativa por competencia.</p>
            <div className="country-links" aria-label="País para practicar">
              {Object.values(countries).map((country) => (
                <Link key={country.code} href={`/practica?country=${country.code}`}>
                  {country.name}
                </Link>
              ))}
            </div>
          </article>

          <article className="mode-card mode-card-accent" id="eventos">
            <span className="mode-index">02</span>
            <h3>Desafío MELIXP</h3>
            <p>Participación verificada, ranking independiente y chances para premios.</p>
            <div className="event-links">
              {launchCampaigns.map((campaign) => (
                <Link key={campaign.slug} href={`/campanas/${campaign.slug}`}>
                  <span>{campaign.name}</span>
                  <strong>
                    {new Intl.DateTimeFormat("es", { day: "2-digit", month: "short" })
                      .format(new Date(campaign.eventDate))}
                  </strong>
                </Link>
              ))}
            </div>
          </article>
        </div>
      </section>

      <footer className="site-footer">
        <p>DomUp Consulting · Partner certificado de Mercado Libre</p>
        <p>Versión de preparación para MELIXP 2026</p>
      </footer>
    </main>
  );
}
