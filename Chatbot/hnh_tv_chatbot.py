
# HnH-TV AI Chatbot  —  v2.0

from __future__ import annotations

import re
import random
import requests
from collections import Counter
from itertools import islice
from typing import Any, cast, Dict, List, Optional, Set, Tuple

# ═══════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════

HF_API_TOKEN = "hf_token"

# Sentiment model
HF_SENTIMENT_URL = (
    "https://router.huggingface.co/hf-inference/models/"
    "cardiffnlp/twitter-roberta-base-sentiment-latest"
)

# Zero-Shot Classification model for richer NLP
HF_ZEROSHOT_URL = (
    "https://router.huggingface.co/hf-inference/models/"
    "facebook/bart-large-mnli"
)

HEADERS = {"Authorization": f"Bearer {HF_API_TOKEN}"}

# Candidate genre/theme labels for zero-shot classification
ZEROSHOT_LABELS = [
    "comedy", "horror", "action", "romance", "science fiction",
    "mystery", "drama", "animation", "documentary", "thriller",
    "fantasy", "crime", "adventure", "biography", "historical",
]


# ═══════════════════════════════════════════════════════════════════
# SESSION MEMORY  (context-aware recommendations)
# ═══════════════════════════════════════════════════════════════════

class SessionMemory:
    """
    Remembers what the user has liked/disliked and which genres/moods
    they keep returning to, so recommendations improve each turn.
    """

    def __init__(self):
        self.genre_counts: Counter = Counter()   # genre → how often requested
        self.mood_history: list[str] = []        # ordered mood log
        self.liked_titles: set[str] = set()      # explicitly liked
        self.disliked_titles: set[str] = set()   # explicitly disliked
        self.seen_titles: set[str] = set()       # already recommended
        self.turn_count: int = 0

    # ── Preference tracking ──────────────────────────────────────
    def record_genre(self, genre: str | None):
        if genre:
            self.genre_counts[genre] += 1

    def record_mood(self, mood: str):
        self.mood_history.append(mood)

    def mark_liked(self, title: str):
        self.liked_titles.add(title)
        self.disliked_titles.discard(title)

    def mark_disliked(self, title: str):
        self.disliked_titles.add(title)
        self.liked_titles.discard(title)

    def mark_seen(self, titles: List[str]) -> None:
        self.seen_titles.update(titles)

    # ── Derived helpers ──────────────────────────────────────────
    @property
    def preferred_genre(self) -> Optional[str]:
        """Most-requested genre this session, if any."""
        top = self.genre_counts.most_common(1)
        if top:
            genre, _ = top[0]
            return str(genre)
        return None

    @property
    def dominant_mood(self) -> Optional[str]:
        """Most common mood in the last 5 turns."""
        history: List[str] = list(self.mood_history)
        n = len(history)
        recent: List[str] = list(islice(history, max(0, n - 5), n))
        if recent:
            top = Counter(recent).most_common(1)
            if top:
                mood, _ = top[0]
                return str(mood)
        return None

    def context_summary(self) -> str:
        """Plain-text summary shown to the user on request."""
        parts = []
        if self.preferred_genre:
            parts.append(f"favourite genre this session: **{self.preferred_genre}**")
        if self.dominant_mood:
            parts.append(f"dominant mood: **{self.dominant_mood}**")
        if self.liked_titles:
            parts.append(f"liked: {', '.join(sorted(self.liked_titles))}")
        if not parts:
            return "No preferences recorded yet — keep chatting and I'll learn! 😊"
        return "📊 What I know about you so far:\n  • " + "\n  • ".join(parts)


# Global session instance
session = SessionMemory()


# ═══════════════════════════════════════════════════════════════════
# MOVIE & TV SHOW DATABASE  (Rule-Based)
# ═══════════════════════════════════════════════════════════════════

