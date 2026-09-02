/**
 * The playable world.
 *
 * Owns the current screen, the hero, enemies, drops and barriers. It knows
 * nothing about how a spelling exercise works: when the hero walks into a
 * sealed barrier it raises a request and waits. Whoever is driving the game
 * decides what happens next.
 */
import { GameLoop } from '../core/loop'
import { Input } from '../core/input'
import { sfx } from '../core/audio/sfx'
import { music, type TrackName } from '../core/audio/music'
import { Rng } from '../core/rng'
import { Atlas } from './render/atlas'
import type { SpriteName } from './render/sprites'
import { drawHud, HUD_H } from './render/hud'
import { drawBarriers, drawDarkness, drawGlimmers, drawSpeech, drawTiles, themeFor } from './render/world'
import { itemSprite } from './render/icons'
import { Enemy, isBossKind, overlaps, type Projectile } from './entities/enemies'
import { Player, PLAYER_SIZE, type Facing } from './entities/player'
import { SCREEN_COLS, SCREEN_H, SCREEN_W, TILE, TILES, isSolidChar, toTile, type TileChar } from './world/tiles'
import { screenById, SCREENS, START_SCREEN, type EnemyKind, type Screen } from './world/screens'
import { stepBackFromGate } from './world/analysis'
import { gateById, type Gate } from './gates'
import { ITEMS, materialOf, TOOL_SLOT, type ItemId } from './items'
import { dropMultiplier, opensFreely } from './pacing'
import type { SaveData } from '../core/save'
import { TOTAL_EXERCISES } from '../content/exercises'

/** What the sign says when a dungeon guardian falls. */
export interface BossVictory {
  /** Which dungeon this was, 1 upwards. */
  level: number
  /** How many guardians are down now, this one included, and out of how many. */
  defeated: number
  total: number
  /** The dungeon's name — the region, not the room, since that is what the
   *  level number refers to. */
  dungeonName: string
}

export interface WorldCallbacks {
  /** The hero touched a sealed barrier. Resolve true once it should open. */
  onGate: (gate: Gate) => void
  /** The hero walked into a shop. */
  onShop: (kind: 'village' | 'secret' | 'smith' | 'castaway') => void
  /** Something worth saving happened. */
  onChange: () => void
  /** The hero ran out of hearts. */
  onDefeat: () => void
  /** A line of text to show in the message bar. */
  onMessage: (text: string) => void
  /** Control or Escape: show the controls, paused, until it is dismissed. */
  onHelp: () => void
  /** A dungeon guardian has fallen: show the sign. */
  onBossDefeated: (win: BossVictory) => void
}

interface Drop {
  kind: 'rupee' | 'rupeeBlue' | 'heart'
  x: number
  y: number
  life: number
}

/** A bomb waiting to go off. */
interface Bomb {
  x: number
  y: number
  fuse: number
}

/** The flash after a bomb, or the candle's flame. */
interface Burst {
  x: number
  y: number
  life: number
  kind: 'explosion' | 'flame'
}

/**
 * A crossing by Wings.
 *
 * Purely what is drawn. The wings are already spent, the screen is already
 * loaded, and the hero already stands where he lands — so a tab closed in
 * mid-air reopens with him safe on the far shore, and there is no moment when
 * the save could disagree with itself.
 */
interface Flight {
  /** Frames left before he touches down. */
  frames: number
  /** Where he came in over the water, in world pixels. */
  fromX: number
  fromY: number
  /** The spawn tile, where he is already standing. */
  toX: number
  toY: number
  facing: Facing
}

/**
 * The moment after a guardian falls: he holds his sword up to the empty room.
 */
interface Victory {
  /** Counts down to the sign, then holds at zero until it is dismissed. */
  frames: number
  level: number
  dungeonName: string
}

/** How long the sword stays up before the sign appears: two seconds. */
const VICTORY_FRAMES = 120

/**
 * The rooms with a guardian in them, in map order. Derived rather than written
 * down, so adding a fifth dungeon cannot leave the sign counting to four.
 */
const BOSS_ROOMS = SCREENS
  .filter((screen) => (screen.spawns ?? []).some((spawn) => isBossKind(spawn.kind)))
  .map((screen) => screen.id)

/** 'boss3' -> 3. The guardian knows which dungeon it belongs to. */
function bossLevel(kind: EnemyKind): number {
  const n = Number(kind.replace('boss', ''))
  return Number.isFinite(n) && n > 0 ? n : 1
}

/** How long the Wings carry him in, at sixty frames a second. */
const FLIGHT_FRAMES = 78
/** How high he rides at the top of the arc, in pixels. */
const FLIGHT_HEIGHT = 26
/** One wingbeat every two of these — matched to the beats in the sound. */
const FLAP_FRAMES = 11

const DARK_RADIUS = 20
/** How close he has to stand before a villager speaks up. */
const TALK_RADIUS = 26
const LIT_RADIUS = 78

export class World {
  readonly canvas: HTMLCanvasElement
  private readonly ctx: CanvasRenderingContext2D
  private readonly atlas: Atlas
  private readonly loop: GameLoop
  private readonly input: Input
  private readonly rng = new Rng(Date.now())

  private screen: Screen
  private player: Player
  private enemies: Enemy[] = []
  private projectiles: Projectile[] = []
  private drops: Drop[] = []
  private bombs: Bomb[] = []
  private bursts: Burst[] = []
  /** The candle lights one flame per room, as the blue one always did. */
  private candleUsedHere = false
  private frame = 0
  private transition = 0
  /** Set while he is in the air on the Wings. Nothing else moves meanwhile. */
  private flight: Flight | undefined
  /**
   * Set from the moment a guardian dies until the sign is dismissed. The world
   * is frozen throughout, and `clearVictory()` is the only way out — anything
   * that later adds another way to close that panel must call it too.
   */
  private victory: Victory | undefined
  private message = ''
  private messageTimer = 0
  /** Barrier the hero is standing against, if any. */
  private pendingGate: Gate | undefined
  /**
   * A barrier he has just declined or walked away from. It stays quiet until he
   * is no longer standing against it, so he can turn round and go somewhere
   * else instead of being asked the same question every frame.
   */
  private suppressedGate: string | undefined
  private paused = false
  private playAccumulator = 0

