export const SUBJECTS = [
  { id: 'english', name: 'Use of English', icon: 'BookOpen', mandatory: true },
  { id: 'mathematics', name: 'Mathematics', icon: 'Calculator' },
  { id: 'physics', name: 'Physics', icon: 'Zap' },
  { id: 'chemistry', name: 'Chemistry', icon: 'FlaskConical' },
  { id: 'biology', name: 'Biology', icon: 'Dna' },
  { id: 'economics', name: 'Economics', icon: 'TrendingUp' },
  { id: 'government', name: 'Government', icon: 'Landmark' },
  { id: 'literature', name: 'Literature-in-English', icon: 'Feather' },
  { id: 'accounting', name: 'Principles of Accounts', icon: 'FileSpreadsheet' },
  { id: 'commerce', name: 'Commerce', icon: 'Briefcase' },
];

export const DIFFICULTIES = ['All', 'Beginner', 'Intermediate', 'Advanced'];

export const QUESTION_BANK = {
  english: [
    {
      id: 'eng-1',
      subject: 'english',
      difficulty: 'Beginner',
      question: 'Choose the word nearest in meaning to the capitalized word: The principal gave a LUCID explanation of the new school regulations.',
      options: [
        { label: 'A', text: 'Vague and complicated' },
        { label: 'B', text: 'Clear and easy to understand' },
        { label: 'C', text: 'Lengthy and tedious' },
        { label: 'D', text: 'Ambiguous and controversial' }
      ],
      correctOption: 'B',
      hint: 'Think about a situation where everyone easily grasped what was being communicated.',
      explanation: '“Lucid” comes from Latin lux/lucere meaning light. In context, a lucid explanation is clear, transparent, and easily intelligible.'
    },
    {
      id: 'eng-2',
      subject: 'english',
      difficulty: 'Intermediate',
      question: 'Complete the sentence with the most appropriate option: Neither the teacher nor the students _______ present at the seminar.',
      options: [
        { label: 'A', text: 'was' },
        { label: 'B', text: 'were' },
        { label: 'C', text: 'is' },
        { label: 'D', text: 'are being' }
      ],
      correctOption: 'B',
      hint: 'Apply the rule of proximity for correlative conjunctions (neither...nor).',
      explanation: 'When subjects are joined by "neither... nor", the verb agrees in number and person with the subject closer to it. "The students" is plural and closer to the blank, so "were" is correct in the past tense.'
    },
    {
      id: 'eng-3',
      subject: 'english',
      difficulty: 'Intermediate',
      question: 'Choose the option that best explains the idiom: The manager decided to "bite the bullet" and announce the budget cuts.',
      options: [
        { label: 'A', text: 'To act violently during a staff meeting' },
        { label: 'B', text: 'To accept a difficult situation with courage and resolve' },
        { label: 'C', text: 'To defer an inevitable financial decision' },
        { label: 'D', text: 'To delegate responsibility to junior subordinates' }
      ],
      correctOption: 'B',
      hint: 'Historically, wounded soldiers bit on bullets during battlefield surgery without anesthesia.',
      explanation: '“To bite the bullet” is an established English idiom meaning to face a painful, grim, or challenging task with fortitude and endurance.'
    },
    {
      id: 'eng-4',
      subject: 'english',
      difficulty: 'Advanced',
      question: 'Identify the word opposite in meaning (antonym) to the capitalized word: The senator was criticized for his BELLICOSE rhetoric during the press conference.',
      options: [
        { label: 'A', text: 'Aggressive' },
        { label: 'B', text: 'Pugnacious' },
        { label: 'C', text: 'Pacifistic' },
        { label: 'D', text: 'Hostile' },
      ],
      correctOption: 'C',
      hint: 'Bellicose means demonstrating aggression or willingness to fight (from Latin bellum = war).',
      explanation: 'The opposite of war-like or aggressive (bellicose) is peaceful or non-violent (pacifistic). Options A, B, and D are synonyms.'
    },
    {
      id: 'eng-5',
      subject: 'english',
      difficulty: 'Intermediate',
      question: 'From the options lettered A to D, choose the option that has the same vowel sound as the one represented by the underlined letter(s): b-i-r-d (sound /ɜː/)',
      options: [
        { label: 'A', text: 'Bread' },
        { label: 'B', text: 'Word' },
        { label: 'C', text: 'Board' },
        { label: 'D', text: 'Bead' }
      ],
      correctOption: 'B',
      hint: 'Look for the centralized long vowel sound /ɜː/ as heard in "nurse" or "shirt".',
      explanation: '"Bird" is transcribed as /bɜːd/. "Word" is pronounced /wɜːd/, which shares the same long central vowel /ɜː/.'
    },
    {
      id: 'eng-6',
      subject: 'english',
      difficulty: 'Beginner',
      question: 'Select the option that best completes the sentence: She has lived in Lagos _______ five years.',
      options: [
        { label: 'A', text: 'since' },
        { label: 'B', text: 'for' },
        { label: 'C', text: 'during' },
        { label: 'D', text: 'from' }
      ],
      correctOption: 'B',
      hint: 'Use "for" to express duration or a period of time, and "since" for a specific point in time.',
      explanation: '"Five years" is a duration of time, so the preposition "for" is required in present perfect sentences.'
    }
  ],

  mathematics: [
    {
      id: 'mth-1',
      subject: 'mathematics',
      difficulty: 'Beginner',
      question: 'Solve for x in the linear equation: 3(x - 2) + 4 = 2(x + 5)',
      options: [
        { label: 'A', text: 'x = 8' },
        { label: 'B', text: 'x = 12' },
        { label: 'C', text: 'x = 14' },
        { label: 'D', text: 'x = 10' }
      ],
      correctOption: 'B',
      hint: 'Expand the parentheses on both sides first, then isolate like terms.',
      explanation: 'Expanding: 3x - 6 + 4 = 2x + 10 => 3x - 2 = 2x + 10. Subtract 2x from both sides: x - 2 = 10. Add 2 to both sides: x = 12.'
    },
    {
      id: 'mth-2',
      subject: 'mathematics',
      difficulty: 'Intermediate',
      question: 'If log₁₀(2) = 0.3010 and log₁₀(3) = 0.4771, calculate the value of log₁₀(18).',
      options: [
        { label: 'A', text: '1.2552' },
        { label: 'B', text: '0.9542' },
        { label: 'C', text: '1.1761' },
        { label: 'D', text: '1.0791' }
      ],
      correctOption: 'A',
      hint: 'Factor 18 into prime factors: 18 = 2 × 3² = 2 × 9.',
      explanation: 'log₁₀(18) = log₁₀(2 × 3²) = log₁₀(2) + 2·log₁₀(3) = 0.3010 + 2(0.4771) = 0.3010 + 0.9542 = 1.2552.'
    },
    {
      id: 'mth-3',
      subject: 'mathematics',
      difficulty: 'Intermediate',
      question: 'Find the derivative dy/dx of the function: y = 4x³ - 5x² + 7x - 9',
      options: [
        { label: 'A', text: '12x² - 10x + 7' },
        { label: 'B', text: '12x³ - 10x² + 7' },
        { label: 'C', text: '4x² - 5x + 7' },
        { label: 'D', text: '12x² - 5x' }
      ],
      correctOption: 'A',
      hint: 'Apply the power rule: d/dx [a·x^n] = n·a·x^(n-1).',
      explanation: 'd/dx (4x³) = 12x², d/dx (-5x²) = -10x, d/dx (7x) = 7, d/dx (-9) = 0. Combining terms gives 12x² - 10x + 7.'
    },
    {
      id: 'mth-4',
      subject: 'mathematics',
      difficulty: 'Advanced',
      question: 'A fair die is rolled twice. What is the probability that the sum of the numbers obtained is at least 10?',
      options: [
        { label: 'A', text: '1/6' },
        { label: 'B', text: '1/12' },
        { label: 'C', text: '5/36' },
        { label: 'D', text: '7/36' }
      ],
      correctOption: 'A',
      hint: 'Total possible outcomes = 36. List outcomes where the sum is 10, 11, or 12.',
      explanation: 'Sum = 10: (4,6), (5,5), (6,4) [3 pairs]. Sum = 11: (5,6), (6,5) [2 pairs]. Sum = 12: (6,6) [1 pair]. Total favorable outcomes = 3 + 2 + 1 = 6. Probability = 6/36 = 1/6.'
    },
    {
      id: 'mth-5',
      subject: 'mathematics',
      difficulty: 'Intermediate',
      question: 'The third term of a Geometric Progression (G.P.) is 12 and the sixth term is 96. What is the first term (a)?',
      options: [
        { label: 'A', text: '2' },
        { label: 'B', text: '3' },
        { label: 'C', text: '4' },
        { label: 'D', text: '6' }
      ],
      correctOption: 'B',
      hint: 'T_n = a·r^(n-1). Divide T_6 by T_3 to find r³.',
      explanation: 'T₃ = ar² = 12; T₆ = ar⁵ = 96. T₆ / T₃ = (ar⁵)/(ar²) = r³ = 96/12 = 8 => r = 2. Then a(2²) = 12 => 4a = 12 => a = 3.'
    }
  ],

  physics: [
    {
      id: 'phy-1',
      subject: 'physics',
      difficulty: 'Beginner',
      question: 'A car accelerates uniformly from rest to a velocity of 20 m/s in 5 seconds. What is the acceleration of the car?',
      options: [
        { label: 'A', text: '2 m/s²' },
        { label: 'B', text: '4 m/s²' },
        { label: 'C', text: '5 m/s²' },
        { label: 'D', text: '100 m/s²' }
      ],
      correctOption: 'B',
      hint: 'Use the first equation of linear motion: v = u + at.',
      explanation: 'Given u = 0 m/s, v = 20 m/s, and t = 5 s: a = (v - u)/t = (20 - 0)/5 = 4 m/s².'
    },
    {
      id: 'phy-2',
      subject: 'physics',
      difficulty: 'Intermediate',
      question: 'An electric kettle rated 2.0 kW is connected to a 240 V mains supply. What is the current drawn by the kettle?',
      options: [
        { label: 'A', text: '8.33 A' },
        { label: 'B', text: '12.0 A' },
        { label: 'C', text: '0.12 A' },
        { label: 'D', text: '480 A' }
      ],
      correctOption: 'A',
      hint: 'Power formula: P = V × I, remember to convert kW to Watts.',
      explanation: 'P = 2.0 kW = 2000 W. P = V × I => I = P / V = 2000 / 240 = 8.333 A.'
    },
    {
      id: 'phy-3',
      subject: 'physics',
      difficulty: 'Advanced',
      question: 'A radioactive sample has a half-life of 8 days. If an initial mass of 80 g is stored, what mass remains undecayed after 32 days?',
      options: [
        { label: 'A', text: '10 g' },
        { label: 'B', text: '5 g' },
        { label: 'C', text: '2.5 g' },
        { label: 'D', text: '1.25 g' }
      ],
      correctOption: 'B',
      hint: 'Determine the number of half-life cycles n = total time / half-life period.',
      explanation: 'n = 32 / 8 = 4 half-lives. Remaining mass = N₀ / (2^n) = 80 / (2⁴) = 80 / 16 = 5 g.'
    },
    {
      id: 'phy-4',
      subject: 'physics',
      difficulty: 'Intermediate',
      question: 'Which of the following optical instruments produces an upright, magnified, and virtual image?',
      options: [
        { label: 'A', text: 'Simple microscope (magnifying glass) with object within focal length' },
        { label: 'B', text: 'Pinhole camera' },
        { label: 'C', text: 'Astronomical telescope in normal adjustment for distant stars' },
        { label: 'D', text: 'Convex mirror' }
      ],
      correctOption: 'A',
      hint: 'Recall ray diagrams for a convex lens when the object is placed between the optical center and principal focus.',
      explanation: 'When an object is placed inside the focal length (u < f) of a convex lens, rays diverge after refraction, forming an erect, magnified, virtual image on the same side.'
    }
  ],

  chemistry: [
    {
      id: 'chm-1',
      subject: 'chemistry',
      difficulty: 'Beginner',
      question: 'What is the oxidation number of sulfur in sulfuric acid (H₂SO₄)?',
      options: [
        { label: 'A', text: '+4' },
        { label: 'B', text: '+6' },
        { label: 'C', text: '-2' },
        { label: 'D', text: '+2' }
      ],
      correctOption: 'B',
      hint: 'Hydrogen has an oxidation state of +1 and oxygen has -2 in most neutral compounds.',
      explanation: 'In H₂SO₄: 2(+1) + S + 4(-2) = 0 => 2 + S - 8 = 0 => S - 6 = 0 => S = +6.'
    },
    {
      id: 'chm-2',
      subject: 'chemistry',
      difficulty: 'Intermediate',
      question: 'Calculate the volume occupied by 8.8 g of carbon(IV) oxide (CO₂) at standard temperature and pressure (s.t.p). [Molar mass of CO₂ = 44 g/mol; Molar volume at s.t.p = 22.4 dm³]',
      options: [
        { label: 'A', text: '4.48 dm³' },
        { label: 'B', text: '2.24 dm³' },
        { label: 'C', text: '1.12 dm³' },
        { label: 'D', text: '8.80 dm³' }
      ],
      correctOption: 'A',
      hint: 'Number of moles = Mass / Molar Mass. Then Volume = Moles × 22.4 dm³.',
      explanation: 'Moles of CO₂ = 8.8 / 44 = 0.2 mol. Volume at s.t.p = 0.2 × 22.4 dm³ = 4.48 dm³.'
    },
    {
      id: 'chm-3',
      subject: 'chemistry',
      difficulty: 'Advanced',
      question: 'Which of the following organic compounds will decolorize acidified potassium tetraoxomanganate(VII) solution without needing sunlight or UV radiation?',
      options: [
        { label: 'A', text: 'Ethane' },
        { label: 'B', text: 'Ethene' },
        { label: 'C', text: 'Propane' },
        { label: 'D', text: 'Cyclohexane' }
      ],
      correctOption: 'B',
      hint: 'Unsaturated hydrocarbons with double or triple carbon-carbon bonds readily undergo addition reactions.',
      explanation: 'Ethene (C₂H₄) is an alkene with an unsaturated double bond that readily undergoes oxidation by acidified KMnO₄ (Baeyer test), decolorizing purple KMnO₄ to colorless Mn²⁺.'
    },
    {
      id: 'chm-4',
      subject: 'chemistry',
      difficulty: 'Intermediate',
      question: 'According to Le Chatelier’s principle, an increase in pressure on the equilibrium system: N₂(g) + 3H₂(g) ⇌ 2NH₃(g) will:',
      options: [
        { label: 'A', text: 'Shift the equilibrium position to the right (favoring ammonia production)' },
        { label: 'B', text: 'Shift the equilibrium position to the left' },
        { label: 'C', text: 'Have no effect on the equilibrium position' },
        { label: 'D', text: 'Decrease the rate of the forward reaction' }
      ],
      correctOption: 'A',
      hint: 'Compare the total moles of gaseous reactants (1 + 3 = 4) to gaseous products (2).',
      explanation: 'Increasing pressure shifts an equilibrium toward the side with fewer gas molecules. Since 4 gas moles react to form 2 gas moles, increasing pressure favors forward reaction.'
    }
  ],

  biology: [
    {
      id: 'bio-1',
      subject: 'biology',
      difficulty: 'Beginner',
      question: 'Which organelle is universally referred to as the "powerhouse of the cell" due to ATP synthesis?',
      options: [
        { label: 'A', text: 'Ribosome' },
        { label: 'B', text: 'Endoplasmic reticulum' },
        { label: 'C', text: 'Mitochondrion' },
        { label: 'D', text: 'Golgi apparatus' }
      ],
      correctOption: 'C',
      hint: 'Aerobic cellular respiration occurs within its inner folded cristae.',
      explanation: 'Mitochondria are the primary sites of ATP production through the citric acid cycle and oxidative phosphorylation.'
    },
    {
      id: 'bio-2',
      subject: 'biology',
      difficulty: 'Intermediate',
      question: 'In human genetics, if both parents are heterozygous carriers for the sickle cell allele (HbA HbS), what is the probability of them giving birth to a child with sickle cell disease (HbS HbS)?',
      options: [
        { label: 'A', text: '0% (0.0)' },
        { label: 'B', text: '25% (1/4)' },
        { label: 'C', text: '50% (1/2)' },
        { label: 'D', text: '75% (3/4)' }
      ],
      correctOption: 'B',
      hint: 'Perform a standard Mendelian monohybrid cross: AS × AS.',
      explanation: 'Cross AS × AS yields: AA (25%), AS (50%), and SS (25%). Therefore, the chance of a homozygous sickle cell child (SS) is 1 in 4 (25%).'
    },
    {
      id: 'bio-3',
      subject: 'biology',
      difficulty: 'Advanced',
      question: 'Which part of the mammalian nephron is primarily responsible for the reabsorption of glucose and amino acids by active transport?',
      options: [
        { label: 'A', text: 'Proximal convoluted tubule' },
        { label: 'B', text: 'Loop of Henle' },
        { label: 'C', text: 'Distal convoluted tubule' },
        { label: 'D', text: 'Collecting duct' }
      ],
      correctOption: 'A',
      hint: 'This section lies immediately adjacent to Bowman’s capsule and has extensive microvilli.',
      explanation: 'The proximal convoluted tubule (PCT) has specialized epithelial cells with microvilli and mitochondria that reabsorb virtually 100% of filtered glucose and amino acids.'
    },
    {
      id: 'bio-4',
      subject: 'biology',
      difficulty: 'Intermediate',
      question: 'A symbiotic relationship in which one organism benefits while the other is neither helped nor harmed is termed:',
      options: [
        { label: 'A', text: 'Mutualism' },
        { label: 'B', text: 'Parasitism' },
        { label: 'C', text: 'Commensalism' },
        { label: 'D', text: 'Predation' }
      ],
      correctOption: 'C',
      hint: 'Think of cattle egrets following grazing cattle or epiphytes on tree trunks.',
      explanation: 'Commensalism is an ecological relationship where one species benefits without causing harm or benefit to the host organism (+/0).'
    }
  ],

  economics: [
    {
      id: 'eco-1',
      subject: 'economics',
      difficulty: 'Beginner',
      question: 'The basic economic problem of all societies arises from:',
      options: [
        { label: 'A', text: 'Excessive money supply and inflation' },
        { label: 'B', text: 'Scarcity of resources in relation to unlimited human wants' },
        { label: 'C', text: 'Ineffective tax collection policies' },
        { label: 'D', text: 'High rate of population growth in developing countries' }
      ],
      correctOption: 'B',
      hint: 'Consider why choice and opportunity cost are necessary.',
      explanation: 'Scarcity is the fundamental economic problem: human desires are unlimited while available productive resources are finite.'
    },
    {
      id: 'eco-2',
      subject: 'economics',
      difficulty: 'Intermediate',
      question: 'When a percentage change in quantity demanded is exactly equal to the percentage change in price, the price elasticity of demand is:',
      options: [
        { label: 'A', text: 'Perfectively inelastic (Ed = 0)' },
        { label: 'B', text: 'Unitary elastic (Ed = 1)' },
        { label: 'C', text: 'Infinitely elastic (Ed = ∞)' },
        { label: 'D', text: 'Relatively inelastic (Ed < 1)' }
      ],
      correctOption: 'B',
      hint: 'Elasticity = (% change in Q) / (% change in P).',
      explanation: 'When %ΔQ / %ΔP = 1, demand possesses unitary elasticity (Ed = 1).'
    },
    {
      id: 'eco-3',
      subject: 'economics',
      difficulty: 'Advanced',
      question: 'Which of the following monetary policy instruments would the Central Bank of Nigeria (CBN) employ to curb acute inflationary pressure?',
      options: [
        { label: 'A', text: 'Lowering the Monetary Policy Rate (MPR)' },
        { label: 'B', text: 'Purchasing government treasury bills on Open Market Operations (OMO)' },
        { label: 'C', text: 'Raising the Cash Reserve Ratio (CRR)' },
        { label: 'D', text: 'Reducing legal liquidity ratios for commercial banks' }
      ],
      correctOption: 'C',
      hint: 'To fight inflation, the central bank must withdraw or tighten money supply from the banking system.',
      explanation: 'Increasing the Cash Reserve Ratio (CRR) forces commercial banks to hold more liquid reserves with the CBN, suppressing credit creation and money supply.'
    }
  ],

  government: [
    {
      id: 'gov-1',
      subject: 'government',
      difficulty: 'Beginner',
      question: 'The foremost political concept that describes the supreme and independent power of a state to govern its territory without external interference is:',
      options: [
        { label: 'A', text: 'Sovereignty' },
        { label: 'B', text: 'Constitutionalism' },
        { label: 'C', text: 'Federalism' },
        { label: 'D', text: 'Legitimacy' }
      ],
      correctOption: 'A',
      hint: 'First formulated by Jean Bodin in 1576.',
      explanation: 'Sovereignty is the exclusive legal authority of a state over its territory, citizenry, and domestic decisions without foreign coercion.'
    },
    {
      id: 'gov-2',
      subject: 'government',
      difficulty: 'Intermediate',
      question: 'Under the 1979 Constitution of the Federal Republic of Nigeria, the system of government shifted from:',
      options: [
        { label: 'A', text: 'Unitary to Confederal' },
        { label: 'B', text: 'Westminster Parliamentary to American Executive Presidential' },
        { label: 'C', text: 'Military junta to Monarchy' },
        { label: 'D', text: 'Executive Presidential to Parliamentary' }
      ],
      correctOption: 'B',
      hint: 'Think of Alhaji Shehu Shagari as Executive President replacing the British prime minister model.',
      explanation: 'The 1979 constitution replaced the British parliamentary cabinet model (which operated under the 1960/1963 constitutions) with an American-style executive presidency.'
    },
    {
      id: 'gov-3',
      subject: 'government',
      difficulty: 'Advanced',
      question: 'Which historical constitutional conference or constitution first officially introduced the concept of regionalism into Nigerian colonial administration?',
      options: [
        { label: 'A', text: 'Clifford Constitution of 1922' },
        { label: 'B', text: 'Richards Constitution of 1946' },
        { label: 'C', text: 'Macpherson Constitution of 1951' },
        { label: 'D', text: 'Lyttelton Constitution of 1954' }
      ],
      correctOption: 'B',
      hint: 'It created Northern, Western, and Eastern Regional Houses of Assembly.',
      explanation: 'The Richards Constitution of 1946 formally recognized the diversity of Nigeria by creating three administrative regions: Northern, Western, and Eastern.'
    }
  ],

  literature: [
    {
      id: 'lit-1',
      subject: 'literature',
      difficulty: 'Beginner',
      question: 'A direct comparison of two dissimilar things without using connecting words such as "like" or "as" is a:',
      options: [
        { label: 'A', text: 'Simile' },
        { label: 'B', text: 'Metaphor' },
        { label: 'C', text: 'Hyperbole' },
        { label: 'D', text: 'Personification' }
      ],
      correctOption: 'B',
      hint: 'For instance, saying "The classroom was a zoo".',
      explanation: 'A metaphor asserts that one thing is another thing directly, whereas a simile uses comparative words like "like" or "as".'
    },
    {
      id: 'lit-2',
      subject: 'literature',
      difficulty: 'Intermediate',
      question: 'In dramatic tragedy, the fundamental personality flaw or error in judgment that leads to the tragic hero’s ultimate downfall is termed:',
      options: [
        { label: 'A', text: 'Catharsis' },
        { label: 'B', text: 'Anagnorisis' },
        { label: 'C', text: 'Hamartia' },
        { label: 'D', text: 'Hubris' }
      ],
      correctOption: 'C',
      hint: 'Aristotle analyzed this Greek concept in his Poetics.',
      explanation: 'Hamartia represents the fatal character flaw (such as excessive pride or indecisiveness) causing the tragic hero’s downfall.'
    },
    {
      id: 'lit-3',
      subject: 'literature',
      difficulty: 'Advanced',
      question: 'Which poetic form consists of exactly fourteen lines, typically written in iambic pentameter with a structured rhyme scheme?',
      options: [
        { label: 'A', text: 'Ode' },
        { label: 'B', text: 'Sonnet' },
        { label: 'C', text: 'Elegy' },
        { label: 'D', text: 'Ballad' }
      ],
      correctOption: 'B',
      hint: 'Popularized by Petrarch and William Shakespeare.',
      explanation: 'A sonnet is a 14-line poem adhering to specific meter and rhyme schemes (Petrarchan octave/sestet or Shakespearean quatrains/couplet).'
    }
  ],

  accounting: [
    {
      id: 'acc-1',
      subject: 'accounting',
      difficulty: 'Beginner',
      question: 'State the foundational accounting equation that forms the basis of the modern balance sheet:',
      options: [
        { label: 'A', text: 'Assets = Capital + Liabilities' },
        { label: 'B', text: 'Assets + Capital = Liabilities' },
        { label: 'C', text: 'Capital = Assets + Liabilities' },
        { label: 'D', text: 'Liabilities = Assets + Capital' }
      ],
      correctOption: 'A',
      hint: 'What a firm owns (assets) is funded either by owners equity or external debt.',
      explanation: 'The fundamental accounting equation states: Assets = Equity (Capital) + Liabilities.'
    },
    {
      id: 'acc-2',
      subject: 'accounting',
      difficulty: 'Intermediate',
      question: 'An item of office furniture purchased for ₦120,000 cash was mistakenly debited to the Office Stationery Account. What type of accounting error has occurred?',
      options: [
        { label: 'A', text: 'Error of omission' },
        { label: 'B', text: 'Error of commission' },
        { label: 'C', text: 'Error of principle' },
        { label: 'D', text: 'Compensating error' }
      ],
      correctOption: 'C',
      hint: 'A capital expenditure (fixed asset) was recorded as a revenue expenditure (expense).',
      explanation: 'An Error of Principle occurs when a transaction violates basic accounting principles—such as treating capital expenditure (Furniture) as revenue expenditure (Stationery).'
    },
    {
      id: 'acc-3',
      subject: 'accounting',
      difficulty: 'Advanced',
      question: 'A trader depreciates a delivery van costing ₦5,000,000 at 20% per annum using the reducing balance method. What is the depreciation charge for the second year?',
      options: [
        { label: 'A', text: '₦1,000,000' },
        { label: 'B', text: '₦800,000' },
        { label: 'C', text: '₦640,000' },
        { label: 'D', text: '₦400,000' }
      ],
      correctOption: 'B',
      hint: 'Under reducing balance, calculate 20% on the net book value at the start of year 2.',
      explanation: 'Year 1 depreciation = 20% of ₦5,000,000 = ₦1,000,000. Book value end of Yr 1 = ₦4,000,000. Year 2 depreciation = 20% of ₦4,000,000 = ₦800,000.'
    }
  ],

  commerce: [
    {
      id: 'com-1',
      subject: 'commerce',
      difficulty: 'Beginner',
      question: 'Commercial activities that facilitate the transfer of goods from the producer to final consumers are collectively known as:',
      options: [
        { label: 'A', text: 'Aids to trade' },
        { label: 'B', text: 'Manufacturing industries' },
        { label: 'C', text: 'Extractive occupations' },
        { label: 'D', text: 'Wholesale monopolies' }
      ],
      correctOption: 'A',
      hint: 'Examples include banking, insurance, transportation, warehousing, and advertising.',
      explanation: 'Aids to trade are services that bridge gaps between producers and consumers (banking, transport, warehousing, advertising, communication, insurance).'
    },
    {
      id: 'com-2',
      subject: 'commerce',
      difficulty: 'Intermediate',
      question: 'The insurance principle which stipulates that the insured cannot make a profit from a loss, but only be restored to their previous financial position is:',
      options: [
        { label: 'A', text: 'Subrogation' },
        { label: 'B', text: 'Insurable interest' },
        { label: 'C', text: 'Indemnity' },
        { label: 'D', text: 'Utmost good faith (Uberrimae Fidei)' }
      ],
      correctOption: 'C',
      hint: 'From the Latin word meaning to make whole without financial enrichment.',
      explanation: 'The principle of indemnity ensures the policyholder is compensated only for the actual loss suffered, placing them in the same financial state as before the mishap.'
    },
    {
      id: 'com-3',
      subject: 'commerce',
      difficulty: 'Advanced',
      question: 'In international trade, a document issued by a shipping company acknowledging the receipt of cargo for transit and acting as a document of title is called a:',
      options: [
        { label: 'A', text: 'Consular invoice' },
        { label: 'B', text: 'Bill of Lading' },
        { label: 'C', text: 'Certificate of Origin' },
        { label: 'D', text: 'Charter party' }
      ],
      correctOption: 'B',
      hint: 'It serves as a contract of carriage and receipt for sea freight.',
      explanation: 'A Bill of Lading is issued by a maritime carrier acknowledging receipt of cargo for shipment, providing evidence of ownership and transport terms.'
    }
  ]
};

// Helper to calculate official WASSCE Grade
export const getWassceGrade = (percentage) => {
  if (percentage >= 75) return { grade: 'A1', label: 'Excellent', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
  if (percentage >= 70) return { grade: 'B2', label: 'Very Good', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
  if (percentage >= 65) return { grade: 'B3', label: 'Good', color: 'text-sky-400 bg-sky-500/10 border-sky-500/30' };
  if (percentage >= 60) return { grade: 'C4', label: 'Credit', color: 'text-sky-400 bg-sky-500/10 border-sky-500/30' };
  if (percentage >= 55) return { grade: 'C5', label: 'Credit', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' };
  if (percentage >= 50) return { grade: 'C6', label: 'Credit', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' };
  if (percentage >= 45) return { grade: 'D7', label: 'Pass', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
  if (percentage >= 40) return { grade: 'E8', label: 'Pass', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
  return { grade: 'F9', label: 'Fail', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' };
};