CONTENT_DATABASE = {
    "happy": {
        "comedy": [
            "Friends", "The Office", "Brooklyn Nine-Nine", "Schitt's Creek",
            "Parks and Recreation", "New Girl", "Abbott Elementary", "Ted Lasso",
            "What We Do in the Shadows", "It's Always Sunny in Philadelphia",
            "Arrested Development", "30 Rock", "Superstore", "The Good Place",
        ],
        "adventure": [
            "Jumanji", "The Grand Budapest Hotel", "Paddington 2", "Indiana Jones",
            "The Princess Bride", "Guardians of the Galaxy", "Thor: Ragnarok",
            "Back to the Future", "The Mummy", "National Treasure",
        ],
        "animation": [
            "Toy Story", "Up", "Encanto", "Moana", "Coco", "The Lion King",
            "Shrek", "Despicable Me", "Spirited Away", "Zootopia",
            "Ratatouille", "Finding Nemo", "Kung Fu Panda", "Big Hero 6",
        ],
        "romance": [
            "Crazy Rich Asians", "To All the Boys I've Loved Before",
            "Hitch", "The Proposal", "Notting Hill", "10 Things I Hate About You",
            "About Time", "La La Land", "Marry Me", "When Harry Met Sally",
        ],
    },
    "sad": {
        "drama": [
            "The Shawshank Redemption", "Good Will Hunting", "Forrest Gump",
            "Manchester by the Sea", "Marriage Story", "Schindler's List",
            "The Green Mile", "A Star Is Born", "Moonlight", "Her",
        ],
        "inspirational": [
            "Soul", "A Beautiful Mind", "The Pursuit of Happyness",
            "October Sky", "Billy Elliot", "Wild", "The Secret Life of Walter Mitty",
            "Rudy", "Coach Carter", "Eddie the Eagle",
        ],
        "comfort": [
            "Chef", "Julie & Julia", "Eat Pray Love", "The Holiday",
            "Amélie", "Midnight in Paris", "Little Women", "Pride & Prejudice",
            "Gilmore Girls", "Downton Abbey",
        ],
    },
    "excited": {
        "action": [
            "John Wick", "Mad Max: Fury Road", "Top Gun: Maverick",
            "Die Hard", "The Dark Knight", "Speed Racer", "Fast & Furious",
            "The Raid", "Extraction", "Nobody", "Atomic Blonde",
            "Mission: Impossible – Fallout", "Spider-Man: No Way Home",
        ],
        "thriller": [
            "Inception", "Gone Girl", "Parasite", "Oldboy", "Prisoners",
            "Knives Out", "Glass Onion", "No Country for Old Men",
            "Zodiac", "Se7en", "The Silence of the Lambs",
        ],
        "sci-fi": [
            "Interstellar", "Dune", "Edge of Tomorrow", "The Martian",
            "Ex Machina", "Arrival", "Blade Runner 2049", "Annihilation",
            "Gravity", "District 9", "Looper", "Source Code",
        ],
    },
    "bored": {
        "mystery": [
            "Knives Out", "Glass Onion", "The White Lotus", "True Detective",
            "Sharp Objects", "Broadchurch", "Mare of Easttown", "Dark",
            "Mindhunter", "The Sinner", "Poker Face", "Only Murders in the Building",
        ],
        "documentary": [
            "Making a Murderer", "Tiger King", "The Last Dance",
            "Wild Wild Country", "Don't F**k with Cats", "The Tinder Swindler",
            "Icarus", "Fyre", "Free Solo", "13th", "My Octopus Teacher",
        ],
        "crime": [
            "Breaking Bad", "Ozark", "Mindhunter", "Narcos", "Peaky Blinders",
            "The Wire", "Better Call Saul", "Dexter", "Justified", "Fargo",
            "Dirty Money", "City on a Hill",
        ],
    },
    "scared": {
        "horror": [
            "Get Out", "A Quiet Place", "Hereditary", "The Conjuring",
            "It Follows", "The Witch", "Midsommar", "Sinister",
            "Us", "The Babadook", "Annihilation", "The Haunting of Hill House",
        ],
        "thriller": [
            "Gone Girl", "Black Mirror", "You", "Orphan Black",
            "The Talented Mr. Ripley", "Nightcrawler", "Shutter Island",
            "Rear Window", "Misery", "The Girl with the Dragon Tattoo",
        ],
    },
    "neutral": {
        "popular": [
            "Stranger Things", "The Crown", "Wednesday", "Squid Game",
            "House of the Dragon", "The Bear", "Severance", "Succession",
            "Euphoria", "The Last of Us", "Andor", "Rings of Power",
        ],
        "classics": [
            "The Godfather", "Pulp Fiction", "Inception", "The Matrix",
            "Schindler's List", "Goodfellas", "Casablanca", "Citizen Kane",
            "2001: A Space Odyssey", "Apocalypse Now", "Taxi Driver",
        ],
        "international": [
            "Parasite", "Money Heist", "Dark", "Squid Game", "Lupin",
            "Sacred Games", "3 Idiots", "Amélie", "Cinema Paradiso",
            "Pan's Labyrinth", "The Lives of Others",
        ],
    },
}


