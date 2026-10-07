// APA 7 sentence case for titles stored in title case: only the first word, the first word after a
// colon, question mark or period, proper nouns and acronyms keep their capitals. Proper nouns and
// program names come from the list below (case-insensitive match, canonical form restored).
const PROPER = [
  'American Academy of Pediatrics', 'American Academy of Sleep Medicine', 'American Academy of Child and Adolescent Psychiatry',
  'Triple P-Positive Parenting Program', 'Triple P', 'Incredible Years', 'Parent-Child Interaction Therapy',
  'Parent Management Training-Oregon Model', 'Parent Management Training', 'Early Head Start', 'Head Start',
  'Child-Directed Interaction', 'Family Check-Up', 'Nurse-Family Partnership', 'Hong Kong', 'Mainland China', 'China', 'Chinese',
  'Taiwan', 'Taiwanese', 'Canada', 'Canadian', 'United States', 'Australia', 'Australian', 'New Zealand', 'Dutch', 'Netherlands',
  'Europe', 'European', 'English', 'Spanish', 'Mandarin', 'Cantonese', 'Cochrane', 'Gershoff', 'Grogan-Kaylor', 'Kazdin', 'Oregon',
  'Shanghai', 'Beijing', 'Jinan', 'Taipei', 'Quebec', 'Montreal', 'Chicago', 'Latino', 'Hispanic', 'African American', 'Asian American', 'American',
  'Fragile Families', 'Millennium Cohort', 'Avon Longitudinal Study', 'NICHD', 'Oxford', 'Dweck', 'Baumrind', 'Patterson',
  'Growing Up in Australia', 'Longitudinal Study of Australian Children', 'Study of Early Child Care', 'National Institute of Child Health and Human Development',
  'More Fun with Sisters and Brothers Program', 'Collaborative & Proactive Solutions',
];
const PROPER_RE = PROPER.slice().sort((a, b) => b.length - a.length).map((p) => [new RegExp(p.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi'), p]);

export function apaTitle(title) {
  const words = String(title ?? '').split(/(\s+)/);
  let startOfSentence = true;
  const out = words.map((w) => {
    if (/^\s+$/.test(w)) return w;
    const bare = w.replace(/^[("'“‘[]+|[)"'”’\]:;,.?!]+$/g, '');
    let next = w;
    const keep = /^[A-Z0-9][A-Z0-9.&/-]*$/.test(bare) && bare.length > 1 && !/^[A-Z][a-z]/.test(bare); // acronyms: ADHD, U.S., DSM-5
    const hasDigit = /\d/.test(bare);
    const lower = (part) => (/^[A-Z]{2,}$/.test(part) ? part : part.toLowerCase()); // keeps ADHD in "ADHD-5"
    if (!startOfSentence && !keep) {
      // lowercase every part of a hyphenated or slashed compound (30-million-word, 3-year-olds)
      next = w.replace(/[A-Za-z’']+/g, lower);
    } else if (startOfSentence) {
      next = w.replace(/^([("'“‘[]*)([a-z])/, (m, p, c) => p + c.toUpperCase());
      // the rest of a hyphenated first word is lowercase in APA (Meta-analysis)
      next = next.replace(/^([^A-Za-z]*[A-Za-z’']+)(.*)$/, (m, head, tail) => head + (keep ? tail : tail.replace(/[A-Za-z’']+/g, lower)));
    }
    startOfSentence = /[:?.!]$/.test(w) || /[:?.!]["'”’)]$/.test(w);
    return next;
  });
  let s = out.join('');
  for (const [re, canon] of PROPER_RE) s = s.replace(re, canon);
  return s;
}
