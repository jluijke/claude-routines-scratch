/**
 * The word bank: every word the curriculum uses, with its syllables and the
 * stretch of letters that carries the spelling pattern.
 *
 * Spec format (see spelling/wordbank.ts): "-" marks a syllable break and
 * "[...]" marks the pattern span.  Australian spellings throughout.
 */
import { buildWordBank } from '../spelling/wordbank'
import type { WordSpecOptions } from '../spelling/wordbank'

type Spec = string | [string, WordSpecOptions]

// --- Exercise 1: syllables ------------------------------------------------
const syllableWords: Spec[] = [
  'fan-tas-tic', 'com-pu-ter', 'el-e-phant', 'um-brel-la', 're-mem-ber',
  'di-no-saur', 'hos-pi-tal', 'ad-ven-ture', 'croc-o-dile', 'won-der-ful',
  'kan-ga-roo', 'but-ter-fly', 'Sep-tem-ber', 'im-por-tant', 'hol-i-day',
  'mag-net', 'rab-bit', 'gar-den', 'bas-ket', 'jum-per',
  'ten-nis', 'win-dow', 'pic-n[ic]', 'sand-wich', 'choc-o-late',
  'yes-ter-day', 'af-ter-noon', 'bas-ket-ball', 'lem-on-ade', 'tel-e-scope',
]

// --- Exercise 2: the /ee/ sound -------------------------------------------
const eeWords: Spec[] = [
  'gr[ee]n', 'sl[ee]p', 'tr[ee]', 'k[ee]p', 'thr[ee]', 'sh[ee]p', 'qu[ee]n',
  'w[ee]k', 'f[ee]t', 'd[ee]p', 'sw[ee]t', 'n[ee]-dle', 'be-tw[ee]n', 'ch[ee]se',
  't[ea]m', 'b[ea]ch', 'dr[ea]m', 'cl[ea]n', 'l[ea]f', '[ea]t', 's[ea]',
  'm[ea]t', 's[ea]t', 'tr[ea]t', 'ea-s[y]', 't[ea]-cher',
  'hap-p[y]', 'fun-n[y]', 'sun-n[y]', 'cit-[y]', 'la-d[y]', 'fam-i-l[y]',
  'twen-t[y]', 'sto-r[y]', 'ba-b[y]', 'par-t[y]',
  'k[ey]', 'mon-k[ey]', 'hon-[ey]', 'don-k[ey]', 'val-l[ey]', 'chim-n[ey]',
]

// --- Exercise 3: the /oa/ sound -------------------------------------------
const oaWords: Spec[] = [
  'b[oa]t', 'c[oa]t', 'r[oa]d', 's[oa]p', 't[oa]st', 'g[oa]t', 'fl[oa]t',
  'c[oa]ch', 'thr[oa]t', '[oa]k', 'l[oa]d', 'r[oa]st',
  'sn[ow]', 'sl[ow]', 'gr[ow]', 'yel-l[ow]', 'win-d[ow]', 'rain-b[ow]',
  'shad-[ow]', 'el-b[ow]', 'bl[ow]', 'pil-l[ow]',
  ['h[o]me', {}], ['b[o]ne', {}], ['st[o]ne', {}], ['n[o]te', {}],
  ['r[o]pe', {}], ['h[o]le', { sentence: 'There is a hole in my sock.' }],
  ['n[o]se', {}], ['th[o]se', {}], ['ph[o]ne', {}], ['sm[o]ke', {}],
  't[oe]', 'g[oe]s', 'h[oe]', 'd[oe]', 'tip-t[oe]',
]

// --- Exercise 4: plural -s and -es ----------------------------------------
const pluralWords: Spec[] = [
  'cat', 'cats', 'dog', 'dogs', 'book', 'books', 'tree', 'trees',
  'house', 'hou-ses', 'chair', 'chairs', 'hand', 'hands', 'shoe', 'shoes',
  'bus', 'bus-[es]', 'box', 'box-[es]', 'brush', 'brush-[es]', 'watch', 'watch-[es]',
  'fox', 'fox-[es]', 'dish', 'dish-[es]', 'glass', 'glass-[es]', 'church', 'church-[es]',
  'beach', 'beach-[es]', 'class', 'class-[es]', 'wish', 'wish-[es]', 'match', 'match-[es]',
  'bench', 'bench-[es]', 'tax', 'tax-[es]', 'buzz', 'buzz-[es]', 'sand-wich-[es]',
]

