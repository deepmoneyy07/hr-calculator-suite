/* SINGLE SOURCE OF TRUTH for every calculator.
 *
 * Each calculator:
 *   id       unique slug
 *   category one of CATEGORIES
 *   name     display title
 *   formula  human-readable formula string
 *   inputs   [{ key, label, unit?, default?, min?, max?, step?, help? }]
 *   example  short "given -> result" line (from the source material)
 *   compute(values) -> { display, insight, rows?, error? }
 *              values is a map of input key -> Number
 *              return { error: 'message' } to show a friendly error instead of a result
 *
 * To add a calculator: append one object here. No UI code changes needed.
 * Helpers (safeDiv, fmtPct, fmtNum, fmtINR, fmtDays, roundTo) come from format.js. */

const CATEGORIES = [
  'Recruitment & Talent Acquisition',
  'Workforce Planning & Analytics',
  'Engagement & Retention',
  'Learning & Development',
  'Compensation & Benefits',
  'Payroll & Statutory (India)',
];

const CALCULATORS = [
  /* ---------------------------------------------------------------- */
  /* Batch 1 — the 10 formulas from the source PDF (categorised per item)  */
  /* ---------------------------------------------------------------- */
  {
    id: 'headcount-growth-rate',
    category: 'Workforce Planning & Analytics',
    name: 'Headcount Growth Rate',
    formula: '(Current Headcount − Previous Headcount) ÷ Previous Headcount × 100',
    inputs: [
      { key: 'current', label: 'Current headcount', min: 0 },
      { key: 'previous', label: 'Previous headcount', min: 1 },
    ],
    example: '100 → 120 employees = 20%',
    compute: ({ current, previous }) => {
      const pct = safeDiv(current - previous, previous) * 100;
      const dir = pct > 0 ? 'grew' : pct < 0 ? 'shrank' : 'stayed flat';
      return {
        display: fmtPct(pct),
        insight: `The workforce ${dir} by ${fmtPct(Math.abs(pct))}. Check whether this growth is proportional to the growth of the business.`,
      };
    },
  },
  {
    id: 'vacancy-rate',
    category: 'Recruitment & Talent Acquisition',
    name: 'Vacancy Rate',
    formula: 'Vacant Positions ÷ Total Approved Positions × 100',
    inputs: [
      { key: 'vacant', label: 'Vacant positions', min: 0 },
      { key: 'approved', label: 'Total approved positions', min: 1 },
    ],
    example: '8 ÷ 50 = 16%',
    compute: ({ vacant, approved }) => {
      const pct = safeDiv(vacant, approved) * 100;
      return {
        display: fmtPct(pct),
        insight: `${fmtPct(pct)} of approved positions are unfilled. Identify which departments need people on priority.`,
      };
    },
  },
  {
    id: 'span-of-control',
    category: 'Workforce Planning & Analytics',
    name: 'Span of Control',
    formula: 'Direct Reports ÷ Number of Managers',
    inputs: [
      { key: 'reports', label: 'Number of employees (direct reports)', min: 0 },
      { key: 'managers', label: 'Number of managers', min: 1 },
    ],
    example: '30 ÷ 3 = 10 employees per manager',
    compute: ({ reports, managers }) => {
      const v = safeDiv(reports, managers);
      return {
        display: `${fmtNum(v)} per manager`,
        insight: `Each manager handles about ${fmtNum(v)} employees. This gives clarity on the reporting structure.`,
      };
    },
  },
  {
    id: 'internal-fill-rate',
    category: 'Recruitment & Talent Acquisition',
    name: 'Internal Fill Rate',
    formula: 'Positions Filled Internally ÷ Total Positions Filled × 100',
    inputs: [
      { key: 'internal', label: 'Positions filled internally', min: 0 },
      { key: 'total', label: 'Total positions filled', min: 1 },
    ],
    example: '12 ÷ 20 = 60%',
    compute: ({ internal, total }) => {
      const pct = safeDiv(internal, total) * 100;
      return {
        display: fmtPct(pct),
        insight: `${fmtPct(pct)} of positions are filled by internal talent within the organisation.`,
      };
    },
  },
  {
    id: 'training-completion-rate',
    category: 'Learning & Development',
    name: 'Training Completion Rate',
    formula: 'Employees Who Completed Training ÷ Employees Assigned Training × 100',
    inputs: [
      { key: 'completed', label: 'Employees who completed', min: 0 },
      { key: 'assigned', label: 'Employees assigned', min: 1 },
    ],
    example: '85 ÷ 100 = 85%',
    compute: ({ completed, assigned }) => {
      const pct = safeDiv(completed, assigned) * 100;
      return {
        display: fmtPct(pct),
        insight: `${fmtPct(100 - pct)} of assigned employees did not complete the training. Identify the reasons and where follow-ups are needed.`,
      };
    },
  },
  {
    id: 'training-attendance-rate',
    category: 'Learning & Development',
    name: 'Training Attendance Rate',
    formula: 'Employees Who Attended ÷ Employees Invited × 100',
    inputs: [
      { key: 'attended', label: 'Employees who attended', min: 0 },
      { key: 'invited', label: 'Employees invited', min: 1 },
    ],
    example: '72 ÷ 90 = 80%',
    compute: ({ attended, invited }) => {
      const pct = safeDiv(attended, invited) * 100;
      return {
        display: fmtPct(pct),
        insight: `${fmtPct(100 - pct)} of employees did not attend the training. Understand this gap and the reasons behind it.`,
      };
    },
  },
  {
    id: 'offer-acceptance-rate',
    category: 'Recruitment & Talent Acquisition',
    name: 'Offer Acceptance Rate',
    formula: 'Offers Accepted ÷ Offers Made × 100',
    inputs: [
      { key: 'accepted', label: 'Offers accepted', min: 0 },
      { key: 'made', label: 'Offers made', min: 1 },
    ],
    example: '45 ÷ 50 = 90%',
    compute: ({ accepted, made }) => {
      const pct = safeDiv(accepted, made) * 100;
      return {
        display: fmtPct(pct),
        insight: `${fmtPct(pct)} of offers were accepted. Analyse the ${fmtPct(100 - pct)} not accepted to understand candidate drop-offs.`,
      };
    },
  },
  {
    id: 'leave-utilization-rate',
    category: 'Engagement & Retention',
    name: 'Leave Utilization Rate',
    formula: 'Leave Days Availed ÷ Leave Days Available × 100',
    inputs: [
      { key: 'availed', label: 'Leave days availed', min: 0 },
      { key: 'available', label: 'Leave days available', min: 1 },
    ],
    example: '360 ÷ 500 = 72%',
    compute: ({ availed, available }) => {
      const pct = safeDiv(availed, available) * 100;
      return {
        display: fmtPct(pct),
        insight: `Employees have used ${fmtPct(pct)} of their allocated leave.`,
      };
    },
  },
  {
    id: 'selection-ratio',
    category: 'Recruitment & Talent Acquisition',
    name: 'Selection Ratio',
    formula: 'Number of Hires ÷ Number of Applicants × 100',
    inputs: [
      { key: 'hires', label: 'Number of hires', min: 0 },
      { key: 'applicants', label: 'Number of applicants', min: 1 },
    ],
    example: '10 ÷ 200 = 5%',
    compute: ({ hires, applicants }) => {
      const pct = safeDiv(hires, applicants) * 100;
      return {
        display: fmtPct(pct),
        insight: `Out of ${fmtNum(applicants)} applicants, ${fmtNum(hires)} were hired. This shows the conversion rate in the hiring process.`,
      };
    },
  },
  {
    id: 'cost-per-hire',
    category: 'Recruitment & Talent Acquisition',
    name: 'Cost per Hire',
    formula: 'Total Recruitment Cost ÷ Number of Hires',
    inputs: [
      { key: 'advertising', label: 'Job posting / advertisement cost', unit: '₹', min: 0 },
      { key: 'agency', label: 'Third-party / consultancy / agency cost', unit: '₹', min: 0 },
      { key: 'other', label: 'Other recruitment cost', unit: '₹', min: 0 },
      { key: 'hires', label: 'Number of hires', min: 1 },
    ],
    example: '₹1,80,000 ÷ 18 = ₹10,000',
    compute: ({ advertising, agency, other, hires }) => {
      const total = advertising + agency + other;
      const cph = safeDiv(total, hires);
      return {
        display: fmtINR(cph),
        rows: [
          { label: 'Total recruitment cost', value: fmtINR(total) },
          { label: 'Number of hires', value: fmtNum(hires) },
        ],
        insight: `Average cost per hire is ${fmtINR(cph)}. Track recruitment spending over time and look for ways to reduce it.`,
      };
    },
  },

  /* ---------------------------------------------------------------- */
  /* Batch 2 — added people, engagement & analytics metrics             */
  /* ---------------------------------------------------------------- */
  {
    id: 'attrition-rate',
    category: 'Engagement & Retention',
    name: 'Attrition / Turnover Rate',
    formula: 'Employees Who Left ÷ Average Headcount × 100',
    inputs: [
      { key: 'left', label: 'Employees who left', min: 0 },
      { key: 'avgHeadcount', label: 'Average headcount', min: 1, help: 'Average headcount = (headcount at start + headcount at end) ÷ 2.' },
    ],
    example: '20 left, avg headcount 200 = 10%',
    compute: ({ left, avgHeadcount }) => {
      const pct = safeDiv(left, avgHeadcount) * 100;
      const band = pct < 10 ? 'healthy' : pct < 20 ? 'moderate' : 'high';
      return {
        display: fmtPct(pct),
        insight: `Attrition is ${fmtPct(pct)} — a ${band} level. Compare it against your industry benchmark and dig into reasons for exits.`,
      };
    },
  },
  {
    id: 'retention-rate',
    category: 'Engagement & Retention',
    name: 'Retention Rate',
    formula: 'Employees Who Stayed ÷ Employees at Start × 100',
    inputs: [
      { key: 'stayed', label: 'Employees still employed at end', min: 0 },
      { key: 'start', label: 'Employees at start of period', min: 1 },
    ],
    example: '180 stayed of 200 = 90%',
    compute: ({ stayed, start }) => {
      const pct = safeDiv(stayed, start) * 100;
      return {
        display: fmtPct(pct),
        insight: `${fmtPct(pct)} of employees were retained over the period. The remaining ${fmtPct(100 - pct)} represents your loss of talent.`,
      };
    },
  },
  {
    id: 'absenteeism-rate',
    category: 'Engagement & Retention',
    name: 'Absenteeism Rate',
    formula: 'Days Absent ÷ Total Available Workdays × 100',
    inputs: [
      { key: 'absentDays', label: 'Total days absent', min: 0 },
      { key: 'availableDays', label: 'Total available workdays', min: 1, help: 'Available workdays = number of employees × working days in the period.' },
    ],
    example: '120 absent of 4,000 workdays = 3%',
    compute: ({ absentDays, availableDays }) => {
      const pct = safeDiv(absentDays, availableDays) * 100;
      return {
        display: fmtPct(pct),
        insight: `${fmtPct(pct)} of scheduled work time was lost to absence. A rising rate can signal disengagement or workload issues.`,
      };
    },
  },
  {
    id: 'enps',
    category: 'Engagement & Retention',
    name: 'Employee Net Promoter Score (eNPS)',
    formula: '% Promoters − % Detractors',
    inputs: [
      { key: 'promoters', label: 'Promoters (scored 9–10)', min: 0 },
      { key: 'passives', label: 'Passives (scored 7–8)', min: 0 },
      { key: 'detractors', label: 'Detractors (scored 0–6)', min: 0 },
    ],
    example: '60 promoters, 25 passives, 15 detractors = +45',
    compute: ({ promoters, passives, detractors }) => {
      const total = promoters + passives + detractors;
      if (total <= 0) return { error: 'Enter at least one response.' };
      const score = roundTo((promoters / total) * 100 - (detractors / total) * 100, 0);
      const band = score >= 50 ? 'excellent' : score >= 10 ? 'healthy' : score >= 0 ? 'needs attention' : 'poor';
      return {
        display: (score > 0 ? '+' : '') + fmtNum(score, 0),
        rows: [{ label: 'Total responses', value: fmtNum(total) }],
        insight: `Your eNPS is ${score > 0 ? '+' : ''}${fmtNum(score, 0)} (${band}). Scores range from −100 to +100; anything above 0 means more promoters than detractors.`,
      };
    },
  },
  {
    id: 'revenue-per-employee',
    category: 'Workforce Planning & Analytics',
    name: 'Revenue per Employee',
    formula: 'Total Revenue ÷ Number of Employees',
    inputs: [
      { key: 'revenue', label: 'Total revenue', unit: '₹', min: 0 },
      { key: 'employees', label: 'Number of employees (FTE)', min: 1 },
    ],
    example: '₹10,00,00,000 ÷ 200 = ₹5,00,000',
    compute: ({ revenue, employees }) => {
      const v = safeDiv(revenue, employees);
      return {
        display: fmtINR(v),
        insight: `Each employee generates about ${fmtINR(v)} in revenue. Track it over time as a measure of workforce productivity.`,
      };
    },
  },
  {
    id: 'promotion-rate',
    category: 'Workforce Planning & Analytics',
    name: 'Promotion Rate',
    formula: 'Number of Promotions ÷ Total Employees × 100',
    inputs: [
      { key: 'promotions', label: 'Number of promotions', min: 0 },
      { key: 'employees', label: 'Total employees', min: 1 },
    ],
    example: '15 promotions of 300 = 5%',
    compute: ({ promotions, employees }) => {
      const pct = safeDiv(promotions, employees) * 100;
      return {
        display: fmtPct(pct),
        insight: `${fmtPct(pct)} of employees were promoted. A very low rate can hurt retention; a very high one may signal grade inflation.`,
      };
    },
  },
  {
    id: 'hr-to-employee-ratio',
    category: 'Workforce Planning & Analytics',
    name: 'HR-to-Employee Ratio',
    formula: 'HR Staff ÷ Total Employees × 100',
    inputs: [
      { key: 'hrStaff', label: 'Number of HR staff', min: 1 },
      { key: 'employees', label: 'Total employees', min: 1 },
    ],
    example: '3 HR staff for 250 employees = 1.2 per 100',
    compute: ({ hrStaff, employees }) => {
      const per100 = safeDiv(hrStaff, employees) * 100;
      return {
        display: `${fmtNum(per100)} per 100 employees`,
        insight: `You have ${fmtNum(per100)} HR staff for every 100 employees. Small firms often run higher; large firms benefit from economies of scale.`,
      };
    },
  },
  {
    id: 'cost-of-turnover',
    category: 'Engagement & Retention',
    name: 'Cost of Turnover',
    formula: 'Employees Who Left × Average Cost per Exit',
    inputs: [
      { key: 'left', label: 'Employees who left', min: 0 },
      { key: 'costPerExit', label: 'Average cost per exit', unit: '₹', min: 0, help: 'Includes separation, recruitment, onboarding, training and lost-productivity costs.' },
    ],
    example: '20 exits × ₹1,50,000 = ₹30,00,000',
    compute: ({ left, costPerExit }) => {
      const total = left * costPerExit;
      return {
        display: fmtINR(total),
        insight: `Turnover cost the business about ${fmtINR(total)}. Reducing avoidable exits directly protects this budget.`,
      };
    },
  },

  /* ---------------------------------------------------------------- */
  /* Batch 3 — added recruitment metrics                                */
  /* ---------------------------------------------------------------- */
  {
    id: 'time-to-hire',
    category: 'Recruitment & Talent Acquisition',
    name: 'Time to Hire',
    formula: 'Total Days to Hire ÷ Number of Hires',
    inputs: [
      { key: 'totalDays', label: 'Total days to hire (summed across hires)', min: 0, help: 'For each hire, days from application to offer acceptance. Add them up.' },
      { key: 'hires', label: 'Number of hires', min: 1 },
    ],
    example: '450 days ÷ 10 hires = 45 days',
    compute: ({ totalDays, hires }) => {
      const avg = safeDiv(totalDays, hires);
      return {
        display: fmtDays(avg),
        insight: `On average it takes ${fmtDays(avg)} from application to acceptance. A long cycle risks losing candidates to faster competitors.`,
      };
    },
  },
  {
    id: 'time-to-fill',
    category: 'Recruitment & Talent Acquisition',
    name: 'Time to Fill',
    formula: 'Total Days to Fill ÷ Positions Filled',
    inputs: [
      { key: 'totalDays', label: 'Total days to fill (summed across roles)', min: 0, help: 'For each role, days from requisition opening to offer acceptance. Add them up.' },
      { key: 'positions', label: 'Positions filled', min: 1 },
    ],
    example: '600 days ÷ 10 roles = 60 days',
    compute: ({ totalDays, positions }) => {
      const avg = safeDiv(totalDays, positions);
      return {
        display: fmtDays(avg),
        insight: `Roles take about ${fmtDays(avg)} to fill from requisition to acceptance. Use it for workforce planning and hiring SLAs.`,
      };
    },
  },
  {
    id: 'yield-ratio',
    category: 'Recruitment & Talent Acquisition',
    name: 'Yield Ratio (stage conversion)',
    formula: 'Candidates at Next Stage ÷ Candidates at This Stage × 100',
    inputs: [
      { key: 'next', label: 'Candidates reaching next stage', min: 0 },
      { key: 'current', label: 'Candidates at this stage', min: 1 },
    ],
    example: '25 interviewed of 200 screened = 12.5%',
    compute: ({ next, current }) => {
      const pct = safeDiv(next, current) * 100;
      return {
        display: fmtPct(pct),
        insight: `${fmtPct(pct)} of candidates advanced to the next stage. Compare yields across stages to find the biggest funnel drop-off.`,
      };
    },
  },
  {
    id: 'offer-decline-rate',
    category: 'Recruitment & Talent Acquisition',
    name: 'Offer Decline Rate',
    formula: 'Offers Declined ÷ Offers Made × 100',
    inputs: [
      { key: 'declined', label: 'Offers declined', min: 0 },
      { key: 'made', label: 'Offers made', min: 1 },
    ],
    example: '5 declined of 50 = 10%',
    compute: ({ declined, made }) => {
      const pct = safeDiv(declined, made) * 100;
      return {
        display: fmtPct(pct),
        insight: `${fmtPct(pct)} of offers were turned down. A high rate points to pay gaps, slow processes or a weaker candidate experience.`,
      };
    },
  },
  {
    id: 'cost-of-vacancy',
    category: 'Recruitment & Talent Acquisition',
    name: 'Cost of Vacancy',
    formula: '(Annual Revenue per Employee ÷ Working Days) × Days Vacant',
    inputs: [
      { key: 'revenuePerEmployee', label: 'Annual revenue per employee', unit: '₹', min: 0 },
      { key: 'workingDays', label: 'Working days per year', default: 260, min: 1 },
      { key: 'daysVacant', label: 'Days the role stays vacant', min: 0 },
    ],
    example: '₹52,00,000 / 260 days × 30 = ₹6,00,000',
    compute: ({ revenuePerEmployee, workingDays, daysVacant }) => {
      const daily = safeDiv(revenuePerEmployee, workingDays);
      const cov = daily * daysVacant;
      return {
        display: fmtINR(cov),
        rows: [{ label: 'Value lost per vacant day', value: fmtINR(daily) }],
        insight: `An open role costs about ${fmtINR(cov)} in lost productivity over ${fmtNum(daysVacant)} days. This is the price of a slow hire.`,
      };
    },
  },

  /* ---------------------------------------------------------------- */
  /* Batch 4 — India payroll & statutory                                */
  /* ---------------------------------------------------------------- */
  {
    id: 'ctc-to-inhand',
    category: 'Payroll & Statutory (India)',
    name: 'CTC → In-Hand (Take-Home) Salary',
    formula: 'Gross (CTC − Employer PF − Gratuity) − Employee PF − Professional Tax − TDS',
    inputs: [
      { key: 'ctc', label: 'Annual CTC', unit: '₹', min: 1 },
      { key: 'basicPct', label: 'Basic as % of CTC', unit: '%', default: 40, min: 1, max: 100, help: 'Common range is 40–50% of CTC.' },
      { key: 'hraPct', label: 'HRA as % of Basic', unit: '%', default: 50, min: 0, max: 100 },
      { key: 'profTaxMonthly', label: 'Professional tax (per month)', unit: '₹', default: 200, min: 0, help: 'State-dependent; often ₹200/month.' },
      { key: 'annualTDS', label: 'Annual income tax (TDS)', unit: '₹', default: 0, min: 0, help: 'Depends on your tax regime and slab. Enter 0 to ignore.' },
    ],
    example: 'CTC ₹10,00,000 → about ₹68,000/month in hand (estimate)',
    compute: ({ ctc, basicPct, hraPct, profTaxMonthly, annualTDS }) => {
      const basic = ctc * (basicPct / 100);
      const hra = basic * (hraPct / 100);
      const employerPF = 0.12 * basic;
      const gratuity = 0.0481 * basic;
      const specialAllowance = ctc - basic - hra - employerPF - gratuity;
      const gross = ctc - employerPF - gratuity; // = basic + hra + special allowance
      const employeePF = 0.12 * basic;
      const profTax = profTaxMonthly * 12;
      const annualInHand = gross - employeePF - profTax - annualTDS;
      const monthly = annualInHand / 12;
      if (specialAllowance < 0) {
        return { error: 'Basic % + HRA are too high for this CTC — lower the percentages.' };
      }
      const pctOfCtc = safeDiv(annualInHand, ctc) * 100;
      return {
        display: `${fmtINR(monthly)} / month`,
        rows: [
          { label: 'Basic (annual)', value: fmtINR(basic) },
          { label: 'HRA (annual)', value: fmtINR(hra) },
          { label: 'Special allowance (annual)', value: fmtINR(specialAllowance) },
          { label: 'Gross salary (annual)', value: fmtINR(gross) },
          { label: '− Employer PF (in CTC)', value: fmtINR(employerPF) },
          { label: '− Gratuity provision (in CTC)', value: fmtINR(gratuity) },
          { label: '− Employee PF (annual)', value: fmtINR(employeePF) },
          { label: '− Professional tax (annual)', value: fmtINR(profTax) },
          { label: '− Income tax / TDS (annual)', value: fmtINR(annualTDS) },
          { label: 'Annual take-home', value: fmtINR(annualInHand) },
        ],
        insight: `Estimated take-home is ${fmtINR(monthly)}/month (${fmtPct(pctOfCtc)} of CTC). This is an estimate — actual figures depend on your exact salary structure and tax regime.`,
      };
    },
  },
  {
    id: 'gratuity',
    category: 'Payroll & Statutory (India)',
    name: 'Gratuity (India)',
    formula: '(15 × Last Monthly Salary × Years of Service) ÷ 26',
    inputs: [
      { key: 'salary', label: 'Last drawn monthly salary (Basic + DA)', unit: '₹', min: 1 },
      { key: 'years', label: 'Years of service', min: 0, step: '0.1' },
    ],
    example: '₹50,000 × 10 years = ₹2,88,461.54',
    compute: ({ salary, years }) => {
      const raw = safeDiv(15 * salary * years, 26);
      const cap = 2000000; // statutory cap ₹20 lakh
      const payable = Math.min(raw, cap);
      const eligible = years >= 5;
      let insight = `Gratuity works out to ${fmtINR(raw)}.`;
      if (raw > cap) insight += ` The statutory tax-free cap is ${fmtINR(cap)}.`;
      insight += eligible
        ? ' The employee meets the 5-year eligibility.'
        : ' Note: employees usually become eligible only after 5 years of continuous service.';
      return { display: fmtINR(payable), insight };
    },
  },
  {
    id: 'epf-pf',
    category: 'Payroll & Statutory (India)',
    name: 'EPF / PF Contribution',
    formula: 'Employee 12% of (Basic + DA) + Employer 12% of (Basic + DA)',
    inputs: [
      { key: 'basic', label: 'Monthly Basic + DA', unit: '₹', min: 1 },
      { key: 'employeePct', label: 'Employee contribution', unit: '%', default: 12, min: 0, max: 100 },
      { key: 'employerPct', label: 'Employer contribution', unit: '%', default: 12, min: 0, max: 100 },
    ],
    example: 'Basic ₹25,000 → ₹3,000 + ₹3,000 = ₹6,000/month',
    compute: ({ basic, employeePct, employerPct }) => {
      const emp = basic * (employeePct / 100);
      const er = basic * (employerPct / 100);
      const total = emp + er;
      return {
        display: `${fmtINR(total)} / month`,
        rows: [
          { label: 'Employee contribution', value: `${fmtINR(emp)}/month` },
          { label: 'Employer contribution', value: `${fmtINR(er)}/month` },
          { label: 'Total (annual)', value: fmtINR(total * 12) },
        ],
        insight: `Total PF contribution is ${fmtINR(total)}/month (${fmtINR(total * 12)}/year). The employer's 12% is usually split between EPF and the pension scheme (EPS).`,
      };
    },
  },
  {
    id: 'esi',
    category: 'Payroll & Statutory (India)',
    name: 'ESI Contribution',
    formula: 'Employee 0.75% of Gross + Employer 3.25% of Gross',
    inputs: [
      { key: 'gross', label: 'Monthly gross salary', unit: '₹', min: 1 },
      { key: 'employeePct', label: 'Employee contribution', unit: '%', default: 0.75, min: 0, max: 100, step: '0.01' },
      { key: 'employerPct', label: 'Employer contribution', unit: '%', default: 3.25, min: 0, max: 100, step: '0.01' },
    ],
    example: 'Gross ₹18,000 → ₹135 + ₹585 = ₹720/month',
    compute: ({ gross, employeePct, employerPct }) => {
      const emp = gross * (employeePct / 100);
      const er = gross * (employerPct / 100);
      const total = emp + er;
      const applicable = gross <= 21000;
      let insight = `Total ESI contribution is ${fmtINR(total)}/month.`;
      insight += applicable
        ? ' The employee is within the ₹21,000/month ESI wage ceiling, so ESI applies.'
        : ' Note: gross is above the ₹21,000/month ceiling, so ESI usually does NOT apply.';
      return {
        display: `${fmtINR(total)} / month`,
        rows: [
          { label: 'Employee contribution', value: `${fmtINR(emp)}/month` },
          { label: 'Employer contribution', value: `${fmtINR(er)}/month` },
        ],
        insight,
      };
    },
  },
  {
    id: 'statutory-bonus',
    category: 'Payroll & Statutory (India)',
    name: 'Statutory Bonus (Payment of Bonus Act)',
    formula: 'min(Basic + DA, Calculation Ceiling) × 12 × Bonus %',
    inputs: [
      { key: 'basic', label: 'Monthly Basic + DA', unit: '₹', min: 1 },
      { key: 'bonusPct', label: 'Bonus percentage', unit: '%', default: 8.33, min: 8.33, max: 20, step: '0.01', help: 'Statutory range is 8.33% (minimum) to 20% (maximum).' },
      { key: 'ceiling', label: 'Calculation ceiling (per month)', unit: '₹', default: 7000, min: 1, help: 'Bonus is calculated on the lower of actual wage or this ceiling (₹7,000 or minimum wage).' },
    ],
    example: 'Basic ₹7,000, 8.33% → ₹6,997/year',
    compute: ({ basic, bonusPct, ceiling }) => {
      const wage = Math.min(basic, ceiling);
      const annual = wage * 12 * (bonusPct / 100);
      return {
        display: `${fmtINR(annual)} / year`,
        rows: [
          { label: 'Wage used for bonus', value: `${fmtINR(wage)}/month` },
          { label: 'Monthly bonus', value: fmtINR(annual / 12) },
        ],
        insight: `Statutory bonus is ${fmtINR(annual)} for the year at ${fmtPct(bonusPct)}. Employees earning up to ₹21,000/month (Basic+DA) are typically eligible.`,
      };
    },
  },
  {
    id: 'leave-encashment',
    category: 'Payroll & Statutory (India)',
    name: 'Leave Encashment',
    formula: '(Monthly Basic + DA ÷ Days in Month) × Leave Days Encashed',
    inputs: [
      { key: 'basic', label: 'Monthly Basic + DA', unit: '₹', min: 1 },
      { key: 'daysInMonth', label: 'Days used per month', default: 30, min: 1 },
      { key: 'leaveDays', label: 'Leave days to encash', min: 0 },
    ],
    example: '₹30,000 / 30 × 15 days = ₹15,000',
    compute: ({ basic, daysInMonth, leaveDays }) => {
      const perDay = safeDiv(basic, daysInMonth);
      const amount = perDay * leaveDays;
      return {
        display: fmtINR(amount),
        rows: [{ label: 'Per-day salary', value: fmtINR(perDay) }],
        insight: `Encashing ${fmtNum(leaveDays)} leave days pays out ${fmtINR(amount)} at ${fmtINR(perDay)} per day.`,
      };
    },
  },
  {
    id: 'salary-hike',
    category: 'Payroll & Statutory (India)',
    name: 'Salary Hike / Increment %',
    formula: '(New Salary − Old Salary) ÷ Old Salary × 100',
    inputs: [
      { key: 'newSalary', label: 'New salary', unit: '₹', min: 0 },
      { key: 'oldSalary', label: 'Old salary', unit: '₹', min: 1 },
    ],
    example: '₹6,00,000 → ₹7,20,000 = 20%',
    compute: ({ newSalary, oldSalary }) => {
      const pct = safeDiv(newSalary - oldSalary, oldSalary) * 100;
      const dir = pct >= 0 ? 'increase' : 'cut';
      return {
        display: fmtPct(pct),
        rows: [{ label: 'Absolute change', value: fmtINR(newSalary - oldSalary) }],
        insight: `That is a ${fmtPct(Math.abs(pct))} ${dir}, or ${fmtINR(newSalary - oldSalary)} in absolute terms.`,
      };
    },
  },
  {
    id: 'overtime-pay',
    category: 'Payroll & Statutory (India)',
    name: 'Overtime Pay',
    formula: '(Monthly Salary ÷ Monthly Hours) × Overtime Hours × Multiplier',
    inputs: [
      { key: 'monthlySalary', label: 'Monthly salary', unit: '₹', min: 1 },
      { key: 'monthlyHours', label: 'Standard hours per month', default: 208, min: 1 },
      { key: 'overtimeHours', label: 'Overtime hours worked', min: 0 },
      { key: 'multiplier', label: 'Overtime multiplier', default: 2, min: 1, step: '0.1', help: 'Indian factory law commonly mandates 2× the ordinary rate.' },
    ],
    example: '₹41,600 / 208h × 10h × 2 = ₹4,000',
    compute: ({ monthlySalary, monthlyHours, overtimeHours, multiplier }) => {
      const hourly = safeDiv(monthlySalary, monthlyHours);
      const otPay = hourly * overtimeHours * multiplier;
      return {
        display: fmtINR(otPay),
        rows: [
          { label: 'Ordinary hourly rate', value: fmtINR(hourly) },
          { label: 'Overtime rate', value: fmtINR(hourly * multiplier) },
        ],
        insight: `${fmtNum(overtimeHours)} overtime hours at ${multiplier}× pay comes to ${fmtINR(otPay)}.`,
      };
    },
  },

  /* ---------------------------------------------------------------- */
  /* Batch 5 — L&D and compensation analytics                           */
  /* ---------------------------------------------------------------- */
  {
    id: 'training-roi',
    category: 'Learning & Development',
    name: 'Training ROI',
    formula: '(Monetary Benefit − Training Cost) ÷ Training Cost × 100',
    inputs: [
      { key: 'benefit', label: 'Monetary benefit / gain from training', unit: '₹', min: 0 },
      { key: 'cost', label: 'Total training cost', unit: '₹', min: 1 },
    ],
    example: '₹5,00,000 gain on ₹2,00,000 = 150%',
    compute: ({ benefit, cost }) => {
      const roi = safeDiv(benefit - cost, cost) * 100;
      const verdict = roi > 0 ? 'a positive return' : roi === 0 ? 'a break-even' : 'a loss';
      return {
        display: fmtPct(roi),
        rows: [{ label: 'Net benefit', value: fmtINR(benefit - cost) }],
        insight: `The programme delivered ${fmtPct(roi)} ROI — ${verdict}. Every ₹1 spent returned ${fmtNum(safeDiv(benefit, cost))} in value.`,
      };
    },
  },
  {
    id: 'cost-per-trainee',
    category: 'Learning & Development',
    name: 'Cost per Trainee / Training Hour',
    formula: 'Total Training Cost ÷ Number of Trainees',
    inputs: [
      { key: 'totalCost', label: 'Total training cost', unit: '₹', min: 0 },
      { key: 'trainees', label: 'Number of trainees', min: 1 },
      { key: 'hours', label: 'Total training hours', min: 1 },
    ],
    example: '₹2,00,000 / 40 trainees = ₹5,000 each',
    compute: ({ totalCost, trainees, hours }) => {
      const perTrainee = safeDiv(totalCost, trainees);
      const perHour = safeDiv(totalCost, hours);
      return {
        display: `${fmtINR(perTrainee)} / trainee`,
        rows: [{ label: 'Cost per training hour', value: fmtINR(perHour) }],
        insight: `Each trainee costs ${fmtINR(perTrainee)}, and each training hour costs ${fmtINR(perHour)}. Use both to compare programmes fairly.`,
      };
    },
  },
  {
    id: 'compa-ratio',
    category: 'Compensation & Benefits',
    name: 'Compa-Ratio',
    formula: 'Employee Salary ÷ Range Midpoint × 100',
    inputs: [
      { key: 'salary', label: "Employee's salary", unit: '₹', min: 1 },
      { key: 'midpoint', label: 'Salary range / market midpoint', unit: '₹', min: 1 },
    ],
    example: '₹9,50,000 / ₹10,00,000 = 95%',
    compute: ({ salary, midpoint }) => {
      const ratio = safeDiv(salary, midpoint) * 100;
      const band = ratio < 90 ? 'below market' : ratio <= 110 ? 'competitive (within the market range)' : 'above market';
      return {
        display: fmtPct(ratio),
        insight: `A compa-ratio of ${fmtPct(ratio)} is ${band}. Around 100% means the salary sits right at the midpoint.`,
      };
    },
  },
  {
    id: 'gender-pay-gap',
    category: 'Compensation & Benefits',
    name: 'Gender Pay Gap',
    formula: '(Avg Male Pay − Avg Female Pay) ÷ Avg Male Pay × 100',
    inputs: [
      { key: 'malePay', label: 'Average male pay', unit: '₹', min: 1 },
      { key: 'femalePay', label: 'Average female pay', unit: '₹', min: 0 },
    ],
    example: '₹1,00,000 vs ₹85,000 = 15% gap',
    compute: ({ malePay, femalePay }) => {
      const gap = safeDiv(malePay - femalePay, malePay) * 100;
      const favour = gap > 0 ? 'in favour of men' : gap < 0 ? 'in favour of women' : 'with no gap';
      return {
        display: fmtPct(gap),
        insight: `There is a ${fmtPct(Math.abs(gap))} pay gap ${favour}. Investigate whether it reflects role/level mix or genuine pay inequity.`,
      };
    },
  },
  {
    id: 'pay-range-penetration',
    category: 'Compensation & Benefits',
    name: 'Pay Range Penetration',
    formula: '(Salary − Range Min) ÷ (Range Max − Range Min) × 100',
    inputs: [
      { key: 'salary', label: "Employee's salary", unit: '₹', min: 0 },
      { key: 'rangeMin', label: 'Range minimum', unit: '₹', min: 0 },
      { key: 'rangeMax', label: 'Range maximum', unit: '₹', min: 1 },
    ],
    example: '₹8,00,000 in a ₹6,00,000–₹10,00,000 band = 50%',
    compute: ({ salary, rangeMin, rangeMax }) => {
      if (rangeMax <= rangeMin) return { error: 'Range maximum must be greater than range minimum.' };
      const pct = safeDiv(salary - rangeMin, rangeMax - rangeMin) * 100;
      return {
        display: fmtPct(pct),
        insight: `The salary sits ${fmtPct(pct)} of the way through its pay band. 0% is the floor, 50% the midpoint, 100% the ceiling.`,
      };
    },
  },
];

