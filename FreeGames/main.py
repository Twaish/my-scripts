import json
import os
import time
from scraper import fetch_free_steam_games, fetch_free_epic_games

STATE_FILE = "promos.json"
MAX_AGE_SECONDS = 12 * 60 * 60  # 12 hours

def load_previous():
  if os.path.exists(STATE_FILE):
    with open(STATE_FILE, "r", encoding="utf-8") as f:
      return json.load(f)
  return {"timestamp": 0, "promos": []}

def save_current(data):
  with open(STATE_FILE, "w", encoding="utf-8") as f:
    json.dump(
      {"timestamp": int(time.time()), "promos": data},
      f,
      indent=2,
      ensure_ascii=False,
    )

def state_file_is_stale():
  if not os.path.exists(STATE_FILE):
    return True
  try:
    with open(STATE_FILE, "r", encoding="utf-8") as f:
      state = json.load(f)
    timestamp = state.get("timestamp", 0)
    return (time.time() - timestamp) >= MAX_AGE_SECONDS
  except Exception:
    return True

def unify_epic_games(epic_list):
  unified = []
  for g in epic_list:
    uid = f"epic:{g['id']}"
    unified.append({
      "uid": uid,
      "title": g["title"],
      "urls": g.get("urls", []),
      "promos": g.get("promos", []),
      "source": "epic"
    })
  return unified

def unify_steam_games(steam_list):
  unified = []
  for g in steam_list:
    uid = f"steam:{g['appid']}"
    unified.append({
      "uid": uid,
      "title": g["title"],
      "url": g["url"],
      "promos": g.get("promos", []),
      "source": "steam"
    })
  return unified

def get_new_promos(today, yesterday):
  yesterday_uids = {g["uid"] for g in yesterday}
  return [g for g in today if g["uid"] not in yesterday_uids]

def get_expired_promos(today, yesterday):
  today_uids = {g["uid"] for g in today}
  return [g for g in yesterday if g["uid"] not in today_uids]


if __name__ == "__main__":
  if state_file_is_stale():
    print("🔄 State file is stale or missing → scraping new data...")
    prev_state = load_previous()
    yesterday = prev_state.get("promos", [])

    steam = unify_steam_games(fetch_free_steam_games())
    epic = unify_epic_games(fetch_free_epic_games())
    today = steam + epic

    new_promos = get_new_promos(today, yesterday)
    expired_promos = get_expired_promos(today, yesterday)

    if new_promos:
      print("🔥 New promos detected:")
      for g in new_promos:
        urls = g.get("urls") or [g.get("url")]
        print(f"- {g['title']} ({', '.join(urls)})")

    if expired_promos:
      print("❌ Expired promos:")
      for g in expired_promos:
        print(f"- {g['title']}")

    if not new_promos and not expired_promos:
      print("No changes since last refresh.")

    save_current(today)

  else:
    print("State file is fresh (<12h) → using cached promos.")
    today = load_previous().get("promos", [])

  print("\nCurrent promos:")
  for g in today:
    urls = g.get("urls") or [g.get("url")]
    print(f"- {g['title']} ({', '.join(urls)})")