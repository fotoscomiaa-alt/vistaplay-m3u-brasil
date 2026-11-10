#!/usr/bin/env python3
"""Generate a stable M3U from officially published, direct stream URLs only."""
from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "automation" / "catalog.json"
OUTPUT = ROOT / "client" / "public" / "lista.m3u"
ROOT_OUTPUT = ROOT / "lista.m3u"
STATUS = ROOT / "automation" / "status.json"


def check_manifest(url: str) -> tuple[bool, int, str]:
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": "VistaPlay-Authorized-Playlist-Monitor/1.0",
            "Range": "bytes=0-8191",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=9) as response:
            body = response.read(16000).decode("utf-8", "replace").lower()
            ok = response.status in (200, 206) and ("#extm3u" in body or "#ext-x-" in body)
            return ok, response.status, "" if ok else "Resposta sem manifesto HLS válido"
    except urllib.error.HTTPError as error:
        return False, error.code, str(error)
    except Exception as error:  # noqa: BLE001 - status report must continue
        return False, 0, str(error)


def clean(value: str) -> str:
    return value.replace('"', "'").replace("\n", " ").replace("\r", " ").strip()


def main() -> int:
    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    lines = ["#EXTM3U"]
    status_rows = []
    for channel in catalog:
        direct_sources = channel.get("sources", [])
        chosen = None
        checks = []
        for source in direct_sources:
            ok, http_status, error = check_manifest(source["url"])
            checks.append({"url": source["url"], "online": ok, "http_status": http_status, "error": error})
            if ok and chosen is None:
                chosen = source
        if chosen:
            attrs = [
                f'tvg-id="{clean(channel.get("tvg_id", channel["slug"]))}"',
                f'tvg-name="{clean(channel["name"])}"',
                f'group-title="{clean(channel["group_title"])}"',
            ]
            lines.append(f'#EXTINF:-1 {" ".join(attrs)},{clean(channel["name"])}')
            lines.append(chosen["url"])
            current_status = "online"
        elif direct_sources:
            current_status = "offline"
        else:
            current_status = "official_page_only"
        status_rows.append({
            "name": channel["name"],
            "category": channel["category"],
            "official_page": channel["official_page"],
            "status": current_status,
            "checks": checks,
        })
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    rendered = "\n".join(lines) + "\n"
    OUTPUT.write_text(rendered, encoding="utf-8")
    ROOT_OUTPUT.write_text(rendered, encoding="utf-8")
    STATUS.write_text(json.dumps({"updated_at": datetime.now(timezone.utc).isoformat(), "channels": status_rows}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    online = sum(row["status"] == "online" for row in status_rows)
    print(f"Generated {OUTPUT} with {online} online direct channel(s) and {len(status_rows) - online} page-only/offline channel(s).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