  constructor(
    container: HTMLElement,
    private save: SaveData,
    private readonly callbacks: WorldCallbacks,
  ) {
    this.canvas = document.createElement('canvas')
    this.canvas.width = SCREEN_W
    this.canvas.height = SCREEN_H + HUD_H
    this.canvas.className = 'game-canvas'
    container.append(this.canvas)

    const ctx = this.canvas.getContext('2d')
    if (!ctx) throw new Error('This browser cannot draw the game.')
    this.ctx = ctx
    this.ctx.imageSmoothingEnabled = false

    this.atlas = new Atlas()

    this.screen = screenById(save.player.screenId) ?? (screenById(START_SCREEN) as Screen)
    this.player = new Player(
      {
        ...(save.player.equippedSword ? { sword: save.player.equippedSword } : {}),
        shield: save.player.equippedShield,
        ...(save.player.equippedTunic ? { tunic: save.player.equippedTunic } : {}),
        ...(save.inventory.blueRing ? { ring: 'blueRing' as ItemId } : {}),
      },
      save.player.hearts,
      save.player.maxHearts,
    )
    this.player.x = save.player.x
    this.player.y = save.player.y

    this.input = new Input(this.canvas, (clientX, clientY) => this.toWorld(clientX, clientY))
    Input.buildTouchControls(container, {
      press: (key) => this.input.pressVirtual(key),
      release: (key) => this.input.releaseVirtual(key),
    })

    this.loadScreen(this.screen.id, false)
    // A save written before the doorway shove was fixed can hold a position
    // inside a wall. Release him on load rather than making him start again.
    this.ensureFree()

    this.loop = new GameLoop({
      update: (step) => this.update(step),
      render: () => this.render(),
    })
  }

  start(): void {
    this.loop.start()
    this.input.resume()
    music.play(this.trackFor(this.screen))
  }

  stop(): void {
    this.loop.stop()
    this.input.suspend()
    this.syncSave()
  }

  /** Silence the music. Used while an exercise is running. */
  hushMusic(): void {
    music.stop()
  }

  isRunning(): boolean {
    return this.loop.isRunning()
  }

  setPaused(paused: boolean): void {
    this.paused = paused
    if (paused) this.input.suspend()
    else this.input.resume()
  }

  destroy(): void {
    this.stop()
    this.input.destroy()
    this.canvas.remove()
  }

  /** Writes the live state back into the save object. */
  syncSave(): void {
    this.save.player.hearts = this.player.hearts
    this.save.player.maxHearts = this.player.maxHearts
    this.save.player.screenId = this.screen.id
    this.save.player.x = this.player.x
    this.save.player.y = this.player.y
    if (this.player.loadout.sword) this.save.player.equippedSword = this.player.loadout.sword
    this.save.player.equippedShield = this.player.loadout.shield
    if (this.player.loadout.tunic) this.save.player.equippedTunic = this.player.loadout.tunic
  }

  /** Re-reads gear and hearts after a shop visit or an exercise reward. */
  refreshFromSave(): void {
    if (this.save.player.equippedSword) this.player.loadout.sword = this.save.player.equippedSword
    this.player.loadout.shield = this.save.player.equippedShield
    if (this.save.player.equippedTunic) this.player.loadout.tunic = this.save.player.equippedTunic
    if (this.save.inventory.blueRing) this.player.loadout.ring = 'blueRing'
    this.player.maxHearts = this.save.player.maxHearts
    this.player.hearts = Math.min(this.save.player.hearts, this.player.maxHearts)
  }

  showMessage(text: string, frames = 260): void {
    this.message = text
    this.messageTimer = frames
    this.callbacks.onMessage(text)
  }

  /** Called once a barrier's exercise has been completed. */
  openGate(gate: Gate): void {
    if (!this.save.world.openedGates.includes(gate.id)) {
      this.save.world.openedGates.push(gate.id)
    }
    if (gate.reward.unlock && !this.save.world.openedGates.includes(gate.reward.unlock)) {
      // Some barriers unseal another as well — a hidden shop, say.
      this.save.world.openedGates.push(gate.reward.unlock)
    }
    sfx.play('gateOpen')
    this.showMessage(gate.openMessage)
    this.pendingGate = undefined
    // Step the hero back so they are not standing inside the doorway.
    this.stepAwayFromGate(gate.id)
    this.ensureFree()
    this.callbacks.onChange()
  }

  /** The child declined the challenge; do not re-prompt until they walk off. */
  declineGate(): void {
    const declined = this.pendingGate
    if (declined) this.suppressedGate = declined.id
    this.pendingGate = undefined
    if (declined) this.stepAwayFromGate(declined.id)
    this.ensureFree()
    this.input.clearTarget()
  }

  /**
   * Same idea across a world rebuild: after leaving an exercise part-way, the
   * hero is restored standing against the door he just walked away from, so
   * without this the prompt fires again before he can press anything.
   */
  suppressGate(gateId: string): void {
    this.suppressedGate = gateId
    this.input.clearTarget()
  }

  /** Solidity as the player experiences it right now. */
  private blockedHere(): (x: number, y: number) => boolean {
    const opened = this.openedTiles()
    const canCrossWater = this.save.inventory.wings !== undefined
    return (x, y) => this.isSolidAt(x, y, opened, canCrossWater)
  }

  private wouldOverlap(x: number, y: number): boolean {
    return this.player.overlaps(x, y, this.blockedHere())
  }

  /**
   * Steps back from a door so the hero is not standing in the doorway. The
   * rule itself lives in world/analysis so the map checks can run it over
   * every barrier rather than over a copy of it.
   */
  private stepAwayFromGate(gateId: string): void {
    const placement = (this.screen.gates ?? []).find((g) => g.gateId === gateId)
    if (!placement) return
    const landed = stepBackFromGate(
      placement,
      { x: this.player.x, y: this.player.y },
      (x, y) => !this.wouldOverlap(x, y),
    )
    this.player.x = landed.x
    this.player.y = landed.y
  }

  /**
   * Never leave the hero inside a wall. Any placement — a restored save, a
   * doorway, a debug teleport — goes through this, so a bad position is
   * corrected on the spot instead of becoming a save file nobody can play.
   */
  private ensureFree(): void {
    if (!this.wouldOverlap(this.player.x, this.player.y)) return
    let best: { x: number; y: number; distance: number } | undefined
    for (let row = 0; row < 11; row++) {
      for (let col = 0; col < 16; col++) {
        const x = col * TILE + (TILE - PLAYER_SIZE) / 2
        const y = row * TILE + (TILE - PLAYER_SIZE) / 2
        if (this.wouldOverlap(x, y)) continue
        const distance = Math.hypot(x - this.player.x, y - this.player.y)
        if (!best || distance < best.distance) best = { x, y, distance }
      }
    }
    if (!best) return
    this.player.x = best.x
    this.player.y = best.y
  }

  // ------------------------------------------------------------ screen setup

  private loadScreen(id: string, remember = true): void {
    const next = screenById(id)
    if (!next) return
    this.screen = next
    this.enemies = []
    this.projectiles = []
    this.drops = []
    this.bombs = []
    this.bursts = []
    this.candleUsedHere = false
    // Load-bearing: teleport, respawn and the dev console all come through
    // here, and a flight left over from another screen would draw the hero at
    // a position that no longer means anything.
    this.flight = undefined
    this.victory = undefined
    this.transition = 12

    const cleared = this.save.world.defeatedBosses
    for (const [index, spawn] of (next.spawns ?? []).entries()) {
      // A defeated boss stays defeated — all of them, not just the two that
      // existed when this was written. Asked of the archetype table rather than
      // a list of names that has to be remembered.
      if (isBossKind(spawn.kind) && cleared.includes(next.id)) continue
      this.enemies.push(new Enemy(spawn.kind, spawn.col, spawn.row, this.rng.int(1, 1e9) + index))
    }

    if (remember && !this.save.world.visitedScreens.includes(id)) {
      this.save.world.visitedScreens.push(id)
    }
    music.play(this.trackFor(next))
    if (next.shop) this.callbacks.onShop(next.shop)
  }

