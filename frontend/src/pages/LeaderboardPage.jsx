import { useQuery } from "@tanstack/react-query";
import { getLeaderboard } from "../lib/api";
import { Trophy, Medal, Crown, User, Star } from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";

export default function LeaderboardPage() {
    const { data: users, isLoading } = useQuery({
        queryKey: ["leaderboard"],
        queryFn: async () => {
            const res = await getLeaderboard();
            return res.data;
        },
    });

    if (isLoading) return <LoadingSpinner />;

    return (
        <div className="relative min-h-[calc(100vh-4rem)] pb-12">
            {/* Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-amber-500/10 to-transparent" />
            </div>

            <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center mb-12 animate-fade-in">
                    <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4 flex items-center justify-center gap-3">
                        <Trophy className="w-10 h-10 text-amber-500" />
                        Global Leaderboard
                    </h1>
                    <p className="text-gray-400">Top coding champions of the platform</p>
                </div>

                <div className="card overflow-hidden animate-slide-up">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-dark-400/30 bg-dark-300/30">
                                    <th className="px-6 py-4 text-sm font-semibold text-gray-400 w-24 text-center">Rank</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-gray-400">User</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-gray-400 text-right">Solved</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-dark-400/30">
                                {users?.map((user, index) => {
                                    const rank = index + 1;
                                    let rankIcon = null;
                                    if (rank === 1) rankIcon = <Crown className="w-6 h-6 text-amber-400" fill="currentColor" />;
                                    else if (rank === 2) rankIcon = <Medal className="w-6 h-6 text-gray-300" />;
                                    else if (rank === 3) rankIcon = <Medal className="w-6 h-6 text-amber-700" />;
                                    else rankIcon = <span className="font-mono font-bold text-gray-500">#{rank}</span>;

                                    return (
                                        <tr key={user._id} className="group hover:bg-dark-300/20 transition-colors">
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex justify-center items-center">{rankIcon}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {user.image ? (
                                                        <img
                                                            src={user.image}
                                                            alt={user.name}
                                                            className="w-10 h-10 rounded-full ring-2 ring-dark-400 group-hover:ring-primary-500/50 transition-all object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                                            {user.name.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="font-medium text-white group-hover:text-primary-400 transition-colors">
                                                            {user.name}
                                                        </div>
                                                        {rank === 1 && <div className="text-xs text-amber-500 font-medium">Grandmaster</div>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-medium text-sm">
                                                    <Star className="w-3.5 h-3.5 fill-current" />
                                                    {user.solvedCount}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}

                                {users?.length === 0 && (
                                    <tr>
                                        <td colSpan="3" className="px-6 py-12 text-center text-gray-500">
                                            No ranked users yet. Be the first to solve a problem!
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
