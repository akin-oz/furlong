# ADR 0007 — Round Flow and State Machine

## Status
Accepted — 2026-05-07
Pending confirmation from Berfu (email sent 2026-05-07) on round selection semantics. If the answer requires balanced horse distribution, the schedule builder will swap implementations without changing this ADR's flow rules.

## Context
The case has two control buttons in the brief: "Generate Program" and "Start the Race". The flow between rounds is not explicit.

## Decision
Race state is a 6-state machine:

- `idle`: page just loaded, no schedule
- `ready`: schedule exists, awaiting Start
- `running`: a round is racing
- `paused`: round halted by user
- `between`: round finished, 1500ms delay before next round
- `finished`: all 6 rounds complete

Transitions:

```
idle → ready (Generate Program)
ready → running (Start)
running → paused (Pause)
paused → running (Resume)
running → between (round finishes; auto)
between → running (after 1500ms; auto)
between → finished (if last round)
finished → ready (Generate Program again)
```

Rounds advance automatically with a 1500ms inter-round delay (see `RACING_CONFIG.flow.interRoundDelayMs`). The user does not click between each round.

Button enable/disable is derived from the state via computed getters (`canStart`, `canPause`, `canSkip`, `canGenerate`).

## Consequences
- The race watches itself; the user's job is just to start/pause/skip
- 1500ms delay lets the user read the result before the next round begins
- Adding a "manual round-by-round" mode later is a one-line change in the `between` transition

## Alternatives considered
- **Manual round triggering**: required clicking Start six times. Rejected as poor UX
- **No inter-round delay**: results panel would update simultaneously with round 2 starting; users would miss results