  /** Key for a tile the child has permanently cleared on this screen. */
  private brokenKey(col: number, row: number): string {
    return `${this.screen.id}:${col},${row}`
  }

  private isBroken(col: number, row: number): boolean {
    return this.save.world.brokenTiles.includes(this.brokenKey(col, row))
  }

  /** Records a cracked wall blown open or a bush burned away, for good. */
  private breakTile(col: number, row: number): void {
    const key = this.brokenKey(col, row)
    if (this.save.world.brokenTiles.includes(key)) return
    this.save.world.brokenTiles.push(key)
    this.callbacks.onChange()
  }

  /** Which tune suits this room. */
  private trackFor(screen: Screen): TrackName {
    const boss = (screen.spawns ?? []).some((s) => isBossKind(s.kind))
    if (boss && !this.save.world.defeatedBosses.includes(screen.id)) return 'boss'
    if (screen.shop) return 'shop'
    const theme = themeFor(screen)
    if (theme === 'dungeon') return 'dungeon'
    if (theme === 'cave') return 'cave'
    return 'overworld'
  }

  /** Called after a boss dies, so the room stops sounding urgent. */
  private refreshMusic(): void {
    music.play(this.trackFor(this.screen))
  }

  private openedTiles(): Set<string> {
    const opened = new Set<string>()
    for (const key of this.save.world.brokenTiles) {
      const [screenId, coords] = key.split(':')
      if (screenId === this.screen.id && coords) opened.add(coords)
    }
    for (const placement of this.screen.gates ?? []) {
      const isOpen =
        this.save.world.openedGates.includes(placement.gateId) ||
        this.isFreelyOpen(placement.gateId)
      if (!isOpen) continue
      for (const tile of placement.opens ?? [{ col: placement.col, row: placement.row }]) {
        opened.add(`${tile.col},${tile.row}`)
      }
    }
    return opened
  }

  /** Optional barriers swing open by themselves when spelling is ahead. */
  private isFreelyOpen(gateId: string): boolean {
    const gate = gateById(gateId)
    if (!gate?.optional) return false
    return opensFreely(this.save.pacing)
  }

  // ------------------------------------------------------------------ update

  private update(step: number): void {
    this.frame += 1
    if (this.paused) return
    if (this.transition > 0) {
      this.transition -= 1
      return
    }
    // In the air. Returning here freezes everything below — input, enemies,
    // projectiles, combat, and the portal he is flying towards — so nothing can
    // hit him mid-crossing and he cannot bounce straight back the way he came.
    if (this.victory) {
      if (this.victory.frames > 0) {
        this.victory.frames -= 1
        if (this.victory.frames === 0) {
          this.callbacks.onBossDefeated({
            level: this.victory.level,
            dungeonName: this.victory.dungeonName,
            defeated: this.save.world.defeatedBosses.filter((id) => BOSS_ROOMS.includes(id)).length,
            total: BOSS_ROOMS.length,
          })
        }
      }
      // The pose holds under the sign until it is dismissed.
      return
    }
    if (this.flight) {
      this.flight.frames -= 1
      if (this.flight.frames <= 0) {
        this.flight = undefined
        this.input.clearTarget()
        this.showMessage('The Wings tear apart as you land. That crossing was one way.')
      }
      return
    }

    // Time spent actually playing feeds the 50/50 governor.
    this.playAccumulator += step
    if (this.playAccumulator >= 1) {
      const whole = Math.floor(this.playAccumulator)
      this.save.pacing.playSeconds += whole
      this.playAccumulator -= whole
    }

    const state = this.input.read()
    if (state.help) {
      this.callbacks.onHelp()
      return
    }

    let dx = state.dx
    let dy = state.dy

    // Click or tap to walk: head toward the point until close enough.
    if ((dx === 0 && dy === 0) && state.moveTarget) {
      const centre = this.player.centre()
      const tx = state.moveTarget.x - centre.x
      const ty = state.moveTarget.y - centre.y
      const distance = Math.hypot(tx, ty)
      if (distance > 5) {
        dx = tx / distance
        dy = ty / distance
      } else {
        this.input.clearTarget()
      }
    }

    if (state.attack) {
      this.player.attack()
      sfx.play('swordSwing')
    }
    if (state.useItem) this.useItem()
    if (state.cycleItem) this.cycleTool()

    const opened = this.openedTiles()
    const blocked = this.blockedHere()

    this.player.update(step, dx, dy, blocked)
    this.clampToScreen()
    // Belt and braces: nothing should ever put him inside a wall, but if
    // something does, he is out of it on the next frame rather than for good.
    this.ensureFree()
    this.checkGateContact(opened)
    this.checkTreasure()
    this.checkPickup()
    this.checkPortals()
    this.checkEdges()

    const target = this.player.centre()
    for (const enemy of this.enemies) {
      enemy.update(step, target, blocked, (p) => this.projectiles.push(p))
    }

    this.resolveCombat()
    this.updateProjectiles(step)
    this.updateDrops(step)
    this.updateBombs(step)

    if (this.messageTimer > 0) {
      this.messageTimer -= 1
      if (this.messageTimer === 0) {
        this.message = ''
        this.callbacks.onMessage('')
      }
    }

    if (this.player.isDead()) {
      this.callbacks.onDefeat()
    }
  }

  private isSolidAt(
    x: number,
    y: number,
    opened: ReadonlySet<string>,
    canCrossWater: boolean,
  ): boolean {
    const { col, row } = toTile(x, y)
    if (col < 0 || row < 0 || col >= 16 || row >= 11) return true
    if (opened.has(`${col},${row}`)) return false
    const char = ((this.screen.rows[row] ?? '')[col] ?? '#') as TileChar
    return isSolidChar(char, canCrossWater)
  }

  private clampToScreen(): void {
    this.player.x = Math.max(-4, Math.min(SCREEN_W - PLAYER_SIZE + 4, this.player.x))
    this.player.y = Math.max(-4, Math.min(SCREEN_H - PLAYER_SIZE + 4, this.player.y))
  }

