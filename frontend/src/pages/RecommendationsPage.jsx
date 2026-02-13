import { useState, useEffect } from "react";
import { getRecommendations, getPerformanceStats, recalculateMetrics, getReadinessScore } from "../lib/api";
import { Link } from "react-router-dom";

export default function RecommendationsPage() {
    const [recommendations, setRecommendations] = useState([]);
    const [metrics, setMetrics] = useState(null);
    const [readiness, setReadiness] = useState(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState("recommendations"); // recommendations | performance | readiness

    useEffect(() => { loadAll(); }, []);

    const loadAll = async () => {
        setLoading(true);
        try {
            const [recRes, statsRes, readyRes] = await Promise.all([
                getRecommendations(12), getPerformanceStats(), getReadinessScore()
            ]);
            setRecommendations(recRes.data.data || []);
            setMetrics(recRes.data.metrics || statsRes.data.data);
            setReadiness(readyRes.data.data);
        } catch { /* initial empty state */ }
        setLoading(false);
    };

    const handleRecalculate = async () => {
        setLoading(true);
        try { await recalculateMetrics(); await loadAll(); } catch { }
        setLoading(false);
    };

    const diffColor = (d) => d === "Easy" ? "text-green-400 bg-green-500/20 border-green-500/30" : d === "Medium" ? "text-yellow-400 bg-yellow-500/20 border-yellow-500/30" : "text-red-400 bg-red-500/20 border-red-500/30";
    const scoreBar = (val, max = 100) => (
        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${val >= 70 ? "bg-green-500" : val >= 40 ? "bg-yellow-500" : "bg-red-500"}`}
                style={{ width: `${Math.min(100, (val / max) * 100)}%` }} />
        </div>
    );

    if (loading) return <div className="flex items-center justify-center h-[60vh] text-gray-400"><span className="animate-spin text-2xl mr-3">⏳</span> Loading analytics...</div>;

    return (
        <div className="max-w-7xl mx-auto p-6">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">📊 Performance & Recommendations</h1>
                    <p className="text-gray-400 mt-1">Adaptive difficulty engine powered by IRT algorithm</p>
                </div>
                <button onClick={handleRecalculate} className="bg-gray-700 text-white px-4 py-2 rounded-xl text-sm hover:bg-gray-600 transition">
                    🔄 Recalculate
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-8 bg-gray-800/40 p-1.5 rounded-xl w-fit">
                {[{ key: "recommendations", label: "🎯 Recommendations" }, { key: "performance", label: "📈 Performance" }, { key: "readiness", label: "🎤 Interview Ready" }].map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === t.key ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"}`}>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ── Recommendations Tab ── */}
            {tab === "recommendations" && (
                <div>
                    {metrics && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            <div className="bg-gray-800/60 rounded-2xl p-4 border border-gray-700">
                                <p className="text-gray-400 text-sm">Performance Score</p>
                                <p className="text-3xl font-bold text-blue-400">{Math.round(metrics.performanceScore || 0)}</p>
                            </div>
                            <div className="bg-gray-800/60 rounded-2xl p-4 border border-gray-700">
                                <p className="text-gray-400 text-sm">Accuracy</p>
                                <p className="text-3xl font-bold text-green-400">{Math.round(metrics.accuracy || 0)}%</p>
                            </div>
                            <div className="bg-gray-800/60 rounded-2xl p-4 border border-gray-700">
                                <p className="text-gray-400 text-sm">Current Level</p>
                                <p className={`text-2xl font-bold ${metrics.currentDifficulty === "Easy" ? "text-green-400" : metrics.currentDifficulty === "Medium" ? "text-yellow-400" : "text-red-400"}`}>
                                    {metrics.currentDifficulty || "Easy"}
                                </p>
                            </div>
                            <div className="bg-gray-800/60 rounded-2xl p-4 border border-gray-700">
                                <p className="text-gray-400 text-sm">Solve Velocity</p>
                                <p className="text-3xl font-bold text-purple-400">{metrics.solveVelocity || 0}<span className="text-sm text-gray-400">/day</span></p>
                            </div>
                        </div>
                    )}

                    {metrics?.weakTopics?.length > 0 && (
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 mb-6 flex items-start gap-3">
                            <span className="text-yellow-400 text-xl">⚠️</span>
                            <div>
                                <p className="text-yellow-400 font-medium">Weak Topics Detected</p>
                                <p className="text-gray-400 text-sm">Focus on: {metrics.weakTopics.join(", ")}</p>
                            </div>
                        </div>
                    )}

                    {recommendations.length === 0 ? (
                        <div className="text-center py-16 bg-gray-800/60 rounded-2xl border border-gray-700">
                            <p className="text-5xl mb-4">🎯</p>
                            <p className="text-white text-lg font-medium">No recommendations yet</p>
                            <p className="text-gray-400 mt-1">Solve some problems to get personalized recommendations!</p>
                            <Link to="/problems" className="inline-block mt-4 bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-500 transition">
                                Browse Problems
                            </Link>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {recommendations.map(p => (
                                <Link key={p._id} to={`/problems/${p._id}`}
                                    className="bg-gray-800/60 rounded-2xl p-5 border border-gray-700 hover:border-blue-500/50 transition group">
                                    <div className="flex items-start justify-between mb-3">
                                        <h3 className="text-white font-medium group-hover:text-blue-400 transition">{p.title}</h3>
                                        <span className={`text-xs px-2.5 py-1 rounded-full border ${diffColor(p.difficulty)}`}>{p.difficulty}</span>
                                    </div>
                                    {p.tags && <div className="flex flex-wrap gap-1.5">{p.tags.map(t => <span key={t} className="bg-gray-700/50 text-gray-400 px-2 py-0.5 rounded-md text-xs">{t}</span>)}</div>}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── Performance Tab ── */}
            {tab === "performance" && metrics && (
                <div className="space-y-6">
                    <div className="bg-gray-800/60 rounded-2xl p-6 border border-gray-700">
                        <h3 className="text-white font-semibold mb-4">📊 Difficulty Distribution</h3>
                        <div className="grid grid-cols-3 gap-4">
                            {["Easy", "Medium", "Hard"].map(d => {
                                const val = metrics.solvedByDifficulty?.[d] || 0;
                                return (
                                    <div key={d} className="text-center">
                                        <p className={`text-4xl font-bold ${d === "Easy" ? "text-green-400" : d === "Medium" ? "text-yellow-400" : "text-red-400"}`}>{val}</p>
                                        <p className="text-gray-400 text-sm mt-1">{d} Solved</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {metrics.topicStrengths?.length > 0 && (
                        <div className="bg-gray-800/60 rounded-2xl p-6 border border-gray-700">
                            <h3 className="text-white font-semibold mb-4">🧠 Topic Strengths</h3>
                            <div className="space-y-4">
                                {metrics.topicStrengths.map(t => (
                                    <div key={t.topic}>
                                        <div className="flex justify-between mb-1">
                                            <span className="text-gray-300 text-sm">{t.topic}</span>
                                            <span className={`text-sm font-medium ${t.accuracy >= 70 ? "text-green-400" : t.accuracy >= 40 ? "text-yellow-400" : "text-red-400"}`}>
                                                {Math.round(t.accuracy)}% ({t.totalAttempts} attempts)
                                            </span>
                                        </div>
                                        {scoreBar(t.accuracy)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="bg-gray-800/60 rounded-2xl p-6 border border-gray-700">
                        <h3 className="text-white font-semibold mb-4">📈 Overall Stats</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { label: "Total Submissions", value: metrics.totalSubmissions || 0 },
                                { label: "Correct", value: metrics.correctSubmissions || 0 },
                                { label: "Avg Solve Time", value: `${Math.round((metrics.avgSolveTime || 0) / 1000)}s` },
                                { label: "Consistency", value: `${Math.round(metrics.consistencyScore || 0)}%` },
                            ].map(s => (
                                <div key={s.label} className="text-center bg-gray-900/40 rounded-xl p-3">
                                    <p className="text-2xl font-bold text-white">{s.value}</p>
                                    <p className="text-gray-400 text-xs mt-1">{s.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Interview Readiness Tab ── */}
            {tab === "readiness" && (
                <div className="max-w-2xl mx-auto">
                    <div className="bg-gray-800/60 rounded-2xl p-8 border border-gray-700 text-center mb-6">
                        <p className="text-gray-400 mb-2">Your Interview Readiness Score</p>
                        <p className={`text-7xl font-bold ${(readiness?.score || 0) >= 70 ? "text-green-400" : (readiness?.score || 0) >= 50 ? "text-yellow-400" : "text-red-400"}`}>
                            {readiness?.score || 0}
                        </p>
                        <p className="text-gray-400 text-sm mt-2">Based on {readiness?.sessionsAnalyzed || 0} sessions analyzed</p>
                        {readiness?.trend !== 0 && readiness?.trend != null && (
                            <p className={`text-sm mt-2 ${readiness.trend > 0 ? "text-green-400" : "text-red-400"}`}>
                                {readiness.trend > 0 ? "📈 Improving" : "📉 Declining"} ({readiness.trend > 0 ? "+" : ""}{readiness.trend} points)
                            </p>
                        )}
                    </div>

                    {readiness?.message && (
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 mb-6 text-center text-blue-400">
                            {readiness.message}
                        </div>
                    )}

                    {readiness?.commonIssues?.length > 0 && (
                        <div className="bg-gray-800/60 rounded-2xl p-6 border border-gray-700">
                            <h3 className="text-white font-semibold mb-4">⚠️ Common Issues</h3>
                            <div className="space-y-3">
                                {readiness.commonIssues.map(({ flag, count }) => (
                                    <div key={flag} className="flex items-center justify-between bg-gray-900/40 rounded-xl p-3">
                                        <span className="text-gray-300 text-sm">{flag.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</span>
                                        <span className="bg-red-500/20 text-red-400 px-2.5 py-0.5 rounded-full text-xs font-medium">{count}x</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mt-6 text-center">
                        <Link to="/ai-interview" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-500 hover:to-purple-500 transition inline-block">
                            🎤 Practice AI Interview
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
