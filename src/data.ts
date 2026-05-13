export interface Episode {
  id: number;
  title: string;
  duration: string;
  url: string;
  thumbnail?: string;
}

export interface Series {
  id: string;
  title: string;
  category: string;
  description: string;
  instructor: string;
  thumbnail?: string;
  backdrop?: string;
  episodes: Episode[];
}

// Big Buck Bunny — Blender Foundation, CC BY 3.0. 1080p cartoon placeholder for all episodes.
const PLACEHOLDER = "https://upload.wikimedia.org/wikipedia/commons/transcoded/c/c0/Big_Buck_Bunny_4K.webm/Big_Buck_Bunny_4K.webm.1080p.vp9.webm";

export const allSeries: Series[] = [
  // ── Anime ──────────────────────────────────────────────────────────────────
  {
    id: "aot-s1",
    title: "Attack on Titan",
    category: "Anime",
    instructor: "MAPPA",
    thumbnail: "https://cdn.myanimelist.net/images/anime/10/47347.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/rqbCbjB19amtOtFQbb3K2lgm2zv.jpg",
    description:
      "Centuries ago, mankind was slaughtered to near extinction by monstrous humanoid creatures called Titans. Survivors built three concentric walls to protect themselves. When the outer wall crumbles, Eren Yeager vows to destroy every Titan that walks the earth.",
    episodes: [
      { id: 1,  title: "To You, in 2000 Years: The Fall of Shiganshina, Part 1", duration: "24:00", url: PLACEHOLDER },
      { id: 2,  title: "That Day: The Fall of Shiganshina, Part 2",              duration: "24:00", url: PLACEHOLDER },
      { id: 3,  title: "A Dim Light Amid Despair: Humanity's Comeback, Part 1",  duration: "24:00", url: PLACEHOLDER },
      { id: 4,  title: "The Night of the Closing Ceremony: Humanity's Comeback, Part 2", duration: "24:00", url: PLACEHOLDER },
      { id: 5,  title: "First Battle: The Struggle for Trost, Part 1",           duration: "24:00", url: PLACEHOLDER },
      { id: 6,  title: "The World the Girl Saw: The Struggle for Trost, Part 2", duration: "24:00", url: PLACEHOLDER },
      { id: 7,  title: "Small Blade: The Struggle for Trost, Part 3",            duration: "24:00", url: PLACEHOLDER },
      { id: 8,  title: "I Can Hear His Heartbeat: The Struggle for Trost, Part 4", duration: "24:00", url: PLACEHOLDER },
      { id: 9,  title: "Whereabouts of His Left Arm: The Struggle for Trost, Part 5", duration: "24:00", url: PLACEHOLDER },
      { id: 10, title: "Response: The Struggle for Trost, Part 6",               duration: "24:00", url: PLACEHOLDER },
      { id: 11, title: "Idol: The Struggle for Trost, Part 7",                   duration: "24:00", url: PLACEHOLDER },
      { id: 12, title: "Wound: The Struggle for Trost, Part 8",                  duration: "24:00", url: PLACEHOLDER },
    ],
  },
  {
    id: "demon-slayer",
    title: "Demon Slayer: Kimetsu no Yaiba",
    category: "Anime",
    instructor: "ufotable",
    thumbnail: "https://cdn.myanimelist.net/images/anime/1286/99889.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/3GQKYh6Trm8pxd2AypovoYQf4Ay.jpg",
    description:
      "Tanjiro Kamado's peaceful life is shattered when his family is slaughtered by a demon. His sister Nezuko survives but is transformed into one. Determined to restore her humanity, Tanjiro sets out to become a Demon Slayer.",
    episodes: [
      { id: 1,  title: "Cruelty",                            duration: "26:00", url: PLACEHOLDER  },
      { id: 2,  title: "Trainer Sakonji Urokodaki",          duration: "24:00", url: PLACEHOLDER  },
      { id: 3,  title: "Sabito and Makomo",                  duration: "24:00", url: PLACEHOLDER  },
      { id: 4,  title: "Final Selection",                    duration: "24:00", url: PLACEHOLDER  },
      { id: 5,  title: "My Own Steel",                       duration: "24:00", url: PLACEHOLDER  },
      { id: 6,  title: "Swordsman Accompanying a Demon",     duration: "24:00", url: PLACEHOLDER  },
      { id: 7,  title: "Muzan Kibutsuji",                    duration: "24:00", url: PLACEHOLDER  },
      { id: 8,  title: "The Smell of Enchanting Blood",      duration: "24:00", url: PLACEHOLDER  },
      { id: 9,  title: "Temari Demon and Arrow Demon",       duration: "24:00", url: PLACEHOLDER  },
      { id: 10, title: "Together Forever",                   duration: "24:00", url: PLACEHOLDER  },
      { id: 11, title: "Tsuzumi Mansion",                    duration: "24:00", url: PLACEHOLDER },
      { id: 12, title: "The Boar Bares Its Fangs, Zenitsu Sleeps", duration: "24:00", url: PLACEHOLDER },
    ],
  },
  {
    id: "jjk-s1",
    title: "Jujutsu Kaisen",
    category: "Anime",
    instructor: "MAPPA",
    thumbnail: "https://cdn.myanimelist.net/images/anime/1171/109222.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/lthkKBLe1rX6iThgVFg22O02sJw.jpg",
    description:
      "High schooler Yuji Itadori swallows a cursed finger belonging to the demon king Ryomen Sukuna to protect his friends and is thrust into the dangerous world of Jujutsu Sorcery.",
    episodes: [
      { id: 1,  title: "Ryomen Sukuna",                                    duration: "24:00", url: PLACEHOLDER  },
      { id: 2,  title: "For Myself",                                       duration: "24:00", url: PLACEHOLDER  },
      { id: 3,  title: "Girl of Steel",                                    duration: "24:00", url: PLACEHOLDER  },
      { id: 4,  title: "Curse Womb Must Die",                              duration: "24:00", url: PLACEHOLDER  },
      { id: 5,  title: "Curse Womb Must Die II",                           duration: "24:00", url: PLACEHOLDER  },
      { id: 6,  title: "After Rain",                                       duration: "24:00", url: PLACEHOLDER  },
      { id: 7,  title: "Assault",                                          duration: "24:00", url: PLACEHOLDER  },
      { id: 8,  title: "Boredom",                                          duration: "24:00", url: PLACEHOLDER  },
      { id: 9,  title: "Small Fry and Reverse Retribution",                duration: "24:00", url: PLACEHOLDER  },
      { id: 10, title: "Idle Transfiguration",                             duration: "24:00", url: PLACEHOLDER  },
      { id: 11, title: "Narrow-Minded",                                    duration: "24:00", url: PLACEHOLDER },
      { id: 12, title: "To You, Someday",                                  duration: "24:00", url: PLACEHOLDER },
    ],
  },
  {
    id: "mha-s1",
    title: "My Hero Academia",
    category: "Anime",
    instructor: "Bones",
    thumbnail: "https://cdn.myanimelist.net/images/anime/10/78745.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/ol0H2DGp4ifBHA4JDlCpwJWxnY2.jpg",
    description:
      "In a world where 80% of humanity has superpowers, Izuku Midoriya is born without one. Despite this, he dreams of becoming the greatest hero and catches the eye of the world's number one hero, All Might.",
    episodes: [
      { id: 1,  title: "Izuku Midoriya: Origin",         duration: "24:00", url: PLACEHOLDER  },
      { id: 2,  title: "What It Takes to Be a Hero",     duration: "24:00", url: PLACEHOLDER  },
      { id: 3,  title: "Roaring Muscles",                duration: "24:00", url: PLACEHOLDER  },
      { id: 4,  title: "Start Line",                     duration: "24:00", url: PLACEHOLDER  },
      { id: 5,  title: "What I Can Do for Now",          duration: "24:00", url: PLACEHOLDER  },
      { id: 6,  title: "Rage, You Damned Nerd",          duration: "24:00", url: PLACEHOLDER  },
      { id: 7,  title: "Deku vs. Kacchan",               duration: "24:00", url: PLACEHOLDER  },
      { id: 8,  title: "Bakugo's Start Line",            duration: "24:00", url: PLACEHOLDER  },
      { id: 9,  title: "Yeah, Just Do Your Best, Iida!", duration: "24:00", url: PLACEHOLDER  },
      { id: 10, title: "Encounter with the Unknown",     duration: "24:00", url: PLACEHOLDER  },
      { id: 11, title: "Game Over",                      duration: "24:00", url: PLACEHOLDER },
      { id: 12, title: "All Might",                      duration: "24:00", url: PLACEHOLDER },
      { id: 13, title: "In Each of Our Hearts",          duration: "24:00", url: PLACEHOLDER },
    ],
  },
  {
    id: "one-piece",
    title: "One Piece",
    category: "Anime",
    instructor: "Toei Animation",
    thumbnail: "https://cdn.myanimelist.net/images/anime/6/73245.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/4Mt7WHox67uJ1yErwTBFcV8KWgG.jpg",
    description:
      "Monkey D. Luffy sets sail to find the legendary treasure One Piece and become King of the Pirates. Gifted with the power of the Gum-Gum Fruit, he gathers a crew of extraordinary misfits along the way.",
    episodes: [
      { id: 1,  title: "I'm Luffy! The Man Who's Gonna Be King of the Pirates!",  duration: "24:00", url: PLACEHOLDER  },
      { id: 2,  title: "The Great Swordsman Appears! Pirate Hunter Roronoa Zoro!", duration: "24:00", url: PLACEHOLDER  },
      { id: 3,  title: "Morgan versus Luffy! Who's This Beautiful Young Girl?",    duration: "24:00", url: PLACEHOLDER  },
      { id: 4,  title: "Luffy's Past! The Red-Haired Shanks Appears!",            duration: "24:00", url: PLACEHOLDER  },
      { id: 5,  title: "A Terrifying Mysterious Power! Captain Buggy the Clown!", duration: "24:00", url: PLACEHOLDER  },
      { id: 6,  title: "Desperate Situation! Beast Tamer Mohji vs. Luffy!",       duration: "24:00", url: PLACEHOLDER  },
      { id: 7,  title: "Epic Showdown! Swordsman Zoro vs. Acrobat Cabaji!",       duration: "24:00", url: PLACEHOLDER  },
      { id: 8,  title: "Who Is the Victor? Devil Fruit Power Showdown!",          duration: "24:00", url: PLACEHOLDER  },
      { id: 9,  title: "The Honorable Liar? Captain Usopp!",                      duration: "24:00", url: PLACEHOLDER  },
      { id: 10, title: "The Weirdly Talented Nami and the Cheat-master Buggy!",   duration: "24:00", url: PLACEHOLDER  },
      { id: 11, title: "Expose the Pirate-Hating Female Warrior!",                duration: "24:00", url: PLACEHOLDER },
      { id: 12, title: "Clash with the Black Cat Pirates!",                       duration: "24:00", url: PLACEHOLDER },
    ],
  },
  {
    id: "fma-brotherhood",
    title: "Fullmetal Alchemist: Brotherhood",
    category: "Anime",
    instructor: "Bones",
    thumbnail: "https://cdn.myanimelist.net/images/anime/1223/96541.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/A6tMQAo6t6eRFCPhsrShmxZLqFB.jpg",
    description:
      "Two brothers use alchemy in an attempt to resurrect their deceased mother, only to lose parts of their own bodies. Now they search for the Philosopher's Stone to restore what was lost.",
    episodes: [
      { id: 1,  title: "Fullmetal Alchemist",                  duration: "24:00", url: PLACEHOLDER  },
      { id: 2,  title: "The First Day",                        duration: "24:00", url: PLACEHOLDER  },
      { id: 3,  title: "City of Heresy",                       duration: "24:00", url: PLACEHOLDER  },
      { id: 4,  title: "An Alchemist's Anguish",               duration: "24:00", url: PLACEHOLDER  },
      { id: 5,  title: "Rain of Sorrows",                      duration: "24:00", url: PLACEHOLDER  },
      { id: 6,  title: "Road of Hope",                         duration: "24:00", url: PLACEHOLDER  },
      { id: 7,  title: "Hidden Truths",                        duration: "24:00", url: PLACEHOLDER  },
      { id: 8,  title: "The Fifth Laboratory",                 duration: "24:00", url: PLACEHOLDER  },
      { id: 9,  title: "Created Feelings",                     duration: "24:00", url: PLACEHOLDER  },
      { id: 10, title: "Separate Destinations",                duration: "24:00", url: PLACEHOLDER  },
      { id: 11, title: "Miracle at Rush Valley",               duration: "24:00", url: PLACEHOLDER },
      { id: 12, title: "One Is All, All Is One",               duration: "24:00", url: PLACEHOLDER },
    ],
  },

  // ── Animated Movies ────────────────────────────────────────────────────────
  {
    id: "toy-story",
    title: "Toy Story",
    category: "Animated",
    instructor: "Pixar",
    thumbnail: "https://image.tmdb.org/t/p/w500/uXDfjJbdP4ijW5hWSBrPrlKpxab.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/3Rfvhy1Nl6sSGJwyjb0QiZzZYlB.jpg",
    description:
      "When a new toy called Buzz Lightyear arrives and steals the spotlight, cowboy doll Woody finds himself cast aside. The two rivals must work together to escape and make it back to their owner Andy.",
    episodes: [
      { id: 1, title: "Toy Story", duration: "1:21:00", url: PLACEHOLDER },
    ],
  },
  {
    id: "finding-nemo",
    title: "Finding Nemo",
    category: "Animated",
    instructor: "Pixar",
    thumbnail: "https://image.tmdb.org/t/p/w500/5lc6nQc0VhWFYFbNv016xze8Jvy.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/eCynaAOgYYiw5yN5lBwz3IxqvaW.jpg",
    description:
      "After his son Nemo is captured and taken to a dentist's fish tank in Sydney, overprotective clownfish Marlin embarks on a journey across the ocean to bring him home.",
    episodes: [
      { id: 1, title: "Finding Nemo", duration: "1:40:00", url: PLACEHOLDER },
    ],
  },
  {
    id: "the-incredibles",
    title: "The Incredibles",
    category: "Animated",
    instructor: "Pixar",
    thumbnail: "https://image.tmdb.org/t/p/w500/2LqaLgk4Z226KkgPJuiOQ58wvrm.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/lxwzY9vNwjDgxWKt3zZ6zcU6rEJ.jpg",
    description:
      "A family of undercover superheroes, while trying to live a quiet suburban life, are forced into action to save the world from a diabolical villain who despises all things super.",
    episodes: [
      { id: 1, title: "The Incredibles", duration: "1:55:00", url: PLACEHOLDER },
    ],
  },
  {
    id: "wall-e",
    title: "WALL-E",
    category: "Animated",
    instructor: "Pixar",
    thumbnail: "https://image.tmdb.org/t/p/w500/hbhFnRzzg6ZDmm8YAmxBnQpQIPh.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/nYs4ZwnJBK4AgljhvzwNz7fpr3E.jpg",
    description:
      "In the distant future, a small waste-collecting robot accidentally embarks on a space journey that will ultimately decide the fate of mankind and his newfound love.",
    episodes: [
      { id: 1, title: "WALL-E", duration: "1:38:00", url: PLACEHOLDER },
    ],
  },
  {
    id: "up",
    title: "Up",
    category: "Animated",
    instructor: "Pixar",
    thumbnail: "https://image.tmdb.org/t/p/w500/nOEzQanBDekstniJGbH3iGLCA75.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/hGGC9gKo7CFE3fW07RA587e5kol.jpg",
    description:
      "Seventy-eight-year-old Carl Fredricksen ties thousands of balloons to his house and flies to South America to fulfil his late wife's dream — but a young stowaway named Russell comes along for the ride.",
    episodes: [
      { id: 1, title: "Up", duration: "1:36:00", url: PLACEHOLDER },
    ],
  },
  {
    id: "coco",
    title: "Coco",
    category: "Animated",
    instructor: "Pixar",
    thumbnail: "https://image.tmdb.org/t/p/w500/6Ryitt95xrO8KXuqRGm1fUuNwqF.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/g7CHF8gTLGooTbP4GznIGwaqAGL.jpg",
    description:
      "Aspiring musician Miguel is magically transported to the vibrant Land of the Dead, where he seeks out his great-great-grandfather — a legendary singer — to prove his family's musical destiny.",
    episodes: [
      { id: 1, title: "Coco", duration: "1:45:00", url: PLACEHOLDER },
    ],
  },
  {
    id: "spirited-away",
    title: "Spirited Away",
    category: "Anime",
    instructor: "Studio Ghibli",
    thumbnail: "https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/dyJvKsNs2KP8qQnAXbRwDjblViy.jpg",
    description:
      "Ten-year-old Chihiro stumbles into a spirit world and must find a way to free herself and her parents, who have been turned into pigs by a mysterious witch.",
    episodes: [
      { id: 1, title: "Spirited Away", duration: "2:04:00", url: PLACEHOLDER },
    ],
  },
  {
    id: "princess-mononoke",
    title: "Princess Mononoke",
    category: "Anime",
    instructor: "Studio Ghibli",
    thumbnail: "https://image.tmdb.org/t/p/w500/cMYCDADoLKLbB83g4WnJegaZimC.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/gl0jzn4BupSbL2qMVeqrjKkF9Js.jpg",
    description:
      "Young warrior Ashitaka becomes embroiled in a war between the gods of a forest and the humans who consume its resources. He seeks to find harmony, but both sides are beyond compromise.",
    episodes: [
      { id: 1, title: "Princess Mononoke", duration: "2:14:00", url: PLACEHOLDER },
    ],
  },
  {
    id: "my-neighbor-totoro",
    title: "My Neighbor Totoro",
    category: "Anime",
    instructor: "Studio Ghibli",
    thumbnail: "https://image.tmdb.org/t/p/w500/rtGDOeG9LzoerkDGZF9dnVeLppL.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/6O1mOoTXuc1WqjKd2R7MFQHZ7Eb.jpg",
    description:
      "Two young sisters move to the countryside and discover that the nearby forest is inhabited by magical creatures — including the gentle and enormous forest spirit, Totoro.",
    episodes: [
      { id: 1, title: "My Neighbor Totoro", duration: "1:26:00", url: PLACEHOLDER },
    ],
  },
  {
    id: "howls-moving-castle",
    title: "Howl's Moving Castle",
    category: "Anime",
    instructor: "Studio Ghibli",
    thumbnail: "https://image.tmdb.org/t/p/w500/13kOl2v0nD2OLbVSHnHk8GUFEhO.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/nv5wwZou159v5OC61i4ElR7OqyY.jpg",
    description:
      "Sophie, a young hat-maker, is cursed by a witch to live as an elderly woman. Her only hope is the wizard Howl and his magnificent moving castle.",
    episodes: [
      { id: 1, title: "Howl's Moving Castle", duration: "1:59:00", url: PLACEHOLDER },
    ],
  },
  {
    id: "shrek",
    title: "Shrek",
    category: "Animated",
    instructor: "DreamWorks",
    thumbnail: "https://image.tmdb.org/t/p/w500/iB64vpL3dIObOtMZgX3RqdVdQDc.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/40Wtp7kMG6mZ4d5T1jfrd8qrvD4.jpg",
    description:
      "A green ogre named Shrek finds his swamp invaded by fairy-tale creatures banished by the evil Lord Farquaad. To reclaim his home he sets out on a quest to rescue Princess Fiona from a dragon-guarded castle.",
    episodes: [
      { id: 1, title: "Shrek", duration: "1:30:00", url: PLACEHOLDER },
    ],
  },
  {
    id: "how-to-train-your-dragon",
    title: "How to Train Your Dragon",
    category: "Animated",
    instructor: "DreamWorks",
    thumbnail: "https://image.tmdb.org/t/p/w500/ygGmAO60t8GyqUo9xYeYxSZAR3b.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/59vDC1BuEQvti24OMr0ZvtAK6R1.jpg",
    description:
      "A young Viking who aspires to hunt dragons befriends one instead. His unlikely bond with the fearsome Night Fury dragon changes his world and challenges everything his tribe believes about dragons.",
    episodes: [
      { id: 1, title: "How to Train Your Dragon", duration: "1:38:00", url: PLACEHOLDER },
    ],
  },
  {
    id: "spider-verse",
    title: "Spider-Man: Into the Spider-Verse",
    category: "Animated",
    instructor: "Sony Pictures",
    thumbnail: "https://image.tmdb.org/t/p/w500/iiZZdoQBEYBv6id8su7ImL0oCbD.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/8mnXR9rey5uQ08rZAvzojKWbDQS.jpg",
    description:
      "Miles Morales, a Brooklyn teen, is suddenly thrust into the multiverse and must team up with Spider-People from alternate realities to stop a threat to all dimensions.",
    episodes: [
      { id: 1, title: "Spider-Man: Into the Spider-Verse", duration: "1:57:00", url: PLACEHOLDER },
    ],
  },
];