# ═══════════════════════════════════════════════════════════════════
# STORY / PLOT DATABASE  (search-by-description)
# ═══════════════════════════════════════════════════════════════════

STORY_DATABASE: List[Dict[str, Any]] = [
    # ── Sci-fi / Space / AI ─────────────────────────────────────
    {"title": "Interstellar",        "tags": ["space", "wormhole", "father", "future", "time", "survival", "gravity", "dimension"]},
    {"title": "Gravity",             "tags": ["space", "astronaut", "survival", "station", "orbit", "disaster"]},
    {"title": "The Martian",         "tags": ["mars", "astronaut", "survival", "stranded", "science", "nasa", "space"]},
    {"title": "Arrival",             "tags": ["alien", "language", "time", "communication", "loop", "memory", "military"]},
    {"title": "Ex Machina",          "tags": ["robot", "ai", "artificial intelligence", "android", "experiment", "isolated"]},
    {"title": "Blade Runner 2049",   "tags": ["robot", "android", "future", "identity", "dystopia", "replicant", "ai"]},
    {"title": "Dune",                "tags": ["desert", "prophecy", "empire", "alien planet", "spice", "chosen one", "war", "sand", "power", "betrayal"]},
    {"title": "Annihilation",        "tags": ["alien", "mystery", "jungle", "mutation", "biology", "expedition", "surreal"]},
    {"title": "Edge of Tomorrow",    "tags": ["time loop", "alien invasion", "war", "military", "repeat", "soldier"]},
    {"title": "District 9",          "tags": ["alien", "refugee", "apartheid", "south africa", "government", "transformation"]},
    # ── Superhero / Fantasy ──────────────────────────────────────
    {"title": "The Dark Knight",     "tags": ["batman", "joker", "crime", "villain", "city", "chaos", "hero", "corruption"]},
    {"title": "Spider-Man: No Way Home", "tags": ["multiverse", "spider-man", "superhero", "villain", "alternate reality"]},
    {"title": "Guardians of the Galaxy", "tags": ["space", "team", "comedy", "music", "adventure", "alien", "superhero"]},
    {"title": "Thor: Ragnarok",      "tags": ["thor", "hulk", "asgard", "arena", "comedy", "end of world", "superhero"]},
    # ── Crime / Thriller ─────────────────────────────────────────
    {"title": "Breaking Bad",        "tags": ["chemistry teacher", "drug", "meth", "transformation", "cancer", "criminal"]},
    {"title": "Ozark",               "tags": ["money laundering", "family", "cartel", "crime", "lake", "survival"]},
    {"title": "Knives Out",          "tags": ["murder mystery", "detective", "family", "inheritance", "mansion", "whodunit"]},
    {"title": "Parasite",            "tags": ["class", "rich family", "poor family", "infiltration", "deception", "basement"]},
    {"title": "Gone Girl",           "tags": ["missing wife", "marriage", "media", "psychological", "twist", "marriage"]},
    {"title": "Prisoners",           "tags": ["kidnapping", "child", "detective", "father", "investigation", "dark"]},
    {"title": "Zodiac",              "tags": ["serial killer", "detective", "newspaper", "investigation", "unsolved"]},
    {"title": "Se7en",               "tags": ["serial killer", "detective", "sins", "dark", "crime", "mystery", "box"]},
    {"title": "Mindhunter",          "tags": ["fbi", "serial killer", "psychology", "interview", "profiling", "crime"]},
    {"title": "Narcos",              "tags": ["drug lord", "cartel", "colombia", "true story", "pablo escobar"]},
    {"title": "Peaky Blinders",      "tags": ["gangster", "gang", "birmingham", "post war", "family", "crime", "1920s"]},
    {"title": "The Wire",            "tags": ["police", "drug dealer", "baltimore", "crime", "investigation", "society"]},
    # ── Drama / Emotional ────────────────────────────────────────
    {"title": "The Shawshank Redemption", "tags": ["prison", "hope", "friendship", "escape", "injustice", "freedom"]},
    {"title": "Forrest Gump",        "tags": ["simple man", "historic events", "love", "running", "destiny", "life journey"]},
    {"title": "Good Will Hunting",   "tags": ["genius", "therapy", "math", "south boston", "mentor", "trauma", "potential"]},
    {"title": "A Beautiful Mind",    "tags": ["genius", "math", "schizophrenia", "hallucination", "nobel prize", "professor"]},
    {"title": "Manchester by the Sea", "tags": ["grief", "loss", "family", "guilt", "tragedy", "uncle", "nephew"]},
    {"title": "Marriage Story",      "tags": ["divorce", "couple", "love", "breakup", "theatre", "custody"]},
    {"title": "Moonlight",           "tags": ["identity", "gay", "coming of age", "drug dealer", "childhood", "black"]},
    {"title": "Soul",                "tags": ["jazz", "afterlife", "purpose", "passion", "near death", "music", "new york"]},
    # ── Horror ───────────────────────────────────────────────────
    {"title": "Get Out",             "tags": ["racism", "hypnosis", "horror", "thriller", "black man", "white family", "creepy"]},
    {"title": "A Quiet Place",       "tags": ["silence", "monster", "family survival", "deaf", "post apocalypse", "quiet"]},
    {"title": "Hereditary",          "tags": ["grief", "cult", "demon", "family curse", "occult", "paranormal", "disturbing"]},
    {"title": "Midsommar",           "tags": ["cult", "summer", "pagan", "sweden", "ritual", "grief", "festival", "breakup"]},
    {"title": "The Haunting of Hill House", "tags": ["haunted house", "family trauma", "ghost", "siblings", "childhood", "horror"]},
    {"title": "The Witch",           "tags": ["puritan", "forest", "devil", "17th century", "family", "witch", "isolation"]},
    # ── Romance / Comedy ─────────────────────────────────────────
    {"title": "La La Land",          "tags": ["musician", "love", "dreams", "los angeles", "jazz", "actress", "bittersweet"]},
    {"title": "Crazy Rich Asians",   "tags": ["rich family", "wedding", "singapore", "love", "culture clash", "romance"]},
    {"title": "About Time",          "tags": ["time travel", "romance", "family", "love", "regret", "british", "father"]},
    {"title": "Amélie",              "tags": ["quirky", "paris", "matchmaking", "love", "imagination", "fantasy", "shy"]},
    {"title": "10 Things I Hate About You", "tags": ["high school", "shakespeare", "romance", "bet", "teen", "love"]},
    # ── Adventure / Family ───────────────────────────────────────
    {"title": "Spirited Away",       "tags": ["spirit world", "child", "magical", "japan", "bath house", "parents", "fantasy"]},
    {"title": "Up",                  "tags": ["old man", "adventure", "balloon house", "friendship", "loss", "dreams", "kid"]},
    {"title": "Coco",                "tags": ["mexico", "dead", "music", "family", "day of the dead", "guitar", "memory"]},
    {"title": "Inside Out",          "tags": ["emotions", "brain", "sadness", "joy", "memory", "girl", "growing up"]},
    {"title": "Ratatouille",         "tags": ["chef", "rat", "paris", "restaurant", "cooking", "dream", "friendship"]},
    # ── Historical / Biographical ────────────────────────────────
    {"title": "Schindler's List",    "tags": ["holocaust", "wwii", "jewish", "factory", "rescue", "nazi", "historical"]},
    {"title": "Oppenheimer",         "tags": ["atomic bomb", "manhattan project", "wwii", "physicist", "nuclear", "moral"]},
    {"title": "The Pursuit of Happyness", "tags": ["homeless", "single father", "stock broker", "struggle", "inspiration", "real story"]},
    # ── Mystery / Slow Burn ──────────────────────────────────────
    {"title": "Dark",                "tags": ["time travel", "germany", "family", "mystery", "loop", "cave", "multi-generational"]},
    {"title": "True Detective",      "tags": ["detective", "serial killer", "louisiana", "philosophy", "partnership", "ritual"]},
    {"title": "Severance",           "tags": ["work", "memory", "corporation", "identity", "two lives", "mysterious office"]},
    {"title": "Black Mirror",        "tags": ["technology", "future", "dystopia", "social media", "dark", "consequences", "ai"]},
]


