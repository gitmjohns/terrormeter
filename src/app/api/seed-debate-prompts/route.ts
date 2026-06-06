import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Debate prompts keyed by title (lowercase, trimmed)
const DEBATE_PROMPTS: Record<string, string> = {
  // ─── Horror Classics ──────────────────────────────────────────────────────
  "the shining": "Is Jack Torrance already insane before arriving at the Overlook, or does the hotel genuinely possess him?",
  "halloween": "Is Michael Myers scarier because he has a motive, or because he doesn't?",
  "a nightmare on elm street": "If you never fall asleep, can Freddy kill you? Is lucid dreaming the ultimate survival strategy?",
  "friday the 13th": "Who is the real villain of the franchise — Jason, Pamela, or Camp Crystal Lake itself?",
  "psycho": "Does killing off the protagonist in Act 1 make Psycho a masterpiece or a cheap trick?",
  "the exorcist": "Is The Exorcist still the scariest movie ever made, or has time blunted its impact?",
  "rosemary's baby": "Is Rosemary's helplessness the point of the film, or does it undermine her as a character?",
  "the texas chain saw massacre": "Is the raw, documentary-style filmmaking what makes The Texas Chain Saw Massacre so disturbing, or is it the family?",
  "alien": "Is Alien more of a haunted house movie than a sci-fi film?",
  "the thing": "Would you trust anyone in your group if you were at the Antarctic base? Who do you kill first?",
  "the silence of the lambs": "Is Hannibal Lecter a villain, an antihero, or something else entirely?",
  "it": "Does Pennywise work better as a shapeshifting cosmic entity or as a simple evil clown?",
  "get out": "Is Get Out more effective as a horror film or as social commentary — and can it be both?",
  "hereditary": "Is the supernatural ending earned, or does it betray the film's grounded family trauma?",
  "midsommar": "Is Dani's ending triumphant, tragic, or both?",
  "us": "Does the twist in Us enhance or ruin the first act on rewatch?",
  "the witch": "Is Black Phillip the real villain of The Witch, or is the Puritan community?",
  "annihilation": "What actually happens inside the Shimmer — is it alien, supernatural, or something else?",
  "a quiet place": "Is the family's survival in A Quiet Place believable, or are there too many plot holes?",
  "it follows": "What does the entity in It Follows actually represent — and can you outrun consequences forever?",
  "the babadook": "Is the Babadook literally real or purely a metaphor for grief — does the film commit to one answer?",
  "sinister": "Ellison or his family: whose fault is the ending?",
  "insidious": "At what exact moment does Insidious stop being scary?",
  "the conjuring": "Does The Conjuring's real-world framing make it scarier or does it feel exploitative?",
  "paranormal activity": "Would Paranormal Activity work if you watched it alone in the dark, or has the found-footage gimmick worn out?",
  "the blair witch project": "Does knowing The Blair Witch Project is fiction retroactively ruin the experience?",
  "28 days later": "Are the Infected in 28 Days Later zombies? Does it matter?",
  "dawn of the dead": "Romero's original or Snyder's remake: which Dawn of the Dead is superior and why?",
  "night of the living dead": "Is Night of the Living Dead's ending racist, a commentary on racism, or just bleak?",
  "evil dead": "Is the Evil Dead remake a worthwhile reinvention or a pale imitation?",
  "evil dead ii": "Is Evil Dead II a sequel, a remake, or something unique that defies categorization?",
  "the evil dead": "Would The Evil Dead work without Ash Williams, or is Bruce Campbell the whole movie?",
  "scream": "Does Scream's meta-awareness make it smarter horror or does it undercut the tension?",
  "scream 2": "Which Scream sequel is the best, and does any of them top the original?",
  "candyman": "Does Candyman need a concrete backstory, or is the mystery part of the horror?",
  "child's play": "Is Chucky a genuinely frightening villain or is the concept too silly to work?",
  "hellraiser": "Are the Cenobites evil, or are they just fulfilling a bargain?",
  "poltergeist": "Who is more responsible for the haunting in Poltergeist — the developers or the family?",
  "carrie": "Is Carrie's rampage justified, or does it make her the villain at the end?",
  "misery": "Is Annie Wilkes the best villain in Stephen King adaptations?",
  "pet sematary": "Would you use the Micmac burial ground to bring back a loved one?",
  "cujo": "Is Cujo unfairly maligned because of the dog, or is it genuinely one of King's best adaptations?",
  "the fly": "Is The Fly (1986) ultimately a love story, a body horror film, or a metaphor for disease?",
  "videodrome": "What is Videodrome actually about — and is that ambiguity a strength or a flaw?",
  "scanners": "Is the exploding head scene in Scanners the most iconic practical effects moment in horror?",
  "the wicker man": "Does The Wicker Man (1973) work as a horror film if you know the twist going in?",
  "suspiria": "Which Suspiria is better: Argento's 1977 original or Guadagnino's 2018 remake?",
  "deep red": "Is Argento's Deep Red the peak of Italian giallo, or does something else claim that crown?",
  "the beyond": "Does The Beyond's incoherent plot hurt it or is the dreamlike chaos the point?",
  "zombie flesh eaters": "Is Zombi 2 the best unofficial sequel ever made, or an embarrassment to the original?",
  "martyrs": "Is Martyrs torture porn elevated to art, or just torture porn with philosophical pretensions?",
  "raw": "Does Raw succeed as a feminist horror film, or does the cannibalism metaphor collapse under scrutiny?",
  "high tension": "Does the twist in High Tension ruin the film or reframe it in an interesting way?",
  "inside": "Is Them or Inside the more effective French extreme horror film?",
  "audition": "At what moment in Audition does the film shift — and was the first half necessary?",
  "ringu": "Is the Japanese original Ring or Gore Verbinski's American remake scarier?",
  "the ring": "Is Samara more or less frightening once you know her backstory?",
  "ju-on: the grudge": "Is the non-linear structure of Ju-On a clever device or just confusing?",
  "the grudge": "Does the Grudge curse make logical sense, and does it need to?",
  "pulse": "Is Pulse (Kairo) the most prescient horror film about internet isolation?",
  "a tale of two sisters": "Is A Tale of Two Sisters best understood as a ghost story or a psychological breakdown?",
  "the host": "Is The Host (Gwoemul) more effective as a monster movie or as a political satire?",
  "train to busan": "Is Train to Busan the best zombie film of the 21st century?",
  "the platform": "Is The Platform a horror film, a thriller, or a political allegory — and does it matter?",
  "the lighthouse": "Are Ephraim and Thomas actually the same person in The Lighthouse?",
  "the black phone": "Is The Black Phone more effective as a supernatural thriller or as a story about childhood trauma?",
  "barbarian": "Does Barbarian's tonal whiplash strengthen or weaken it as a horror film?",
  "nope": "What is the creature in Nope actually a metaphor for — and does Peele over-explain it?",
  "talk to me": "Would you use the hand in Talk to Me? Be honest.",
  "smile": "Is Smile's supernatural conceit a clever metaphor for trauma or just an excuse for jump scares?",
  "m3gan": "Is M3GAN a satire of tech culture or does it embrace the tropes it's supposedly critiquing?",
  "the menu": "Is The Menu a horror film, a dark comedy, or neither — and does labeling it matter?",
  "pearl": "Is Pearl a sympathetic character by the end of the film, or has she always been a monster?",
  "x": "Does Ti West's X trilogy work better as individual films or as a thematic whole?",
  "the black cat": "Is Lucio Fulci's The Black Cat (1981) an underrated gem in his filmography, or a minor effort compared to his best work?",
  "dracula": "Which Dracula adaptation is definitively the best — Nosferatu, Lugosi, or Lee?",
  "frankenstein": "Is the Creature in Frankenstein (1931) a monster or a victim?",
  "bride of frankenstein": "Is Bride of Frankenstein better than the original?",
  "the wolf man": "Is the Wolf Man (1941) sympathetic in a way other Universal Monsters aren't?",
  "creature from the black lagoon": "Is the Creature from the Black Lagoon misunderstood, or just monstrous?",
  "the invisible man": "Is the 2020 Invisible Man the best modern update of a Universal Monster?",
  "freaks": "Is Freaks (1932) exploitation cinema or an empathetic portrayal of its cast?",
  "house of wax": "Did Vincent Price define the horror icon, or was he always just playing himself?",

  // ─── Cult Classics ────────────────────────────────────────────────────────
  "re-animator": "Is Herbert West a villain, an antihero, or science itself personified?",
  "the return of the living dead": "Does Return of the Living Dead's comedy undercut the horror or amplify it?",
  "near dark": "Is Near Dark the best vampire film that nobody talks about enough?",
  "society": "Is Society's finale the most disturbing practical effects sequence in horror history?",
  "in the mouth of madness": "Is In the Mouth of Madness Carpenter's most underrated film?",
  "phantasm": "Does Phantasm hold up as more than a fever dream, or is that the only way to appreciate it?",
  "the people under the stairs": "Is The People Under the Stairs Craven's most politically charged film?",
  "jacob's ladder": "Is Jacob's Ladder best understood as horror, war film, or psychological drama?",
  "session 9": "Does Session 9 need supernatural elements, or is the mundane explanation more frightening?",
  "mandy": "Is Mandy an exploitation film that thinks it's art, or art that uses exploitation as a vehicle?",
  "possessor": "Is Brandon Cronenberg emerging from his father's shadow, or is Possessor just Videodrome 2?",
  "the wailing": "Is the stranger in The Wailing good, evil, or something beyond those categories?",
  "under the skin": "Is Scarlett Johansson's alien a predator, a victim, or something we can't map onto human categories?",
  "lake mungo": "Is Lake Mungo the most emotionally devastating horror film of the 2010s?",
  "the love witch": "Is The Love Witch a feminist film, an anti-feminist film, or neither?",
  "a cure for wellness": "Does A Cure for Wellness earn its runtime, or does it overstay its welcome?",
  "the house that jack built": "Is Lars von Trier's The House That Jack Built a serious examination of evil or just provocation?",
  "color out of space": "Which Lovecraft adaptation has come closest to capturing the true cosmic horror of the source material?",
  "prince of darkness": "Is John Carpenter's Apocalypse Trilogy underappreciated as a whole?",
  "the fog": "Is The Fog Carpenter's most atmospheric film, or does atmosphere substitute for scares?",
  "pumpkinhead": "Is Pumpkinhead a cautionary tale about revenge or an endorsement of it?",
  "tremors": "Is Tremors a perfect creature feature, and what would you have changed?",
  "slither": "Is Slither James Gunn's best film?",
  "the cabin in the woods": "Does The Cabin in the Woods ultimately love or hate horror movie conventions?",

  // ─── Recent & Modern Horror ──────────────────────────────────────────────
  "smile 2": "Does Smile 2 improve on the original, or does the sequel formula dilute what made the first work?",
  "malignant": "Is Malignant a serious horror film wearing a camp mask, or is the campiness the whole point?",
  "scream vi": "Is Scream VI the best sequel since Scream 2, or does moving to New York break the formula?",
  "halloween kills": "Is Halloween Kills the worst entry in the franchise, or does it deserve more credit?",
  "halloween ends": "Is Halloween Ends a bold artistic swing or an unforgivable betrayal of the franchise?",
  "evil dead rise": "Does Evil Dead Rise successfully modernize the franchise, or does it miss what made the originals work?",
  "the boogeyman": "Is The Boogeyman a return to form for Stephen King adaptations or another missed opportunity?",
  "skinamarink": "Is Skinamarink genuine experimental horror or an endurance test that mistakes boredom for dread?",
  "when evil lurks": "Is When Evil Lurks the best possession horror film in years, or does its nihilism go too far?",
  "late night with the devil": "Does Late Night with the Devil's found footage format earn the climax, or does it fall apart?",
  "longlegs": "Does Longlegs live up to its marketing hype, or is it all style and no substance?",
  "the substance": "Is The Substance a feminist body horror masterpiece or does it undermine its own message?",
  "immaculate": "Does Immaculate work better as a Sydney Sweeney showcase or as a commentary on religious control?",
  "heretic": "Is Hugh Grant's performance in Heretic the best villain turn of 2024?",
  "abigail": "Is Abigail best as a vampire film, a heist film, or a darkly comic creature feature?",
  "alien: romulus": "Is Alien: Romulus the best film in the franchise since the original two, or does nostalgia do the heavy lifting?",
  "terrifier 3": "Has Art the Clown become horror's new icon, or is Terrifier running out of ways to shock?",
  "maxxxine": "Is MaXXXine a satisfying conclusion to Ti West's trilogy or the weakest of the three?",
  "in a violent nature": "Does In a Violent Nature's inverted POV elevate the slasher genre or is it just a gimmick?",
  "strange darling": "Does Strange Darling's non-linear structure serve the story or just disguise its weaknesses?",
  "sinners": "Is Sinners Ryan Coogler's best film, and does the vampire mythology feel fresh or familiar?",
  "companion": "Does Companion succeed as both a horror film and a relationship thriller?",
  "the monkey": "Is The Monkey the most fun Stephen King adaptation in years, or does it squander a great premise?",
  "presence": "Is Soderbergh's Presence the most inventive use of a single camera perspective in horror?",
  "wolf man": "Does the 2025 Wolf Man justify remaking the Universal classic, or should some monsters stay buried?",
  "the night house": "Does The Night House's ending reward or frustrate the dread built throughout?",
  "his house": "Is His House more effective as a refugee horror story or as a supernatural haunting?",
  "titane": "Does Titane's Palme d'Or reflect genuine artistic achievement or festival taste for provocation?",
  "a quiet place part ii": "Is A Quiet Place Part II a worthy sequel, or does it survive on the original's goodwill?",
  "doctor sleep": "Does Doctor Sleep do justice to both The Shining and King's novel, or is it caught between two masters?",
  "it chapter two": "Does It Chapter Two stick the landing, or does the adult timeline pale against the Losers as kids?",
  "parasite": "Does Parasite belong in the horror canon, or is it something genre labeling can't contain?",
  "cocaine bear": "Is Cocaine Bear peak absurdist horror-comedy, or does the premise wear thin before the credits roll?",
  "totally killer": "Does Totally Killer's time-travel twist make it the most inventive slasher in years?",
  "five nights at freddy's": "Does Five Nights at Freddy's work for fans of the game but fail everyone else, or is there a movie here for both?",
  "last night in soho": "Is Last Night in Soho Edgar Wright's most ambitious film, or does the third act let it down?",
  "a ghost story": "Is A Ghost Story the most meditative horror film ever made, or is it just slow?",

  // ─── TV Shows ────────────────────────────────────────────────────────────
  "the haunting of hill house": "Is the Haunting of Hill House about grief, trauma, addiction — or all three?",
  "twin peaks": "Does Twin Peaks: The Return transcend television, or is it David Lynch being deliberately inaccessible?",
  "the x-files": "Mulder or Scully: who was right more often, and does the finale vindicate either of them?",
  "american horror story": "Which season of American Horror Story is the definitive best — and has the show declined?",
  "the walking dead": "At what point did The Walking Dead peak, and was it ever going to sustain that quality?",
  "penny dreadful": "Is Penny Dreadful's abrupt ending a creative failure or a bold artistic choice?",
  "true blood": "Did True Blood's allegory for gay rights hold up, or did the show undermine its own message?",
  "tales from the crypt": "Which Tales from the Crypt episode is the best standalone horror story?",
  "the haunting of bly manor": "Is The Haunting of Bly Manor a worthy successor to Hill House, or a step down?",
  "midnight mass": "Is Father Paul a villain or a tragic true believer in Midnight Mass?",
  "the midnight club": "Does Mike Flanagan's anthology approach work better on TV or film?",
  "the fall of the house of usher": "Is The Fall of the House of Usher Flanagan's best Netflix work?",
  "castle rock": "Does Castle Rock do justice to the Stephen King multiverse, or does it collapse under its own weight?",
  "outcast": "Is Outcast's possession mythology richer or more confusing than The Exorcist's?",
  "channel zero": "Which Channel Zero season scared you most, and does the creepypasta source material help?",
  "the strain": "Did The Strain squander its premise, or was the premise always too limited for three seasons?",
  "ash vs evil dead": "Is Ash vs Evil Dead the most fun horror TV show ever made?",
  "scream queens": "Is Scream Queens horror, comedy, or parody — and does it matter?",
  "marianne": "Why doesn't Marianne get more attention as one of the scariest Netflix horror shows?",
  "brand new cherry flavor": "Is Brand New Cherry Flavor too weird to be effective, or is the weirdness the point?",
  "from": "Is From building toward a satisfying mythology, or is it stalling like Lost did?",
  "the terror": "Is The Terror season 1 the best slow-burn horror TV ever made?",
  "ratched": "Does Ratched humanize a classic villain or destroy what made Nurse Ratched frightening?",
  "hannibal": "Is Hannibal (the show) actually a love story, and does that reframing make it better?",
  "slasher": "Does Slasher improve on its premise each season, or does the anthology format hurt continuity?",
  "are you afraid of the dark?": "Which Are You Afraid of the Dark? episode actually traumatized you as a kid?",
  "tales from the darkside": "Is Tales from the Darkside underrated compared to other anthology shows of its era?",
  "creepshow": "Which Creepshow segment — film or series — is the definitive best of the anthology?",
  "supernatural": "Did Supernatural run too long, or did it earn every one of its 15 seasons?",
  "stranger things": "At what point did Stranger Things shift from horror to action-adventure, and was that the right move?",
  "dark": "Is Dark the smartest sci-fi/horror show ever made, or does it collapse under its own complexity?",
  "black mirror": "Which Black Mirror episode is the most genuinely horrifying, and has the show lost its edge?",
  "the outsider": "Does The Outsider succeed as a Stephen King adaptation, or does the supernatural element feel grafted on?",
};

export async function GET(request: NextRequest) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch all titles to match against
  const { data: titles, error } = await supabase
    .from("titles")
    .select("id, title, media_type");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const inserted: string[] = [];
  const skipped: string[] = [];
  const notFound: string[] = [];

  for (const [key, prompt] of Object.entries(DEBATE_PROMPTS)) {
    const match = (titles ?? []).find(
      (t: { id: string; title: string }) => t.title.toLowerCase().trim() === key
    );

    if (!match) {
      notFound.push(key);
      continue;
    }

    // Check if a thread already exists
    const { data: existing } = await supabase
      .from("debate_threads")
      .select("id")
      .eq("title_id", match.id)
      .single();

    if (existing) {
      skipped.push(match.title);
      continue;
    }

    const { error: insertError } = await supabase
      .from("debate_threads")
      .insert({ title_id: match.id, prompt });

    if (insertError) {
      return NextResponse.json({ error: insertError.message, on: match.title }, { status: 500 });
    }
    inserted.push(match.title);
  }

  return NextResponse.json({
    inserted: inserted.length,
    skipped: skipped.length,
    notFound: notFound.length,
    insertedTitles: inserted,
    notFoundKeys: notFound,
  });
}
