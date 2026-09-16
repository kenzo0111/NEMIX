#!/usr/bin/env python3
"""Refresh TRUSTED_PROXIES from Cloudflare's public, authenticated TLS API."""

import ipaddress
import json
import grp
import os
from pathlib import Path
import tempfile
import urllib.request


ENV_FILE = Path(__file__).resolve().parents[1] / ".env"
SOURCE = "https://api.cloudflare.com/client/v4/ips"


def main() -> None:
    with urllib.request.urlopen(SOURCE, timeout=15) as response:
        payload = json.load(response)
    if payload.get("success") is not True:
        raise RuntimeError("Cloudflare IP response was not successful")

    result = payload["result"]
    ipv4 = result["ipv4_cidrs"]
    ipv6 = result["ipv6_cidrs"]
    if len(ipv4) < 10 or len(ipv6) < 3:
        raise RuntimeError("Cloudflare IP response was incomplete")
    cidrs = [str(ipaddress.ip_network(value, strict=True)) for value in ipv4 + ipv6]
    if len(cidrs) != len(set(cidrs)):
        raise RuntimeError("Cloudflare IP response contained duplicate ranges")

    original = ENV_FILE.read_text(encoding="utf-8")
    line = "TRUSTED_PROXIES=" + ",".join(cidrs)
    lines = original.splitlines()
    matches = [index for index, value in enumerate(lines) if value.startswith("TRUSTED_PROXIES=")]
    if len(matches) > 1:
        raise RuntimeError("Multiple TRUSTED_PROXIES entries found")
    if matches:
        lines[matches[0]] = line
    else:
        lines.append(line)

    with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=ENV_FILE.parent, delete=False) as output:
        temporary = Path(output.name)
        output.write("\n".join(lines) + "\n")
    try:
        os.chown(temporary, ENV_FILE.stat().st_uid, grp.getgrnam("www-data").gr_gid)
        os.chmod(temporary, 0o640)
        os.replace(temporary, ENV_FILE)
    finally:
        temporary.unlink(missing_ok=True)

    print(f"Trusted proxy ranges refreshed: {len(ipv4)} IPv4, {len(ipv6)} IPv6")


if __name__ == "__main__":
    main()
