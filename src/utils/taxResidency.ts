import { Club } from '../types/game';

export interface TaxBreakdown {
  country: string;
  taxAuthority: string;
  taxAuthorityShort: string;
  marginalRatePercent: number;
  effectiveRatePercent: number;
  grossWeeklyWage: number;
  taxDeductedWeekly: number;
  agentFeeWeekly: number;
  agentFeePercent: number;
  netWeeklyWage: number;
  grossAnnualWage: number;
  taxDeductedAnnual: number;
  netAnnualWage: number;
  taxSchemeName: string;
  isTaxFreeHaven: boolean;
  notes: string;
  legalBasis: string;
}

export interface CountryTaxConfig {
  taxAuthority: string;
  taxAuthorityShort: string;
  effectiveRate: number;
  isTaxFreeHaven: boolean;
  schemeName: string;
  notes: string;
  legalBasis: string;
}

/**
 * Real-world Professional Footballer Tax Residency Rates (Top Athlete Brackets):
 * - England (Premier League): 45% Additional Rate + 2% National Insurance = 47%
 * - Spain (La Liga): 47% (Combined State & Autonómico top athlete bracket)
 * - Germany (Bundesliga): 45% Reichensteuer + 5.5% Solidarity Surcharge = 47.5%
 * - France (Ligue 1): 45% Top tranche + 4% CEHR high revenue contribution = 49%
 * - Italy (Serie A): 43% Top IRPEF rate + 2% regional surcharges = 45%
 * - Saudi Arabia (Saudi Pro League): 0% Personal income tax haven! 100% net wage take-home
 * - United States (MLS): 37% Federal + State + Medicare = ~45%
 * - Portugal (Primeira Liga): 48% Top rate + 5% solidarity = 53%
 * - Netherlands (Eredivisie): 49.5% Box 1 top rate
 * - Brazil (Brasileirão): 27.5% Top rate (60% CLT + 40% Image Rights)
 * - Nigeria (NPFL): 24% Top marginal PAYE band under PITA
 */
export const COUNTRY_TAX_SYSTEMS: Record<string, CountryTaxConfig> = {
  England: {
    taxAuthority: 'HM Revenue & Customs (HMRC)',
    taxAuthorityShort: 'HMRC',
    effectiveRate: 0.47,
    isTaxFreeHaven: false,
    schemeName: 'UK PAYE Additional Rate + Class 1 NIC',
    notes: '45% top marginal income tax bracket on weekly footballer earnings exceeding £125,140/yr plus 2% employee National Insurance.',
    legalBasis: 'Finance Act (UK) - Source taxation for players resident for football employment.',
  },
  Spain: {
    taxAuthority: 'Agencia Estatal de Administración Tributaria (AEAT)',
    taxAuthorityShort: 'Agencia Tributaria',
    effectiveRate: 0.47,
    isTaxFreeHaven: false,
    schemeName: 'IRPF Tramo Autonómico y Estatal',
    notes: 'Top athlete marginal rate in Madrid and Catalunya. Foreign transfers may apply for Beckham Law regimes.',
    legalBasis: 'Ley del Impuesto sobre la Renta de las Personas Físicas (LIRPF).',
  },
  Germany: {
    taxAuthority: 'Bundeszentralamt für Steuern (BZSt / Finanzamt)',
    taxAuthorityShort: 'Finanzamt',
    effectiveRate: 0.475,
    isTaxFreeHaven: false,
    schemeName: 'Einkommensteuer (Reichensteuer) + Solidaritätszuschlag',
    notes: '45% top bracket on high earnings plus 5.5% solidarity surcharges for professional Bundesliga players.',
    legalBasis: 'Einkommensteuergesetz (EStG) § 32a.',
  },
  France: {
    taxAuthority: 'Direction Générale des Finances Publiques (DGFiP)',
    taxAuthorityShort: 'DGFiP',
    effectiveRate: 0.49,
    isTaxFreeHaven: false,
    schemeName: 'Impôt sur le Revenu + CEHR 4% + CSG',
    notes: 'Top tier 45% bracket with 4% Contribution Exceptionnelle sur les Hauts Revenus on pro sporting contracts.',
    legalBasis: 'Code Général des Impôts (CGI) Art. 223 sexies.',
  },
  Italy: {
    taxAuthority: 'Agenzia delle Entrate',
    taxAuthorityShort: 'Entrate',
    effectiveRate: 0.45,
    isTaxFreeHaven: false,
    schemeName: 'Imposta sul Reddito delle Persone Fisiche (IRPEF)',
    notes: '43% standard top IRPEF rate plus ~2% regional/municipal surcharges applied to Serie A player contracts.',
    legalBasis: 'Testo Unico delle Imposte sui Redditi (TUIR).',
  },
  'Saudi Arabia': {
    taxAuthority: 'Zakat, Tax and Customs Authority (ZATCA)',
    taxAuthorityShort: 'ZATCA',
    effectiveRate: 0.00,
    isTaxFreeHaven: true,
    schemeName: '0% Personal Income Tax Haven Exemption',
    notes: '0% personal income tax on foreign professional football salaries. 100% of gross contract wage is retained.',
    legalBasis: 'Royal Decree M/1 - Complete personal income tax exemption on employee salaries.',
  },
  'United States': {
    taxAuthority: 'Internal Revenue Service (IRS) & State Revenue',
    taxAuthorityShort: 'IRS',
    effectiveRate: 0.45,
    isTaxFreeHaven: false,
    schemeName: 'US Federal Marginal Rate (37%) + State Tax + Medicare',
    notes: '37% Federal top bracket plus state income tax (California 13.3%, Florida 0%) and 2.35% Medicare surtax.',
    legalBasis: 'Internal Revenue Code (IRC) Title 26.',
  },
  Portugal: {
    taxAuthority: 'Autoridade Tributária e Aduaneira (AT)',
    taxAuthorityShort: 'Autoridade Tributária',
    effectiveRate: 0.53,
    isTaxFreeHaven: false,
    schemeName: 'Imposto sobre o Rendimento das Pessoas Singulares (IRS) + Solidariedade',
    notes: '48% top tax bracket plus 5% solidarity surcharge on professional Primeira Liga salaries.',
    legalBasis: 'Código do Imposto sobre o Rendimento das Pessoas Singulares (CIRS).',
  },
  Netherlands: {
    taxAuthority: 'Belastingdienst',
    taxAuthorityShort: 'Belastingdienst',
    effectiveRate: 0.495,
    isTaxFreeHaven: false,
    schemeName: 'Box 1 Top Inkomstenbelasting',
    notes: '49.5% top rate with potential 30% ruling exemption for qualifying international transfers.',
    legalBasis: 'Wet inkomstenbelasting 2001 (Box 1).',
  },
  Brazil: {
    taxAuthority: 'Receita Federal do Brasil',
    taxAuthorityShort: 'Receita Federal',
    effectiveRate: 0.275,
    isTaxFreeHaven: false,
    schemeName: 'IRPF + CLT / Contrato de Imagem Split',
    notes: '27.5% maximum income tax rate under standard 60% CLT wage and 40% Image Rights corporate assignment.',
    legalBasis: 'Lei Pelé (Lei nº 9.615/1998) & Regulamento do Imposto de Renda (RIR).',
  },
  Nigeria: {
    taxAuthority: 'Federal Inland Revenue Service (FIRS / LIRS)',
    taxAuthorityShort: 'FIRS / LIRS',
    effectiveRate: 0.24,
    isTaxFreeHaven: false,
    schemeName: 'Personal Income Tax Act (PITA / PAYE)',
    notes: 'Top 24% progressive tax band on professional domestic NPFL league earnings.',
    legalBasis: 'Personal Income Tax Act (PITA) Cap P8 LFN 2004.',
  },
};

