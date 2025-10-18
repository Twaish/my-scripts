import requests
from bs4 import BeautifulSoup
import json
from datetime import datetime, timezone

EPIC_GAMES_URL = "https://store-site-backend-static-ipv4.ak.epicgames.com/freeGamesPromotions"
STEAM_URL = "https://store.steampowered.com/search/results?force_infinite=1&maxprice=free&specials=1&ndl=1"

def fetch_free_epic_games():
  response = requests.get(EPIC_GAMES_URL, headers={"User-Agent": "Mozilla/5.0"})
  response.raise_for_status()
  data = response.json()

  results = []
  elements = data.get("data", {}).get("Catalog", {}).get("searchStore", {}).get("elements", [])
  now = datetime.now(timezone.utc)

  for e in elements:
    promotions = e.get("promotions") or {}
    promo_groups = promotions.get("promotionalOffers", []) or []

    active_windows = []
    for group in promo_groups:
      for promo in group.get("promotionalOffers", []):
        start = datetime.fromisoformat(promo["startDate"].replace("Z", "+00:00"))
        end = datetime.fromisoformat(promo["endDate"].replace("Z", "+00:00"))
        if start <= now <= end:
          active_windows.append({"start": start.isoformat(), "end": end.isoformat()})

    if not active_windows:
      continue

    mappings = e.get("catalogNs", {}).get("mappings", [])
    slugs = [m.get("pageSlug") for m in mappings if m.get("pageSlug")]

    results.append({
      "title": e.get("title"),
      "id": e.get("id"),
      "description": e.get("description"),
      "originalPrice": e.get("price", {}).get("totalPrice", {}).get("fmtPrice", {}).get("originalPrice"),
      "discountPrice": e.get("price", {}).get("totalPrice", {}).get("fmtPrice", {}).get("discountPrice"),
      "promos": active_windows,
      "urls": [f"https://store.epicgames.com/en-US/p/{slug}" for slug in slugs],
    })

  return results

def fetch_free_steam_games():
  response = requests.get(STEAM_URL, headers={"User-Agent": "Mozilla/5.0"})
  response.raise_for_status()
  soup = BeautifulSoup(response.text, "html.parser")

  games = []
  for row in soup.select("a.search_result_row"):
    appid = row.get("data-ds-appid")
    title = row.select_one(".title").get_text(strip=True)
    link = row.get("href").split("?")[0]

    release_date = row.select_one(".search_released")
    release_date = release_date.get_text(strip=True) if release_date else None

    discount_block = row.select_one(".discount_block")
    if discount_block:
      discount_pct = discount_block.select_one(".discount_pct")
      discount_pct = discount_pct.get_text(strip=True) if discount_pct else None

      original_price = discount_block.select_one(".discount_original_price")
      original_price = original_price.get_text(strip=True) if original_price else None

      final_price = discount_block.select_one(".discount_final_price")
      final_price = final_price.get_text(strip=True) if final_price else None
    else:
      discount_pct = None
      original_price = None
      final_price = None

    games.append({
      "appid": int(appid) if appid else None,
      "title": title,
      "url": link,
      "release_date": release_date,
      "discount_pct": discount_pct,
      "original_price": original_price,
      "final_price": final_price
    })

  return games

if __name__ == "__main__":
  free_games = fetch_free_epic_games()
  print(free_games)
  print(json.dumps(free_games, indent=2, ensure_ascii=False))