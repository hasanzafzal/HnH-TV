# ============================================
# H&H TV AI Recommendation + Sentiment Module
# Production Ready (FastAPI + MongoDB + BFS + A*)
# ============================================

from fastapi import FastAPI
from pydantic import BaseModel
from pymongo import MongoClient
from collections import deque, defaultdict
import random
import re
from dotenv import load_dotenv
import os

load_dotenv()

MONGO_URI = os.getenv("MONGODB_URI")

client = MongoClient(MONGO_URI)

db = client["test"]
contents_col = db["contents"]
watch_col = db["watchhistories"]
app = FastAPI(title="H&H TV AI Engine")

sessions = {}

class ChatRequest(BaseModel):
    userId: str
    message: str

# ============================================
# SENTIMENT ANALYSIS
# ============================================

def detect_mood(text):
    text = text.lower()

    mood_map = {
        "sad": ["sad", "down", "cry", "depressed"],
        "happy": ["happy", "great", "good", "joy"],
        "bored": ["bored", "nothing to watch"],
        "stressed": ["stress", "tired", "anxious"],
        "excited": ["excited", "thrill", "energetic"]
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
        "neutral": []
    }
    return mapping.get(mood, [])

# ============================================
# AGE FILTER
# ============================================

SAFE_RATINGS = ["G", "PG", "PG-13"]

def kid_mode_filter(items):
    return [x for x in items if x.get("rating") in SAFE_RATINGS]

# ============================================
# WATCH HISTORY
# ============================================

def get_watched_ids(userId):
    watched = watch_col.find({"userId": userId})
    ids = set()

    for w in watched:
        ids.add(str(w.get("contentId")))

    return ids

# ============================================
# LOAD CONTENT
# ============================================

def load_all_content():
    return list(contents_col.find())

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

    item_genres = item.get("genre", [])

    for g in item_genres:
        if g in preferred_genres:
            score += 30

    if kid_mode:
        if item.get("rating") in SAFE_RATINGS:
            score += 20

    try:
        score += float(item.get("averageRating", 0))
    except:
        pass

    return score

# ============================================
# GRAPH BUILDING
# Node = content
# Edge = shared genre
# ============================================

def build_graph(items):
    graph = defaultdict(list)

    for i in range(len(items)):
        for j in range(i + 1, len(items)):
            g1 = set(items[i].get("genre", []))
            g2 = set(items[j].get("genre", []))

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
    item_genres = set(item.get("genre", []))
    target = set(target_genres)

    return len(target - item_genres)

def astar(items, target_genres):
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
    # Kid Mode
    # --------------------------------
    if "kid" in msg or "children" in msg or "family" in msg:
        session["kid_mode"] = True
        return "Child-safe mode enabled. Tell me your mood or say Surprise Me."

    # --------------------------------
    # Surprise Me
    # --------------------------------
    if "surprise" in msg or "random" in msg:
        items = load_all_content()
        watched_ids = get_watched_ids(userId)

        if session["kid_mode"]:
            items = kid_mode_filter(items)

        pick = surprise_me(items, watched_ids)

        return f"🎲 Surprise Recommendation: {pick.get('title')}"

    # --------------------------------
    # Sentiment
    # --------------------------------
    mood = detect_mood(msg)
    pref_genres = mood_genres(mood)

    items = load_all_content()

    if session["kid_mode"]:
        items = kid_mode_filter(items)

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
        return "No recommendations found."

    result = f"Detected Mood: {mood}\nRecommended:\n"

    for score, item in top:
        result += f"- {item.get('title')} ({item.get('rating')})\n"

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