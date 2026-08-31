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
import { Rng } from '../core/rng'
import { Atlas } from './render/atlas'
import { drawHud, HUD_H } from './render/hud'
import { drawDarkness, drawSeals, drawTiles } from './render/world'
import { Enemy, overlaps, type Projectile } from './entities/enemies'
import { Player, PLAYER_SIZE, type Facing } from './entities/player'
import { SCREEN_H, SCREEN_W, TILE, TILES, isSolidChar, toTile, type TileChar } from './world/tiles'
import { screenById, START_SCREEN, type Screen } from './world/screens'
import { gateById, type Gate } from './gates'
import { ITEMS, type ItemId } from './items'
import { dropMultiplier, opensFreely } from './pacing'
import type { SaveData } from '../core/save'
import { TOTAL_EXERCISES } from '../content/exercises'

export interface WorldCallbacks {
  /** The hero touched a sealed barrier. Resolve true once it should open. */
  onGate: (gate: Gate) => void
  /** The hero walked into a shop. */
  onShop: (kind: 'village' | 'secret' | 'smith') => void
  /** Something worth saving happened. */
  onChange: () => void
  /** The hero ran out of hearts. */
  onDefeat: () => void
  /** A line of text to show in the message bar. */
  onMessage: (text: string) => void
}

interface Drop {
  kind: 'rupee' | 'rupeeBlue' | 'heart'
  x: number
  y: number
  life: number
}