  /** Walking into a sealed barrier raises it; the driver decides what happens. */
  private checkGateContact(opened: ReadonlySet<string>): void {
    if (this.pendingGate) return
    const centre = this.player.centre()
    const ahead = this.pointAhead(centre, this.player.facing, 8)
    const { col, row } = toTile(ahead.x, ahead.y)

    let touchingSuppressed = false
    for (const placement of this.screen.gates ?? []) {
      const tiles = placement.opens ?? [{ col: placement.col, row: placement.row }]
      const touching =
        (placement.col === col && placement.row === row) ||
        tiles.some((t) => t.col === col && t.row === row)
      if (!touching) continue
      if (this.save.world.openedGates.includes(placement.gateId)) continue
      if (opened.has(`${col},${row}`)) continue
      if (placement.gateId === this.suppressedGate) {
        touchingSuppressed = true
        continue
      }

      const gate = gateById(placement.gateId)
      if (!gate) continue
      this.pendingGate = gate
      this.callbacks.onGate(gate)
      return
    }
    // He has stepped off it, so it may ask again next time he walks up.
    if (!touchingSuppressed) this.suppressedGate = undefined
  }

  private pointAhead(from: { x: number; y: number }, facing: Facing, distance: number) {
    switch (facing) {
      case 'up': return { x: from.x, y: from.y - distance }
      case 'down': return { x: from.x, y: from.y + distance }
      case 'left': return { x: from.x - distance, y: from.y }
      case 'right': return { x: from.x + distance, y: from.y }
    }
  }

  private checkPortals(): void {
    const centre = this.player.centre()
    const { col, row } = toTile(centre.x, centre.y)
    for (const portal of this.screen.portals ?? []) {
      if (portal.col !== col || portal.row !== row) continue
      // A doorway that a barrier still seals cannot be walked through.
      if (this.tileStillSealed(col, row)) return
      // A stairway hidden under a bush stays hidden until the bush is burned.
      // Bushes are walkable, so without this he would fall down it by accident
      // and the candle would have nothing to find.
      const char = ((this.screen.rows[row] ?? '')[col] ?? '.') as TileChar
      if (TILES[char]?.bush && !this.isBroken(col, row)) return
      // A stretch of open water is crossed with the Wings, and the crossing
      // wears them out — so the island is a place you fly to, not a place you
      // wander in and out of.
      if (portal.requires && (this.save.inventory[portal.requires] ?? 0) === 0) {
        this.showMessage(portal.refusal ?? 'You cannot get across this without help.')
        return
      }
      if (portal.requires && portal.consumes) {
        const left = (this.save.inventory[portal.requires] ?? 0) - 1
        if (left > 0) this.save.inventory[portal.requires] = left
        else delete this.save.inventory[portal.requires]
        this.equipBest()
      }

      // Everything that changes state happens here, in one frame, exactly as it
      // did before there was an animation: the wings are spent above, the
      // screen loads, he stands where he lands, the save is written. The flight
      // that follows is only what is drawn, so there is no instant at which a
      // closed tab could lose the crossing or the Wings.
      const flying = portal.requires === 'wings'
      this.loadScreen(portal.to)
      this.player.placeAtTile(portal.spawnCol, portal.spawnRow)
      this.ensureFree()
      this.input.clearTarget()
      this.callbacks.onChange()
      if (flying) this.beginFlight(portal.spawnCol)
      return
    }
  }

  /**
   * An unsealed chest, opened by walking into it. No spelling, no key: this one
   * pays for having gone and looked, which is the reason to go down a hole in
   * the ground in the first place.
   */
  private checkTreasure(): void {
    const treasure = this.screen.treasure
    if (!treasure) return
    if (this.save.world.takenChests.includes(treasure.id)) return

    const ahead = this.pointAhead(this.player.centre(), this.player.facing, 8)
    const { col, row } = toTile(ahead.x, ahead.y)
    const here = toTile(this.player.centre().x, this.player.centre().y)
    const touching =
      (col === treasure.col && row === treasure.row) ||
      (here.col === treasure.col && here.row === treasure.row)
    if (!touching) return

    this.save.world.takenChests.push(treasure.id)
    this.save.player.rupees += treasure.rupees
    sfx.play('fanfare')
    this.showMessage(`${treasure.message} +${treasure.rupees} rupees.`)
    this.callbacks.onChange()
  }

  /**
   * An item lying on the ground. Walking across it is enough — no facing, no
   * button. The first thing a child does in this game is find a sword, and that
   * should not need explaining to him.
   */
  private checkPickup(): void {
    const pickup = this.screen.pickup
    if (!pickup) return
    if (this.save.world.takenChests.includes(pickup.id)) return

    const body = { x: this.player.x, y: this.player.y, w: PLAYER_SIZE, h: PLAYER_SIZE }
    const tile = { x: pickup.col * TILE, y: pickup.row * TILE, w: TILE, h: TILE }
    if (!overlaps(body, tile)) return

    this.save.world.takenChests.push(pickup.id)
    // A second candle is no better than the first, so a tool he already owns
    // tops up to one rather than to two.
    const held = this.save.inventory[pickup.item] ?? 0
    this.save.inventory[pickup.item] = ITEMS[pickup.item].stackable ? held + 1 : Math.max(held, 1)
    this.equipBest()
    sfx.play('secret')
    // Each pickup says its own piece. This used to append "You can swing it
    // with Z or Space" to everything, which is true of a sword and nonsense
    // about a candle.
    this.showMessage(pickup.message)
    this.callbacks.onChange()
  }

  private tileStillSealed(col: number, row: number): boolean {
    for (const placement of this.screen.gates ?? []) {
      const tiles = placement.opens ?? [{ col: placement.col, row: placement.row }]
      if (!tiles.some((t) => t.col === col && t.row === row)) continue
      if (this.save.world.openedGates.includes(placement.gateId)) continue
      if (this.isFreelyOpen(placement.gateId)) continue
      return true
    }
    return false
  }

  /**
   * Walking off an edge cuts to the next screen, NES style. The threshold sits
   * just inside where clampToScreen stops the player, so pushing against the
   * border always triggers the change rather than pinning them there.
   */
  private checkEdges(): void {
    const { exits } = this.screen
    const centre = this.player.centre()
    const margin = 5

    if (centre.y < margin && exits.up) return this.moveScreen(exits.up, 'up')
    if (centre.y > SCREEN_H - margin && exits.down) return this.moveScreen(exits.down, 'down')
    if (centre.x < margin && exits.left) return this.moveScreen(exits.left, 'left')
    if (centre.x > SCREEN_W - margin && exits.right) return this.moveScreen(exits.right, 'right')
  }

  private moveScreen(id: string, direction: Facing): void {
    this.loadScreen(id)
    const margin = TILE
    switch (direction) {
      case 'up': this.player.y = SCREEN_H - margin - PLAYER_SIZE; break
      case 'down': this.player.y = margin; break
      case 'left': this.player.x = SCREEN_W - margin - PLAYER_SIZE; break
      case 'right': this.player.x = margin; break
    }
    this.ensureFree()
    this.input.clearTarget()
    this.callbacks.onChange()
  }

  // ------------------------------------------------------------------ combat

