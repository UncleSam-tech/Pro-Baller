/**
 * Professional Footballer Tax Residency & Wage Deductions System
 *
 * Grounded in real-world sports taxation rules:
 * - UK HMRC (45% top rate + 2% NIC = 47%)
 * - Spain Agencia Tributaria (47% standard IRPF)
 * - Italy Agenzia delle Entrate (43% + 2% surcharges = 45%)
 * - Germany Finanzamt (45% Reichensteuer + 5.5% solidarity = 47.5%)
 * - France DGFiP (45% top rate + 4% CEHR = 49%)
 * - Saudi Arabia ZATCA (0% Personal Income Tax Haven)
 * - USA IRS (37% Federal + State + Medicare = ~45%)
 * - Portugal AT (48% + 5% solidarity = 53%)
 * - Netherlands Belastingdienst (49.5% Box 1)
 * - Brazil Receita Federal (27.5% CLT/Image rights blend)
 * - Nigeria FIRS (24% P.A.Y.E.)
 */

export interface TaxBracketInfo {
  country: string;
  taxAuthority: string;
  taxAuthorityShort: string;
  taxSystemName: string;
  effectiveTaxRate: number; // e.g. 0.47
  isTaxFreeHaven: boolean;
  systemDescription: string;
  legalBasis: string;
}

export const COUNTRY_TAX_REGIMES: Record<string, TaxBracketInfo> = {
  England: {
    country: 'England',
    taxAuthority: 'HM Revenue & Customs (HMRC)',
    taxAuthorityShort: 'HMRC',
    taxSystemName: 'UK PAYE Additional Rate + Class 1 NIC',
    effectiveTaxRate: 0.47,
    isTaxFreeHaven: false,
    systemDescription: '45% top marginal income tax rate on earnings over £125,140 plus 2% employee National Insurance.',
    legalBasis: 'Finance Act (UK) - Source taxation for players resident for football employment.',
  },
  Spain: {
    country: 'Spain',
    taxAuthority: 'Agencia Estatal de Administración Tributaria (AEAT)',
    taxAuthorityShort: 'Agencia Tributaria',
    taxSystemName: 'IRPF Escala General y Autonómica',
    effectiveTaxRate: 0.47,
    isTaxFreeHaven: false,
    systemDescription: 'Combined State and Autonomous Community progressive income tax (45% - 47%).',
    legalBasis: 'Ley del Impuesto sobre la Renta de las Personas Físicas (LIRPF).',
  },
  Germany: {
    country: 'Germany',
    taxAuthority: 'Bundeszentralamt für Steuern (Finanzamt)',
    taxAuthorityShort: 'Finanzamt',
    taxSystemName: 'Einkommensteuer (Reichensteuer) + Solidaritätszuschlag',
    effectiveTaxRate: 0.475,
    isTaxFreeHaven: false,
    systemDescription: '45% top wealth tax bracket over €277,826 plus 5.5% solidarity surcharge on tax liability.',
    legalBasis: 'Einkommensteuergesetz (EStG) § 32a.',
  },
  Italy: {
    country: 'Italy',
    taxAuthority: 'Agenzia delle Entrate',
    taxAuthorityShort: 'Entrate',
    taxSystemName: 'IRPEF Nazionale + Addizionali Regionali e Comunali',
    effectiveTaxRate: 0.45,
    isTaxFreeHaven: false,
    systemDescription: '43% national bracket on income over €50,000 plus local municipal surcharges averaging 2%.',
    legalBasis: 'Testo Unico delle Imposte sui Redditi (TUIR).',
  },
  France: {
    country: 'France',
    taxAuthority: 'Direction Générale des Finances Publiques (DGFiP)',
    taxAuthorityShort: 'DGFiP',
    taxSystemName: "Impôt sur le Revenu + CEHR 4% + Prélèvements Sociaux",
    effectiveTaxRate: 0.49,
    isTaxFreeHaven: false,
    systemDescription: '45% top tranche plus 4% Contribution Exceptionnelle sur les Hauts Revenus for ultra-high sporting wages.',
    legalBasis: 'Code Général des Impôts (CGI) Art. 223 sexies.',
  },
  'Saudi Arabia': {
    country: 'Saudi Arabia',
    taxAuthority: 'Zakat, Tax and Customs Authority (ZATCA)',
    taxAuthorityShort: 'ZATCA',
    taxSystemName: '0% Personal Income Tax Haven',
    effectiveTaxRate: 0.0,
    isTaxFreeHaven: true,
    systemDescription: 'Kingdom of Saudi Arabia imposes 0% personal income tax on foreign professional football athletes. 100% net wage retention.',
    legalBasis: 'Royal Decree M/1 - Zero personal income tax on employee earnings.',
  },
  'United States': {
    country: 'United States',
    taxAuthority: 'Internal Revenue Service (IRS)',
    taxAuthorityShort: 'IRS',
    taxSystemName: 'US Federal Marginal Rate (37%) + State Tax + Medicare',
    effectiveTaxRate: 0.45,
    isTaxFreeHaven: false,
    systemDescription: '37% Federal top bracket plus State income tax (California 13.3%, Florida 0%) and 2.35% Medicare surtax.',
    legalBasis: 'Internal Revenue Code (IRC) Title 26.',
  },
  Portugal: {
    country: 'Portugal',
    taxAuthority: 'Autoridade Tributária e Aduaneira (AT)',
    taxAuthorityShort: 'Autoridade Tributária',
    taxSystemName: 'IRS Escalões + Taxa Adicional de Solidariedade',
    effectiveTaxRate: 0.53,
    isTaxFreeHaven: false,
    systemDescription: '48% top marginal income rate plus 5% maximum solidarity surcharge on earnings exceeding €250,000.',
    legalBasis: 'Código do Imposto sobre o Rendimento das Pessoas Singulares (CIRS).',
  },
  Netherlands: {
    country: 'Netherlands',
    taxAuthority: 'Belastingdienst',
    taxAuthorityShort: 'Belastingdienst',
    taxSystemName: 'Inkomstenbelasting Box 1 Top Schijf',
    effectiveTaxRate: 0.495,
    isTaxFreeHaven: false,
    systemDescription: '49.5% top progressive tax bracket on employment earnings above €75,518.',
    legalBasis: 'Wet inkomstenbelasting 2001 (Box 1).',
  },
  Brazil: {
    country: 'Brazil',
    taxAuthority: 'Receita Federal do Brasil',
    taxAuthorityShort: 'Receita Federal',
    taxSystemName: 'IRPF + CLT / Contrato de Imagem Split',
    effectiveTaxRate: 0.275,
    isTaxFreeHaven: false,
    systemDescription: '27.5% maximum income tax rate under standard 60% CLT wage and 40% Image Rights corporate assignment.',
    legalBasis: 'Lei Pelé (Lei nº 9.615/1998) & Regulamento do Imposto de Renda (RIR).',
  },
  Nigeria: {
    country: 'Nigeria',
    taxAuthority: 'Federal Inland Revenue Service (FIRS) / State LIRS',
    taxAuthorityShort: 'FIRS / LIRS',
    taxSystemName: 'Personal Income Tax Act (P.A.Y.E.)',
    effectiveTaxRate: 0.24,
    isTaxFreeHaven: false,
    systemDescription: '24% top marginal bracket on annual employment income under Nigerian Pay-As-You-Earn regulations.',
    legalBasis: 'Personal Income Tax Act (PITA) Cap P8 LFN 2004.',
  },
};