const DARK_RADIUS = 46
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
  private frame = 0
  private transition = 0
  private message = ''
  private messageTimer = 0
  /** Barrier the hero is standing against, if any. */
  private pendingGate: Gate | undefined
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
        sword: save.player.equippedSword,
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

    this.loop = new GameLoop({
      update: (step) => this.update(step),
      render: () => this.render(),
    })
  }

  start(): void {
    this.loop.start()
    this.input.resume()
  }

  stop(): void {
    this.loop.stop()
    this.input.suspend()
    this.syncSave()
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
    this.canvas.remove()
  }

  /** Writes the live state back into the save object. */
  syncSave(): void {
    this.save.player.hearts = this.player.hearts
    this.save.player.maxHearts = this.player.maxHearts
    this.save.player.screenId = this.screen.id
    this.save.player.x = this.player.x
    this.save.player.y = this.player.y
    this.save.player.equippedSword = this.player.loadout.sword
    this.save.player.equippedShield = this.player.loadout.shield
    if (this.player.loadout.tunic) this.save.player.equippedTunic = this.player.loadout.tunic
  }

  /** Re-reads gear and hearts after a shop visit or an exercise reward. */
  refreshFromSave(): void {
    this.player.loadout.sword = this.save.player.equippedSword
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
    this.nudgeAwayFromGate()
    this.callbacks.onChange()
  }

  /** The child declined the challenge; do not re-prompt until they walk off. */
  declineGate(): void {
    this.pendingGate = undefined
    this.nudgeAwayFromGate()
    this.input.clearTarget()
  }

  private nudgeAwayFromGate(): void {
    const push = 10
    switch (this.player.facing) {
      case 'up': this.player.y += push; break
      case 'down': this.player.y -= push; break
      case 'left': this.player.x += push; break
      case 'right': this.player.x -= push; break
    }
  }

  // ------------------------------------------------------------ screen setup

  private loadScreen(id: string, remember = true): void {
    const next = screenById(id)
    if (!next) return
    this.screen = next
    this.enemies = []
    this.projectiles = []
    this.drops = []
    this.transition = 12

    const cleared = this.save.world.defeatedBosses
    for (const [index, spawn] of (next.spawns ?? []).entries()) {
      // A defeated boss stays defeated.
      if ((spawn.kind === 'boss1' || spawn.kind === 'boss2') && cleared.includes(next.id)) continue
      this.enemies.push(new Enemy(spawn.kind, spawn.col, spawn.row, this.rng.int(1, 1e9) + index))
    }

    if (remember && !this.save.world.visitedScreens.includes(id)) {
      this.save.world.visitedScreens.push(id)
    }
    if (next.shop) this.callbacks.onShop(next.shop)
  }

  private openedTiles(): Set<string> {
    const opened = new Set<string>()
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

    // Time spent actually playing feeds the 50/50 governor.
    this.playAccumulator += step
    if (this.playAccumulator >= 1) {
      const whole = Math.floor(this.playAccumulator)
      this.save.pacing.playSeconds += whole
      this.playAccumulator -= whole
    }

    const state = this.input.read()
    if (state.pause) {
      this.callbacks.onMessage('')
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

    const opened = this.openedTiles()
    const canCrossWater = this.save.inventory.wings !== undefined
    const blocked = (x: number, y: number): boolean => this.isSolidAt(x, y, opened, canCrossWater)

    this.player.update(step, dx, dy, blocked)
    this.clampToScreen()
    this.checkGateContact(opened)
    this.checkPortals()
    this.checkEdges()

    const target = this.player.centre()
    for (const enemy of this.enemies) {
      enemy.update(step, target, blocked, (p) => this.projectiles.push(p))
    }

    this.resolveCombat()
    this.updateProjectiles(step)
    this.updateDrops(step)

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

    for (const placement of this.screen.gates ?? []) {
      const tiles = placement.opens ?? [{ col: placement.col, row: placement.row }]
      const touching =
        (placement.col === col && placement.row === row) ||
        tiles.some((t) => t.col === col && t.row === row)
      if (!touching) continue
      if (this.save.world.openedGates.includes(placement.gateId)) continue
      if (opened.has(`${col},${row}`)) continue

      const gate = gateById(placement.gateId)
      if (!gate) continue
      this.pendingGate = gate
      this.callbacks.onGate(gate)
      return
    }
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
      this.loadScreen(portal.to)
      this.player.placeAtTile(portal.spawnCol, portal.spawnRow)
      this.input.clearTarget()
      this.callbacks.onChange()
      return
    }
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
      sfx.play('secret')
      this.showMessage('The guardian falls. The way beyond is yours.')
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

    for (const shot of this.projectiles) {
      shot.x += shot.vx * step
      shot.y += shot.vy * step
      shot.life -= 1
      if (shot.life <= 0) continue
      if (shot.x < -8 || shot.y < -8 || shot.x > SCREEN_W + 8 || shot.y > SCREEN_H + 8) continue

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

  /** Uses whatever is in the B slot: bait, a candle, a recovery heart. */
  private useItem(): void {
    const inventory = this.save.inventory

    if ((inventory.recoveryHeart ?? 0) > 0 && this.player.hearts < this.player.maxHearts) {
      inventory.recoveryHeart = (inventory.recoveryHeart ?? 0) - 1
      this.player.heal(1)
      sfx.play('heart')
      this.showMessage('You feel better.', 90)
      this.callbacks.onChange()
      return
    }

    if ((inventory.bait ?? 0) > 0 && this.enemies.length > 0) {
      inventory.bait = (inventory.bait ?? 0) - 1
      const centre = this.player.centre()
      const spot = this.pointAhead(centre, this.player.facing, 24)
      for (const enemy of this.enemies) enemy.distract(spot.x, spot.y)
      this.showMessage('The monsters stop to eat.', 120)
      this.callbacks.onChange()
      return
    }

    this.showMessage('Nothing to use yet.', 70)
  }

  // ------------------------------------------------------------------ render

  private render(): void {
    const ctx = this.ctx
    ctx.save()
    ctx.translate(0, HUD_H)

    const opened = this.openedTiles()
    drawTiles(ctx, this.screen, opened, this.frame)
    drawSeals(ctx, this.atlas, this.screen, opened, this.frame)

    for (const prop of this.screen.props ?? []) {
      this.atlas.draw(ctx, prop.sprite, prop.col * TILE, prop.row * TILE)
    }

    for (const drop of this.drops) {
      // Blink when it is about to disappear, so it does not simply vanish.
      if (drop.life < 120 && Math.floor(this.frame / 6) % 2 === 0) continue
      this.atlas.draw(ctx, drop.kind, drop.x, drop.y)
    }

    for (const enemy of this.enemies) {
      const flashing = enemy.hurtTimer > 0 && Math.floor(this.frame / 3) % 2 === 0
      if (!flashing) this.atlas.draw(ctx, enemy.sprite, enemy.x, enemy.y)
    }

    for (const shot of this.projectiles) {
      this.atlas.draw(ctx, shot.magic ? 'magicBolt' : 'projectile', shot.x, shot.y)
    }

    this.drawPlayer(ctx)

    if (this.screen.dark) {
      const lit = this.save.inventory.blueCandle ? LIT_RADIUS : DARK_RADIUS
      drawDarkness(ctx, this.player.centre(), lit, SCREEN_W, SCREEN_H)
    }

    if (this.transition > 0) {
      ctx.fillStyle = `rgba(0,0,0,${this.transition / 12})`
      ctx.fillRect(0, 0, SCREEN_W, SCREEN_H)
    }

    ctx.restore()

    drawHud(
      ctx,
      this.atlas,
      this.player,
      this.save.player.rupees,
      this.screen.name,
      this.save.spelling.completedExercises.length,
      TOTAL_EXERCISES,
    )

    if (this.message) this.drawMessageBar(ctx)
  }

  private drawPlayer(ctx: CanvasRenderingContext2D): void {
    // Flicker while invulnerable, the classic "you just got hit" signal.
    if (this.player.invulnerable > 0 && Math.floor(this.frame / 3) % 2 === 0) return

    const facing = this.player.facing
    const frame = this.player.animationFrame
    const name = `hero${facing[0]?.toUpperCase()}${facing.slice(1)}${frame}` as
      | 'heroUpA' | 'heroUpB' | 'heroDownA' | 'heroDownB'
      | 'heroLeftA' | 'heroLeftB' | 'heroRightA' | 'heroRightB'

    this.atlas.draw(ctx, name, this.player.x - 2, this.player.y - 4)

    // The blade, drawn as a simple bar in the facing direction.
    const sword = this.player.swordBox()
    if (!sword) return
    ctx.fillStyle = '#e8e8f0'
    ctx.fillRect(sword.x, sword.y, sword.w, sword.h)
    ctx.fillStyle = '#9aa2b0'
    ctx.fillRect(sword.x + 1, sword.y + 1, Math.max(1, sword.w - 2), Math.max(1, sword.h - 2))
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
    const best = (ids: ItemId[], fallback: ItemId): ItemId =>
      ids.filter(owned).sort((a, b) => (ITEMS[b].power ?? 0) - (ITEMS[a].power ?? 0))[0] ?? fallback

    this.player.loadout.sword = best(['goldenSword', 'bronzeSword', 'metalSword', 'woodenSword'], 'woodenSword')
    this.player.loadout.shield = best(['magicalShield', 'bronzeShield', 'metalShield', 'woodenShield'], 'woodenShield')
    const tunic = (['redTunic', 'blueTunic'] as ItemId[]).filter(owned)[0]
    if (tunic) this.player.loadout.tunic = tunic
    if (owned('blueRing')) this.player.loadout.ring = 'blueRing'
    this.syncSave()
  }

  /** Live state, for the debug menu and the end-to-end checks. */
  debugState(): Record<string, unknown> {
    return {
      screen: this.screen.id,
      x: Math.round(this.player.x),
      y: Math.round(this.player.y),
      facing: this.player.facing,
      hearts: this.player.hearts,
      enemies: this.enemies.length,
      pendingGate: this.pendingGate?.id,
      paused: this.paused,
    }
  }

  /** Jumps straight to a screen. Used by the debug menu and the end-to-end checks. */
  teleport(screenId: string, col: number, row: number): void {
    this.loadScreen(screenId)
    this.player.placeAtTile(col, row)
    this.input.clearTarget()
    this.syncSave()
    this.callbacks.onChange()
  }

  respawn(): void {
    this.player.hearts = this.player.maxHearts
    this.player.invulnerable = 90
    this.loadScreen(START_SCREEN)
    this.player.placeAtTile(7, 5)
    this.syncSave()
    this.callbacks.onChange()
  }
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
