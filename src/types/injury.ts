export type InjurySeverity = 'Mild' | 'Moderate' | 'Severe' | 'Critical';

export interface InjuryDetail {
  id: string;
  name: string;
  bodyPart: 'Hamstring' | 'Knee (ACL)' | 'Knee (Meniscus)' | 'Ankle' | 'Metatarsal (Foot)' | 'Groin' | 'Concussion' | 'Calf';
  severity: InjurySeverity;
  initialWeeksOut: number;
  remainingWeeks: number;
  occurredYear: number;
  occurredWeek: number;
  treatmentMethod: 'club_physio' | 'specialist_clinic' | 'cortisone_risk';
  description: string;
  attributeImpact: {
    paceLoss?: number;
    staminaLoss?: number;
  };
}

export const INJURY_CATALOG: Omit<InjuryDetail, 'id' | 'remainingWeeks' | 'occurredYear' | 'occurredWeek' | 'treatmentMethod'>[] = [
  {
    name: 'Hamstring Muscle Strain (Grade 1)',
    bodyPart: 'Hamstring',
    severity: 'Mild',
    initialWeeksOut: 3,
    description: 'Micro-tears in the biceps femoris muscle fibers during full sprint acceleration.',
    attributeImpact: { staminaLoss: 2 },
  },
  {
    name: 'Severe Hamstring Tear (Grade 2)',
    bodyPart: 'Hamstring',
    severity: 'Moderate',
    initialWeeksOut: 6,
    description: 'Partial tear requiring immobilization, ultrasound therapy, and gradual eccentric loading.',
    attributeImpact: { paceLoss: 1, staminaLoss: 4 },
  },
  {
    name: 'Anterior Cruciate Ligament (ACL) Rupture',
    bodyPart: 'Knee (ACL)',
    severity: 'Critical',
    initialWeeksOut: 28,
    description: 'Complete ligament snap following non-contact knee rotation. Mandates surgical reconstruction and 7-month grueling rehabilitation.',
    attributeImpact: { paceLoss: 3, staminaLoss: 6 },
  },
  {
    name: 'Lateral Meniscus Cartilage Tear',
    bodyPart: 'Knee (Meniscus)',
    severity: 'Moderate',
    initialWeeksOut: 8,
    description: 'Cartilage tear causing joint locking and swelling. Requires keyhole arthroscopic trimming.',
    attributeImpact: { paceLoss: 1, staminaLoss: 3 },
  },
  {
    name: 'High Ankle Syndesmosis Sprain',
    bodyPart: 'Ankle',
    severity: 'Moderate',
    initialWeeksOut: 5,
    description: 'Torn syndesmotic ligaments above the ankle joint from an aggressive sliding tackle.',
    attributeImpact: { staminaLoss: 3 },
  },
  {
    name: 'Fifth Metatarsal Stress Fracture',
    bodyPart: 'Metatarsal (Foot)',
    severity: 'Severe',
    initialWeeksOut: 10,
    description: 'Hairline bone fracture in outer foot bone due to accumulated match fatigue and stud impact. Requires orthopedic boot.',
    attributeImpact: { paceLoss: 2, staminaLoss: 4 },
  },
  {
    name: 'Adductor Longus Groin Strain',
    bodyPart: 'Groin',
    severity: 'Mild',
    initialWeeksOut: 3,
    description: 'Sharp pain when striking the ball across body or changing direction rapidly.',
    attributeImpact: { staminaLoss: 2 },
  },
  {
    name: 'Grade 2 Concussion Protocol',
    bodyPart: 'Concussion',
    severity: 'Mild',
    initialWeeksOut: 2,
    description: 'Direct head collision during aerial contest. Mandates 14-day zero-contact cognitive rest protocol.',
    attributeImpact: {},
  },
];