// --- Exercise 5: consonant + y plurals ------------------------------------
const yPluralWords: Spec[] = [
  'ba-b[ies]', 'cher-ry', 'cher-r[ies]', 'cit-[ies]', 'par-t[ies]',
  'sto-r[ies]', 'pup-py', 'pup-p[ies]', 'la-d[ies]', 'fam-i-l[ies]',
  'pen-ny', 'pen-n[ies]', 'but-ter-fl[ies]', 'ar-my', 'ar-m[ies]',
  'coun-try', 'coun-tr[ies]', 'pon-y', 'pon-[ies]', 'ber-ry', 'ber-r[ies]',
  'k[eys]', 'mon-k[eys]', 'don-k[eys]', 'val-l[eys]', 'chim-n[eys]',
  'day', 'd[ays]', 'boy', 'b[oys]', 'toy', 't[oys]', 'tur-key', 'tur-k[eys]',
]

// --- Exercise 6: compound words -------------------------------------------
const compoundWords: Spec[] = [
  'rain-[bow]', 'tooth-[brush]', 'foot-[ball]', 'bed-[room]', 'sun-[flow-er]',
  'play-[ground]', 'birth-[day]', 'cup-[cake]', 'note-[book]', 'snow-[man]',
  'sea-[side]', 'week-[end]', 'home-[work]', 'door-[bell]', 'black-[board]',
  'straw-[ber-ry]', 'sky-[scrap-er]', 'pop-[corn]', 'camp-[fire]', 'tooth-[paste]',
  'jump-ing', 'play-ing', 'read-ing', 'look-ing',
]

// --- Exercise 7: doubling the final consonant -----------------------------
const doublingWords: Spec[] = [
  'run', 'ru[n-n]ing', 'hop', 'ho[p-p]ing', 'stop', 'sto[p-p]ed',
  'sit', 'si[t-t]ing', 'swim', 'swi[m-m]ing', 'shop', 'sho[p-p]ing',
  'plan', 'pla[n-n]ed', 'drop', 'dro[p-p]ed', 'drum', 'dru[m-m]ing',
  'clap', 'cla[p-p]ing', 'hug', 'hu[g-g]ing', 'jog', 'jo[g-g]ing',
  'chat', 'cha[t-t]ing', 'grab', 'gra[b-b]ing', 'skip', 'ski[p-p]ing',
  'win', 'wi[n-n]ing', 'pat', 'pa[t-t]ed', 'trip', 'tri[p-p]ing',
]

// --- Exercise 8: dropping the silent e ------------------------------------
const dropEWords: Spec[] = [
  'make', 'mak-[ing]', 'hope', 'hop-[ing]', 'write', 'writ-[ing]',
  'ride', 'rid-[ing]', 'bake', 'bak-[ing]', 'dance', 'danc-[ing]',
  'smile', 'smil-[ing]', 'use', 'us-[ing]', 'move', 'mov-[ing]',
  'drive', 'driv-[ing]', 'close', 'clos-[ing]', 'shine', 'shin-[ing]',
  'tape', 'tap-[ing]', 'shake', 'shak-[ing]', 'save', 'sav-[ing]',
]

// --- Homophones and other words used in sentences -------------------------
const contextWords: Spec[] = [
  ['to', { sentence: 'I am going to the shop.' }],
  ['too', { sentence: 'That bag is too heavy.' }],
  ['two', { sentence: 'I have two brothers.' }],
  ['there', { sentence: 'Put your bag over there.' }],
  ['their', { sentence: 'The kids lost their ball.' }],
  ["they're", { sentence: "They're playing outside." }],
  ['piece', { sentence: 'I ate a piece of cake.' }],
  ['peace', { sentence: 'The garden was full of peace and quiet.' }],
  ['hear', { sentence: 'Can you hear the music?' }],
  ['here', { sentence: 'Come and sit here with me.' }],
  ['week', { sentence: 'We go swimming once a week.' }],
  ['weak', { sentence: 'My legs felt weak after the race.' }],
  ['sea', { sentence: 'We swam in the sea.' }],
  ['see', { sentence: 'I can see the mountains.' }],
  'park', 'friend', 'school', 'water', 'river', 'bridge', 'sword', 'shield',
  'really', 'because', 'people', 'colour', 'favourite', 'centre', 'metre',
]