  private resolveCombat(): void {
    const sword = this.player.swordBox()
    const playerBox = { x: this.player.x, y: this.player.y, w: PLAYER_SIZE, h: PLAYER_SIZE }

    for (const enemy of [...this.enemies]) {
      const box = enemy.box()

      if (sword && overlaps(sword, box)) {
        if (enemy.hurt(this.player.swordDamage)) {
          sfx.play('enemyHit')
          if (enemy.isDead()) this.defeat(enemy)
        }
      }

      if (overlaps(playerBox, box)) {
        const centre = enemy.centre()
        if (this.player.hurt(enemy.def.damage, centre.x, centre.y)) {
          sfx.play('playerHurt')
          this.callbacks.onChange()
        }
      }
    }
  }

  private defeat(enemy: Enemy): void {
    this.enemies = this.enemies.filter((e) => e !== enemy)
    const centre = enemy.centre()

    if (enemy.isBoss) {
      if (!this.save.world.defeatedBosses.includes(this.screen.id)) {
        this.save.world.defeatedBosses.push(this.screen.id)
      }
      sfx.play('bossFanfare')
      this.refreshMusic()
      // Nothing it fired, and nothing he threw, should hang in the air behind
      // the celebration — none of it will be ticked while this holds.
      this.projectiles = []
      this.bombs = []
      this.bursts = []
      this.victory = {
        frames: VICTORY_FRAMES,
        level: bossLevel(enemy.kind),
        dungeonName: this.screen.region,
      }
    }

    // Rupee drops thin out when play is running ahead of spelling.
    const luck = dropMultiplier(this.save.pacing)
    const value = enemy.rupeeValue()
    if (this.rng.chance(Math.min(0.95, 0.45 * luck))) {
      this.drops.push({
        kind: value >= 3 ? 'rupeeBlue' : 'rupee',
        x: centre.x - 4,
        y: centre.y - 4,
        life: 600,
      })
    } else if (this.rng.chance(0.18)) {
      this.drops.push({ kind: 'heart', x: centre.x - 4, y: centre.y - 4, life: 600 })
    }
    this.callbacks.onChange()
  }

  private updateProjectiles(step: number): void {
    const playerBox = { x: this.player.x, y: this.player.y, w: PLAYER_SIZE, h: PLAYER_SIZE }
    const survivors: Projectile[] = []

    const opened = this.openedTiles()
    const canCrossWater = this.save.inventory.wings !== undefined

    for (const shot of this.projectiles) {
      shot.x += shot.vx * step
      shot.y += shot.vy * step
      shot.life -= 1
      if (shot.life <= 0) continue
      if (shot.x < -8 || shot.y < -8 || shot.x > SCREEN_W + 8 || shot.y > SCREEN_H + 8) continue

      // Only the caster's magic passes through rock; everything else stops at
      // it, so taking cover behind a wall actually works.
      if (!shot.throughWalls && this.isSolidAt(shot.x + 4, shot.y + 4, opened, canCrossWater)) continue

      const box = { x: shot.x, y: shot.y, w: 8, h: 8 }
      if (overlaps(playerBox, box)) {
        // A shield only helps if you are facing the thing that is shooting you.
        if (this.player.blocks(shot.vx, shot.vy)) {
          sfx.play('enemyHit')
          continue
        }
        if (this.player.hurt(shot.damage, shot.x, shot.y)) {
          sfx.play('playerHurt')
          this.callbacks.onChange()
        }
        continue
      }
      survivors.push(shot)
    }
    this.projectiles = survivors
  }

  private updateDrops(step: number): void {
    const playerBox = { x: this.player.x, y: this.player.y, w: PLAYER_SIZE, h: PLAYER_SIZE }
    const remaining: Drop[] = []

    for (const drop of this.drops) {
      drop.life -= step * 60
      if (drop.life <= 0) continue

      if (overlaps(playerBox, { x: drop.x, y: drop.y, w: 8, h: 8 })) {
        if (drop.kind === 'heart') {
          this.player.heal(1)
          sfx.play('heart')
        } else {
          this.save.player.rupees += drop.kind === 'rupeeBlue' ? 5 : 1
          sfx.play('rupee')
        }
        this.callbacks.onChange()
        continue
      }
      remaining.push(drop)
    }
    this.drops = remaining
  }

  /** Tools he actually owns, in cycle order. */
  private ownedTools(): ItemId[] {
    return TOOL_SLOT.filter((id) => (this.save.inventory[id] ?? 0) > 0)
  }

  /** The item in the B slot, falling back to the first one he owns. */
  selectedTool(): ItemId | undefined {
    const owned = this.ownedTools()
    const chosen = this.save.player.equippedTool
    if (chosen && owned.includes(chosen)) return chosen
    return owned[0]
  }

  /** Steps to the next tool he owns. */
  cycleTool(): void {
    const owned = this.ownedTools()
    if (owned.length === 0) {
      this.showMessage('You have no items to use yet.', 80)
      return
    }
    // selectedTool() falls back to the first item he owns, so before he has
    // ever chosen one the "current" tool is already owned[0]. Starting from 0
    // makes the first press actually move to the next item.
    const current = this.selectedTool()
    const index = current ? owned.indexOf(current) : 0
    const next = owned[(index + 1) % owned.length] as ItemId
    this.save.player.equippedTool = next
    sfx.play('select')
    this.showMessage(`${ITEMS[next].name} ready.`, 70)
    this.callbacks.onChange()
  }

  /** Uses whatever is in the B slot. */
  private useItem(): void {
    const tool = this.selectedTool()
    if (!tool) {
      this.showMessage('Nothing to use yet. Buy something at the shop.', 80)
      return
    }

    switch (tool) {
      case 'bomb':
        return this.placeBomb()
      case 'blueCandle':
        return this.lightCandle()
      case 'bait':
        return this.dropBait()
      case 'recoveryHeart':
        return this.eatHeart()
      default:
        this.showMessage('You cannot use that here.', 70)
    }
  }

  private placeBomb(): void {
    if ((this.save.inventory.bomb ?? 0) <= 0) {
      this.showMessage('You are out of bombs.', 80)
      return
    }
    // One at a time, so a handful of bombs cannot clear a whole room at once.
    if (this.bombs.length > 0) return

    this.save.inventory.bomb = (this.save.inventory.bomb ?? 0) - 1
    const centre = this.player.centre()
    const spot = this.pointAhead(centre, this.player.facing, 14)
    this.bombs.push({ x: spot.x - 4, y: spot.y - 4, fuse: 100 })
    sfx.play('select')
    this.callbacks.onChange()
  }

  private lightCandle(): void {
    if (this.candleUsedHere) {
      this.showMessage('The blue candle only lights once in each room.', 90)
      return
    }
    this.candleUsedHere = true
    const centre = this.player.centre()
    const ahead = this.pointAhead(centre, this.player.facing, 18)
    this.bursts.push({ x: ahead.x - 4, y: ahead.y - 4, life: 34, kind: 'flame' })
    sfx.play('swordSwing')

    // Burn the bush in front, or the one he is standing in. Demanding exact
    // alignment from a nine-year-old turns a nice discovery into a chore.
    this.burnAt(ahead.x, ahead.y, centre.x, centre.y)
  }

