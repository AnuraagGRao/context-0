-- Context0 D1 Database Schema
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS questions (
  id INTEGER PRIMARY KEY,
  category TEXT NOT NULL,
  text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_option TEXT NOT NULL,
  difficulty TEXT DEFAULT 'easy',
  explanation TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS quiz_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  category TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  total INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS leaderboard (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL,
  score INTEGER NOT NULL,
  accuracy REAL NOT NULL,
  streak INTEGER DEFAULT 1,
  category TEXT DEFAULT 'All',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category);
CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON leaderboard(score DESC);

-- Seed Categories
INSERT OR IGNORE INTO categories (id, name, description, icon) VALUES
(1, 'Science', 'Physics, Chemistry, Astronomy, and Biological wonders', '🔬'),
(2, 'History', 'World history from ancient empires to the modern era', '📜'),
(3, 'Geography', 'Countries, capitals, rivers, peaks, and borders', '🌍'),
(4, 'Pop Culture', 'Cinema, music, iconic milestones, and modern trends', '🎬'),
(5, 'Technology', 'Computing, internet architecture, software, and AI', '💻');

-- Seed Core Question Bank
INSERT OR IGNORE INTO questions (id, category, text, option_a, option_b, option_c, option_d, correct_option, difficulty, explanation) VALUES
(1, 'Science', 'What is the chemical symbol for gold?', 'Go', 'Gd', 'Au', 'Ag', 'C', 'easy', 'Gold''s symbol "Au" comes from the Latin word "Aurum", meaning shining dawn.'),
(2, 'Science', 'How many bones are in the adult human body?', '196', '206', '216', '226', 'B', 'medium', 'The adult human skeletal framework comprises exactly 206 distinct bones.'),
(3, 'Science', 'What is the speed of light in a vacuum (approximately)?', '150,000 km/s', '200,000 km/s', '300,000 km/s', '400,000 km/s', 'C', 'easy', 'Light travels at approximately 299,792 kilometers per second in a vacuum.'),
(4, 'Science', 'Which planet has the most confirmed moons in our solar system?', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'B', 'medium', 'Saturn leads our solar system with over 140 confirmed natural satellites.'),
(5, 'Science', 'What is the powerhouse organelle of the eukaryotic cell?', 'Nucleus', 'Mitochondria', 'Ribosome', 'Golgi apparatus', 'B', 'easy', 'Mitochondria generate most of the chemical energy needed to power the cell''s biochemical reactions (ATP).'),
(6, 'Science', 'What is the absolute zero temperature in Celsius?', '-273.15°C', '-212.00°C', '-300.50°C', '-100.00°C', 'A', 'medium', 'Absolute zero is 0 Kelvin or exactly -273.15° Celsius, where molecular motion reaches minimum energy.'),

(7, 'History', 'In which year did World War II officially conclude?', '1943', '1944', '1945', '1946', 'C', 'easy', 'World War II concluded in 1945 with the formal surrender documents signed in September.'),
(8, 'History', 'Who served as the first President of the United States?', 'John Adams', 'Thomas Jefferson', 'Benjamin Franklin', 'George Washington', 'D', 'easy', 'George Washington served as the first US President from 1789 to 1797.'),
(9, 'History', 'The ancient city of Rome is traditionally dated to have been founded in which year?', '753 BC', '500 BC', '1000 BC', '300 BC', 'A', 'medium', 'Roman tradition and archaeological evidence date the founding by Romulus to circa 753 BC.'),
(10, 'History', 'Which queen was the last active ruler of the Ptolemaic Kingdom of Egypt?', 'Nefertiti', 'Hatshepsut', 'Cleopatra VII', 'Arsinoe II', 'C', 'easy', 'Cleopatra VII Philopator ruled Egypt until 30 BC when Egypt became a Roman province.'),
(11, 'History', 'Which empire built the monumental architectural complex of Machu Picchu?', 'Aztec', 'Inca', 'Maya', 'Olmec', 'B', 'easy', 'Machu Picchu was constructed as an estate for the Inca emperor Pachacuti in the 15th century.'),

(12, 'Geography', 'What is the capital city of Australia?', 'Sydney', 'Melbourne', 'Brisbane', 'Canberra', 'D', 'easy', 'Canberra was chosen as a compromise site between rivals Sydney and Melbourne in 1908.'),
(13, 'Geography', 'Which river is recognized as the longest in the world?', 'Amazon', 'Nile', 'Yangtze', 'Mississippi', 'B', 'easy', 'The Nile River in Africa spans approximately 6,650 km, traditionally recorded as the world''s longest.'),
(14, 'Geography', 'Which nation holds the largest terrestrial land area on Earth?', 'China', 'Canada', 'United States', 'Russia', 'D', 'easy', 'Russia spans approximately 17.1 million square kilometers across Europe and Asia.'),
(15, 'Geography', 'What is the deepest known oceanic trench on the planet?', 'Java Trench', 'Puerto Rico Trench', 'Mariana Trench', 'Tonga Trench', 'C', 'easy', 'The Challenger Deep in the Mariana Trench plunges to a depth of nearly 11,000 meters.'),
(16, 'Geography', 'Which mountain range separates the European and Asian continents?', 'Alps', 'Ural Mountains', 'Himalayas', 'Andes', 'B', 'medium', 'The Ural Mountains run north-south through western Russia, forming the conventional boundary.'),

(17, 'Pop Culture', 'Which film became the first non-English production to win Best Picture at the Oscars (2020)?', '1917', 'Joker', 'Parasite', 'Roma', 'C', 'medium', 'Bong Joon-ho''s South Korean masterpiece "Parasite" won four Academy Awards including Best Picture in 2020.'),
(18, 'Pop Culture', 'Which artist released the iconic studio album "Thriller" in 1982?', 'Prince', 'Michael Jackson', 'David Bowie', 'Stevie Wonder', 'B', 'easy', '"Thriller" remains the highest-selling record worldwide, certified at over 70 million copies.'),
(19, 'Pop Culture', 'What is the fictional metal alloy bonded to Wolverine''s skeleton in Marvel comics?', 'Vibranium', 'Adamantium', 'Uru', 'Mithril', 'B', 'easy', 'Wolverine was infused with virtually indestructible Adamantium during the Weapon X program.'),
(20, 'Pop Culture', 'In "The Lord of the Rings", into which volcanic chasm must the One Ring be cast to be destroyed?', 'Mount Doom (Orodruin)', 'Erebor', 'Moria', 'Cirith Ungol', 'A', 'easy', 'The One Ring can only be unmade in the fires of Mount Doom in Mordor where it was originally forged.'),

(21, 'Technology', 'Who co-founded Apple Computer with Steve Jobs in 1976?', 'Bill Gates', 'Steve Wozniak', 'Larry Page', 'Dennis Ritchie', 'B', 'easy', 'Steve Wozniak ("Woz") designed and hand-built the Apple I and Apple II computers.'),
(22, 'Technology', 'What does the networking acronym "HTTP" stand for?', 'HyperText Transfer Protocol', 'High Transfer Text Protocol', 'HyperText Transmission Process', 'Hybrid Text Technology Protocol', 'A', 'easy', 'HTTP is the foundational application layer protocol enabling distributed hypertext information systems.'),
(23, 'Technology', 'Which computer programming language was created by Guido van Rossum in 1991?', 'Java', 'Ruby', 'Python', 'Perl', 'C', 'easy', 'Python was created by Guido van Rossum with an emphasis on code readability and syntax elegance.'),
(24, 'Technology', 'What algorithmic consensus mechanism did Bitcoin introduce in 2008?', 'Proof of Stake', 'Proof of Authority', 'Proof of Work', 'Proof of History', 'C', 'medium', 'Satoshi Nakamoto introduced Nakamoto consensus based on SHA-256 Proof of Work mining.'),
(25, 'Technology', 'Which open-source operating system kernel was released by Linus Torvalds in 1991?', 'FreeBSD', 'Linux', 'Minix', 'Darwin', 'B', 'easy', 'Linus Torvalds announced the Linux kernel on the comp.os.minix newsgroup on August 25, 1991.');
