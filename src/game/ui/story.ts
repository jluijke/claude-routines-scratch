/**
 * A page of story.
 *
 * Twice in the whole game: once when the last guardian of the land falls and
 * the machine takes him to the future, and once when the last mech falls and
 * the future is safe. Big text, one paragraph at a time, over a dark wash, so
 * it reads as a moment rather than as another dialog box.
 */
import { button, el } from '../../spelling/ui/dom'

export interface StoryOptions {
  /** The small line over the title. */
  kicker: string
  title: string
  /** Shown one after another; the button moves to the next, then onward. */
  paragraphs: string[]
  /** What the last button says. */
  onwardLabel: string
  onContinue: () => void
}

export function showStory(root: HTMLElement, options: StoryOptions): () => void {
  let index = 0

  const text = el('p', { class: 'story-text' })
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

  const panel = el('div', { class: 'overlay overlay-story' }, [
    el('section', { class: 'panel-game story-panel' }, [
      el('p', { class: 'story-kicker' }, [options.kicker]),
      el('h2', { class: 'story-title' }, [options.title]),
      text,
      dots,
      el('div', { class: 'gate-actions' }, [next]),
    ]),
  ])

  function show(): void {
    text.textContent = options.paragraphs[index] ?? ''
    // Re-run the fade for each page, so the eye is drawn to the new words.
    text.classList.remove('story-text-in')
    void text.offsetWidth
    text.classList.add('story-text-in')
    const last = index >= options.paragraphs.length - 1
    next.textContent = last ? options.onwardLabel : 'Next →'
    dots.querySelectorAll('li').forEach((dot, i) => dot.classList.toggle('done', i <= index))
  }

  root.append(panel)
  show()
  window.setTimeout(() => next.focus(), 60)

  function close(): void {
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
    'The ring flares. When you can see again there is a fountain in front of you, ' +
      'pigeons at your feet, a man playing chess against nobody, and a sound you have ' +
      'never heard before, which is a taxi, leaning on its horn.',
  ],
  onwardLabel: 'Step out into the square →',
}

export const CITY_SAVED: Omit<StoryOptions, 'onContinue'> = {
  kicker: 'The last of the three has been loved',
  title: 'The city is safe',
  paragraphs: [
    'He hugs you. He actually hugs you. Then he walks off down the boardwalk, pink ' +
      'to the ears, and does not look back. Somewhere under the city something that ' +
      'had been humming for a very long time stops.',
    'The trains keep running. The taxis keep honking. Nobody in New York notices ' +
      'anything at all, which is the way New York likes it. Your friend sits down at ' +
      'your feet and looks up at you as if to say: well, that was easy.',
    'A thousand years behind you, a village is sleeping. A thousand years ahead, a ' +
      'ship is sailing between the stars. And right now, in the middle, eight million ' +
      'people are getting on with it. All three because of someone who could spell.',
    'The ring hums, ready to take you anywhere you like. Or stay a while. There is a ' +
      'whole city to walk, and nothing left in it that wants to hurt you.',
  ],
  onwardLabel: 'Back to the city →',
}
