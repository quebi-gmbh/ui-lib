import { FormattedNumber } from "@/components/formatted-number"
import {
  Leaderboard,
  LeaderboardContent,
  LeaderboardEnd,
  LeaderboardHeader,
  LeaderboardItem,
  LeaderboardStart,
  LeaderboardTitle,
} from "@/components/leaderboard"
import type { OgScene } from "./types"

const PLAYERS = [
  { name: "Ada Lovelace", score: 9821 },
  { name: "Grace Hopper", score: 7420 },
  { name: "Alan Turing", score: 5115 },
]

const MAX = PLAYERS[0]?.score ?? 0

/** Three rows, so the ink rule is visibly proportional rather than decorative. */
export const leaderboardOgScene: OgScene = {
  scale: 1.5,
  render: () => (
    <Leaderboard className="w-96">
      <LeaderboardHeader>
        <LeaderboardTitle>top players</LeaderboardTitle>
      </LeaderboardHeader>
      <LeaderboardContent>
        {PLAYERS.map((player, index) => (
          <LeaderboardItem key={player.name} value={player.score} maxValue={MAX}>
            <LeaderboardStart>
              <span className="w-6 font-mono text-xs text-quebi-fg-subtle tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </span>
              {player.name}
            </LeaderboardStart>
            <LeaderboardEnd>
              <FormattedNumber value={player.score} />
            </LeaderboardEnd>
          </LeaderboardItem>
        ))}
      </LeaderboardContent>
    </Leaderboard>
  ),
}
