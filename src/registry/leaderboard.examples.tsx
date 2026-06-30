import {
  Leaderboard,
  LeaderboardContent,
  LeaderboardEnd,
  LeaderboardHeader,
  LeaderboardItem,
  LeaderboardStart,
  LeaderboardTitle,
} from "@/components/leaderboard"
import type { ComponentExample } from "./types"

const players = [
  { name: "Nova", score: 4820 },
  { name: "Echo", score: 3910 },
  { name: "Vex", score: 3240 },
  { name: "Lyra", score: 2105 },
  { name: "Orion", score: 1180 },
]

const maxScore = players[0].score

export const leaderboardExamples: ComponentExample[] = [
  {
    title: "Default",
    description: "Each row's brand-teal fill is scaled to the leader's score.",
    render: () => (
      <Leaderboard className="w-full max-w-md">
        <LeaderboardHeader>
          <LeaderboardTitle>Top players</LeaderboardTitle>
        </LeaderboardHeader>
        <LeaderboardContent>
          {players.map((player, i) => (
            <LeaderboardItem key={player.name} value={player.score} maxValue={maxScore}>
              <LeaderboardStart>
                <span className="text-quebi-fg-muted tabular-nums">{i + 1}.</span>
                {player.name}
              </LeaderboardStart>
              <LeaderboardEnd>{player.score.toLocaleString()}</LeaderboardEnd>
            </LeaderboardItem>
          ))}
        </LeaderboardContent>
      </Leaderboard>
    ),
  },
  {
    title: "Actionable rows",
    description: "Pass onAction to make rows clickable — the fill brightens on hover.",
    render: () => (
      <Leaderboard className="w-full max-w-md">
        <LeaderboardHeader>
          <LeaderboardTitle>Leaderboard</LeaderboardTitle>
        </LeaderboardHeader>
        <LeaderboardContent>
          {players.slice(0, 3).map((player, i) => (
            <LeaderboardItem
              key={player.name}
              value={player.score}
              maxValue={maxScore}
              onAction={() => {}}
            >
              <LeaderboardStart>
                <span className="text-quebi-fg-muted tabular-nums">{i + 1}.</span>
                {player.name}
              </LeaderboardStart>
              <LeaderboardEnd>{player.score.toLocaleString()}</LeaderboardEnd>
            </LeaderboardItem>
          ))}
        </LeaderboardContent>
      </Leaderboard>
    ),
  },
]