  private dropBait(): void {
    if (this.enemies.length === 0) {
      this.showMessage('Nothing here is hungry.', 70)
      return
    }
    this.save.inventory.bait = (this.save.inventory.bait ?? 0) - 1
    const centre = this.player.centre()
    const spot = this.pointAhead(centre, this.player.facing, 24)
    for (const enemy of this.enemies) enemy.distract(spot.x, spot.y)
    this.showMessage('The monsters stop to eat.', 120)
    this.callbacks.onChange()
  }

  private eatHeart(): void {
    if (this.player.hearts >= this.player.maxHearts) {
      this.showMessage('You are already at full health.', 70)
      return
    }
    this.save.inventory.recoveryHeart = (this.save.inventory.recoveryHeart ?? 0) - 1
    this.player.heal(1)
    sfx.play('heart')
    this.showMessage('You feel better.', 90)
    this.callbacks.onChange()
  }

  /** The candle's flame burns away a bush and singes anything standing in it. */
  private burnAt(x: number, y: number, fallbackX?: number, fallbackY?: number): void {
    const candidates: { col: number; row: number }[] = [toTile(x, y)]
    if (fallbackX !== undefined && fallbackY !== undefined) {
      candidates.push(toTile(fallbackX, fallbackY))
    }

    const bush = candidates.find(({ col, row }) => {
      const char = ((this.screen.rows[row] ?? '')[col] ?? '.') as TileChar
      return TILES[char]?.bush === true && !this.isBroken(col, row)
    })

    if (bush) {
      this.breakTile(bush.col, bush.row)
      sfx.play('secret')
      this.showMessage('The bush burns away.')
    } else {
      this.showMessage('The flame gutters out.', 70)
    }

    for (const enemy of [...this.enemies]) {
      const centre = enemy.centre()
      if (Math.hypot(centre.x - x, centre.y - y) > 16) continue
      if (enemy.hurt(1)) {
        sfx.play('enemyHit')
        if (enemy.isDead()) this.defeat(enemy)
      }
    }
  }

  private updateBombs(step: number): void {
    for (const bomb of [...this.bombs]) {
      bomb.fuse -= step * 60
      if (bomb.fuse > 0) continue
      this.bombs = this.bombs.filter((b) => b !== bomb)
      this.explode(bomb.x + 4, bomb.y + 4)
    }

    for (const burst of [...this.bursts]) {
      burst.life -= step * 60
      if (burst.life <= 0) this.bursts = this.bursts.filter((b) => b !== burst)
    }
  }

  private explode(x: number, y: number): void {
    this.bursts.push({ x: x - 8, y: y - 8, life: 26, kind: 'explosion' })
    sfx.play('playerHurt')

    // Open any cracked wall the blast touches.
    let opened = false
    const { col, row } = toTile(x, y)
    for (let dc = -1; dc <= 1; dc++) {
      for (let dr = -1; dr <= 1; dr++) {
        const c = col + dc
        const r = row + dr
        const char = ((this.screen.rows[r] ?? '')[c] ?? '.') as TileChar
        if (!TILES[char]?.cracked || this.isBroken(c, r)) continue
        this.breakTile(c, r)
        opened = true
      }
    }

    if (opened) {
      sfx.play('secret')
      this.showMessage('The cracked rock blows apart, revealing a way through.')
    }

    // Bombs hurt monsters, not the child. Getting the placement slightly wrong
    // should cost a bomb, not a heart.
    for (const enemy of [...this.enemies]) {
      const centre = enemy.centre()
      if (Math.hypot(centre.x - x, centre.y - y) > 26) continue
      if (enemy.hurt(3)) {
        sfx.play('enemyHit')
        if (enemy.isDead()) this.defeat(enemy)
      }
    }
  }

  // ------------------------------------------------------------------ render

  private render(): void {
    const ctx = this.ctx
    ctx.save()
    ctx.translate(0, HUD_H)

    const opened = this.openedTiles()
    drawTiles(ctx, this.screen, opened, this.frame)
    drawBarriers(ctx, this.atlas, this.screen, opened, this.frame)

    for (const prop of this.screen.props ?? []) {
      this.atlas.draw(ctx, prop.sprite, prop.col * TILE, prop.row * TILE)
    }

    const pickup = this.screen.pickup
    if (pickup && !this.save.world.takenChests.includes(pickup.id)) {
      // Bob it gently, so a sword in the grass reads as a thing to collect.
      const bob = Math.sin(this.frame / 20) > 0 ? 0 : 1
      this.atlas.draw(ctx, itemSprite(pickup.item), pickup.col * TILE, pickup.row * TILE - bob)
    }

    const treasure = this.screen.treasure
    if (treasure) {
      const taken = this.save.world.takenChests.includes(treasure.id)
      this.atlas.draw(ctx, taken ? 'chestOpen' : 'chestClosed', treasure.col * TILE, treasure.row * TILE)
    }

    for (const drop of this.drops) {
      // Blink when it is about to disappear, so it does not simply vanish.
      if (drop.life < 120 && Math.floor(this.frame / 6) % 2 === 0) continue
      this.atlas.draw(ctx, drop.kind, drop.x, drop.y)
    }

    for (const enemy of this.enemies) {
      const flashing = enemy.hurtTimer > 0 && Math.floor(this.frame / 3) % 2 === 0
      const blinking = enemy.isBlinking && Math.floor(this.frame / 2) % 2 === 0
      if (!flashing && !blinking) this.atlas.draw(ctx, enemy.sprite, enemy.x, enemy.y)
    }

    for (const shot of this.projectiles) {
      this.atlas.draw(ctx, shot.magic ? 'magicBolt' : 'projectile', shot.x, shot.y)
    }

    for (const bomb of this.bombs) {
      // Flashes faster as the fuse runs down.
      const urgency = bomb.fuse < 34 ? 3 : bomb.fuse < 66 ? 6 : 10
      const lit = Math.floor(this.frame / urgency) % 2 === 0
      this.atlas.draw(ctx, lit ? 'bombLit' : 'bomb', bomb.x, bomb.y)
    }

    for (const burst of this.bursts) {
      if (Math.floor(this.frame / 3) % 2 === 0 && burst.life < 10) continue
      this.atlas.draw(ctx, burst.kind === 'explosion' ? 'explosion' : 'flame', burst.x, burst.y)
    }

    if (this.flight) this.drawFlight(ctx)
    else if (this.victory) this.drawVictoryHero(ctx)
    else this.drawPlayer(ctx)
    this.drawNearbyTalk(ctx)

    if (this.screen.dark) {
      const lit = this.save.inventory.blueCandle ? LIT_RADIUS : DARK_RADIUS
      drawDarkness(ctx, this.player.centre(), lit, SCREEN_W, SCREEN_H)
      // Over the darkness: a hint that there is somewhere to go.
      drawGlimmers(ctx, this.screen, this.frame, this.save.world.takenChests, opened)
    }

    // Over the darkness, so a boss room lights up when its guardian falls.
    if (this.victory) this.drawVictoryLight(ctx)

    if (this.transition > 0) {
      ctx.fillStyle = `rgba(0,0,0,${this.transition / 12})`
      ctx.fillRect(0, 0, SCREEN_W, SCREEN_H)
    }

    ctx.restore()

    const tool = this.selectedTool()
    drawHud(ctx, this.atlas, this.player, {
      rupees: this.save.player.rupees,
      screenName: this.screen.name,
      exercisesDone: this.save.spelling.completedExercises.length,
      totalExercises: TOTAL_EXERCISES,
      ...(tool ? { tool: { name: ITEMS[tool].name, count: this.save.inventory[tool] ?? 0 } } : {}),
    })

    if (this.message) this.drawMessageBar(ctx)
  }