# ═══════════════════════════════════════════════════════════════════
# KEYWORD / GENRE MAPPING  (lightweight NLP fallback)
# ═══════════════════════════════════════════════════════════════════

GENRE_KEYWORDS = {
    "comedy":        ["funny", "laugh", "humor", "comic", "hilarious", "joke", "silly", "lighthearted"],
    "horror":        ["scary", "horror", "frightening", "creepy", "ghost", "monster", "terrifying", "nightmare"],
    "action":        ["action", "fight", "explosion", "hero", "chase", "gun", "battle", "warrior", "thrill"],
    "romance":       ["love", "romance", "relationship", "dating", "couple", "wedding", "heartbreak", "kiss"],
    "science fiction": ["space", "future", "robot", "alien", "technology", "sci-fi", "science fiction", "cyberpunk", "time travel"],
    "mystery":       ["mystery", "detective", "crime", "murder", "whodunit", "clue", "investigation", "unsolved"],
    "drama":         ["drama", "emotional", "serious", "deep", "intense", "family", "life", "realistic"],
    "animation":     ["cartoon", "animated", "animation", "kids", "pixar", "disney", "animated movie"],
    "documentary":   ["documentary", "real", "true story", "facts", "history", "based on", "nonfiction"],
    "thriller":      ["suspense", "thriller", "psychological", "twist", "tense", "paranoia", "mind-bending"],
    "fantasy":       ["magic", "dragon", "wizard", "kingdom", "elf", "mythical", "fantasy world", "quest"],
    "crime":         ["gangster", "mafia", "heist", "drug", "cartel", "corrupt", "underworld"],
    "adventure":     ["journey", "explore", "quest", "discover", "expedition", "survival"],
    "biography":     ["biography", "biopic", "real person", "life story", "based on true events"],
    "historical":    ["historical", "period", "19th century", "wwii", "ancient", "war", "victorian"],
}

