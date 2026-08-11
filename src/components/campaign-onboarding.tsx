"use client";

import { useEffect, useState } from "react";
import type { CampaignSummary } from "@/lib/campaigns";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { GamePlayer } from "@/components/game-player";

type Props = {
  campaign: CampaignSummary;
  meliVerified: boolean;
  initialError?: string;
};

function oauthErrorMessage(code?: string) {
  switch (code) {
    case "oauth_invalid_client":
      return "La credencial de la aplicación de Mercado Libre no es válida.";
    case "oauth_invalid_grant":
      return "Mercado Libre rechazó la autorización. Reintentá con la cuenta administradora principal.";
    case "oauth_invalid_operator_user_id":
      return "La cuenta es colaboradora. Ingresá con el usuario administrador principal del seller.";
    case "oauth_denied":
      return "La autorización fue cancelada o rechazada en Mercado Libre.";
    case "oauth_state":
      return "La autorización venció o se inició en otra pestaña. Volvé a intentarlo desde aquí.";
    case "wrong_country":
      return "La cuenta conectada no pertenece al país de esta campaña.";
    case "oauth_seller_401":
    case "oauth_seller_403":
      return "Mercado Libre autorizó la app, pero no permitió consultar el seller.";
    case "oauth_items_401":
    case "oauth_items_403":
      return "Mercado Libre autorizó la app, pero no permitió consultar las publicaciones del seller.";
    case "no_active_publication":
      return "La cuenta no tiene publicaciones activas para validar.";
    case "invalid_active_publication":
      return "No se pudo confirmar una publicación activa de esta cuenta.";
    default:
      return "No pudimos completar la validación de Mercado Libre.";
  }
}

export function CampaignOnboarding({ campaign, meliVerified, initialError }: Props) {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [phoneSent, setPhoneSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [sellerVerified, setSellerVerified] = useState(meliVerified);
  const [publicationVerified, setPublicationVerified] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [legalReady, setLegalReady] = useState(false);
  const [campaignStatus, setCampaignStatus] = useState("draft");
  const [message, setMessage] = useState(initialError ? oauthErrorMessage(initialError) : "");
  const [busy, setBusy] = useState(false);
  const phoneAuthEnabled = process.env.NEXT_PUBLIC_ENABLE_PHONE_AUTH === "true";

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/campaigns/${campaign.slug}/status`, { cache: "no-store" })
      .then(async (response) => {
        const status = await response.json();
        if (!response.ok) throw new Error(status.error || "No pudimos recuperar el estado de tu registro.");
        return status;
      })
      .then((status) => {
        if (cancelled) return;
        setPhoneVerified(Boolean(status.phoneVerified));
        setSellerVerified(Boolean(status.sellerVerified));
        setPublicationVerified(Boolean(status.publicationVerified));
        setConsentAccepted(Boolean(status.consentAccepted));
        setLegalReady(Boolean(status.legalReady));
        setCampaignStatus(status.campaignStatus || "draft");
      })
      .catch((error) => {
        if (!cancelled) {
          setMessage(error instanceof Error ? error.message : "No pudimos recuperar el estado de tu registro.");
        }
      });
    return () => { cancelled = true; };
  }, [campaign.slug]);

  async function sendOtp() {
    setBusy(true);
    setMessage("");
    try {
      if (!phoneAuthEnabled) throw new Error("La verificación de WhatsApp aún no está habilitada.");
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOtp({
        phone,
        options: { channel: "whatsapp" },
      });
      if (error) throw error;
      setPhoneSent(true);
      setMessage("Te enviamos un código por WhatsApp.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo enviar el código.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp() {
    setBusy(true);
    setMessage("");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.verifyOtp({ phone, token: otp, type: "sms" });
      if (error) throw error;

      const claimResponse = await fetch("/api/mercadolibre/claim", { method: "POST" });
      const claimResult = await claimResponse.json();
      if (!claimResponse.ok) {
        throw new Error(claimResult.error || "No se pudo vincular la validación comercial.");
      }
      setPhoneVerified(true);
      setMessage("WhatsApp verificado. Tu identidad comercial quedó vinculada.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "El código no es válido.");
    } finally {
      setBusy(false);
    }
  }

  async function acceptCampaignTerms(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/campaigns/${campaign.slug}/consent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acceptTerms, acceptPrivacy }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "No se pudo registrar la aceptación.");
      setConsentAccepted(true);
      setMessage("Registro completo.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo registrar la aceptación.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="onboarding-card" aria-labelledby="registro-title">
      <div className="step-track" aria-label="Progreso de validación">
        <span className={sellerVerified && publicationVerified ? "done" : "active"}>1</span>
        <span className={phoneVerified ? "done" : publicationVerified ? "active" : ""}>2</span>
        <span className={consentAccepted ? "done" : phoneVerified ? "active" : ""}>3</span>
      </div>
      <h2 id="registro-title">Prepará tu participación</h2>

      {publicationVerified && !phoneVerified && (
        <div className="onboarding-step">
          <label htmlFor="phone">WhatsApp con código de país</label>
          <input id="phone" inputMode="tel" autoComplete="tel" placeholder="+56 9... / +54 9..." value={phone} onChange={(event) => setPhone(event.target.value)} />
          {!phoneSent ? (
            <button className="button button-primary" onClick={sendOtp} disabled={busy || !phone}>Validar WhatsApp</button>
          ) : (
            <>
              <label htmlFor="otp">Código recibido</label>
              <input id="otp" inputMode="numeric" autoComplete="one-time-code" value={otp} onChange={(event) => setOtp(event.target.value)} />
              <button className="button button-primary" onClick={verifyOtp} disabled={busy || otp.length < 6}>Confirmar código</button>
            </>
          )}
        </div>
      )}

      {(!sellerVerified || !publicationVerified) && (
        <div className="onboarding-step">
          <p>Conectá tu cuenta y comprobaremos automáticamente que tenga una publicación activa.</p>
          <a className="button button-meli" href={`/api/mercadolibre/authorize?country=${campaign.country}&campaign=${campaign.slug}`}>
            {sellerVerified ? "Volver a comprobar Mercado Libre" : "Conectar Mercado Libre"}
          </a>
        </div>
      )}

      {phoneVerified && publicationVerified && !consentAccepted && (
        <form className="onboarding-step consent-step" onSubmit={acceptCampaignTerms}>
          <strong>Último paso: bases y privacidad</strong>
          {!legalReady && <p>Los documentos legales todavía están pendientes de publicación.</p>}
          <label className="check-row"><input type="checkbox" checked={acceptTerms} onChange={(event) => setAcceptTerms(event.target.checked)} />Acepto las bases de la campaña.</label>
          <label className="check-row"><input type="checkbox" checked={acceptPrivacy} onChange={(event) => setAcceptPrivacy(event.target.checked)} />Acepto el tratamiento de datos para administrar mi participación.</label>
          <button className="button button-primary" type="submit" disabled={busy || !legalReady || !acceptTerms || !acceptPrivacy}>Completar registro</button>
        </form>
      )}

      {consentAccepted && campaignStatus !== "active" && (
        <div className="onboarding-step success-panel">
          <strong>Registro e identidad comercial validados</strong>
          <p>Tu acceso quedará habilitado cuando abra la campaña.</p>
        </div>
      )}

      {consentAccepted && campaignStatus === "active" && (
        <GamePlayer mode="campaign" country={campaign.country} campaign={campaign.slug} />
      )}

      {message && <p className="form-message" role="status">{message}</p>}
      <p className="privacy-note">Al continuar aceptás que validemos estos datos únicamente para administrar esta campaña.</p>
    </section>
  );
}