// --- Level 2: Pattern Hunters ---------------------------------------------
const level2Words: Spec[] = [
  // -ed endings that sound different but spell the same
  'jump-[ed]', 'play-[ed]', 'want-[ed]', 'walk-[ed]', 'land-[ed]', 'point-[ed]',
  'kick-[ed]', 'shout-[ed]', 'clean-[ed]', 'paint-[ed]', 'wait-[ed]', 'help-[ed]',
  'paint', 'shout', 'want', 'land',
  // plural endings that sound like /s/, /z/ and /iz/
  'lamp[s]', 'bed[s]', 'ro-s[es]', 'ta-ble[s]', 'clock[s]', 'bird[s]', 'hor-s[es]', 'snake[s]',
  // -er and -est
  'fast', 'fast-[er]', 'fast-[est]', 'tall', 'tall-[er]', 'tall-[est]',
  'quick', 'quick-[er]', 'quick-[est]', 'big', 'bi[g-g]er', 'bi[g-g]est',
  'hot', 'ho[t-t]er', 'ho[t-t]est', 'thin', 'thi[n-n]er', 'thi[n-n]est',
  'slow', 'slow-[er]', 'slow-[est]', 'strong', 'strong-[er]', 'strong-[est]',
  // y becomes i before an ending
  'hap-p[ier]', 'hap-p[iest]', 'fun-n[ier]', 'fun-n[iest]', 'ear-l[ier]',
  'lucky', 'luck-[ier]', 'luck-[iest]', 'tid-y', 'tid-[ier]', 'tid-[iest]',
  'heav-y', 'heav-[ier]', 'heav-[iest]', 'no-is-y', 'nois-[ier]',
  // -ly
  'quick-[ly]', 'slow-[ly]', 'sad-[ly]', 'kind-[ly]', 'love-[ly]', 'safe-[ly]',
  'hap-pi-[ly]', 'an-gri-[ly]', 'eas-i-[ly]', 'lazi-[ly]', 'brave-[ly]', 'loud-[ly]',
  'quiet-[ly]', 'sud-den-[ly]', 'care-ful-[ly]',
  // silent letters
  '[kn]ee', '[kn]ow', '[kn]ife', '[kn]ock', '[kn]ot', '[kn]ight',
  '[wr]ite', '[wr]ong', '[wr]ap', '[wr]ist', '[wr]eck', '[wr]inkle',
  'thu[mb]', 'cli[mb]', 'la[mb]', 'co[mb]', 'cru[mb]', 'nu[mb]',
  // dge and ge
  'bri[dge]', 'ba[dge]', 'e[dge]', 'he[dge]', 'fu[dge]', 'ju[dge]', 'do[dge]',
  'hu[ge]', 'sta[ge]', 'ca[ge]', 'pa[ge]', 'lar[ge]', 'chan[ge]', 'villa[ge]',
  // tch and ch
  'ca[tch]', 'pi[tch]', 'ma[tch]', 'wi[tch]', 'sti[tch]', 'sket[ch]', 'scra[tch]',
  'mu[ch]', 'bea[ch]', 'ri[ch]', 'su[ch]', 'tea[ch]', 'lun[ch]', 'ben[ch]',
  'lo[dge]', 'e[dge]s', 'san-dcas-tle',
]


