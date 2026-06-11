"""Polite fetching: robots.txt, throttling, static requests, Playwright fallback."""

from __future__ import annotations

import time
from urllib.parse import urlparse
from urllib.robotparser import RobotFileParser

import requests
from bs4 import BeautifulSoup

from . import config


class Fetcher:
    def __init__(self, use_browser: bool = True, throttle: float | None = None):
        self.use_browser = use_browser
        self.throttle = config.THROTTLE_SECONDS if throttle is None else throttle
        self._last_request: dict[str, float] = {}
        self._robots: dict[str, RobotFileParser | None] = {}
        self._browser_broken = False  # set True once Playwright proves unavailable

    # --- politeness --------------------------------------------------------
    def _wait(self, host: str) -> None:
        last = self._last_request.get(host)
        if last is not None:
            delta = time.monotonic() - last
            if delta < self.throttle:
                time.sleep(self.throttle - delta)
        self._last_request[host] = time.monotonic()

    def allowed(self, url: str) -> bool:
        host = urlparse(url).netloc
        if host not in self._robots:
            rp = RobotFileParser()
            robots_url = f"{urlparse(url).scheme}://{host}/robots.txt"
            try:
                resp = requests.get(
                    robots_url,
                    headers={"User-Agent": config.USER_AGENT},
                    timeout=config.REQUEST_TIMEOUT,
                )
                if resp.status_code >= 400:
                    rp = None  # no robots -> allow
                else:
                    rp.parse(resp.text.splitlines())
            except requests.RequestException:
                rp = None
            self._robots[host] = rp
        rp = self._robots[host]
        if rp is None:
            return True
        return rp.can_fetch(config.USER_AGENT, url)

    # --- fetching ----------------------------------------------------------
    def _static(self, url: str) -> str | None:
        try:
            resp = requests.get(
                url,
                headers={"User-Agent": config.USER_AGENT},
                timeout=config.REQUEST_TIMEOUT,
                allow_redirects=True,
            )
            if resp.status_code >= 400:
                return None
            ctype = resp.headers.get("content-type", "")
            if "html" not in ctype and "text" not in ctype:
                return None
            return resp.text
        except requests.RequestException:
            return None

    def _rendered(self, url: str) -> str | None:
        if not self.use_browser or self._browser_broken:
            return None
        try:
            from playwright.sync_api import sync_playwright
        except Exception:
            self._browser_broken = True
            return None
        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                page = browser.new_page(user_agent=config.USER_AGENT)
                page.goto(url, timeout=20000, wait_until="domcontentloaded")
                page.wait_for_timeout(1500)
                html = page.content()
                browser.close()
                return html
        except Exception:
            # Browser not installed or page failed; stop trying to render.
            self._browser_broken = True
            return None

    def get(self, url: str) -> tuple[str | None, str]:
        """Return (html, status). status in: ok, blocked, unreachable."""
        if not self.allowed(url):
            return None, "blocked"
        host = urlparse(url).netloc
        self._wait(host)
        html = self._static(url)
        if html is not None and not looks_js_empty(html):
            return html, "ok"
        # JS-empty or failed -> try a headless render.
        rendered = self._rendered(url)
        if rendered is not None:
            return rendered, "ok"
        if html is not None:
            return html, "ok"  # keep the thin static html as last resort
        return None, "unreachable"


def looks_js_empty(html: str) -> bool:
    """Heuristic: the page has almost no visible text (JS-rendered shell)."""
    text = html_to_text(html)
    return len(text) < 400


def html_to_text(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "noscript", "svg"]):
        tag.decompose()
    return " ".join(soup.get_text(separator=" ").split())
