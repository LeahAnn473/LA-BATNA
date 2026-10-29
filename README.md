# لعبتنا
### Our game. Our family. Fair play, refereed by AI.

La'batna is a family game-day host. It watches real gameplay through a camera and microphone, checks the rules, and keeps score fairly, so game night ends in laughter instead of arguments.

---

## The problem it solves
Family games often end in disputes. Who hit the marble? Was that clue too obvious? Was that a goal? La'batna acts as a neutral AI referee that recognises what happened, applies the rules, explains every decision, and keeps a transparent scoreboard.

## The three games
Each game is played separately, with **2 teams of 2 players** and **4 rounds**.

### 1. Al Teelah (التيلة), the marble game
- Each player has a coloured marble, saved to their name.
- The camera watches the playing surface only (marbles, holes, starting line), with no faces needed.
- Tracks hole entries, strikes, turn order and foul throws.
- Supports the three-hole and straight-line variations.

### 2. Say Less, Guess More
- One player gives only vague spoken clues, and their teammate guesses the secret word.
- The AI listens and rates every clue: **Acceptable**, **Borderline** or **Too direct**.
- A forbidden-words list and a three-level penalty system keep it fair.

### 3. Football (كرة القدم)
- A 2v2 match, recorded live or uploaded as a video.
- The AI finds goals, possession, completed passes and visible fouls.
- Awards an **MVP** based on who had the ball most.

## How it works
1. **Choose a game.**
2. **Enter players and teams.** Team A is P1 + P2 and Team B is P3 + P4.
3. **Review the rules and get ready.**
4. **Play the round.** See the timer, the current turn and the live score.
5. **See the AI judge's results.** Every moment comes with a reason.
6. **Apply or reject.** The host always has the final say.
7. **View the final results**, then choose another game.

## Scoring at a glance
| Game | Earns points | Loses points |
|---|---|---|
| Al Teelah | Marble in hole +2, strike +3 | Out of turn -1, outside line -1, moving a marble -2 |
| Say Less, Guess More | Correct guess +3, fast guess +1, clean round +2 | Direct clue -2, repeat violation -3 |
| Football | Goal +3, five passes +1, round win +3 | Handball -2, foul -2, time wasting -1 |

The scoreboard always shows **earned points, bonuses, penalties and final score** separately, with a reason for every deduction.

## Fair-play promise
- The AI only changes the score when it is confident.
- If it is unsure, it asks the host to confirm.
- The host can override, undo or adjust any decision.
- Every event is saved in the **FairPlay Event Log** with a timestamp, reason and evidence.

## Privacy
- The camera focuses on the **playing surface, not faces**.
- The microphone is used only in games that need it.
- Camera and mic permission is requested first.
- Recordings are kept only as long as needed for review, unless the host chooses to keep them.

## Built with
- [Base44](https://base44.com) for the app, database and built-in AI integration
- Browser camera and microphone access
- Speech-to-text for clue detection
- Browser speech synthesis for the AI referee's voice

## Known limitations
- Camera detection depends on good lighting, a fixed camera and clearly coloured objects.
- A marble hidden inside a hole, or overlapping marbles, may need host confirmation.
- Speech recognition can miss words, so unclear clues are flagged for review instead of penalised automatically.
- AI judgements are decision support for the host, not a perfect referee.

## Tips for best results
- Fix the camera on a tripod or stand.
- Use high-contrast marbles and bright bibs and balls.
- Mark the lines, holes and goals with tape or cones.
- Play in a quiet space for clue detection.

## Team
Made for **Family AI Game Day**. Add your name and team here.

---
*La'batna (لعبتنا): because the best games are the ones we play together.*
