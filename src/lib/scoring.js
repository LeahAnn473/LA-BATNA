export function emptyTotals() {
  return { earned: 0, bonus: 0, penalty: 0, final: 0 };
}

export function teamTotals(events, team) {
  const totals = emptyTotals();
  (events || [])
    .filter((event) => event.status !== 'pending' && event.team === team)
    .forEach((event) => {
      const points = Number(event.points) || 0;
      if (event.kind === 'penalty') totals.penalty -= Math.abs(points);
      else if (event.kind === 'bonus') totals.bonus += points;
      else totals.earned += points;
    });
  totals.final = totals.earned + totals.bonus + totals.penalty;
  return totals;
}

export function scores(events) {
  return { A: teamTotals(events, 'A'), B: teamTotals(events, 'B') };
}

export function penaltyList(events, team) {
  return (events || [])
    .filter((event) => event.status !== 'pending' && event.team === team && event.kind === 'penalty')
    .map((event) => ({ id: event.id, reason: event.reason || event.rule_key || 'Penalty', points: -Math.abs(Number(event.points) || 0) }));
}

export function bestPlayer(events) {
  const board = {};
  (events || [])
    .filter((event) => event.status !== 'pending' && event.player_name)
    .forEach((event) => {
      const points = Number(event.points) || 0;
      if (points <= 0) return;
      board[event.player_name] = (board[event.player_name] || 0) + points;
    });
  const ranked = Object.entries(board).sort((a, b) => b[1] - a[1]);
  return ranked.length ? { name: ranked[0][0], points: ranked[0][1] } : null;
}

export function bestRound(events, rounds = 4) {
  let best = null;
  for (let round = 1; round <= rounds; round += 1) {
    const points = (events || [])
      .filter((event) => event.status !== 'pending' && Number(event.round_number) === round)
      .reduce((sum, event) => sum + Math.max(0, Number(event.points) || 0), 0);
    if (!best || points > best.points) best = { round, points };
  }
  return best && best.points > 0 ? best : null;
}

export function roundPenalties(events, round, team) {
  return (events || []).filter(
    (event) => event.status !== 'pending' && Number(event.round_number) === round && event.team === team && event.kind === 'penalty'
  );
}

export function winnerOf(events, teamA, teamB) {
  const totals = scores(events);
  if (totals.A.final === totals.B.final) {
    if (Math.abs(totals.A.penalty) !== Math.abs(totals.B.penalty)) {
      return totals.A.penalty > totals.B.penalty
        ? { key: 'A', name: teamA, reason: 'Level on points — fewer penalties' }
        : { key: 'B', name: teamB, reason: 'Level on points — fewer penalties' };
    }
    if (totals.A.bonus !== totals.B.bonus) {
      return totals.A.bonus > totals.B.bonus
        ? { key: 'A', name: teamA, reason: 'Level on points — more bonus points' }
        : { key: 'B', name: teamB, reason: 'Level on points — more bonus points' };
    }
    return { key: 'tie', name: 'Shared win', reason: 'Level on points, penalties and bonuses' };
  }
  return totals.A.final > totals.B.final
    ? { key: 'A', name: teamA, reason: 'Higher final score' }
    : { key: 'B', name: teamB, reason: 'Higher final score' };
}