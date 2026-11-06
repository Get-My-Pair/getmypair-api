/**
 * Default "Your Pair's Progress" timelines per CareMyPair problem code.
 * Step 1 is always Order Confirmed; last two are Quality Check + Ready for delivery.
 * estimateDays defaults to steps.length (usually 7 → 1 step / day).
 */
function steps(...titles) {
  return titles.map((title, i) => ({
    title: String(title).trim(),
    subtitle: i === 0 ? '' : '',
    sortOrder: i + 1,
  }));
}

const SERVICE_LABEL = {
  repair: 'RepairMyPair',
  maintenance: 'MaintainMyPair',
  wash: 'WashMyPair',
};

function withOrderConfirmed(serviceType, midSteps) {
  const label = SERVICE_LABEL[serviceType] || 'CareMyPair';
  return [
    { title: 'Order Confirmed', subtitle: label, sortOrder: 1 },
    ...midSteps.map((title, i) => ({
      title,
      subtitle: '',
      sortOrder: i + 2,
    })),
    { title: 'Quality Check', subtitle: '', sortOrder: midSteps.length + 2 },
    { title: 'Ready for delivery', subtitle: '', sortOrder: midSteps.length + 3 },
  ];
}

/** @type {Record<string, { estimateDays: number, progressSteps: Array<{title:string,subtitle:string,sortOrder:number}> }>} */
const CARE_PROBLEM_PROGRESS = {
  // —— RepairMyPair ——
  sole_bottom_construction: {
    estimateDays: 7,
    progressSteps: withOrderConfirmed('repair', [
      'Carefully removing damaged sole and other components.',
      'Prepping surfaces and applying heavy-duty footwear adhesives.',
      'Pressing and curing the new sole foundation.',
      'Edge trimming and bottom finishing.',
    ]),
  },
  upper_seam_restoration: {
    estimateDays: 7,
    progressSteps: withOrderConfirmed('repair', [
      'Matching leather, fabric, and thread colors.',
      'Re-stitching split seams and reinforcing tears.',
      'Rebuilding interior heel linings for comfort.',
      'Blending and sealing the restored panels.',
    ]),
  },
  hardware_fastener: {
    estimateDays: 7,
    progressSteps: withOrderConfirmed('repair', [
      'Removing broken or oxidized hardware.',
      'Sourcing and aligning replacement fasteners.',
      'Riveting and sewing new hardware into place.',
      'Testing zipper tracks and buckle tension.',
    ]),
  },
  fit_structural: {
    estimateDays: 7,
    progressSteps: withOrderConfirmed('repair', [
      'Diagnosing structural squeaks and loose support shanks.',
      'Re-securing internal mechanics for stability.',
      'Applying targeted pressure on the stretching block.',
      'Resting the shoe to set the final comfortable shape.',
    ]),
  },

  // —— MaintainMyPair ——
  protection_conditioning: {
    estimateDays: 7,
    progressSteps: withOrderConfirmed('maintenance', [
      'Prepping the material for deep conditioning.',
      'Massaging in deep-leather conditioning to restore softness and vibrancy.',
      'Applying hydrophobic weatherproofing and UV shielding.',
      'Curing the protective barrier for dirt-resistance.',
    ]),
  },
  surface_care_polishing: {
    estimateDays: 7,
    progressSteps: withOrderConfirmed('maintenance', [
      'Performing material-specific brushing to lift away surface debris.',
      'Buffing to eliminate surface buildup and yellowing.',
      'Applying premium polishing compounds to restore original shine.',
      'Perfecting the final look with precise edge detailing.',
    ]),
  },
  structural_shape: {
    estimateDays: 7,
    progressSteps: withOrderConfirmed('maintenance', [
      'Applying professional steam reshaping to restore the original silhouette.',
      'Performing deep antimicrobial lining sanitization for interior freshness.',
      'Treating and restoring the laces for factory-fresh lace care.',
      'Cooling and setting the structure to lock in the shape.',
    ]),
  },
  storage_preservation: {
    estimateDays: 7,
    progressSteps: withOrderConfirmed('maintenance', [
      'Cleaning and neutralizing the shoe for long-term preservation.',
      'Measuring and applying custom sole protection.',
      'Executing humidity-controlled seasonal storage prep.',
      'Finalizing preservation to safeguard against long-term wear.',
    ]),
  },

  // —— WashMyPair ——
  exterior_surface_deep_clean: {
    estimateDays: 7,
    progressSteps: withOrderConfirmed('wash', [
      'Prepping the shoe for comprehensive deep cleaning.',
      'Safely lifting dirt from the uppers.',
      'Scrubbing the soles clean to remove heavy debris.',
      'Treating and restoring yellowed midsoles.',
    ]),
  },
  interior_care_sanitization: {
    estimateDays: 7,
    progressSteps: withOrderConfirmed('wash', [
      'Performing a deep interior extraction wash.',
      'Pulling out trapped sweat and dirt from the linings.',
      'Applying antibacterial treatment.',
      'Neutralizing odor-causing bacteria for a fresh interior.',
    ]),
  },
  detailing_finishing: {
    estimateDays: 7,
    progressSteps: withOrderConfirmed('wash', [
      'Analyzing the material for targeted stain treatment.',
      'Executing deep lace soaking.',
      'Performing controlled moisture extraction.',
      'Finalizing the shoe for a spot-free, safe finish.',
    ]),
  },
};

function defaultProgressFor(serviceType, code) {
  if (code && CARE_PROBLEM_PROGRESS[code]) return CARE_PROBLEM_PROGRESS[code];
  return {
    estimateDays: 7,
    progressSteps: withOrderConfirmed(serviceType || 'repair', [
      'Work in progress — step 2.',
      'Work in progress — step 3.',
      'Work in progress — step 4.',
      'Work in progress — step 5.',
    ]),
  };
}

module.exports = {
  CARE_PROBLEM_PROGRESS,
  defaultProgressFor,
  withOrderConfirmed,
  SERVICE_LABEL,
  steps,
};