# Normalize zero-shot label → internal genre key
ZEROSHOT_TO_GENRE = {
    "science fiction": "sci-fi",
    "biography": "inspirational",
    "historical": "drama",
    "adventure": "adventure",
    **{g: g for g in ["comedy", "horror", "action", "romance", "mystery", "drama",
                       "animation", "documentary", "thriller", "fantasy", "crime"]},
}


# ═══════════════════════════════════════════════════════════════════
# SENTIMENT ANALYSIS  (HuggingFace API)
# ═══════════════════════════════════════════════════════════════════

def analyze_sentiment(text: str) -> str:
    """Returns 'positive', 'negative', or 'neutral'."""
    try:
        response = requests.post(
            HF_SENTIMENT_URL,
            headers=HEADERS,
            json={"inputs": text},
            timeout=10,
        )
        result = response.json()
        if isinstance(result, list) and len(result) > 0:
            candidates = result[0] if isinstance(result[0], list) else result
            best = max(candidates, key=lambda x: x.get("score", 0))
            label = best.get("label", "neutral").lower()
            if "pos" in label:
                return "positive"
            elif "neg" in label:
                return "negative"
        return "neutral"
    except Exception as e:
        print(f"[Sentiment API Error] {e}")
        return "neutral"


def map_sentiment_to_mood(sentiment: str, text: str) -> str:
    """Maps sentiment + explicit mood keywords → mood category."""
    text_lower = text.lower()
    if any(w in text_lower for w in ["excited", "pumped", "hyped", "thrilled", "energetic"]):
        return "excited"
    if any(w in text_lower for w in ["bored", "nothing to do", "boring", "dull"]):
        return "bored"
    if any(w in text_lower for w in ["scared", "afraid", "anxious", "nervous", "terrified"]):
        return "scared"
    if any(w in text_lower for w in ["sad", "depressed", "unhappy", "cry", "upset", "miserable"]):
        return "sad"
    if any(w in text_lower for w in ["happy", "great", "awesome", "joyful", "good", "fantastic", "wonderful"]):
        return "happy"
    if sentiment == "positive":
        return "happy"
    elif sentiment == "negative":
        return "sad"
    return "neutral"


# ═══════════════════════════════════════════════════════════════════
# NLP — GENRE EXTRACTION  (keyword + zero-shot)
# ═══════════════════════════════════════════════════════════════════

def extract_genre_keywords(text: str) -> str | None:
    """Fast keyword-based genre detection (no API call)."""
    text_lower = text.lower()
    for genre, keywords in GENRE_KEYWORDS.items():
        if any(kw in text_lower for kw in keywords):
            # Normalize to internal key
            return ZEROSHOT_TO_GENRE.get(genre, genre)
    return None


