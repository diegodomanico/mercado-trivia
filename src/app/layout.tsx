import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Vendedor Super Pro | DomUp",
    template: "%s | Vendedor Super Pro",
  },
  description:
    "Entrenamiento práctico para vendedores de Mercado Libre en Latinoamérica.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <a className="skip-link" href="#contenido">Ir al contenido</a>
        {children}
      </body>
    </html>
  );
}
