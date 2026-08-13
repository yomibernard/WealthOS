import { analyseOffer, extractOfferFromText, type WealthGuardResult } from "./wealthguard";
import { lookupProvider } from "@/integrations/provider-registry";

/** WealthGuard with live/demo provider registry adapter. */
export async function analyseOfferWithRegistry(text: string): Promise<WealthGuardResult> {
  const extracted = extractOfferFromText(text);
  const lookup = await lookupProvider(extracted.provider);
  const detail =
    lookup.status === "Verified" && lookup.licenceNumber
      ? `Registry match: ${lookup.licenceStatus} (${lookup.licenceNumber}) via ${lookup.regulator}.`
      : undefined;

  return analyseOffer(text, {
    providerVerification: lookup.status,
    providerDetail: detail,
  });
}
