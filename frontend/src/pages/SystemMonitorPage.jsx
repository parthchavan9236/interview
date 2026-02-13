import { useState, useEffect } from "react";
import { getSystemHealth, getSystemPerformance, getEndpointStats } from "../lib/api";

export default function SystemMonitorPage() {
    const [health, setHealth] = useState(null);
    const [performance, setPerformance] = useState([]);
    const [endpoints, setEndpoints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState("health");
    const [error, setError] = useState(null);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [h, p, e] = await Promise.all([
                getSystemHealth(), getSystemPerformance(7), getEndpointStats()
            ]);
            setHealth(h.data.data);
            setPerformance(p.data.data || []);
            setEndpoints(e.data.data || []);
        } catch (err) {
            setError(err.response?.status === 403 ? "Admin access required" : "Failed to load system metrics");
        }
        setLoading(false);
    };

    const statusDot = (v) => v === "healthy" || v === "connected" ? "bg-green-400" : v === "degraded" ? "bg-yellow-400" : "bg-red-400";
    const statusText = (v) => v === "healthy" || v === "connected" ? "text-green-400" : v === "degraded" ? "text-yellow-400" : "text-red-400";

    if (loading) return <div className="flex items-center justify-center h-[60vh] text-gray-400"><span className="animate-spin text-2xl mr-3">⏳</span> Loading metrics...</div>;
    if (error) return <div className="max-w-xl mx-auto p-6 text-center"><div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8"><p className="text-red-400 text-lg font-medium">🔒 {error}</p><p className="text-gray-400 mt-2">This page is only accessible to administrators.</p></div></div>;

    return (
        <div className="max-w-7xl mx-auto p-6">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">📡 System Monitor</h1>
                    <p className="text-gray-400 mt-1">Real-time platform health and performance metrics</p>
                </div>
                <button onClick={loadData} className="bg-gray-700 text-white px-4 py-2 rounded-xl text-sm hover:bg-gray-600 transition">🔄 Refresh</button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-8 bg-gray-800/40 p-1.5 rounded-xl w-fit">
                {[{ key: "health", label: "💚 Health" }, { key: "performance", label: "📈 Performance" }, { key: "endpoints", label: "🔗 Endpoints" }].map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === t.key ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"}`}>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ── Health Tab ── */}
            {tab === "health" && health && (
                <div className="space-y-6">
                    {/* Status Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gray-800/60 rounded-2xl p-5 border border-gray-700">
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`w-2.5 h-2.5 rounded-full ${statusDot(health.server?.status)}`} />
                                <span className="text-gray-400 text-sm">Server</span>
                            </div>
                            <p className={`text-xl font-bold ${statusText(health.server?.status)}`}>
                                {(health.server?.status || "unknown").charAt(0).toUpperCase() + (health.server?.status || "unknown").slice(1)}
                            </p>
                            <p className="text-gray-500 text-xs mt-1">Uptime: {Math.round((health.server?.uptime || 0) / 3600)}h</p>
                        </div>
                        <div className="bg-gray-800/60 rounded-2xl p-5 border border-gray-700">
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`w-2.5 h-2.5 rounded-full ${statusDot(health.database?.status)}`} />
                                <span className="text-gray-400 text-sm">Database</span>
                            </div>
                            <p className={`text-xl font-bold ${statusText(health.database?.status)}`}>
                                {(health.database?.status || "unknown").charAt(0).toUpperCase() + (health.database?.status || "unknown").slice(1)}
                            </p>
                            <p className="text-gray-500 text-xs mt-1">Ping: {health.database?.pingMs || 0}ms</p>
                        </div>
                        <div className="bg-gray-800/60 rounded-2xl p-5 border border-gray-700">
                            <p className="text-gray-400 text-sm mb-2">Memory Usage</p>
                            <p className="text-xl font-bold text-white">{Math.round((health.memory?.heapUsed || 0) / 1024 / 1024)} MB</p>
                            <div className="w-full h-1.5 bg-gray-700 rounded-full mt-2">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, ((health.memory?.heapUsed || 0) / (health.memory?.heapTotal || 1)) * 100)}%` }} />
                            </div>
                        </div>
                        <div className="bg-gray-800/60 rounded-2xl p-5 border border-gray-700">
                            <p className="text-gray-400 text-sm mb-2">Environment</p>
                            <p className="text-xl font-bold text-white">{health.environment || "development"}</p>
                            <p className="text-gray-500 text-xs mt-1">v{health.version || "1.0.0"}</p>
                        </div>
                    </div>

                    {/* Today's Metrics */}
                    {health.today && (
                        <div className="bg-gray-800/60 rounded-2xl p-6 border border-gray-700">
                            <h3 className="text-white font-semibold mb-4">📊 Today's Metrics</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="text-center bg-gray-900/40 rounded-xl p-4">
                                    <p className="text-3xl font-bold text-blue-400">{health.today.totalApiCalls || 0}</p>
                                    <p className="text-gray-400 text-xs mt-1">API Calls</p>
                                </div>
                                <div className="text-center bg-gray-900/40 rounded-xl p-4">
                                    <p className="text-3xl font-bold text-green-400">{Math.round(health.today.avgResponseTime || 0)}ms</p>
                                    <p className="text-gray-400 text-xs mt-1">Avg Response</p>
                                </div>
                                <div className="text-center bg-gray-900/40 rounded-xl p-4">
                                    <p className={`text-3xl font-bold ${(health.today.errorRate || 0) > 5 ? "text-red-400" : "text-green-400"}`}>
                                        {(health.today.errorRate || 0).toFixed(1)}%
                                    </p>
                                    <p className="text-gray-400 text-xs mt-1">Error Rate</p>
                                </div>
                                <div className="text-center bg-gray-900/40 rounded-xl p-4">
                                    <p className="text-3xl font-bold text-purple-400">{health.today.activeSessions || 0}</p>
                                    <p className="text-gray-400 text-xs mt-1">Sessions</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Cache */}
                    {health.cache && (
                        <div className="bg-gray-800/60 rounded-2xl p-6 border border-gray-700">
                            <h3 className="text-white font-semibold mb-4">⚡ Cache Performance</h3>
                            <div className="grid grid-cols-4 gap-4">
                                <div className="text-center bg-gray-900/40 rounded-xl p-3">
                                    <p className="text-2xl font-bold text-green-400">{health.cache.hits || 0}</p>
                                    <p className="text-gray-400 text-xs">Hits</p>
                                </div>
                                <div className="text-center bg-gray-900/40 rounded-xl p-3">
                                    <p className="text-2xl font-bold text-red-400">{health.cache.misses || 0}</p>
                                    <p className="text-gray-400 text-xs">Misses</p>
                                </div>
                                <div className="text-center bg-gray-900/40 rounded-xl p-3">
                                    <p className="text-2xl font-bold text-blue-400">{health.cache.size || 0}</p>
                                    <p className="text-gray-400 text-xs">Entries</p>
                                </div>
                                <div className="text-center bg-gray-900/40 rounded-xl p-3">
                                    <p className="text-2xl font-bold text-yellow-400">
                                        {health.cache.hits + health.cache.misses > 0 ? Math.round((health.cache.hits / (health.cache.hits + health.cache.misses)) * 100) : 0}%
                                    </p>
                                    <p className="text-gray-400 text-xs">Hit Rate</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── Performance Tab ── */}
            {tab === "performance" && (
                <div>
                    {performance.length === 0 ? (
                        <div className="text-center py-16 bg-gray-800/60 rounded-2xl border border-gray-700">
                            <p className="text-5xl mb-4">📈</p>
                            <p className="text-white text-lg">No performance data yet</p>
                            <p className="text-gray-400 mt-1">Metrics are collected as APIs are used</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {performance.map(day => (
                                <div key={day.date} className="bg-gray-800/60 rounded-2xl p-5 border border-gray-700">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-white font-medium">{day.date}</h3>
                                        <span className="text-gray-500 text-sm">{day.totalApiCalls} calls</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <p className="text-gray-400 text-xs">Avg Response</p>
                                            <p className="text-green-400 font-bold">{Math.round(day.avgResponseTime || 0)}ms</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-xs">Error Rate</p>
                                            <p className={`font-bold ${day.errorRate > 5 ? "text-red-400" : "text-green-400"}`}>{(day.errorRate || 0).toFixed(1)}%</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-xs">Peak Users</p>
                                            <p className="text-blue-400 font-bold">{day.peakConcurrentUsers || day.activeSessions || 0}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── Endpoints Tab ── */}
            {tab === "endpoints" && (
                <div className="bg-gray-800/60 rounded-2xl border border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-700 text-gray-400 text-sm">
                                    <th className="text-left p-4">Endpoint</th>
                                    <th className="text-right p-4">Calls</th>
                                    <th className="text-right p-4">Avg Time</th>
                                    <th className="text-right p-4">Errors</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700/50">
                                {endpoints.length === 0 ? (
                                    <tr><td colSpan={4} className="text-center text-gray-400 py-8">No endpoint data yet</td></tr>
                                ) : endpoints.map((ep, i) => (
                                    <tr key={i} className="hover:bg-gray-700/20 transition">
                                        <td className="p-4">
                                            <span className={`inline-block w-14 text-center rounded-md text-xs font-bold py-0.5 mr-2 ${ep.method === "GET" ? "bg-green-500/20 text-green-400" : ep.method === "POST" ? "bg-blue-500/20 text-blue-400" : ep.method === "DELETE" ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                                                {ep.method}
                                            </span>
                                            <span className="text-gray-300 text-sm font-mono">{ep.route}</span>
                                        </td>
                                        <td className="p-4 text-right text-white font-medium">{ep.totalCalls || 0}</td>
                                        <td className="p-4 text-right text-gray-400">{Math.round(ep.avgResponseTime || 0)}ms</td>
                                        <td className="p-4 text-right">
                                            <span className={ep.errorCount > 0 ? "text-red-400" : "text-green-400"}>{ep.errorCount || 0}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
