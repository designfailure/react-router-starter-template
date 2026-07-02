import { describe, expect, it } from 'vitest';
import { analyzeCampaign } from '@/lib/scoring';
import type { CampaignInput } from '@/lib/schemas/campaign';

const strongVetFamilyCampaign: CampaignInput = {
  campaign_name: 'Veterinarski družinski paket',
  objective: 'conversion',
  channel: 'vet_partnership',
  format: 'landing_page',
  headline: 'Brezplačen veterinarski pregled za družine z ljubljenčki',
  primary_text:
    'V sodelovanju z lokalnim veterinarjem nudimo jasen pregled, preprosto razlago in hitro pot do ponudbe za vašega družinskega člana.',
  cta: 'Preveri zdaj',
  offer: 'Brezplačen pregled in 10% popust',
  tone: 'authoritative',
  price_signal: 'low',
  language: 'sl',
  trust_signals: ['veterinar', 'certifikat', 'mnenja'],
  target_segment_hint: 'PA-02',
  visual_description: 'Srečna družina s psom pred veterinarsko kliniko.',
  landing_url_type: 'quote',
  frequency_cap: 'low',
  push_intensity: 'low',
};

const genericInsuranceCampaign: CampaignInput = {
  campaign_name: 'Splošna zavarovalna kampanja',
  objective: 'awareness',
  channel: 'display',
  format: 'static',
  headline: 'Zavarujte svojega ljubljenčka danes',
  primary_text: 'Ponujamo celovito kritje za vašega psa ali mačko. Več informacij na spletni strani.',
  cta: 'Več',
  offer: 'zavarovanje',
  tone: 'rational',
  price_signal: 'premium',
  language: 'sl',
  trust_signals: [],
  visual_description: 'Splošna ilustracija hišnega ljubljenčka.',
  landing_url_type: 'education',
  frequency_cap: 'medium',
  push_intensity: 'medium',
};

const hostileDigitalAd: CampaignInput = {
  campaign_name: 'Digitalna zmeda za upokojence',
  objective: 'conversion',
  channel: 'meta',
  format: 'video',
  headline: 'NUJNO! Zavarovalna premija, franšiza in kritje v eni minuti',
  primary_text: 'Kliknite zdaj in oddajte obrazec takoj. Brez dodatnih pojasnil.',
  cta: 'Kontaktiraj',
  offer: 'Skrita cena',
  tone: 'urgent',
  price_signal: 'hidden',
  language: 'sl',
  trust_signals: [],
  target_segment_hint: 'PA-03',
  visual_description: 'Temen vizual z veliko besedila in brez veterinarja.',
  landing_url_type: 'checkout',
  frequency_cap: 'high',
  push_intensity: 'high',
};

describe('analyzeCampaign', () => {
  it('scores all six personas and is reproducible', () => {
    const resultA = analyzeCampaign(strongVetFamilyCampaign);
    const resultB = analyzeCampaign(strongVetFamilyCampaign);

    expect(resultA).toEqual(resultB);
    expect(resultA.persona_scores).toHaveLength(6);

    for (const score of resultA.persona_scores) {
      expect(score.content_acceptance).toBeGreaterThanOrEqual(0);
      expect(score.content_acceptance).toBeLessThanOrEqual(100);
      expect(score.appeal_index).toBeGreaterThanOrEqual(0);
      expect(score.appeal_index).toBeLessThanOrEqual(100);
      expect(score.predicted_ctr_pct).toEqual(expect.any(Number));
      expect(score.predicted_cvr_pct).toEqual(expect.any(Number));
    }
  });

  it('gives PA-02 higher appeal for a vet-trust family campaign than for a generic ad', () => {
    const familyResult = analyzeCampaign(strongVetFamilyCampaign);
    const genericResult = analyzeCampaign(genericInsuranceCampaign);
    const familyPa02 = familyResult.persona_scores.find((item) => item.persona_id === 'PA-02');
    const genericPa02 = genericResult.persona_scores.find((item) => item.persona_id === 'PA-02');

    expect(familyPa02?.appeal_index).toBeGreaterThan((genericPa02?.appeal_index ?? 0));
  });

  it('penalizes hostile digital messaging for PA-03', () => {
    const result = analyzeCampaign(hostileDigitalAd);
    const pa03 = result.persona_scores.find((item) => item.persona_id === 'PA-03');

    expect(pa03?.content_acceptance).toBeLessThan(60);
    expect(pa03?.appeal_index).toBeLessThan(50);
    expect(pa03?.predicted_cvr_pct).toBeGreaterThanOrEqual(0);
    expect(result.message_decomposition.detected_barriers).toContain('nujnost brez dokazov');
  });
});
