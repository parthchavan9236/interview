import { useState, useEffect } from "react";
import { getOrganizations, createOrganization, getOrganization, getOrgLeaderboard, getOrgAnalytics } from "../lib/api";

export default function OrganizationsPage() {
    const [view, setView] = useState("list"); // list | detail | create
    const [orgs, setOrgs] = useState([]);
    const [selectedOrg, setSelectedOrg] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState("members"); // members | leaderboard | analytics
    const [form, setForm] = useState({ name: "", slug: "", description: "" });
    const [creating, setCreating] = useState(false);

    useEffect(() => { loadOrgs(); }, []);

    const loadOrgs = async () => {
        setLoading(true);
        try {
            const res = await getOrganizations();
            setOrgs(res.data.data || []);
        } catch { setOrgs([]); }
        setLoading(false);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setCreating(true);
        try {
            await createOrganization(form);
            await loadOrgs();
            setView("list");
            setForm({ name: "", slug: "", description: "" });
        } catch (err) {
            alert(err.response?.data?.message || "Failed to create organization");
        }
        setCreating(false);
    };

    const openOrg = async (id) => {
        setLoading(true);
        try {
            const [orgRes, lbRes, anRes] = await Promise.all([
                getOrganization(id), getOrgLeaderboard(id), getOrgAnalytics(id)
            ]);
            setSelectedOrg(orgRes.data.data);
            setLeaderboard(lbRes.data.data || []);
            setAnalytics(anRes.data.data);
            setView("detail");
            setTab("members");
        } catch { alert("Failed to load organization"); }
        setLoading(false);
    };

    // ── List View ──
    if (view === "list") {
        return (
            <div className="max-w-5xl mx-auto p-6">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white">🏢 Organizations</h1>
                        <p className="text-gray-400 mt-1">Multi-tenant workspaces for teams and institutions</p>
                    </div>
                    <button onClick={() => setView("create")}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-5 py-2.5 rounded-xl font-medium hover:from-blue-500 hover:to-purple-500 transition">
                        + Create Organization
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-16 text-gray-400"><span className="animate-spin text-2xl mr-2">⏳</span> Loading...</div>
                ) : orgs.length === 0 ? (
                    <div className="text-center py-16 bg-gray-800/60 rounded-2xl border border-gray-700">
                        <p className="text-5xl mb-4">🏢</p>
                        <p className="text-white text-lg font-medium">No organizations yet</p>
                        <p className="text-gray-400 mt-1 mb-4">Create your first to start collaborating</p>
                        <button onClick={() => setView("create")} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-500 transition">Create One</button>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {orgs.map(org => (
                            <button key={org._id} onClick={() => openOrg(org._id)}
                                className="bg-gray-800/60 rounded-2xl p-5 border border-gray-700 hover:border-blue-500/50 transition text-left group">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 text-lg font-bold group-hover:bg-blue-500/30 transition">
                                        {org.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="text-white font-medium group-hover:text-blue-400 transition">{org.name}</h3>
                                        <p className="text-gray-500 text-xs">@{org.slug}</p>
                                    </div>
                                </div>
                                {org.description && <p className="text-gray-400 text-sm mb-3 line-clamp-2">{org.description}</p>}
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                    <span>👥 {org.members?.length || 0} members</span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs border ${org.subscriptionPlan === "enterprise" ? "text-purple-400 bg-purple-500/20 border-purple-500/30" : org.subscriptionPlan === "pro" ? "text-blue-400 bg-blue-500/20 border-blue-500/30" : "text-gray-400 bg-gray-700/50 border-gray-600"}`}>
                                        {org.subscriptionPlan || "free"}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // ── Create View ──
    if (view === "create") {
        return (
            <div className="max-w-xl mx-auto p-6">
                <button onClick={() => setView("list")} className="text-gray-400 hover:text-white mb-6 transition flex items-center gap-1">← Back</button>
                <h1 className="text-3xl font-bold text-white mb-6">Create Organization</h1>
                <form onSubmit={handleCreate} className="bg-gray-800/60 rounded-2xl p-6 border border-gray-700 space-y-5">
                    <div>
                        <label className="text-sm font-medium text-gray-300 mb-2 block">Organization Name *</label>
                        <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") })}
                            className="w-full bg-gray-900/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                            placeholder="e.g. PICT College" required />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-300 mb-2 block">Slug</label>
                        <input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })}
                            className="w-full bg-gray-900/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                            placeholder="pict-college" required />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-300 mb-2 block">Description</label>
                        <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                            className="w-full bg-gray-900/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none resize-none"
                            rows={3} placeholder="Brief description..." />
                    </div>
                    <button type="submit" disabled={creating || !form.name || !form.slug}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 transition">
                        {creating ? "Creating..." : "Create Organization"}
                    </button>
                </form>
            </div>
        );
    }

    // ── Detail View ──
    if (view === "detail" && selectedOrg) {
        return (
            <div className="max-w-5xl mx-auto p-6">
                <button onClick={() => { setView("list"); setSelectedOrg(null); }} className="text-gray-400 hover:text-white mb-6 transition flex items-center gap-1">← Back</button>

                <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400 text-2xl font-bold">
                        {selectedOrg.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white">{selectedOrg.name}</h1>
                        <p className="text-gray-400">@{selectedOrg.slug} • {selectedOrg.members?.length || 0} members • {selectedOrg.subscriptionPlan} plan</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 bg-gray-800/40 p-1.5 rounded-xl w-fit">
                    {[{ key: "members", label: "👥 Members" }, { key: "leaderboard", label: "🏆 Leaderboard" }, { key: "analytics", label: "📊 Analytics" }].map(t => (
                        <button key={t.key} onClick={() => setTab(t.key)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === t.key ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"}`}>
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Members */}
                {tab === "members" && (
                    <div className="grid gap-3">
                        {selectedOrg.members?.map((m, i) => (
                            <div key={i} className="bg-gray-800/60 rounded-xl p-4 border border-gray-700 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-medium">
                                        {m.user?.name?.charAt(0) || "?"}
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">{m.user?.name || "Unknown"}</p>
                                        <p className="text-gray-500 text-sm">{m.user?.email}</p>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${m.role === "org_admin" ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" : "bg-gray-700/50 text-gray-400 border border-gray-600"}`}>
                                    {m.role}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Leaderboard */}
                {tab === "leaderboard" && (
                    <div className="bg-gray-800/60 rounded-2xl border border-gray-700 overflow-hidden">
                        <div className="p-4 border-b border-gray-700">
                            <h3 className="text-white font-semibold">Organization Leaderboard</h3>
                        </div>
                        {leaderboard.length === 0 ? (
                            <p className="text-center text-gray-400 py-8">No ranking data yet</p>
                        ) : (
                            <div className="divide-y divide-gray-700/50">
                                {leaderboard.map(user => (
                                    <div key={user._id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-700/20 transition">
                                        <div className="flex items-center gap-3">
                                            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${user.rank <= 3 ? "bg-yellow-500/20 text-yellow-400" : "bg-gray-700 text-gray-400"}`}>
                                                {user.rank}
                                            </span>
                                            <span className="text-white">{user.name}</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm">
                                            <span className="text-green-400">{user.problemsSolved} solved</span>
                                            <span className="text-yellow-400 font-medium">{user.totalPoints} pts</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Analytics */}
                {tab === "analytics" && analytics && (
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-gray-800/60 rounded-2xl p-6 border border-gray-700">
                            <h3 className="text-white font-semibold mb-4">👥 Members</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center bg-gray-900/40 rounded-xl p-4">
                                    <p className="text-3xl font-bold text-blue-400">{analytics.totalMembers}</p>
                                    <p className="text-gray-400 text-sm">Total</p>
                                </div>
                                <div className="text-center bg-gray-900/40 rounded-xl p-4">
                                    <p className="text-3xl font-bold text-green-400">{analytics.activeMembers}</p>
                                    <p className="text-gray-400 text-sm">Active (7d)</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-800/60 rounded-2xl p-6 border border-gray-700">
                            <h3 className="text-white font-semibold mb-4">📊 Submissions</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center bg-gray-900/40 rounded-xl p-4">
                                    <p className="text-3xl font-bold text-white">{analytics.submissions?.total || 0}</p>
                                    <p className="text-gray-400 text-sm">Total</p>
                                </div>
                                <div className="text-center bg-gray-900/40 rounded-xl p-4">
                                    <p className="text-3xl font-bold text-green-400">{analytics.submissions?.accuracy || 0}%</p>
                                    <p className="text-gray-400 text-sm">Accuracy</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return null;
}
