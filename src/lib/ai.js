const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };


async function callReferee(prompt, schema, fileUrls) {
  const payload = { prompt, response_json_schema: schema };
  if (fileUrls && fileUrls.length) payload.file_urls = fileUrls;
  const result = await db.integrations.Core.InvokeLLM(payload);
  if (!result || typeof result !== 'object') throw new Error('The AI referee sent an unreadable answer.');
  return result;
}

const CLUE_SCHEMA = {
  type: 'object',
  properties: {
    verdict: { type: 'string', enum: ['ACCEPTABLE', 'BORDERLINE', 'TOO_DIRECT'] },
    reason: { type: 'string' },
    confidence: { type: 'number' },
    directness: { type: 'number' },
  },
  required: ['verdict', 'reason', 'confidence', 'directness'],
};

export async function judgeClue({ clue, secretWord, forbiddenWords, history }) {
  const forbidden = (forbiddenWords || []).join(', ') || 'none listed';
  const historyText = (history || [])
    .map((entry, index) => `${index + 1}. "${entry.clue}" -> ${entry.verdict}`)
    .join('\n');

  const prompt = `You are the Fair Play Referee of LA'BATNA, a kind family game show.
Game: "Say Less, Guess More". A clue-giver says vague spoken clues so a teammate guesses a SECRET WORD. The whole family is listening, including children.

SECRET WORD: "${secretWord}"
FORBIDDEN WORDS (may never be said, in any form): ${forbidden}

FORBIDDEN CLUES:
- saying the word, part of it, or a close variation of it
- spelling, first letter, letter count, rhyming or sound-alike hints
- direct dictionary definitions or obvious synonyms
- clues that practically name the answer
- repeating an earlier clue in different words
- gestures, pointing or miming that reveal the answer

ALLOWED CLUES:
- a broad category ("it is a living thing")
- a general use ("you use it in the kitchen")
- a loosely associated situation ("you might see one on a long journey")

${historyText ? `PREVIOUS CLUES FROM THIS TURN:\n${historyText}\n` : ''}
CLUE TO JUDGE: "${clue}"

Judge the MEANING of the whole clue, not just keywords. A clue that describes the word precisely is TOO_DIRECT even if it never uses a forbidden word. A clue that leans towards the answer but still needs imagination is BORDERLINE. If the clue is empty, off-topic or unintelligible, answer ACCEPTABLE with confidence 0.2 and a reason asking the host to confirm.

Return:
- verdict: ACCEPTABLE, BORDERLINE or TOO_DIRECT
- reason: ONE short, warm sentence the family can hear out loud (never harsh, never scolding)
- confidence: 0 to 1, how sure you are of this verdict
- directness: 0 to 100, where 0 is perfectly vague and 100 practically names the answer`;

  const result = await callReferee(prompt, CLUE_SCHEMA);
  return {
    verdict: ['ACCEPTABLE', 'BORDERLINE', 'TOO_DIRECT'].includes(result.verdict) ? result.verdict : 'BORDERLINE',
    reason: result.reason || 'The clue was hard to judge.',
    confidence: Math.min(1, Math.max(0, Number(result.confidence) || 0)),
    directness: Math.min(100, Math.max(0, Number(result.directness) || 0)),
  };
}

const GESTURE_SCHEMA = {
  type: 'object',
  properties: {
    possible_gesture: { type: 'boolean' },
    reason: { type: 'string' },
    confidence: { type: 'number' },
  },
  required: ['possible_gesture', 'reason', 'confidence'],
};

export async function checkGesture({ frameUrl, secretWord }) {
  const prompt = `This is a single snapshot of a clue-giver during the family game "Say Less, Guess More". The secret word is "${secretWord}".
Look only at what is visible: are the hands, fingers, or body clearly drawing, shaping, counting letters or pointing in a way that reveals the answer?
Do not guess. If the image is unclear, unlit, or shows no person, answer possible_gesture false with low confidence.
Return possible_gesture (true or false), reason (one short friendly sentence for the host) and confidence (0 to 1).`;
  const result = await callReferee(prompt, GESTURE_SCHEMA, [frameUrl]);
  return {
    possibleGesture: Boolean(result.possible_gesture),
    reason: result.reason || 'Nothing clear in the snapshot.',
    confidence: Math.min(1, Math.max(0, Number(result.confidence) || 0)),
  };
}

const FORBIDDEN_SCHEMA = {
  type: 'object',
  properties: {
    forbidden: { type: 'array', items: { type: 'string' } },
  },
  required: ['forbidden'],
};

export async function suggestForbidden({ word, category }) {
  const prompt = `For the family guessing game "Say Less, Guess More", list the words a clue-giver must NOT be allowed to say for the secret word "${word}" (category: ${category}).
Include: parts of the word, close variations, obvious synonyms, its most obvious defining features, and any sound-alike that would give it away.
Return between 4 and 7 short lowercase words or two-word phrases in the "forbidden" array. No explanations.`;
  const result = await callReferee(prompt, FORBIDDEN_SCHEMA);
  return (result.forbidden || []).map((entry) => String(entry).toLowerCase()).slice(0, 8);
}

