import Link from "next/link";
import { countries, isCountryCode } from "@/lib/countries";
import { GamePlayer } from "@/components/game-player";

export default async function PracticePage({
  searchParams,
}: {
  searchParams: Promise<{ country?: string }>;
}) {
  const params = await searchParams;
  const code = params.country && isCountryCode(params.country) ? params.country : "CL";
  const country = countries[code];

  return (
    <main id="contenido" className="practice-shell">
      <header className="site-header compact">
        <Link className="brand" href="/"><span className="brand-mark">D</span>DOMUP · SUPER PRO</Link>
        <span className="pill">Práctica · {country.name}</span>
      </header>

      <section className="practice-intro">
        <p className="eyebrow">Diagnóstico sin registro</p>
        <h1>Entrená como vendés: tomando decisiones.</h1>
        <p>
          Serán 25 situaciones distribuidas en cinco niveles. Al terminar vas a recibir
          un mapa de fortalezas y oportunidades para tu operación en {country.name}.
        </p>
        <div className="notice">
          <strong>Contenido con control editorial.</strong>
          <span>La partida sólo usa preguntas vigentes y aprobadas para este país.</span>
        </div>
        <GamePlayer mode="practice" country={code} />
      </section>
    </main>
  );
}