  /**
   * Sets up the visual half of a crossing. Everything real has already
   * happened; this only decides what is drawn for the next second and a bit.
   */
  private beginFlight(spawnCol: number): void {
    // He comes in over the water, from whichever side of the map he lands
    // nearest — the island's landing is on its seaward east side, the
    // mainland's on its west.
    const fromRight = spawnCol >= SCREEN_COLS / 2
    this.flight = {
      frames: FLIGHT_FRAMES,
      fromX: fromRight ? SCREEN_W + 12 : -24,
      fromY: this.player.y,
      toX: this.player.x,
      toY: this.player.y,
      facing: fromRight ? 'left' : 'right',
    }
    this.player.facing = this.flight.facing
    // No black cut over a flight: he is off the edge of the screen anyway, and
    // the veil would only hide the water he is crossing.
    this.transition = 0
    sfx.play('wings')
  }

  /**
   * The Wings crossing: an arc in over the water, a shadow beneath him that
   * tightens as he climbs and spreads as he drops, and a landing. Drawn from
   * sprites already in the atlas — the hero lifted by an offset, with the Wings
   * beating at his shoulders — so flying costs no new pixel art.
   */
  private drawFlight(ctx: CanvasRenderingContext2D): void {
    const flight = this.flight
    if (!flight) return
    const t = 1 - flight.frames / FLIGHT_FRAMES
    const ease = t * t * (3 - 2 * t)
    const groundX = flight.fromX + (flight.toX - flight.fromX) * ease
    const groundY = flight.fromY + (flight.toY - flight.fromY) * ease
    // Already flying when he appears, highest a third of the way across, and
    // down on the sand at the end.
    const climb = Math.sin(Math.PI * (0.25 + 0.75 * t))
    const lift = FLIGHT_HEIGHT * climb

    // The shadow is what makes an offset read as height rather than as the hero
    // having simply walked up the screen. Rectangles, not an ellipse:
    // everything else on this canvas is whole pixels, and a path would blur.
    const shadowX = Math.round(groundX + PLAYER_SIZE / 2)
    const shadowY = Math.round(groundY + PLAYER_SIZE - 1)
    const wide = Math.round(12 - 6 * climb)
    ctx.save()
    ctx.globalAlpha = 0.45 - 0.3 * climb
    ctx.fillStyle = '#0a1a3a'
    ctx.fillRect(shadowX - wide / 2, shadowY, wide, 2)
    ctx.fillRect(shadowX - wide / 2 + 1, shadowY - 1, wide - 2, 1)
    ctx.restore()

    const beat = Math.floor(flight.frames / FLAP_FRAMES) % 2 === 0
    const x = groundX - 2
    const y = groundY - 4 - lift
    this.atlas.draw(ctx, 'wings', x, y - (beat ? 5 : 3))
    const shieldTier = capitalise(materialOf(this.player.loadout.shield))
    const way = capitalise(flight.facing)
    this.atlas.draw(ctx, `hero${shieldTier}${way}${beat ? 'A' : 'B'}` as SpriteName, x, y)
  }

  /** The sign has been read: he lowers the sword and the room starts again. */
  clearVictory(): void {
    this.victory = undefined
    this.input.clearTarget()
  }

  /**
   * The pose: he turns to face the child and holds the sword straight up. No
   * new art — the hero he already wears and the up-pointing blade from his own
   * swing, moved above his head. Blade first, so his silhouette stays whole.
   */
  private drawVictoryHero(ctx: CanvasRenderingContext2D): void {
    const victory = this.victory
    if (!victory) return
    const t = 1 - victory.frames / VICTORY_FRAMES
    const raise = Math.min(1, t * 4)
    const bob = Math.sin(this.frame / 9)
    const x = this.player.x - 2
    const y = this.player.y - 4

    const bladeTier = capitalise(materialOf(this.player.loadout.sword ?? 'woodenSword'))
    this.atlas.draw(
      ctx,
      `sword${bladeTier}Up` as SpriteName,
      this.player.x + PLAYER_SIZE / 2 - 4,
      y + 2 - raise * 16 + bob,
    )
    const shieldTier = capitalise(materialOf(this.player.loadout.shield))
    this.atlas.draw(ctx, `hero${shieldTier}DownA` as SpriteName, x, y + bob)
  }

