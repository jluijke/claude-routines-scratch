# Zelda Spelling Quest

A spelling program for a nine-year-old, wrapped in a top-down adventure game.

He explores, fights monsters and collects rupees — but every sealed door, the
bridge over the river, the dungeon bosses and the best gear in the shop open
only for someone who can spell. The curriculum is 40 exercises aligned to
Australian Year 4 expectations, built around discovering patterns rather than
memorising word lists.

## Running it

The quickest way — no install, no internet:

```bash
npm install
npm run build:single   # writes dist-single/zelda-spelling-quest.html
```

That one file is the whole game. Double-click it, or copy it to any other
machine or an iPad and open it there. It runs from a `file://` URL, so it is
built as a classic script rather than ES modules, which a browser refuses to
load from a local file.

For development, with hot reload:

```bash
npm run dev            # then open the URL it prints
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
| Swap item | C or Tab | On-screen ↻ button |
| Music on/off | M | — |
| The controls, and pause | Control or Escape | On-screen ? button |

Tapping **Control** pauses the game and shows every key on one screen, so he
never has to be told twice. Held down as a modifier it does nothing — the help
only opens on a tap.

The item in the B slot is shown in the status bar, so he can see what the item
button will do before pressing it.

On a touch screen a d-pad and two buttons appear below the game. In the
exercises everything works by keyboard alone: answers auto-focus, Enter
submits, and word sorting accepts drag, click-then-click, or Tab plus the
group's number.

**Leaving an exercise.** "Leave for now" — or Escape — steps out of an exercise
after asking first. The barrier stays shut, so nothing is skipped, but he is
never stuck in front of a door he cannot spell past today: he can go and explore
somewhere else and come back. The exercise starts again from the beginning next
time, since a run he walked out of proves nothing. Rupees already earned are
kept, and each pattern only ever pays once.

## The first five minutes

He arrives with **nothing** — no sword, no candle, no rupees. A villager on the
square tells him monsters have been carrying treasure into the cave, and that
it is dark in there. The **wooden sword** is lying in the grass at the bottom
right of the square; walking over it picks it up, and only then can he fight.

The cave is pitch black, so the first trip in is a trip straight back out. The
shopkeeper sells the Blue Candle, but stops him first: **two very short
questions**, which pay 70 rupees — enough for the 60-rupee candle. That is the
whole opening loop, and it teaches the thing the rest of the game runs on:
spelling is what buys progress.

Those two questions are not one of the 40. They live outside the curriculum
entirely, so they never touch the exercise count, the parent dashboard, or the
order the real exercises come in.

## The look of the world

Screens are authored as clean rectangles, because that is the readable way to
write a map, and the woods are then grown in unevenly on top — deterministically,
per screen, in `world/scenery.ts`. Forty-seven identical hedged rectangles all
looked like the same place; ragged edges give each clearing a shape you
recognise. The growth never touches a barrier, a door, a spawn or the lane into
an exit, and any planting that would cut a screen in two is undone on the spot,
so the map checks run over the finished result.

## The island

Past the waterfall, at the far western end of the map, is a long stretch of open
water. A line of carved stakes on the shore costs half an exercise to pass. The
water itself costs the **Wings** — they carry you over once and tear doing it,
so the island is a place you fly *to*, not somewhere you wander in and out of.

On it is a cave holding a sea chest with 500 rupees, and below that a castaway
who was marooned the same way and has since gone into business. He asks for
another half exercise, pays 300 for it, and sells the only thing anyone on that
island ever wants — a second pair of Wings, at exactly 300.

Nobody can be stranded there: the fare home is the barrier's own reward, so it
is always affordable even on a second visit with the chest already emptied.

## Items worth knowing about

**Bombs** blow open cracked walls. A cracked wall looks different from ordinary
rock, and behind them are caves, a trader, and the entrance to one of the
dungeons. Sold four at a time.

**The Blue Candle** lights a dark dungeon room, and burns away a bush. Some
bushes are hiding a stairway. It lights once per room, so it is worth thinking
about where to use it.

Neither is signposted. Finding out what is behind a cracked rock by trying a
bomb on it is a better moment than being told.

**The Hollow** is a cave mouth on the village square, in plain sight from the
first minute. Nothing has to be spelled to go in — it is there to be a game
before it is a lesson. It is pitch dark, so the Blue Candle is what turns
stumbling into exploring, and two rooms down there is an unsealed chest holding
a hundred rupees.

## For the parent

**The reading voice** is chosen in that dashboard. The game picks the clearest
voice the browser offers — quality first, accent only as a tie-break — because
macOS ships novelty voices (Grandma, Grandpa, Rocko) in every English locale
including Australian, and picking by accent alone lands on one of those. If the
default still sounds wrong, the dashboard lists every usable voice with a
**Hear it** button; the choice is remembered on that device and never travels in
the progress file, since the available voices differ on every machine.

**Ctrl+Shift+P** (or **⌘+Shift+P** on a Mac) opens a dashboard showing which patterns have stuck, which are
shaky, how many hints were used, which words keep going wrong, and the real
balance between playing and spelling. It also exports and imports the progress
file so he can play on more than one device.

It also holds a **testing kit**: hand over any shop item instantly, or all of
them at once with 999 rupees, skipping both the price and the spelling. It is
there so a parent can check a corner of the game works without playing the whole
curriculum to reach it.

Firefox claims that key combination for its own private window before the page
sees it, so there is also a **"For grown-ups"** link at the foot of the title
screen that opens the same dashboard.

**Starting over** is in that dashboard, under "Start again". It wipes progress,
gear and rupees and returns to the title screen, and asks you to type NEW first
because there is no undo — download the progress file if you might want it
back. The game otherwise saves continuously, so closing the tab loses nothing.

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

**Every barrier is a small quest, not a toll gate.** A river with no bridge and
planks stacked on the bank. A hall whose floor has fallen away. A sluice gate
with letters cut around the wheel. A chest bound with a spelling charm. A
shopkeeper who wants proof before selling you the Wings. Sixty-two of them
across nine kinds, and each one names what it will give you before you start.

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

## Music

There are six original tunes, written for this game and synthesised at
runtime: a marching overworld theme, a slow unfriendly dungeon theme, a close
echoing cave theme, a driving boss theme, a warm title theme and a short shop
lilt. They use the voice layout of the NES sound chip — two pulse channels for
melody and harmony, a triangle for bass, a whisper of noise for percussion —
and they are written as note tokens in `src/core/audio/music.ts`, so a tune can
be adjusted by editing the source rather than reaching for a tracker.

Everything is deliberately quiet, and **M** turns it off. That choice is kept
per device rather than in the save file, so it does not travel when he moves
machines.

**Exercises run in silence.** He has to hear the word being read out, and a
tune underneath makes that harder for exactly the child who needs it clearest.

## Audio

Spoken words use the browser's speech synthesis, preferring an Australian
voice, then British, then any English. Replays are unlimited and never
penalised, and there is a slower playback option. Everything goes through a
`SpeechEngine` interface, so pre-generated audio files can replace the browser
voice later without touching a single exercise.

## Hosting it

Pushing to the branch builds the game and publishes it to GitHub Pages, so he
can open a URL on any device instead of needing Node running. It needs one
switch flipped by hand first: in the repository's **Settings → Pages**, set
**Source** to **GitHub Actions**. After that every push deploys, and the
workflow refuses to publish if the tests or the content validator fail.

## A note on the art

All sprites are original, authored as text in `src/game/render/sprites.ts` and
baked to a sprite atlas at boot. The hero is drawn in the visual language of the
1986 NES adventure games — pointed cap, tunic, shield in front, chunky 16×16
proportions — but nothing here is copied from anyone else's game. The music is
likewise written for this project, in that idiom rather than borrowed from it.

## The map is checked, not just drawn

`src/game/world/analysis.ts` proves four things about the world, and the
content validator fails the build if any of them break:

1. No exit drops the player inside a wall or a river.
2. The screens can all be laid on one consistent map.
3. Every door has a tile you can step onto it from.
4. No barrier can be walked around in the direction it guards.

All four exist because all four were violated at once, and a child got
permanently stuck in a river. `tools/map-smoke.mjs` then walks all 68 crossings
in a real browser and confirms he can still move after each one.

`tools/combat-smoke.mjs` does the same for fighting: it hunts each enemy type
down and fails if one takes more than fourteen swings. That check exists
because the sword's blade used to stick out seven pixels — less than half a
tile — so a child had to be almost touching a monster to hit it, and every
other browser check drove exercises or walked the map without ever trying to
hit anything.