def extract_genre_zeroshot(text: str) -> str | None:
    """
    Uses HuggingFace Zero-Shot Classification to understand
    story descriptions, character mentions, and theme queries
    that plain keyword matching would miss.
    Returns internal genre key or None on failure.
    """
    try:
        payload = {
            "inputs": text,
            "parameters": {
                "candidate_labels": ZEROSHOT_LABELS,
                "multi_label": False,
            },
        }
        response = requests.post(
            HF_ZEROSHOT_URL,
            headers=HEADERS,
            json=payload,
            timeout=15,
        )
        result = response.json()
        if "labels" in result and "scores" in result:
            top_label = result["labels"][0]
            top_score = result["scores"][0]
            # Only trust the model if it's reasonably confident
            if top_score >= 0.30:
                return ZEROSHOT_TO_GENRE.get(top_label, top_label)
    except Exception as e:
        print(f"[Zero-Shot API Error] {e}")
    return None


def extract_genre(text: str) -> str | None:
    """
    Combined genre extractor:
      1. Fast keyword scan first (no API needed)
      2. Falls back to Zero-Shot Classification for story/character descriptions
    """
    genre = extract_genre_keywords(text)
    if genre:
        return genre
    return extract_genre_zeroshot(text)


# ═══════════════════════════════════════════════════════════════════
# STORY SEARCH ENGINE
# ═══════════════════════════════════════════════════════════════════

def story_search(query: str, top_n: int = 5) -> List[str]:
    """
    Matches a free-text description against the STORY_DATABASE by
    counting overlapping keywords in the query.
    Returns up to top_n titles sorted by relevance.
    """
    query_lower = query.lower()
    query_words = set(re.findall(r"\b\w+\b", query_lower))
    scored: List[Tuple[str, int]] = []
    seen_titles: set = set()

    for entry in STORY_DATABASE:
        title = str(entry["title"])
        tags: List[str] = list(entry["tags"])
        # Count how many of the entry's tags appear in the query
        score = sum(
            1 for tag in tags
            if any(word in tag or tag in query_lower for word in query_words)
        )
        if score > 0 and title not in seen_titles:
            seen_titles.add(title)
            scored.append((title, score))

    # Sort by score desc, then alphabetically for ties
    scored.sort(key=lambda x: (-x[1], x[0]))
    return [t for t, _ in list(islice(scored, top_n))]


# ═══════════════════════════════════════════════════════════════════
# RECOMMENDATION ENGINE  (Rule-Based + Session Memory)
# ═══════════════════════════════════════════════════════════════════

def get_recommendations(mood: str, genre: Optional[str] = None) -> List[str]:
    """
    Returns 5 fresh, non-repeated recommendations.

    Priority order:
      1. Session's preferred genre (if user has requested it before)
      2. Genre extracted from current message
      3. All titles for the current mood
    Excludes already-seen and explicitly disliked titles.
    """
    # Boost genre with session preference
    preferred = session.preferred_genre
    effective_genre = genre or preferred

    mood_content = CONTENT_DATABASE.get(mood, CONTENT_DATABASE["neutral"])
    pool: List[str] = []

    if effective_genre and effective_genre in mood_content:
        pool = list(mood_content[effective_genre])
        # Supplement with other genres so we always have enough
        for g, titles in mood_content.items():
            if g != effective_genre:
                pool.extend(titles)
    else:
        for titles in mood_content.values():
            pool.extend(titles)

    # Remove seen and disliked titles
    fresh = [
        t for t in pool
        if t not in session.seen_titles and t not in session.disliked_titles
    ]

    # If pool is exhausted, reset seen (but keep dislikes)
    if not fresh:
        session.seen_titles.clear()
        fresh = [t for t in pool if t not in session.disliked_titles]

    random.shuffle(fresh)
    picks: List[str] = list(islice(fresh, 5))
    session.mark_seen(picks)
    return picks


# ═══════════════════════════════════════════════════════════════════
# LIKE / DISLIKE PARSER
# ═══════════════════════════════════════════════════════════════════

