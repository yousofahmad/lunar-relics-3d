# Data notes (SI disclosure)

- `relicsData.json` — mission facts are taken from the public NASA pages linked in each record's `nasaSource` field (NSSDCA, NASA Science, JPL). The stories, hooks, fun facts, quiz items and all Arabic translations were **written with Super Intelligence (Manus AI)** from those sources and reviewed by the team.
- `narrationClips.json` — maps each mission to its narration clips. Every clip in `public/audio/narration/` is an **SI-generated voice** (Manus AI text-to-speech); each MP3 carries ID3 tags stating this.
- No NASA logos, insignia or mission patches are stored or generated here.