export interface TaxCalculationResult {
  country: string;
  taxAuthority: string;
  taxAuthorityShort: string;
  taxSystemName: string;
  effectiveTaxRate: number;
  grossWeeklyIncome: number;
  taxWithheld: number;
  agentFeePercent: number;
  agentFee: number;
  netWeekly: number;
  isTaxFreeHaven: boolean;
  systemDescription: string;
}

/**
 * Calculates net wage and tax deductions dynamically based on the country of the player's club.
 */
export function calculateTaxResidency(
  grossWeeklyIncome: number,
  clubCountry: string,
  agentFeePercent: number = 5
): TaxCalculationResult {
  const regime: TaxBracketInfo = COUNTRY_TAX_REGIMES[clubCountry] || {
    country: clubCountry,
    taxAuthority: 'National Tax Directorate',
    taxAuthorityShort: 'Revenue Authority',
    taxSystemName: 'Standard International Athlete Tax',
    effectiveTaxRate: 0.35,
    isTaxFreeHaven: false,
    systemDescription: 'Standard 35% international athlete employment withholding tax.',
    legalBasis: 'International OECD Model Tax Convention on Entertainers and Sportspersons (Art. 17).',
  };

  const taxWithheld = Math.round(grossWeeklyIncome * regime.effectiveTaxRate);
  const safeAgentPercent = Math.max(0, Math.min(15, agentFeePercent));
  const agentFee = Math.round(grossWeeklyIncome * (safeAgentPercent / 100));
  const netWeekly = Math.max(0, grossWeeklyIncome - taxWithheld - agentFee);

  return {
    country: regime.country,
    taxAuthority: regime.taxAuthority,
    taxAuthorityShort: regime.taxAuthorityShort,
    taxSystemName: regime.taxSystemName,
    effectiveTaxRate: regime.effectiveTaxRate,
    grossWeeklyIncome,
    taxWithheld,
    agentFeePercent: safeAgentPercent,
    agentFee,
    netWeekly,
    isTaxFreeHaven: regime.isTaxFreeHaven,
    systemDescription: regime.systemDescription,
  };
}