def parse_feedback(text: str) -> Optional[str]:
    """
    Detects explicit like/dislike feedback.
    Returns: 'liked:<title>', 'disliked:<title>', or None.

    Examples:
      "I loved Interstellar"   -> 'liked:Interstellar'
      "didn't like Ozark"      -> 'disliked:Ozark'
    """
    lower = text.lower()

    # Check for liked
    liked_patterns = [r"loved?\s+(.+)", r"liked?\s+(.+)", r"enjoyed?\s+(.+)", r"great\s+(.+)"]
    for pat in liked_patterns:
        m = re.search(pat, lower)
        if m:
            raw: str = m.group(1).strip().title()
            for entry in STORY_DATABASE:
                etitle: str = cast(str, entry["title"])
                if etitle.lower() in raw.lower() or raw.lower() in etitle.lower():
                    return f"liked:{etitle}"

    # Check for disliked
    dislike_patterns = [
        r"didn'?t like\s+(.+)", r"hated?\s+(.+)", r"not a fan of\s+(.+)", r"disliked?\s+(.+)"
    ]
    for pat in dislike_patterns:
        m = re.search(pat, lower)
        if m:
            raw: str = m.group(1).strip().title()
            for entry in STORY_DATABASE:
                etitle: str = cast(str, entry["title"])
                if etitle.lower() in raw.lower() or raw.lower() in etitle.lower():
                    return f"disliked:{etitle}"

    return None


# ═══════════════════════════════════════════════════════════════════
# WATCH HISTORY (simple session-based)
# ═══════════════════════════════════════════════════════════════════

watch_history: List[str] = []

def parse_watch_history(text: str) -> Optional[str]:
    """Detects when the user says they watched something."""
    lower = text.lower()
    patterns = [r"just watched\s+(.+)", r"finished\s+(.+)", r"i watched\s+(.+)", r"seen\s+(.+)"]
    for pat in patterns:
        m = re.search(pat, lower)
        if m:
            raw: str = m.group(1).strip().title()
            for entry in STORY_DATABASE:
                etitle: str = cast(str, entry["title"])
                if etitle.lower() in raw.lower() or raw.lower() in etitle.lower():
                    return etitle
    return None


# ═══════════════════════════════════════════════════════════════════
# RESPONSE GENERATOR
# ═══════════════════════════════════════════════════════════════════

