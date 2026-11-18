/**
 * Recycle My Pair — five-step process shown as a slideshow
 * in the user app and on the masteradmin recycle page.
 */
const RECYCLE_SLIDES = [
  {
    step: 1,
    title: 'Check the pair',
    summary: 'Decide whether this pair should be recycled or passed on.',
    body:
      'Wipe off mud and take the pair out of its box. If the shoes are still wearable, use Donate My Pair so someone else can wear them. Recycle is for pairs that are worn out, torn, or no longer safe to walk in.',
    points: [
      'Keep left and right shoes together.',
      'Remove loose insoles only if they fall out on their own.',
      'Do not send pairs that are still in good condition.',
    ],
  },
  {
    step: 2,
    title: 'Hand the pair in',
    summary: 'Drop it at a GetMyPair hub or book a pickup.',
    body:
      'Place the pair in a breathable bag and mark it Recycle so it is not mixed with repair or wash jobs. At the hub, tell the desk this is a recycle drop. For pickup, keep the bag ready at the address on your profile.',
    points: [
      'One pair per bag keeps sorting accurate.',
      'Include both shoes even if one is more damaged.',
      'You do not need a receipt for a recycle drop.',
    ],
  },
  {
    step: 3,
    title: 'Hub inspection',
    summary: 'The hub checks materials before anything is processed.',
    body:
      'Staff look at the upper, sole, stitching, and any metal parts. Wearable pairs are moved to the donate line. Pairs that cannot be worn stay on the recycle line and are logged against your account.',
    points: [
      'Leather, canvas, mesh, and rubber are recorded separately.',
      'Heavy mud or oil is cleaned before separation.',
      'You can see this step as “At the hub” once the bag is received.',
    ],
  },
  {
    step: 4,
    title: 'Separate the materials',
    summary: 'Soles, uppers, laces, and metal take different paths.',
    body:
      'Rubber soles can be ground for flooring, tracks, and playground surfaces. Fabric and foam go to fibre recovery. Eyelets, studs, and other metal are sent to a scrap partner. Nothing from this step is resold as a wearable shoe.',
    points: [
      'Mixed-material shoes are split by hand.',
      'Glue and foam are kept out of the rubber stream.',
      'Parts that cannot be recovered are sent to licensed disposal, not a general landfill pile.',
    ],
  },
  {
    step: 5,
    title: 'A second use',
    summary: 'Recovered material leaves the hub as something new.',
    body:
      'Recovered rubber and fibre become surfaces, insulation, or filler for new goods. GetMyPair confirms the recycle on your Save impact once the hub closes the bag. That confirmation is the end of this process.',
    points: [
      'You receive a recycle confirmation in the app.',
      'The pair is not returned.',
      'Wearable shoes should use Donate My Pair instead of this flow.',
    ],
  },
];

module.exports = { RECYCLE_SLIDES };
