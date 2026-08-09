import type { CountryCode } from "@/lib/countries";

export type CampaignSummary = {
  slug: string;
  country: CountryCode;
  name: string;
  eventDate: string;
  expectedParticipants: number;
};

export const launchCampaigns: CampaignSummary[] = [
  {
    slug: "melixp-chile-2026",
    country: "CL",
    name: "MELIXP Chile 2026",
    eventDate: "2026-08-27T09:00:00-04:00",
    expectedParticipants: 3000,
  },
  {
    slug: "melixp-argentina-2026",
    country: "AR",
    name: "MELIXP Argentina 2026",
    eventDate: "2026-09-10T09:00:00-03:00",
    expectedParticipants: 7000,
  },
];

export function getCampaign(slug: string) {
  return launchCampaigns.find((campaign) => campaign.slug === slug);
}