/* Card metadata for the dashboard grid: a one-line description + an icon.
 * Kept separate so the compute logic above stays uncluttered. Merged into
 * each calculator below. */
const CALC_META = {
  'headcount-growth-rate':   { icon: '📈', desc: 'See how fast your workforce is growing.' },
  'vacancy-rate':            { icon: '🪑', desc: 'Share of approved roles still unfilled.' },
  'span-of-control':         { icon: '🧭', desc: 'Average employees managed per manager.' },
  'internal-fill-rate':      { icon: '🔁', desc: 'How many roles you fill with internal talent.' },
  'training-completion-rate':{ icon: '🎓', desc: 'Share of assigned training that gets completed.' },
  'training-attendance-rate':{ icon: '🙋', desc: 'Turnout for training you invite people to.' },
  'offer-acceptance-rate':   { icon: '✅', desc: 'How many job offers candidates accept.' },
  'leave-utilization-rate':  { icon: '🌴', desc: 'How much of allotted leave employees use.' },
  'selection-ratio':         { icon: '🎯', desc: 'Applicants-to-hires conversion rate.' },
  'cost-per-hire':           { icon: '💰', desc: 'Average recruitment spend for each hire.' },

  'attrition-rate':          { icon: '📉', desc: 'Rate at which employees leave the company.' },
  'retention-rate':          { icon: '🤝', desc: 'Share of employees you keep over a period.' },
  'absenteeism-rate':        { icon: '🚪', desc: 'Work time lost to unplanned absence.' },
  'enps':                    { icon: '😊', desc: 'Employee loyalty score from −100 to +100.' },
  'revenue-per-employee':    { icon: '💹', desc: 'Revenue generated per employee.' },
  'promotion-rate':          { icon: '⬆️', desc: 'Share of employees promoted.' },
  'hr-to-employee-ratio':    { icon: '👥', desc: 'HR staff for every 100 employees.' },
  'cost-of-turnover':        { icon: '💸', desc: 'Total cost of employees leaving.' },

  'time-to-hire':            { icon: '⏱️', desc: 'Average days from application to acceptance.' },
  'time-to-fill':            { icon: '📅', desc: 'Average days to fill an open role.' },
  'yield-ratio':             { icon: '🔻', desc: 'Candidate conversion between funnel stages.' },
  'offer-decline-rate':      { icon: '❌', desc: 'Share of offers candidates turn down.' },
  'cost-of-vacancy':         { icon: '🕳️', desc: 'Lost value while a role stays open.' },

  'ctc-to-inhand':           { icon: '🧾', desc: 'Estimate take-home pay from annual CTC.' },
  'gratuity':                { icon: '🎁', desc: 'End-of-service gratuity payout (India).' },
  'epf-pf':                  { icon: '🏦', desc: 'Monthly EPF / PF contributions.' },
  'esi':                     { icon: '🩺', desc: 'Employee & employer ESI contributions.' },
  'statutory-bonus':         { icon: '🎉', desc: 'Annual statutory bonus under the Act.' },
  'leave-encashment':        { icon: '🏖️', desc: 'Payout for unused leave days.' },
  'salary-hike':             { icon: '📊', desc: 'Increment percentage on a salary change.' },
  'overtime-pay':            { icon: '⏰', desc: 'Overtime earnings at a chosen multiplier.' },

  'training-roi':            { icon: '📚', desc: 'Return on money spent on training.' },
  'cost-per-trainee':        { icon: '🧑‍🏫', desc: 'Training cost per trainee and per hour.' },
  'compa-ratio':             { icon: '⚖️', desc: 'Salary vs the market / range midpoint.' },
  'gender-pay-gap':          { icon: '🚻', desc: 'Pay difference between men and women.' },
  'pay-range-penetration':   { icon: '📏', desc: 'Where a salary sits within its band.' },
};

CALCULATORS.forEach((c) => {
  const m = CALC_META[c.id];
  if (m) { c.icon = m.icon; c.desc = m.desc; }
});

// Brand-anchored colour per category (used for card tags and icon tints).
const CATEGORY_COLORS = {
  'Recruitment & Talent Acquisition': '#FF6D05',
  'Workforce Planning & Analytics':   '#29294C',
  'Engagement & Retention':           '#654AB7',
  'Learning & Development':            '#159E8C',
  'Compensation & Benefits':          '#2F6DB5',
  'Payroll & Statutory (India)':      '#FD5595',
};

// Expose for the Node test harness (ignored in the browser).
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CALCULATORS, CATEGORIES, CATEGORY_COLORS };
}
