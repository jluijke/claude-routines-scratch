# Zelda Spelling Quest

A spelling program for a nine-year-old, wrapped in a top-down adventure game.

He explores, fights monsters and collects rupees — but every sealed door, the
bridge over the river, the dungeon bosses and the best gear in the shop open
only for someone who can spell. The curriculum is 40 exercises aligned to
Australian Year 4 expectations, built around discovering patterns rather than
memorising word lists.

## Running it

```bash
npm install
npm run dev          # then open the URL it prints
```

Other commands:

```bash
npm test                 # unit tests (mastery, hints, scheduler, save, pacing)
npm run validate:content # checks the curriculum and world data
npm run typecheck
npm run build            # static files in dist/, hostable anywhere
```

## Controls

Both input methods work everywhere; neither is a second-class citizen.

| | Keyboard | Mouse / trackpad |
|---|---|---|
| Move | Arrows, WASD, or the number pad (including diagonals) | Click or hold where you want to go |
| Sword | Z or Space | Right-click |
| Use item | X | On-screen button |
| Pause | Escape | — |

On a touch screen a d-pad and two buttons appear below the game. In the
exercises everything works by keyboard alone: answers auto-focus, Enter
submits, and word sorting accepts drag, click-then-click, or Tab plus the
group's number.

## For the parent

**Ctrl+Shift+P** opens a dashboard showing which patterns have stuck, which are
shaky, how many hints were used, which words keep going wrong, and the real
balance between playing and spelling. It also exports and imports the progress
file so he can play on more than one device.

Everything stays in the browser's local storage. Nothing is uploaded anywhere.

## How it works

Two subsystems joined by a thin bridge. The world raises a barrier, the
exercise engine answers it, rewards flow back; neither knows the other's
internals.

**The mastery rule shapes everything.** A corrected mistake is not mastery.
Getting a concept wrong schedules a fresh question on the same concept, using a
word he has not just seen, and the exercise cannot finish until he answers one
right first time with no hints.

**Hints are a ladder, not an answer.** Five levels — replay the audio, split
into beats, name the pattern, hide only the tricky letters, narrow it to two
possibilities — and he types the whole word himself even at the top of it.

**Exercises are budgeted by time, not question count.** Each activity type has
a duration estimate, and the scheduler fills an exercise to its target minutes.
A sentence dictation is worth three word sorts, so counting questions would
never hold the ten-minute target. There is no visible timer anywhere.

**Cumulative review from Exercise 6.** Roughly 60% current lesson, 25% recent,
15% older. When a concept goes shaky, targeted practice *replaces* ordinary
review rather than being added to it, so struggling never makes an exercise
longer.

**The pacing governor** tracks minutes played against minutes spelling and
steers quietly toward 50/50: rupees thin out when play runs ahead, optional
doors open free when spelling does. He never sees the ratio.

### Layout

```
src/
  core/      game loop, input, audio (speech + synthesised SFX), save, rng
  game/      world, entities, combat, shop, barriers, pacing, rendering
  spelling/  engine, mastery, hints, scheduler, grading, twelve question types
  content/   concepts, word bank, the 40 exercises — data only
  parent/    the dashboard
tools/       content validator and the browser-driven checks
```

Adding an exercise is data entry. Hints, grading, review selection and duration
budgeting are all driven from the concept registry and the word bank, so
Exercise 38 needed no new application logic — only content.

### Words are authored compactly

```
'fan-tas-tic'   →  syllables fan / tas / tic
'b[oa]t'        →  the tricky pattern is "oa"
'ru[n-n]ing'    →  syllables run / ning, pattern "nn"
```

Hyphens mark syllable breaks and brackets mark the letters a hint should hide.
A concept can override which part its own hints hide, because a word can belong
to two lessons with different tricky parts — "rainbow" is about `ow` for the
/oa/ sound but about `bow` as a compound word.

## Audio

Spoken words use the browser's speech synthesis, preferring an Australian
voice, then British, then any English. Replays are unlimited and never
penalised, and there is a slower playback option. Everything goes through a
`SpeechEngine` interface, so pre-generated audio files can replace the browser
voice later without touching a single exercise.

## A note on the art

All sprites are original, authored as text in `src/game/render/sprites.ts` and
baked to a sprite atlas at boot. The hero is drawn in the visual language of the
1986 NES adventure games — pointed cap, tunic, shield in front, chunky 16×16
proportions — but nothing here is copied from anyone else's game.
