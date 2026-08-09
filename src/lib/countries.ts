export const countries = {
  AR: {
    code: "AR",
    name: "Argentina",
    siteId: "MLA",
    locale: "es-AR",
    authUrl: "https://auth.mercadolibre.com.ar/authorization",
    launchOrder: 2,
  },
  CL: {
    code: "CL",
    name: "Chile",
    siteId: "MLC",
    locale: "es-CL",
    authUrl: "https://auth.mercadolibre.cl/authorization",
    launchOrder: 1,
  },
  CO: {
    code: "CO",
    name: "Colombia",
    siteId: "MCO",
    locale: "es-CO",
    authUrl: "https://auth.mercadolibre.com.co/authorization",
    launchOrder: 3,
  },
  MX: {
    code: "MX",
    name: "México",
    siteId: "MLM",
    locale: "es-MX",
    authUrl: "https://auth.mercadolibre.com.mx/authorization",
    launchOrder: 4,
  },
  UY: {
    code: "UY",
    name: "Uruguay",
    siteId: "MLU",
    locale: "es-UY",
    authUrl: "https://auth.mercadolibre.com.uy/authorization",
    launchOrder: 5,
  },
} as const;

export type CountryCode = keyof typeof countries;

export const launchCountries = [countries.CL, countries.AR] as const;

export function isCountryCode(value: string): value is CountryCode {
  return value in countries;
}