  /** The light: the room whites out as the guardian goes, then eight spokes
   *  turn off the raised blade. */
  private drawVictoryLight(ctx: CanvasRenderingContext2D): void {
    const victory = this.victory
    if (!victory) return
    const t = 1 - victory.frames / VICTORY_FRAMES
    const tipX = this.player.x + PLAYER_SIZE / 2
    const tipY = this.player.y - 16

    const spokes = 8
    const reach = (26 + Math.sin(this.frame / 7) * 6) * Math.min(1, t * 3)
    ctx.save()
    ctx.translate(tipX, tipY)
    ctx.rotate(this.frame / 60)
    ctx.globalAlpha = 0.28 + Math.sin(this.frame / 9) * 0.08
    ctx.fillStyle = '#ffeaa0'
    for (let i = 0; i < spokes; i++) {
      ctx.rotate((Math.PI * 2) / spokes)
      ctx.fillRect(6, -1, reach, 2)
    }
    ctx.restore()

    // A fifth of a second of white as it dies.
    const flash = Math.max(0, 0.85 - t * 6)
    if (flash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${flash})`
      ctx.fillRect(0, 0, SCREEN_W, SCREEN_H)
    }
  }

  private drawPlayer(ctx: CanvasRenderingContext2D): void {
    // Flicker while invulnerable, the classic "you just got hit" signal.
    if (this.player.invulnerable > 0 && Math.floor(this.frame / 3) % 2 === 0) return

    const facing = this.player.facing
    const frame = this.player.animationFrame
    const way = capitalise(facing)

    // The hero is drawn in the material of the shield he is carrying, and the
    // blade in the material of the sword — so the wooden ones look wooden.
    const shieldTier = capitalise(materialOf(this.player.loadout.shield))
    this.atlas.draw(ctx, `hero${shieldTier}${way}${frame}` as SpriteName, this.player.x - 2, this.player.y - 4)

    // The blade, pointing the way he is facing. The sprite is a fixed length;
    // a better sword reaches slightly further than it draws, which is a fairer
    // way round than looking longer than it hits.
    const sword = this.player.swordBox()
    if (!sword) return
    const centreX = this.player.x + PLAYER_SIZE / 2
    const centreY = this.player.y + PLAYER_SIZE / 2
    const bladeTier = capitalise(materialOf(this.player.loadout.sword ?? 'woodenSword'))
    const blade = `sword${bladeTier}${way}` as SpriteName

    switch (facing) {
      case 'right':
        this.atlas.draw(ctx, blade, sword.x, centreY - 4)
        break
      case 'left':
        this.atlas.draw(ctx, blade, sword.x + sword.w - 16, centreY - 4)
        break
      case 'down':
        this.atlas.draw(ctx, blade, centreX - 4, sword.y)
        break
      case 'up':
        this.atlas.draw(ctx, blade, centreX - 4, sword.y + sword.h - 16)
        break
    }
  }

  /**
   * Whoever the hero is standing next to has something to say. `talk` has been
   * on props since the world was built, carrying three lines of dialogue that
   * nothing ever read.
   */
  private drawNearbyTalk(ctx: CanvasRenderingContext2D): void {
    const centre = this.player.centre()
    for (const prop of this.screen.props ?? []) {
      if (!prop.talk) continue
      const dx = centre.x - (prop.col * TILE + TILE / 2)
      const dy = centre.y - (prop.row * TILE + TILE / 2)
      if (Math.hypot(dx, dy) > TALK_RADIUS) continue
      drawSpeech(ctx, prop, prop.talk, SCREEN_W)
      return
    }
  }

  private drawMessageBar(ctx: CanvasRenderingContext2D): void {
    const lines = wrap(this.message, 38)
    const height = 10 + lines.length * 9
    const y = SCREEN_H + HUD_H - height - 2

    ctx.fillStyle = 'rgba(8,10,16,0.92)'
    ctx.fillRect(4, y, SCREEN_W - 8, height)
    ctx.strokeStyle = '#57d2c6'
    ctx.lineWidth = 1
    ctx.strokeRect(4.5, y + 0.5, SCREEN_W - 9, height - 1)

    ctx.fillStyle = '#f6f3e7'
    ctx.font = '7px monospace'
    ctx.textBaseline = 'top'
    lines.forEach((line, i) => ctx.fillText(line, 9, y + 5 + i * 9))
  }

  private toWorld(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect()
    const scaleX = this.canvas.width / rect.width
    const scaleY = this.canvas.height / rect.height
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY - HUD_H,
    }
  }

  /** Exposed so the shop can check and spend. */
  get rupees(): number {
    return this.save.player.rupees
  }

  currentScreenId(): string {
    return this.screen.id
  }

  heal(hearts: number): void {
    this.player.heal(hearts)
    this.save.player.hearts = this.player.hearts
  }

  grantHeartContainer(): void {
    this.player.addHeartContainer()
    this.save.player.maxHearts = this.player.maxHearts
    this.save.player.hearts = this.player.hearts
  }

  equipBest(): void {
    // After a purchase, wear the strongest thing owned in each slot.
    const owned = (id: ItemId) => (this.save.inventory[id] ?? 0) > 0
    const best = <T extends ItemId | undefined>(ids: ItemId[], fallback: T): ItemId | T =>
      ids.filter(owned).sort((a, b) => (ITEMS[b].power ?? 0) - (ITEMS[a].power ?? 0))[0] ?? fallback

    // The fallback must not be a sword: it used to hand him a wooden one even
    // with an empty inventory, and then write it into the save.
    const sword = best(['goldenSword', 'bronzeSword', 'metalSword', 'woodenSword'], undefined)
    if (sword) this.player.loadout.sword = sword
    this.player.loadout.shield = best(['magicalShield', 'bronzeShield', 'metalShield', 'woodenShield'], 'woodenShield')
    const tunic = (['redTunic', 'blueTunic'] as ItemId[]).filter(owned)[0]
    if (tunic) this.player.loadout.tunic = tunic
    if (owned('blueRing')) this.player.loadout.ring = 'blueRing'
    this.syncSave()
  }

  /** Live state, for the debug menu and the end-to-end checks. */
  /** What a nearby villager is currently saying, if anyone is. For the checks. */
  talkingProp(): string | undefined {
    const centre = this.player.centre()
    for (const prop of this.screen.props ?? []) {
      if (!prop.talk) continue
      const dx = centre.x - (prop.col * TILE + TILE / 2)
      const dy = centre.y - (prop.row * TILE + TILE / 2)
      if (Math.hypot(dx, dy) <= TALK_RADIUS) return prop.talk
    }
    return undefined
  }

  /** True if the hero's body overlaps something solid. Used by the checks. */
  insideWall(): boolean {
    return this.wouldOverlap(this.player.x, this.player.y)
  }

  debugState(): Record<string, unknown> {
    return {
      screen: this.screen.id,
      flying: this.flight !== undefined,
      x: Math.round(this.player.x),
      y: Math.round(this.player.y),
      facing: this.player.facing,
      hearts: this.player.hearts,
      enemies: this.enemies.length,
      // Positions and health, so a combat check can actually chase something
      // down rather than swinging at thin air and calling the sword broken.
      monsters: this.enemies.map((e) => ({
        kind: e.kind,
        x: Math.round(e.x),
        y: Math.round(e.y),
        hp: e.hp,
      })),
      sword: this.player.swordBox(),
      // How far he can see here, so a check can tell a dark room from a lit one.
      litRadius: this.screen.dark
        ? (this.save.inventory.blueCandle ? LIT_RADIUS : DARK_RADIUS)
        : undefined,
      pendingGate: this.pendingGate?.id,
      paused: this.paused,
    }
  }

  /** Jumps straight to a screen. Used by the debug menu and the end-to-end checks. */
  teleport(screenId: string, col: number, row: number): void {
    this.loadScreen(screenId)
    this.player.placeAtTile(col, row)
    this.ensureFree()
    this.input.clearTarget()
    this.syncSave()
    this.callbacks.onChange()
  }

  respawn(): void {
    this.player.hearts = this.player.maxHearts
    this.player.invulnerable = 90
    this.loadScreen(START_SCREEN)
    this.player.placeAtTile(7, 5)
    this.ensureFree()
    this.syncSave()
    this.callbacks.onChange()
  }
}

function capitalise<T extends string>(value: T): Capitalize<T> {
  return (value[0]?.toUpperCase() + value.slice(1)) as Capitalize<T>
}

function wrap(text: string, width: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    if ((line + ' ' + word).trim().length > width) {
      if (line) lines.push(line.trim())
      line = word
    } else {
      line = `${line} ${word}`
    }
  }
  if (line.trim()) lines.push(line.trim())
  return lines.slice(0, 4)
}

/** Re-exported so callers do not need to reach into the tiles module. */
export { SCREEN_W, SCREEN_H, TILES }