def generate_response(user_input: str) -> str:
    """
    Master logic: user input → analysis → personalized response.
    """
    session.turn_count += 1
    user_input = user_input.strip()
    lower = user_input.lower()

    # ── Greetings ────────────────────────────────────────────────
    if any(w in lower for w in ["hello", "hi", "hey", "what's up", "howdy", "sup"]):
        greeting_suffix = ""
        if session.preferred_genre:
            greeting_suffix = (
                f"\n\nI remember you like **{session.preferred_genre}** content — "
                "want more of that today?"
            )
        return (
            "👋 Hey there! Welcome to HnH-TV!\n"
            "I'm your AI assistant. I can help you:\n"
            "  🎬 Find movies/shows based on your **mood**\n"
            "  🔍 Search by **story, character, or theme** descriptions\n"
            "  😊 Recommend based on **how you're feeling**\n"
            "  🧠 Learn your preferences over time\n\n"
            "How are you feeling today, or what kind of story are you in the mood for?"
            + greeting_suffix
        )

    # ── Farewell ─────────────────────────────────────────────────
    if any(w in lower for w in ["bye", "goodbye", "exit", "quit", "see you", "later"]):
        return "👋 Goodbye! Enjoy your watch on HnH-TV! Come back anytime 🎬"

    # ── Help ─────────────────────────────────────────────────────
    if "help" in lower or "what can you do" in lower:
        return (
            "🤖 Here's what I can do for you:\n"
            "  • **Mood-based recs** → 'I'm feeling sad, suggest something good'\n"
            "  • **Genre search** → 'Show me something funny'\n"
            "  • **Story search** → 'Something about a genius with mental illness'\n"
            "  • **Character search** → 'A movie with a detective solving murders'\n"
            "  • **Feedback** → 'I loved Interstellar' / 'I didn't like Ozark'\n"
            "  • **My profile** → 'What do you know about me?'\n"
            "  • **Watch history** → 'I just watched Breaking Bad'\n\n"
            "Try: *'Something about time travel and family grief'* 😊"
        )

    # ── Profile / Context Summary ─────────────────────────────────
    if any(w in lower for w in ["my profile", "what do you know", "my preferences", "remember me"]):
        return session.context_summary()

    # ── Watch History ─────────────────────────────────────────────
    watched_title = parse_watch_history(user_input)
    if watched_title:
        watch_history.append(watched_title)
        session.mark_seen([watched_title])
        return (
            f"📺 Got it! I've noted that you watched **{watched_title}**.\n"
            "I'll make sure not to recommend it again and use this to personalize your picks!\n\n"
            "How did you find it? (e.g. 'I loved it' or 'wasn't my thing')"
        )

    # ── Explicit Feedback (like/dislike) ─────────────────────────
    feedback = parse_feedback(user_input)
    if feedback:
        action, title = feedback.split(":", 1)
        if action == "liked":
            session.mark_liked(title)
            return (
                f"❤️ Awesome! Noted that you liked **{title}**.\n"
                "I'll use that to refine your future recommendations!\n\n"
                "Want more similar picks right now?"
            )
        elif action == "disliked":
            session.mark_disliked(title)
            return (
                f"👎 Noted — I won't recommend **{title}** to you again.\n"
                "What kind of content are you in the mood for instead?"
            )

    # ── Story / Description Search ────────────────────────────────
    story_triggers = [
        "something about", "a movie about", "a show about", "with a",
        "where", "involving", "features", "that has", "story of",
        "set in", "based on", "like a story", "film about",
    ]
    is_story_query = any(trigger in lower for trigger in story_triggers)

    if is_story_query or len(user_input.split()) >= 6:
        story_hits = story_search(user_input)
        if story_hits:
            rec_list = "\n".join([f"  {i+1}. {t}" for i, t in enumerate(story_hits)])
            return (
                f"🔍 Searching by story description...\n\n"
                f"🍿 Best matches for your description:\n"
                f"{rec_list}\n\n"
                "💡 Tip: Tell me if you've seen any of these or want a different style!"
            )

    # ── Sentiment + Mood + Genre Recommendation ───────────────────
    sentiment = analyze_sentiment(user_input)
    mood = map_sentiment_to_mood(sentiment, user_input)
    genre = extract_genre(user_input)

    # Record to session memory
    session.record_mood(mood)
    session.record_genre(genre)

    recommendations = get_recommendations(mood, genre)

    mood_messages = {
        "happy":   "😄 You seem to be in a great mood!",
        "sad":     "😢 Sounds like you need something comforting.",
        "excited": "🔥 You're pumped up! Let's match that energy!",
        "bored":   "😴 Bored? I've got something to fix that!",
        "scared":  "😱 Feeling tense? Here's something for that mood.",
        "neutral": "🎬 Here are some popular picks for you:",
    }

    genre_note = f" ({genre.replace('-', ' ').title()})" if genre else ""
    # Note if we're using session preference
    if not genre and session.preferred_genre:
        genre_note = f" (based on your taste for {session.preferred_genre})"

    mood_line = mood_messages.get(mood, "🎬 Here's what I found for you:")
    rec_list = "\n".join([f"  {i+1}. {t}" for i, t in enumerate(recommendations)])

    personal_note = ""
    if session.turn_count > 1:
        personal_note = (
            f"\n\n🧠 *Personalized for you — I've been learning your preferences "
            f"across {session.turn_count} interactions this session.*"
        )

    return (
        f"{mood_line}\n\n"
        f"🍿 Recommended{genre_note}:\n"
        f"{rec_list}\n\n"
        "Want me to search by story, character, or theme? Just describe what you're looking for! 😊"
        + personal_note
    )


# ═══════════════════════════════════════════════════════════════════
# MAIN CHAT LOOP
# ═══════════════════════════════════════════════════════════════════

def main():
    print("=" * 55)
    print("        Welcome to HnH-TV AI Chatbot v2.0 🎬")
    print("=" * 55)
    print("Features: Sentiment · NLP · Story Search · Memory")
    print("Type 'help' to see all commands. 'quit' to exit.\n")

    while True:
        try:
            user_input = input("You: ").strip()
            if not user_input:
                continue
            if user_input.lower() in ["quit", "exit"]:
                print("HnH-TV Bot: 👋 Goodbye! Enjoy watching!")
                break

            response = generate_response(user_input)
            print(f"\nHnH-TV Bot:\n{response}\n")
            print("-" * 45)

        except KeyboardInterrupt:
            print("\n\nHnH-TV Bot: 👋 Goodbye! See you next time!")
            break


if __name__ == "__main__":
    main()
