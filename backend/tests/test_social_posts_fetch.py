from backend.services.social_fetcher import (
    channel_id_from_youtube_html,
    posts_from_social_payload,
    posts_from_youtube_feed,
)

FEED = """<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015" xmlns:media="http://search.yahoo.com/mrss/" xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <id>yt:video:bYLDkqN4QWk</id>
    <yt:videoId>bYLDkqN4QWk</yt:videoId>
    <title>Health camp in the constituency</title>
    <published>2026-11-25T15:25:18+00:00</published>
    <link rel="alternate" href="https://www.youtube.com/watch?v=bYLDkqN4QWk"/>
    <media:group>
      <media:thumbnail url="https://i3.ytimg.com/vi/bYLDkqN4QWk/hqdefault.jpg" width="480" height="360"/>
      <media:description>A camp.</media:description>
      <media:statistics views="4243"/>
    </media:group>
  </entry>
</feed>
"""


def test_youtube_feed_keeps_thumbnail_title_date_and_views():
    posts = posts_from_youtube_feed(FEED)
    assert len(posts) == 1
    post = posts[0]
    assert post["url"] == "https://www.youtube.com/watch?v=bYLDkqN4QWk"
    assert post["thumbnailUrl"].endswith("hqdefault.jpg")
    assert post["text"] == "Health camp in the constituency"
    assert post["views"] == 4243
    assert post["publishedAt"].startswith("2026-11-25")


def test_channel_id_comes_from_the_page():
    assert channel_id_from_youtube_html('{"externalId":"UCRdtDIdKR3Ze8asE7UujNqA"}') == "UCRdtDIdKR3Ze8asE7UujNqA"


def test_social_payload_builds_links_and_skips_rows_without_a_date():
    payload = {"timeline": [
        {"full_text": "Rally today", "created_at": "Wed Nov 25 12:00:00 +0000 2026", "id_str": "99", "favorite_count": 5, "media": [{"media_url_https": "https://pbs.twimg.com/media/a.jpg"}]},
        {"full_text": "No date", "id_str": "100"},
    ]}
    posts = posts_from_social_payload("x", "example", payload)
    assert len(posts) == 1
    assert posts[0]["url"] == "https://x.com/example/status/99"
    assert posts[0]["thumbnailUrl"] == "https://pbs.twimg.com/media/a.jpg"
    assert posts[0]["likes"] == 5
    assert posts[0]["text"] == "Rally today"
