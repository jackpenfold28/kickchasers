"""Create responsive WebP copies without changing the supplied screenshots."""
from pathlib import Path
import json
from PIL import Image

root = Path(__file__).resolve().parents[1]
source = root / 'public/landing/screenshots'
out = root / 'public/landing/images'
manifest_path = root / 'src/components/landing/landing-assets.json'
manifest = json.loads(manifest_path.read_text())
images = {
 'capture-game-log': 'profile/gamelog.png',
 'capture-location-analysis': 'profile/single plaer location analysis.png',
 'capture-feed-player': 'feed/Feed2.png',
 'capture-squad-player-leaders': 'Official squads/squads leader board player.png',
 'capture-squad-team-leaders': 'Official squads/squads leader board team.png',
 'capture-card-creation': 'player-cards/Card creation.png',
 'capture-tracked-vote': 'Voting Screenshots/Tracked game Voting card.png',
 'capture-vote-setup': 'Voting Screenshots/Creating Cards.png',
 'capture-game-tallies': 'Voting Screenshots/game tallys.png',
 'capture-vote-matchups': 'Voting Screenshots/view all cards.png',
 'capture-selection-design': 'Official squads/team selections and design.png',
 'capture-social-post': 'team-tracker/teampost-social generation.png',
 'capture-voting-teams': 'Voting Screenshots/teams.png',
 'capture-player-phone': 'single-tracker/Single tracking phone.png',
 'capture-player-ipad': 'single-tracker/singe tacker ipad-01.png',
 'capture-team-phone': 'team-tracker/team tracker phone.png',
 'capture-team-ipad': 'team-tracker/team tracker ipad.png',
 'capture-map-phone': 'team-stats/team stats phone.png',
 'capture-map-ipad': 'team-stats/team stats ipad.png',
 'capture-custom-pad': 'team-tracker/statpad custom.png',
 'capture-custom-stats': 'team-tracker/custom stats.png',
 'capture-matchday': 'live stats/Matchday.png',
 'capture-summary': 'live stats/team tracker summery.png',
 'capture-profile': 'profile/profilepage.png',
 'capture-performance': 'profile/single player stats.png',
 'capture-history': 'profile/profile stats.png',
 'capture-leaders': 'leaderboard/leaderboard all.png',
 'capture-weekly': 'leaderboard/leaderboard weekly.png',
 'capture-squad': 'Official squads/official squads.png',
 'capture-management': 'Official squads/squad managment.png',
 'capture-lineup': 'Official squads/team selections.png',
 'capture-members': 'Official squads/manage squad members.png',
 'capture-guests': 'Official squads/manage guests.png',
 'capture-roles': 'Official squads/club roles.png',
 'capture-vote': 'Voting Screenshots/Voting card user.png',
 'capture-assign': 'Voting Screenshots/Assign cards.png',
 'capture-tally': 'Voting Screenshots/season tallys.png',
 'capture-share-vote': 'Voting Screenshots/send link to anyone.png',
 'capture-awards': 'Voting Screenshots/other awards.png',
 'capture-feed': 'feed/Feed3 with score.png',
 'capture-card': 'player-cards/custom card.png',
 'capture-generated': 'player-cards/generated card.png',
 'capture-album': 'player-cards/album.png',
}
for key, relative in images.items():
 path = source / relative
 image = Image.open(path).convert('RGBA')
 # Trim transparent canvas only; device frames and every screen pixel stay intact.
 bounds = image.getchannel('A').getbbox()
 if bounds: image = image.crop(bounds)
 width, height = image.size
 variants = []
 sizes = [480, 800, 1280, 1920] if width > height else [360, 600, 900]
 for target in sizes:
  if target > width: continue
  dest = out / f'{key}-{target}.webp'
  image.resize((target, round(height * target / width)), Image.Resampling.LANCZOS).save(dest, 'WEBP', quality=86, method=6)
  variants.append({'src': '/landing/images/' + dest.name, 'width': target, 'bytes': dest.stat().st_size})
 manifest[key] = {'original': '/landing/screenshots/' + relative, 'width': width, 'height': height, 'originalBytes': path.stat().st_size, 'variants': variants}
manifest_path.write_text(json.dumps(manifest, indent=2) + '\n')
print(f'Prepared {len(images)} screenshots; {sum(v["bytes"] for k in images for v in manifest[k]["variants"]):,} bytes across responsive variants.')
