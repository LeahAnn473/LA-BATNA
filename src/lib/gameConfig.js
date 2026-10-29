export const GAME_ORDER = ['teelah', 'sayless', 'football'];

export const TEAM_COLORS = [
  { key: 'red', label: 'Red', hex: '#D64545' },
  { key: 'blue', label: 'Blue', hex: '#2F6FB0' },
  { key: 'green', label: 'Green', hex: '#2E8B57' },
  { key: 'gold', label: 'Sand gold', hex: '#D9A227' },
  { key: 'purple', label: 'Purple', hex: '#7A4FA3' },
  { key: 'charcoal', label: 'Charcoal', hex: '#3A3A3A' },
];

export const WORD_CATEGORIES = [
  { key: 'animals', label: 'Animals' },
  { key: 'food', label: 'Food' },
  { key: 'places', label: 'Places' },
  { key: 'objects', label: 'Objects' },
  { key: 'jobs', label: 'Jobs' },
  { key: 'gulf_culture', label: 'Gulf culture' },
];

export const WORD_LEVELS = [
  { key: 'easy', label: 'Easy' },
  { key: 'medium', label: 'Medium' },
  { key: 'hard', label: 'Hard' },
];

export const GAMES = {
  teelah: {
    key: 'teelah',
    order: 1,
    name: 'Al Teelah',
    nameAr: 'التيلة',
    tagline: 'Marble strike showdown',
    blurb:
      'Two marble colours, one line. Strike, land and claim marbles while the AI referee watches the play surface.',
    icon: 'marble',
    rounds: 4,
    turnSeconds: 120,
    variationLabel: 'variation',
    accent: {
      hex: '#0F4C4C',
      text: 'text-teal-900',
      bg: 'bg-teal-900',
      soft: 'bg-teal-50',
      border: 'border-teal-200',
      chip: 'bg-teal-100 text-teal-900',
      gradient: 'from-teal-900 to-teal-700',
    },
    variations: [
      {
        key: 'three_holes',
        label: 'Three holes',
        description:
          'Throw from the line, land a marble in the nearest hole to earn a strike turn, then hit an opponent marble to win it.',
      },
      {
        key: 'line',
        label: 'Straight line',
        description:
          'Opponent marbles sit in a straight line. Hit one and keep every marble you knock out of the line.',
      },
    ],
    scoring: [
      { key: 'hole', label: 'Marble in the designated hole', points: 2, kind: 'scored' },
      { key: 'strike', label: 'Successful strike on an opponent marble', points: 3, kind: 'scored' },
      { key: 'round_win', label: 'Win the round', points: 1, kind: 'bonus' },
      { key: 'out_of_turn', label: 'Played out of turn', points: -1, kind: 'penalty' },
      { key: 'outside_line', label: 'Thrown from outside the line', points: -1, kind: 'penalty' },
      { key: 'moved_marble', label: 'Moved a marble by hand', points: -2, kind: 'penalty' },
      { key: 'false_claim', label: 'False claim of a strike or hole', points: -2, kind: 'penalty' },
    ],
    rules: [
      'Four rounds. Team A throws in rounds 1 and 3, Team B in rounds 2 and 4, and each player throws once.',
      'Throw only from behind the start line, onto the play surface the camera calibrated.',
      'A marble in the designated hole scores. A marble you strike is captured and keeps its new owner.',
      'Never move a marble with your hand. Only a throw moves marbles.',
      'The AI awards only what it can verify. Unclear collisions or hidden marbles are sent to the host.',
      'Every point, bonus and penalty is written into the FairPlay log with its reason.',
      'The host has the final say and can add or remove points at any time.',
    ],
    tieBreak: 'Fewest penalties first, then most strikes. If still level, the game is a shared win.',
  },
  sayless: {
    key: 'sayless',
    order: 2,
    name: 'Say Less, Guess More',
    nameAr: 'قول أقل',
    tagline: 'Vague clues, sharp guesses',
    blurb:
      'One clue-giver, one guesser, sixty seconds. The AI fairness referee listens and keeps the clues vague.',
    icon: 'clue',
    rounds: 4,
    turnSeconds: 60,
    variationLabel: 'banks',
    accent: {
      hex: '#C4473A',
      text: 'text-coral-dark',
      bg: 'bg-coral-dark',
      soft: 'bg-coral-light',
      border: 'border-coral',
      chip: 'bg-coral-light text-coral-dark',
      gradient: 'from-coral-dark to-coral',
    },
    variations: [],
    scoring: [
      { key: 'correct', label: 'Correct guess', points: 3, kind: 'scored' },
      { key: 'fast', label: 'Correct in the first 15 seconds', points: 1, kind: 'bonus' },
      { key: 'clean_round', label: 'No violations in the round', points: 2, kind: 'bonus' },
      { key: 'pass', label: 'Pass', points: -1, kind: 'penalty' },
      { key: 'too_direct', label: 'Clue too direct', points: -2, kind: 'penalty' },
      { key: 'spelling_hint', label: 'Letter or spelling hint', points: -2, kind: 'penalty' },
      { key: 'gesture', label: 'Gesture that reveals the answer', points: -2, kind: 'penalty' },
      { key: 'repeat_violation', label: 'Repeat after a warning — turn ends', points: -3, kind: 'penalty' },
    ],
    rules: [
      'Four rounds of 60 seconds. Team A gives clues in rounds 1 and 3, Team B in rounds 2 and 4. Roles swap inside each team.',
      'Only the clue-giver sees the secret word. The opposing team watches but never speaks.',
      'Clues must stay vague: a broad category, a general use, a loosely related situation.',
      'Never say the word, part of it, its letters, rhymes or a direct definition. No gestures or pointing.',
      'Borderline clue: one friendly warning, no points. Clearly direct: minus two.',
      'A repeat after a warning costs three points and ends the turn.',
      'When the AI is unsure it asks the host, and the host decides.',
    ],
    tieBreak: 'Fewest penalties first, then most correct guesses. If still level, the game is a shared win.',
  },
  football: {
    key: 'football',
    order: 3,
    name: 'Football',
    nameAr: 'الكورة',
    tagline: 'Two against two, one referee',
    blurb:
      'Four short rounds of 2v2. The AI reviews the match video, suggests the goals, fouls and MVP, and the host applies them.',
    icon: 'ball',
    rounds: 4,
    turnSeconds: 180,
    variationLabel: 'format',
    accent: {
      hex: '#B6842F',
      text: 'text-sand-dark',
      bg: 'bg-sand-dark',
      soft: 'bg-sand-light',
      border: 'border-sand',
      chip: 'bg-sand-light text-sand-dark',
      gradient: 'from-sand-dark to-sand',
    },
    variations: [],
    scoring: [
      { key: 'goal', label: 'Valid goal', points: 3, kind: 'scored' },
      { key: 'passes', label: 'Five consecutive teammate passes', points: 1, kind: 'bonus' },
      { key: 'round_win', label: 'Win the round', points: 3, kind: 'bonus' },
      { key: 'fair_play', label: 'Goal with no foul that round', points: 1, kind: 'bonus' },
      { key: 'handball', label: 'Deliberate handball', points: -2, kind: 'penalty' },
      { key: 'foul', label: 'Confirmed foul (trip or push)', points: -2, kind: 'penalty' },
      { key: 'time_waste', label: 'Kicked the ball out to waste time', points: -1, kind: 'penalty' },
      { key: 'interference', label: 'Interfered with the opponent restart', points: -1, kind: 'penalty' },
      { key: 'repeat_foul', label: 'Repeated fouls after a warning', points: -3, kind: 'penalty' },
    ],
    rules: [
      'Four short rounds of 3 minutes, two against two. Teams change sides between rounds.',
      'Point the camera so the whole pitch and both goals stay in frame.',
      'The AI reviews sampled frames and the match audio, then suggests goals, fouls, ball-outs, possession and an MVP.',
      'Nothing counts until the host presses Apply AI results, and every moment carries a reason.',
      'Accidental contact is never penalised automatically.',
    ],
    tieBreak: 'Fewest penalties first, then most goals. If still level, the match is a shared win.',
  },
};

