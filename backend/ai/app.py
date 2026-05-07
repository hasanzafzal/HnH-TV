# ============================================
# H&H TV AI Recommendation + Sentiment Module
# Production Ready (FastAPI + MongoDB + BFS + A*)
# ============================================

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pymongo import MongoClient
from bson import ObjectId
from collections import deque, defaultdict
import random
import re
from dotenv import load_dotenv
import os

# Load .env from project root
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '.env'))

MONGO_URI = os.getenv("MONGODB_URI")

client = MongoClient(MONGO_URI)

db = client["test"]
contents_col = db["contents"]
genres_col = db["genres"]
watch_col = db["watchhistories"]
app = FastAPI(title="H&H TV AI Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

sessions = {}

class ChatRequest(BaseModel):
    userId: str
    message: str

# ============================================
# GENRE LOOKUP CACHE
# Build a map of ObjectId -> genre name string
# ============================================

_genre_cache = {}

def get_genre_map():
    """Load genre ObjectId -> name mapping from DB (cached)."""
    global _genre_cache
    if not _genre_cache:
        for g in genres_col.find():
            _genre_cache[str(g["_id"])] = g.get("name", "")
    return _genre_cache

def resolve_genre_names(item):
    """Convert an item's genre ObjectId list to a list of genre name strings."""
    genre_map = get_genre_map()
    raw_genres = item.get("genre", [])
    names = []
    for g in raw_genres:
        name = genre_map.get(str(g), "")
        if name:
            names.append(name)
    return names

# ============================================
# SENTIMENT ANALYSIS
# ============================================

def detect_mood(text):
    text = text.lower()

    mood_map = {
        "sad": ["sad", "down", "cry", "depressed", "upset", "lonely", "heartbroken", "miss", "lost"],
        "happy": ["happy", "great", "good", "joy", "cheerful", "wonderful", "amazing", "awesome", "love"],
        "bored": ["bored", "nothing to watch", "boring", "dull", "meh"],
        "stressed": ["stress", "tired", "anxious", "overwhelmed", "burned out", "exhausted", "worried"],
        "excited": ["excited", "thrill", "energetic", "pumped", "hyped", "adrenaline"],
        "scared": ["scared", "horror", "spooky", "creepy", "terrified", "frightened"],
        "romantic": ["romantic", "love", "date", "romance", "couple", "valentine"]
    }

    for mood, words in mood_map.items():
        for word in words:
            if word in text:
                return mood

    return "neutral"

# ============================================
# GENRE MAPPING BY MOOD
# ============================================

def mood_genres(mood):
    mapping = {
        "sad": ["Comedy", "Family", "Adventure"],
        "happy": ["Adventure", "Comedy", "Fantasy"],
        "bored": ["Action", "Thriller", "Crime"],
        "stressed": ["Comedy", "Animation", "Family"],
        "excited": ["Action", "Sci-Fi", "Thriller"],
        "scared": ["Horror", "Thriller", "Mystery"],
        "romantic": ["Romance", "Drama", "Comedy"],
        "neutral": ["Action", "Comedy", "Drama", "Adventure"]
    }
    return mapping.get(mood, ["Action", "Comedy", "Drama"])

# ============================================
# AGE FILTER
# ============================================

SAFE_AGE_RATINGS = ["G", "PG", "PG-13"]

def kid_mode_filter(items):
    return [x for x in items if x.get("ageRating") in SAFE_AGE_RATINGS]

# ============================================
# WATCH HISTORY
# ============================================

def get_watched_ids(userId):
    """Get set of content IDs the user has watched."""
    ids = set()

    # Try both string and ObjectId lookup since userId might be stored either way
    try:
        watched = watch_col.find({"user": ObjectId(userId)})
        for w in watched:
            content_id = w.get("content") or w.get("contentId")
            if content_id:
                ids.add(str(content_id))
    except Exception:
        pass

    return ids

# ============================================
# LOAD CONTENT
# ============================================

def load_all_content():
    """Load all active content from DB."""
    return list(contents_col.find({"isActive": True}))

# ============================================
# FILTER WATCHED
# ============================================

def remove_watched(items, watched_ids):
    unseen = []

    for item in items:
        if str(item["_id"]) not in watched_ids:
            unseen.append(item)

    if unseen:
        return unseen

    # if all watched treat as new user
    return items

# ============================================
# SCORING SYSTEM
# Mood > Genre > Rating
# ============================================

def score_content(item, preferred_genres, kid_mode):
    score = 0

    # Resolve genre ObjectIds to actual name strings
    item_genre_names = resolve_genre_names(item)

    # Genre match is the PRIMARY signal (30 points per matching genre)
    for g in item_genre_names:
        if g in preferred_genres:
            score += 30

    # Kid mode bonus
    if kid_mode:
        if item.get("ageRating") in SAFE_AGE_RATINGS:
            score += 20

    # Rating is a SECONDARY signal (0-10 scale)
    try:
        score += float(item.get("rating", 0))
    except (ValueError, TypeError):
        pass

    return score

# ============================================
# GRAPH BUILDING
# Node = content
# Edge = shared genre (using ObjectIds directly)
# ============================================

def build_graph(items):
    graph = defaultdict(list)

    for i in range(len(items)):
        for j in range(i + 1, len(items)):
            g1 = set(str(x) for x in items[i].get("genre", []))
            g2 = set(str(x) for x in items[j].get("genre", []))

            if g1.intersection(g2):
                a = str(items[i]["_id"])
                b = str(items[j]["_id"])
                graph[a].append(b)
                graph[b].append(a)

    return graph

# ============================================
# BFS SEARCH
# ============================================

def bfs_recommend(start_id, graph):
    visited = set()
    q = deque([start_id])

    order = []

    while q:
        node = q.popleft()

        if node in visited:
            continue

        visited.add(node)
        order.append(node)

        for nei in graph[node]:
            if nei not in visited:
                q.append(nei)

    return order

# ============================================
# A* SEARCH
# heuristic = unmatched genres count
# admissible (never overestimates)
# ============================================

def heuristic(item, target_genres):
    item_genre_names = set(resolve_genre_names(item))
    target = set(target_genres)

    return len(target - item_genre_names)

def astar(items, target_genres):
    if not target_genres:
        return items

    scored = []

    for item in items:
        h = heuristic(item, target_genres)
        g = 0
        f = g + h
        scored.append((f, item))

    scored.sort(key=lambda x: x[0])

    return [x[1] for x in scored]

# ============================================
# SURPRISE MODE
# ============================================

def surprise_me(items, watched_ids):
    unseen = remove_watched(items, watched_ids)

    if unseen:
        return random.choice(unseen)

    return random.choice(items)

# ============================================
# MAIN RECOMMENDER
# ============================================

def recommend(userId, message):
    msg = message.lower()

    if userId not in sessions:
        sessions[userId] = {
            "kid_mode": False
        }

    session = sessions[userId]

    # --------------------------------
    # Greeting
    # --------------------------------
    greetings = ["hi", "hello", "hey", "sup", "yo", "what's up", "howdy"]
    if msg.strip() in greetings or msg.strip().rstrip("!") in greetings:
        return (
            "Hey there! 👋 I'm your HnH TV AI assistant.\n\n"
            "Here's what I can do:\n"
            "• Tell me your mood (happy, sad, bored, excited...)\n"
            "• Say \"surprise me\" for a random pick\n"
            "• Say \"kid mode\" for child-safe content\n\n"
            "What are you in the mood for?"
        )

    # --------------------------------
    # Help
    # --------------------------------
    if "help" in msg or "what can you do" in msg:
        return (
            "I can recommend movies & shows based on your mood! 🎬\n\n"
            "Try saying:\n"
            "• \"I'm feeling sad\" → uplifting picks\n"
            "• \"I'm bored\" → action-packed titles\n"
            "• \"I'm excited\" → thrilling content\n"
            "• \"Surprise me\" → random recommendation\n"
            "• \"Kid mode\" → family-friendly only"
        )

    # --------------------------------
    # Kid Mode
    # --------------------------------
    if "kid" in msg or "children" in msg or "child" in msg:
        session["kid_mode"] = True
        return "🧸 Child-safe mode enabled! I'll only recommend family-friendly content.\n\nTell me your mood or say \"surprise me\"!"

    # --------------------------------
    # Disable Kid Mode
    # --------------------------------
    if "adult" in msg or "disable kid" in msg or "normal mode" in msg:
        session["kid_mode"] = False
        return "Kid mode disabled. All content is now available."

    # --------------------------------
    # Surprise Me
    # --------------------------------
    if "surprise" in msg or "random" in msg:
        items = load_all_content()
        watched_ids = get_watched_ids(userId)

        if session["kid_mode"]:
            items = kid_mode_filter(items)

        if not items:
            return "No content available right now. Stay tuned!"

        pick = surprise_me(items, watched_ids)

        genre_names = resolve_genre_names(pick)
        genre_str = ", ".join(genre_names) if genre_names else "N/A"

        return (
            f"🎲 Surprise Pick!\n\n"
            f"🎬 {pick.get('title')}\n"
            f"⭐ Rating: {pick.get('rating', 'N/A')}/10\n"
            f"🎭 Genre: {genre_str}\n"
            f"📅 Type: {'TV Series' if pick.get('contentType') == 'tv_series' else 'Movie'}"
        )

    # --------------------------------
    # Sentiment-based Recommendation
    # --------------------------------
    mood = detect_mood(msg)
    pref_genres = mood_genres(mood)

    items = load_all_content()

    if session["kid_mode"]:
        items = kid_mode_filter(items)

    if not items:
        return "No content available right now. Stay tuned!"

    watched_ids = get_watched_ids(userId)
    items = remove_watched(items, watched_ids)

    # --------------------------------
    # A* Ranking
    # --------------------------------
    ranked = astar(items, pref_genres)

    final = []

    for item in ranked:
        s = score_content(item, pref_genres, session["kid_mode"])
        final.append((s, item))

    final.sort(reverse=True, key=lambda x: x[0])

    top = final[:5]

    if not top:
        return "No recommendations found. Try telling me how you feel!"

    # --------------------------------
    # Format Response
    # --------------------------------
    mood_emoji = {
        "sad": "😢", "happy": "😊", "bored": "😴",
        "stressed": "😰", "excited": "🤩",
        "scared": "😱", "romantic": "💕", "neutral": "🎬"
    }

    emoji = mood_emoji.get(mood, "🎬")
    genre_str = ", ".join(pref_genres)

    result = f"{emoji} Mood: {mood.capitalize()}\n"
    result += f"🎭 Suggested genres: {genre_str}\n\n"
    result += "Here are my picks for you:\n"

    for i, (score, item) in enumerate(top, 1):
        genre_names = resolve_genre_names(item)
        item_genre_str = ", ".join(genre_names) if genre_names else ""
        content_type = "📺" if item.get("contentType") == "tv_series" else "🎬"
        result += f"{i}. {content_type} {item.get('title')} — ⭐ {item.get('rating', 'N/A')}/10"
        if item_genre_str:
            result += f" ({item_genre_str})"
        result += "\n"

    return result

# ============================================
# API
# ============================================

@app.get("/")
def root():
    return {"message": "H&H TV AI Engine Running"}

@app.post("/chat")
def chat(req: ChatRequest):
    reply = recommend(req.userId, req.message)
    return {"reply": reply}

# ============================================
# OPTIONAL BFS DEMO ROUTE
# ============================================

@app.get("/bfs-demo")
def bfs_demo():
    items = load_all_content()

    if len(items) < 2:
        return {"message": "Need more content"}

    graph = build_graph(items)

    start = str(items[0]["_id"])
    order = bfs_recommend(start, graph)

    return {
        "start": start,
        "visited_order": order
    }

# ============================================
# CACHE REFRESH ROUTE
# ============================================

@app.post("/refresh-cache")
def refresh_cache():
    """Clear genre cache so new genres are picked up."""
    global _genre_cache
    _genre_cache = {}
    return {"message": "Genre cache cleared"}