const express = require('express');
const router = express.Router();

const CATALOG = [
  { id: 'aot-s1', keywords: ['dark','intense','action','military','survival','titans','walls','despair','hope','scary','fight','war','sad'] },
  { id: 'demon-slayer', keywords: ['emotional','beautiful','animation','demons','sword','family','tragic','sad','cry','action','fight'] },
  { id: 'jjk-s1', keywords: ['hype','action','dark','fantasy','curses','sorcerers','superpowers','badass','fight','intense','cool'] },
  { id: 'mha-s1', keywords: ['uplifting','hopeful','action','superheroes','school','underdog','determination','motivating','hype','feel good'] },
  { id: 'one-piece', keywords: ['epic','adventure','funny','pirates','friendship','journey','optimistic','laugh','comedy','long','fun'] },
  { id: 'fma-brotherhood', keywords: ['deep','emotional','philosophical','alchemy','brotherhood','sacrifice','loss','redemption','sad','cry','dark','intense'] },
  { id: 'spirited-away', keywords: ['magical','whimsical','peaceful','coming of age','ghibli','spirit','chill','beautiful','calm','cozy'] },
  { id: 'princess-mononoke', keywords: ['epic','nature','forest','gods','war','environmentalism','dark','action','beautiful','ghibli'] },
  { id: 'my-neighbor-totoro', keywords: ['gentle','cozy','heartwarming','peaceful','childlike','wonder','family','chill','calm','cute','kids'] },
  { id: 'howls-moving-castle', keywords: ['romantic','fantastical','whimsical','magic','identity','war','love','beautiful','ghibli','cozy'] },
  { id: 'toy-story', keywords: ['fun','heartwarming','nostalgic','toys','friendship','rivalry','kids','family','feel good','laugh'] },
  { id: 'finding-nemo', keywords: ['feel good','adventure','emotional','ocean','family','heartwarming','kids','fun','cry','hope'] },
  { id: 'the-incredibles', keywords: ['action','funny','family','superheroes','suburbia','identity','hype','laugh','fun','cool'] },
  { id: 'wall-e', keywords: ['romantic','emotional','quiet','robot','space','love','environment','minimalist','chill','beautiful','sad','cry'] },
  { id: 'up', keywords: ['emotional','heartwarming','adventure','balloons','travel','grief','loss','cry','sad','feel good','family'] },
  { id: 'coco', keywords: ['emotional','cultural','vibrant','family','music','legacy','cry','sad','heartwarming','beautiful','feel good'] },
  { id: 'shrek', keywords: ['funny','irreverent','fairy tale','ogre','humor','satire','laugh','comedy','fun','kids'] },
  { id: 'how-to-train-your-dragon', keywords: ['action','heartwarming','adventure','vikings','dragons','friendship','family','feel good','beautiful'] },
  { id: 'spider-verse', keywords: ['hype','stylish','emotional','multiverse','stunning','identity','action','cool','beautiful','badass'] },
];

function score(mood, keywords) {
  const q = mood.toLowerCase();
  const words = q.split(/\s+/);
  let s = 0;
  for (const kw of keywords) {
    if (q.includes(kw)) s += 2;
    else if (words.some(w => kw.includes(w) || w.includes(kw))) s += 1;
  }
  return s;
}

router.post('/', async (req, res) => {
  const { mood } = req.body;
  if (!mood || typeof mood !== 'string' || mood.trim().length === 0) {
    return res.status(400).json({ error: 'mood required' });
  }

  const q = mood.trim();
  const scored = CATALOG
    .map(s => ({ id: s.id, score: score(q, s.keywords) }))
    .sort((a, b) => b.score - a.score);

  // If nothing matched at all, return a random mix
  const top = scored[0].score > 0
    ? scored.slice(0, 4).map(s => s.id)
    : CATALOG.sort(() => Math.random() - 0.5).slice(0, 4).map(s => s.id);

  res.json({ ids: top });
});

module.exports = router;