export function rulesFor(gameKey) {
  return GAMES[gameKey]?.scoring || [];
}

export function ruleByKey(gameKey, key) {
  return rulesFor(gameKey).find((rule) => rule.key === key) || null;
}

export function variationLabel(gameKey, variation) {
  const game = GAMES[gameKey];
  if (!game) return '';
  const found = (game.variations || []).find((v) => v.key === variation);
  if (found) return found.label;
  if (gameKey === 'sayless') return 'Category word bank';
  if (gameKey === 'football') return '2 v 2 · 3 minute rounds';
  return 'Standard rules';
}

export function teamOf(session, key) {
  if (!session) return { key: 'A', name: 'Team A', color: '', hex: '#0F4C4C', players: [] };
  const lower = key === 'B' ? 'b' : 'a';
  return {
    key: lower.toUpperCase(),
    name: session[`team_${lower}_name`] || `Team ${lower.toUpperCase()}`,
    color: session[`team_${lower}_color`] || '',
    hex: session[`team_${lower}_color_hex`] || (lower === 'a' ? '#0F4C4C' : '#EE6A5B'),
    players: [session[`team_${lower}_player_1`], session[`team_${lower}_player_2`]].filter(Boolean),
  };
}

export function currentTurn(session) {
  const round = session?.current_round || 1;
  const team = round % 2 === 1 ? 'A' : 'B';
  const active = teamOf(session, team);
  const firstTurn = round <= 2;
  const giver = firstTurn ? active.players[0] : active.players[1];
  const guesser = firstTurn ? active.players[1] : active.players[0];
  return {
    round,
    team,
    teamName: active.name,
    teamHex: active.hex,
    players: active.players,
    giver: giver || `${active.name} clue-giver`,
    guesser: guesser || `${active.name} guesser`,
    player: giver || `${active.name} player`,
  };
}