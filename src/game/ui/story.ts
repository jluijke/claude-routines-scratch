/**
 * A page of story.
 *
 * Twice in the whole game: once when the last guardian of the land falls and
 * the machine takes him to the future, and once when the last mech falls and
 * the future is safe. Big text, one paragraph at a time, over a dark wash, so
 * it reads as a moment rather than as another dialog box.
 */
import { button, el } from '../../spelling/ui/dom'
import { sfx } from '../../core/audio/sfx'

/** How long each heart takes to go, once the ring starts pulling. */
export const TOLL_HEART_MS = 520
/** The pause before the first heart goes, so he sees them all first. */
export const TOLL_LEAD_MS = 900

export interface StoryOptions {
  /** The small line over the title. */
  kicker: string
  title: string
  /** Shown one after another; the button moves to the next, then onward. */
  paragraphs: string[]
  /** What the last button says. */
  onwardLabel: string
  /**
   * The page on which the crossing takes its price: his hearts are shown
   * under the words and drain, one by one, from `toll.from` to `toll.to`, and
   * the button waits until they have. Set by the story; the numbers come from
   * whoever shows it, because only they know how many hearts he has.
   */
  tollPage?: number
  toll?: { from: number; to: number }
  onContinue: () => void
}

export function showStory(root: HTMLElement, options: StoryOptions): () => void {
  let index = 0
  let timer: number | undefined

  const text = el('p', { class: 'story-text' })
  const hearts = el('div', { class: 'story-hearts', 'aria-hidden': 'true' })
  const dots = el('ul', { class: 'story-dots' }, options.paragraphs.map(() => el('li')))

  const next = button('', () => {
    index += 1
    if (index >= options.paragraphs.length) {
      close()
      options.onContinue()
      return
    }
    show()
  }, { class: 'btn btn-primary btn-large' })

  const section = el('section', { class: 'panel-game story-panel' }, [
    el('p', { class: 'story-kicker' }, [options.kicker]),
    el('h2', { class: 'story-title' }, [options.title]),
    text,
    hearts,
    dots,
    el('div', { class: 'gate-actions' }, [next]),
  ])
  const panel = el('div', { class: 'overlay overlay-story' }, [section])

  function show(): void {
    text.textContent = options.paragraphs[index] ?? ''
    // Re-run the fade for each page, so the eye is drawn to the new words.
    text.classList.remove('story-text-in')
    void text.offsetWidth
    text.classList.add('story-text-in')
    const last = index >= options.paragraphs.length - 1
    next.textContent = last ? options.onwardLabel : 'Next →'
    dots.querySelectorAll('li').forEach((dot, i) => dot.classList.toggle('done', i <= index))

    hearts.replaceChildren()
    hearts.classList.remove('on')
    panel.classList.remove('warping')
    if (options.toll && index === options.tollPage) drain(options.toll)
  }

  /**
   * The ring pulling the life out of him: every heart he has, then each one
   * past the limit going dark in turn, with the hurt sound for each, and the
   * button held until the last has gone.
   */
  function drain(toll: { from: number; to: number }): void {
    const icons = Array.from({ length: toll.from }, () => el('span', { class: 'story-heart' }, ['♥']))
    hearts.append(...icons)
    hearts.classList.add('on')
    panel.classList.add('warping')
    let left = toll.from
    if (left <= toll.to) return

    const label = next.textContent
    next.disabled = true
    next.textContent = 'Hold on…'
    const tick = (): void => {
      left -= 1
      icons[left]?.classList.add('gone')
      sfx.play('playerHurt')
      if (left > toll.to) {
        timer = window.setTimeout(tick, TOLL_HEART_MS)
        return
      }
      panel.classList.remove('warping')
      next.disabled = false
      next.textContent = label
      next.focus()
    }
    timer = window.setTimeout(tick, TOLL_LEAD_MS)
  }

  root.append(panel)
  show()
  window.setTimeout(() => next.focus(), 60)

  function close(): void {
    if (timer !== undefined) window.clearTimeout(timer)
    panel.remove()
  }
  return close
}

/** What the machine at the top of the Sunless Spire says, once the last guardian is gone. */
export const TO_THE_FUTURE: Omit<StoryOptions, 'onContinue'> = {
  kicker: 'The last guardian has fallen',
  title: 'A voice from a thousand years away',
  paragraphs: [
    'With the last guardian gone, the whole land goes quiet. The princess is safe. ' +
      'The village will sleep soundly tonight. And then, in the top of the Sunless ' +
      'Spire, something begins to hum.',
    'It is a machine — a ring of silver, older than the dungeon around it, and it is ' +
      'waking up. A voice comes out of it, thin and far away. "Hero. The trouble did ' +
      'not begin here. It began a thousand years from now."',
    '"In the future, the sky-ships that carry everyone between the stars have been ' +
      'taken by robots. The people are hiding. The animals are half machine. And the ' +
      'thing that sent the monsters to your land is out there, on the rocks, waiting."',
    '"The machine will carry you forward. It cannot carry metal — your sword, your ' +
      'shield and your rupees stay here, and they will be waiting when you come home. ' +
      'Your hearts come with you. So does your friend."',
    'You step into the ring. Light. Wind. A sound like a thousand bells. And then a ' +
      'floor of cold metal under your boots, a red light blinking, and somewhere down ' +
      'the corridor, the sound of something with wheels.',
  ],
  onwardLabel: 'Step into the machine →',
}