// --- Level 3: Word Engineers ----------------------------------------------
const level3Words: Spec[] = [
  // re- and un-
  '[re]-do', '[re]-read', '[re]-build', '[re]-turn', '[re]-play', '[re]-fill',
  '[un]-hap-py', '[un]-fair', '[un]-kind', '[un]-tie', '[un]-lock', '[un]-well',
  'fair', 'kind', 'lock', 'tie', 'well', 'do', 'build', 'turn',
  // mis-, dis-, pre-
  '[mis]-be-have', '[mis]-take', '[mis]-count', '[mis]-place', '[mis]-spell',
  '[dis]-a-gree', '[dis]-ap-pear', '[dis]-like', '[dis]-hon-est', '[dis]-obey',
  '[pre]-view', '[pre]-pay', '[pre]-heat', '[pre]-school', '[pre]-pare',
  'be-have', 'a-gree', 'ap-pear', 'view', 'heat', 'o-bey', 'hon-est',
  // sub-, under-, de-, anti-
  '[sub]-ma-rine', '[sub]-way', '[sub]-tract', '[sub]-head-ing',
  '[under]-ground', '[under]-wa-ter', '[under]-stand', '[under]-line',
  '[de]-ac-ti-vate', '[de]-frost', '[de]-part', '[anti]-ven-om', '[anti]-clock-wise',
  // -ful and -less
  'help-[ful]', 'care-[ful]', 'col-our-[ful]', 'cheer-[ful]', 'use-[ful]', 'play-[ful]',
  'fear-[less]', 'care-[less]', 'hope-[less]', 'end-[less]', 'use-[less]', 'harm-[less]',
  'help', 'care', 'cheer', 'harm', 'fear', 'end', 'use',
  // -ness
  'kind-[ness]', 'dark-[ness]', 'hap-pi-[ness]', 'sad-[ness]', 'ill-[ness]',
  'good-[ness]', 'fit-[ness]', 'weak-[ness]', 'bright-[ness]', 'lazi-[ness]',
  'dark', 'sad', 'good', 'bright', 'weak',
  // -ment
  'en-joy-[ment]', 'move-[ment]', 'ex-cite-[ment]', 'meas-ure-[ment]',
  'pay-[ment]', 'a-gree-[ment]', 'treat-[ment]', 'e-quip-[ment]', 'ar-gu-[ment]',
  'en-joy', 'ex-cite', 'meas-ure', 'treat', 'pay',
  // -ous
  'dan-ger-[ous]', 'fam-[ous]', 'nerv-[ous]', 'cour-age-[ous]', 'poi-son-[ous]',
  'joy-[ous]', 'ser-i-[ous]', 'jeal-[ous]', 'mount-ain-[ous]', 'hu-mor-[ous]',
  'dan-ger', 'poi-son', 'cour-age', 'moun-tain',
  // word families
  'un-help-ful', 'help-ful-ness', 'un-help-ful-ness', 'un-kind-ness', 'care-less-ness',
  'un-care-ful', 'hope-ful-ness', 'thought-ful', 'thought-less', 'thought',
]


// --- Level 4: Meaning Masters ---------------------------------------------
// Homophones live and die by their sentence, so nearly every entry here
// carries one: the audio must be able to give the word in context.
const level4Words: Spec[] = [
  ['there', { sentence: 'Put your bag over there.', confusions: ['their', "they're"] }],
  ['their', { sentence: 'The children lost their ball.', confusions: ['there', "they're"] }],
  ["they're", { sentence: "They're playing outside already.", confusions: ['there', 'their'] }],
  ['your', { sentence: 'Is this your jumper?', confusions: ["you're"] }],
  ["you're", { sentence: "You're going to love this.", confusions: ['your'] }],
  ['its', { sentence: 'The dog wagged its tail.', confusions: ["it's"] }],
  ["it's", { sentence: "It's raining again.", confusions: ['its'] }],
  ['one', { sentence: 'I only need one more.', confusions: ['won'] }],
  ['won', { sentence: 'Our team won the final.', confusions: ['one'] }],
  ['right', { sentence: 'Turn right at the corner.', confusions: ['write'] }],
  ['knew', { sentence: 'I knew the answer straight away.', confusions: ['new'] }],
  ['new', { sentence: 'She has a new bike.', confusions: ['knew'] }],
  ['no', { sentence: 'There is no milk left.', confusions: ['know'] }],
  ['blue', { sentence: 'The sky was bright blue.', confusions: ['blew'] }],
  ['blew', { sentence: 'The wind blew all night.', confusions: ['blue'] }],
  ['flour', { sentence: 'We need flour for the cake.', confusions: ['flower'] }],
  ['flower', { sentence: 'She picked a yellow flower.', confusions: ['flour'] }],
  // contractions
  ["could-n['t]", {}], ["would-n['t]", {}], ["did-n['t]", {}], ["do[n't]", {}],
  ["is-n['t]", {}], ["was-n['t]", {}], ["have-n['t]", {}], ["ca[n't]", {}],
  ["I['ll]", {}], ["we['ll]", {}], ["they['ll]", {}], ["I['m]", {}], ["I['ve]", {}],
  ["she['s]", {}], ["we['re]", {}], ["let['s]", {}],
  'could', 'would', 'not', 'will', 'have', 'are',
  // the lazy vowel — schwa
  'a-b[ou]t', 'prob-l[e]m', 'sup-p[o]rt', 'an-i-m[a]l', 'fam-i-l[y]',
  'sep-[a]-rate', 'dif-f[e]-rent', 'in-t[e]-rest', 'gen-[e]-ral', 'choc-[o]-late',
  'veg-[e]-ta-ble', 'cam-[e]-ra', 'par-[e]nt', 'gar-d[e]n', 'mem-[o]-ry',
  // splitting long words two ways
  'un-for-tu-nate-ly', 'in-ter-est-ing', 'com-fort-a-ble', 'ex-tra-or-di-nar-y',
  'dis-ap-point-ment', 'un-be-liev-a-ble', 'in-de-pend-ent',
]


