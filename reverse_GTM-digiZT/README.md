# digiZT GTM Resonance

Next.js 14 application for modelirano ocenjevanje GTM resonance in response analytics za pet health / insurance kampanje.

## Zagon

```bash
npm install
npm run dev
```

## Preverjanje kakovosti

```bash
npm run lint
npx tsc --noEmit
npm test
npm run build
```

## Okoljske spremenljivke

Kopirajte `.env.example` v `.env.local` in po potrebi nastavite:

- `LLM_API_KEY` – API ključ za LLM ponudnika
- `LLM_BASE_URL` – osnovni URL kompatibilnega OpenAI endpointa
- `LLM_MODEL` – model, privzeto `gpt-4o`
- `LLM_ENABLED` – `true` za vključitev LLM obogatitve, sicer `false`

Če je LLM izklopljen, aplikacija deluje v rules-only načinu.

## Podatkovni viri

- `data/personas.json`
- `config/scoring_weights.yaml`
- `prompts/gtm-resonance-v1.md`
- `docs/PRD-digiZT-GTM-Resonance.md`

Vsi izračuni so deterministični in prediktivni/modelirani.