/** And what happens when the last mech is down. */
export const TO_THE_PRESENT: Omit<StoryOptions, 'onContinue'> = {
  kicker: 'The last mech has fallen',
  title: 'It was never the robots',
  paragraphs: [
    'The core goes dark. Out on every rock, every robot that was hunting the ship ' +
      'stops where it stands. On the bridge, the red light stops blinking and turns ' +
      'green. One by one, the people come out of hiding.',
    'And then the ring of silver hums again, and the thin voice is back. "Hero. The ' +
      'robots were never the trouble. Something passed through on its way to the ' +
      'future, and it stopped, on the way, in the present. In a city of eight ' +
      'million people, under the streets, it is still there."',
    '"They call the city New York. It has a river on each side, a park in the ' +
      'middle of every neighbourhood, and trains that run under the ground. Nobody ' +
      'there can see what is wrong. But you have been a thousand years each way. ' +
      'You will."',
    '"One more thing," the voice says, and it is quieter now. "Going back is ' +
      'harder than going forward. The present pulls at anyone who has been away ' +
      'from it, and the ring pays for the crossing in life. You will arrive with ' +
      'four hearts, whatever you carry now. Spend them carefully."',
    'You step into the ring. The hum climbs, and climbs, and the light folds in ' +
      'around you. One by one you feel the hearts you earned out here pulled away ' +
      'into the glow, until only four are left beating.',
    'When you can see again there is a fountain in front of you, pigeons at your ' +
      'feet, a man playing chess against nobody, and a sound you have never heard ' +
      'before, which is a taxi, leaning on its horn.',
  ],
  // The hearts drain on the page where he steps into the ring.
  tollPage: 4,
  onwardLabel: 'Step out into the square →',
}

/** The last of the three, loved. He has something in his pocket. */
export const CITY_SAVED: Omit<StoryOptions, 'onContinue'> = {
  kicker: 'The last of the three has been loved',
  title: 'A ticket, folded small',
  paragraphs: [
    'He hugs you. He actually hugs you. Then he goes pink to the ears, digs in his ' +
      'pocket, and holds something out: a ferry ticket, folded small. "She is on the ' +
      'island," he says. "In the crown. We put her there. I am so sorry."',
    'The island. Out in the harbour, at the bottom of the city, past Chinatown and ' +
      'the park with the binoculars: the green lady with the torch. You have seen her ' +
      'from the water\'s edge. You did not know anyone was up there.',
    'The trains keep running. The taxis keep honking. Nobody in New York notices ' +
      'anything at all, which is the way New York likes it. Your friend sits down at ' +
      'your feet and looks up at you as if to say: well, that was easy.',
    'The three of them have gone to Coney Island, at the very end of the line, to ' +
      'ride the Wonder Wheel and feel bad. The ferry leaves from Battery Park. The man ' +
      'in the booth will want to see the ticket.',
  ],
  onwardLabel: 'To the ferry →',
}

/** And the end of it: the crown, and her in it. */
export const PRINCESS_SAVED: Omit<StoryOptions, 'onContinue'> = {
  kicker: 'Two hundred and sixty steps up',
  title: 'The princess is safe',
  paragraphs: [
    'She is sitting in the crown with her knees up, looking out at the city, and ' +
      'when she sees you she laughs. "You took your time," she says. "I have been ' +
      'waving at that pier for a week." Then she hugs you, which is the second hug ' +
      'today, and the better one.',
    'Down all the steps. Out through the door in the base. The ferry man does not ' +
      'ask for a ticket this time; he just nods, and looks at the water, and the boat ' +
      'pulls out with the two of you on it, and the island gets small behind you.',
    'A thousand years behind you, a village is sleeping. A thousand years ahead, a ' +
      'ship is sailing between the stars. And right now, in the middle, eight million ' +
      'people are getting on with it. All three because of someone who could spell.',
    'The ring hums, ready to take you anywhere you like. Or stay a while. There is a ' +
      'whole city to walk, a museum with a dinosaur in it, and a roof with a view of ' +
      'the park. Nothing left in it wants to hurt you. Except the rats. It is New York.',
  ],
  onwardLabel: 'Back to the city →',
}