const TEELEH_SCHEMA = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    observations: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['hole', 'strike', 'round_win', 'out_of_turn', 'outside_line', 'moved_marble', 'false_claim'],
          },
          team: { type: 'string', enum: ['A', 'B'] },
          player: { type: 'string' },
          reason: { type: 'string' },
          confidence: { type: 'number' },
          frame_index: { type: 'number' },
        },
        required: ['action', 'team', 'reason', 'confidence', 'frame_index'],
      },
    },
  },
  required: ['summary', 'observations'],
};

export async function analyzeTeelah({ frameUrls, session, calibration }) {
  const startLine = calibration?.start_line ? Math.round(calibration.start_line * 100) : null;
  const prompt = `You are the video referee for "Al Teelah", a marble game played by two family teams of two.

These images are ordered still frames sampled from the recording of round ${session.current_round} of 4.
Variation: ${session.variation === 'line' ? 'straight line (hit marbles placed in a line, keep the ones you knock out)' : 'three holes (land in the nearest hole to earn a strike turn, then hit an opponent marble to win it)'}.
Team A "${session.team_a_name}" throws ${session.team_a_color || 'their'} marbles. Team B "${session.team_b_name}" throws ${session.team_b_color || 'their'} marbles.
${startLine !== null ? `The host calibrated the play surface: the start line sits about ${startLine}% down the frame, holes and the permitted area were marked in that calibration snapshot.` : 'The play surface was not calibrated.'}.

Report ONLY actions you can actually see in these still frames, using these action keys:
- "hole": a marble clearly resting inside a hole
- "strike": one marble clearly knocking another marble
- "out_of_turn": a marble moving while it was not the acting team's turn
- "outside_line": a marble released from beyond the start line
- "moved_marble": a marble moved by a hand rather than a throw
- "false_claim": a claim contradicted by what the frames show

Rules for your answer:
- Never invent an event. If the frames are blurry, too far away, or show no marble movement, return an empty observations list.
- Maximum 5 observations. Never report the same action twice.
- confidence is 0 to 1. Use below 0.6 whenever you are not sure — the host will confirm those.
- team must be "A" or "B". player is the name you can match from Team A (${session.team_a_player_1}, ${session.team_a_player_2}) or Team B (${session.team_b_player_1}, ${session.team_b_player_2}), otherwise leave it empty.
- reason: one short sentence describing the evidence you saw in the frames.
- frame_index: the index (starting at 0) of the frame that shows it best.
- summary: one friendly sentence summarising the round for the hosts.`;

  return callReferee(prompt, TEELEH_SCHEMA, frameUrls);
}

const FOOTBALL_SCHEMA = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    possession: {
      type: 'object',
      properties: { A: { type: 'number' }, B: { type: 'number' } },
      required: ['A', 'B'],
    },
    mvp_player: { type: 'string' },
    moments: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['goal', 'passes', 'round_win', 'fair_play', 'handball', 'foul', 'time_waste', 'interference', 'repeat_foul'],
          },
          team: { type: 'string', enum: ['A', 'B'] },
          player: { type: 'string' },
          reason: { type: 'string' },
          confidence: { type: 'number' },
          frame_index: { type: 'number' },
        },
        required: ['action', 'team', 'reason', 'confidence', 'frame_index'],
      },
    },
  },
  required: ['summary', 'possession', 'moments'],
};

export async function analyzeFootball({ frameUrls, session, transcript }) {
  const prompt = `You are the match referee for a 2 v 2 small-sided family football match, round ${session.current_round} of 4.

These images are ordered still frames sampled across the recording. The whole pitch and both goals were in frame.
Team A "${session.team_a_name}" (${session.team_a_color || 'first bib colour'}) players: ${session.team_a_player_1}, ${session.team_a_player_2}.
Team B "${session.team_b_name}" (${session.team_b_color || 'second bib colour'}) players: ${session.team_b_player_1}, ${session.team_b_player_2}.
${transcript ? `Audio transcript of the round (crowd, whistle, voices): "${String(transcript).slice(0, 1200)}"` : 'No audio transcript is available for this round.'}

Report only what the frames and audio actually support, using these action keys:
- "goal": the ball clearly crossing the goal line between the posts
- "passes": a completed run of five consecutive passes between teammates
- "round_win": only if the score makes the round winner obvious
- "fair_play": a goal scored in a round with no fouls
- "handball": a player deliberately handling the ball with their hand or arm
- "foul": a deliberate trip, push or shirt pull
- "time_waste": a player deliberately kicking the ball out to waste time
- "interference": a player interfering with the opponent's restart
- "repeat_foul": repeated fouls after a warning

Rules:
- Accidental contact is NEVER a foul. When in doubt, do not report it.
- Maximum 6 moments, no duplicates. Empty list is a valid answer.
- confidence is 0 to 1; stay below 0.6 when you are unsure, the host will confirm.
- possession.A + possession.B must equal 100, based on where the ball spent time across the frames.
- mvp_player: the player name (from the lists above) who appears most involved, or empty if unclear.
- reason: one short sentence of evidence for each moment.
- frame_index: the frame where it is best visible.
- summary: one friendly sentence for the hosts.`;

  return callReferee(prompt, FOOTBALL_SCHEMA, frameUrls);
}