export function getCountryTaxConfig(country: string): CountryTaxConfig {
  return COUNTRY_TAX_SYSTEMS[country] || {
    taxAuthority: 'National Revenue Directorate',
    taxAuthorityShort: 'Tax Authority',
    effectiveRate: 0.35,
    isTaxFreeHaven: false,
    schemeName: 'Standard International Athlete Withholding',
    notes: 'Standard 35% international athlete employment withholding tax.',
    legalBasis: 'International OECD Model Tax Convention on Entertainers and Sportspersons (Art. 17).',
  };
}

export function calculateTaxBreakdown(
  clubOrCountry: Club | string,
  grossWeeklyWage: number,
  agentFeePercent: number = 5
): TaxBreakdown {
  const country = typeof clubOrCountry === 'string' ? clubOrCountry : (clubOrCountry.country || 'England');
  const system = getCountryTaxConfig(country);

  const effectiveRate = system.effectiveRate;
  const taxDeductedWeekly = Math.round(grossWeeklyWage * effectiveRate);
  const safeAgentPercent = Math.max(0, Math.min(15, agentFeePercent));
  const agentFeeWeekly = Math.round(grossWeeklyWage * (safeAgentPercent / 100));
  const netWeeklyWage = Math.max(0, grossWeeklyWage - taxDeductedWeekly - agentFeeWeekly);

  const grossAnnualWage = grossWeeklyWage * 52;
  const taxDeductedAnnual = taxDeductedWeekly * 52;
  const netAnnualWage = netWeeklyWage * 52;

  return {
    country,
    taxAuthority: system.taxAuthority,
    taxAuthorityShort: system.taxAuthorityShort,
    marginalRatePercent: Math.round(effectiveRate * 100),
    effectiveRatePercent: Math.round(effectiveRate * 100),
    grossWeeklyWage,
    taxDeductedWeekly,
    agentFeeWeekly,
    agentFeePercent: safeAgentPercent,
    netWeeklyWage,
    grossAnnualWage,
    taxDeductedAnnual,
    netAnnualWage,
    taxSchemeName: system.schemeName,
    isTaxFreeHaven: system.isTaxFreeHaven,
    notes: system.notes,
    legalBasis: system.legalBasis,
  };
}

export function getCountryTaxRate(country: string): number {
  return getCountryTaxConfig(country).effectiveRate;
}