// --- Level 5: Spelling Detectives -----------------------------------------
const level5Words: Spec[] = [
  // soft c and soft g
  '[c]i-ty', '[c]y-cle', '[c]ent', '[c]ir-cle', '[c]el-ery', '[c]en-tre', '[c]ir-cus',
  '[g]i-ant', '[g]ym', '[g]em', '[g]en-tle', '[g]in-ger', '[g]er-m', '[g]i-raffe',
  'cat', 'cup', 'cot', 'gate', 'goat', 'gum',
  // the /shun/ ending
  'ac-[tion]', 'col-lec-[tion]', 'in-ven-[tion]', 'sta-[tion]', 'ques-[tion]',
  'at-ten-[tion]', 'di-rec-[tion]', 'frac-[tion]', 'men-[tion]', 'sec-[tion]',
  'cel-e-bra-[tion]', 'in-struc-[tion]', 'de-scrip-[tion]', 'im-ag-i-na-[tion]',
  'act', 'col-lect', 'in-vent', 'di-rect', 'in-struct',
  // Greek and Latin roots
  '[tele]-phone', '[tele]-scope', '[tele]-vi-sion', '[photo]-graph', '[photo]-graph-er',
  '[geo]-gra-phy', '[micro]-scope', '[micro]-phone', '[auto]-graph', '[bi]-cy-cle',
  '[aqua]-ri-um', '[trans]-port', '[port]-a-ble', '[dict]-ion-a-ry',
  // Australian spellings
  'col-[our]', 'fav-our-ite', 'hon-[our]', 'har-b[our]', 'neigh-b[our]', 'fla-v[our]',
  'cen-t[re]', 'me-t[re]', 'thea-t[re]', 'lit-[re]', 'fi-b[re]',
  're-a-li[se]', 'or-gan-i[se]', 'rec-og-ni[se]', 'a-pol-o-gi[se]', 'prac-ti[se]',
  'trav-el-[led]', 'trav-el-[ling]', 'jew-el-[lery]',
  // sentences worth dictating
  'weath-er', 'be-cause', 'friend', 'thought', 'through', 'en-ough', 'a-noth-er',
  'me-t[res]', 'buy', 'shelf', 'climbed', 'rain-ing', 'sleep-ing', 'com-plete-ly',
  'an-swers', 'ap-ol-o-gised', 'mis-placed', 'changed', 'paint-ed', 'fence',
  'to-geth-er', 'per-haps', 'a-gainst', 'be-lieve', 'oc-ca-sion', 'straight',
]

export const WORD_BANK = buildWordBank([
  ...syllableWords,
  ...eeWords,
  ...oaWords,
  ...pluralWords,
  ...yPluralWords,
  ...compoundWords,
  ...doublingWords,
  ...dropEWords,
  ...contextWords,
  ...level2Words,
  ...level3Words,
  ...level4Words,
  ...level5Words,
])
