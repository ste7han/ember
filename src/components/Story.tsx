import { Section } from './ui/Section'

export function Story() {
  return (
    <Section
      id="story"
      eyebrow="The story"
      title={
        <>
          A dad, his son, and a{' '}
          <span className="text-flame">little fire</span>
        </>
      }
    >
      <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
        <div className="space-y-5 text-base leading-relaxed text-bone-300">
          <p>
            Charmander has been my favourite Pokémon for thirty years. Since the
            day Pokémon existed, basically. Nothing ever replaced it.
          </p>
          <p>
            We named our son Aiden because we liked the sound of it. That was the
            only reason. I found out afterwards what it actually means:{' '}
            <strong className="font-semibold text-bone-100">
              Aodhán, old Irish, a diminutive of Aodh, the Celtic god of fire.{' '}
              <em className="text-ember-400 not-italic">Little fire.</em>
            </strong>
          </p>
          <p>
            That was the bit that completed the picture for me. A name we'd
            already picked, a Pokémon I'd loved for three decades, and a meaning
            that tied them together entirely by accident. He's one and a half, so
            he can't tell me anything about it. What he does do is walk past a
            whole pile of stuffed animals and pick the same one, nearly every
            time. I'm not going to claim that proves anything. I'm also not going
            to pretend I don't like it.
          </p>
          <p>
            So that's the name. Ember. It's his name in English and it's the move
            printed on the Base Set card. Two things pointing the same way.
          </p>
          <p>
            We open packs together at the table, filmed from my glasses — so you
            get my hands and the cards, not us. He's too young to agree to being
            on camera, so he isn't. When he's old enough to decide for himself,
            it's his call.
          </p>
          <p>
            A card sitting in a binder isn't a story, and this is supposed to be
            a story. So the line stays with us and everything else goes to you.
          </p>
        </div>

        <aside className="rounded-2xl border border-ash-800 bg-ash-900/50 p-7">
          <p className="font-mono text-xs tracking-[0.2em] text-ember-500 uppercase">
            Etymology
          </p>
          <p className="mt-5 font-display text-4xl font-extrabold tracking-tight">
            Aodhán
          </p>
          <p className="mt-2 font-mono text-sm text-bone-500">/ˈeɪdən/</p>
          <hr className="my-6 border-ash-700" />
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="text-bone-500">Origin</dt>
              <dd className="mt-0.5 text-bone-100">Old Irish</dd>
            </div>
            <div>
              <dt className="text-bone-500">Root</dt>
              <dd className="mt-0.5 text-bone-100">
                Aodh, Celtic god of fire
              </dd>
            </div>
            <div>
              <dt className="text-bone-500">Meaning</dt>
              <dd className="mt-0.5 font-semibold text-ember-400">
                little fire
              </dd>
            </div>
          </dl>
        </aside>
      </div>
    </Section>
  )
}
