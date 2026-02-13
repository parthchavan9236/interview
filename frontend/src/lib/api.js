import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "";

const api = axios.create({
    baseURL: `${API_URL}/api`,
    headers: {
        "Content-Type": "application/json",
    },
});

// Auto-attach JWT token from localStorage to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("auth_token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auto-handle 401 responses
api.interceptors.response.use(
    (res) => res,
    (error) => {
        if (error.response?.status === 401) {
            // Only clear if it was a protected route (not login/register)
            const url = error.config?.url || "";
            if (!url.includes("/login") && !url.includes("/register")) {
                // Token might be expired
                console.warn("Auth token may be expired");
            }
        }
        return Promise.reject(error);
    }
);

// Add auth token to requests (for Clerk compatibility)
export const setAuthToken = (token) => {
    if (token) {
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
        delete api.defaults.headers.common["Authorization"];
    }
};

// ─── Custom Auth API ──────────────────────────────────────────────
export const registerUser = (data) => api.post("/auth/register", data);
export const loginUser = (data) => api.post("/auth/login", data);

// ─── Auth API (Clerk) ─────────────────────────────────────────────
export const syncUser = (data) => api.post("/auth/sync", data);
export const getMe = () => api.get("/auth/me");
export const updateRole = (role) => api.put("/auth/role", { role });

// ─── Problems API ─────────────────────────────────────────────────
export const getProblems = (params) => api.get("/problems", { params });
export const getProblemById = (id) => api.get(`/problems/${id}`);
export const createProblem = (data) => api.post("/problems", data);
export const updateProblem = (id, data) => api.put(`/problems/${id}`, data);
export const deleteProblem = (id) => api.delete(`/problems/${id}`);

// ─── Submissions API ──────────────────────────────────────────────
export const submitCode = (data) => api.post("/submissions", data);
export const getUserSubmissions = () => api.get("/submissions");
export const getProblemSubmissions = (problemId) =>
    api.get(`/submissions/problem/${problemId}`);
export const getSubmissionStats = () => api.get("/submissions/stats");

// ─── Interview API ────────────────────────────────────────────────
export const createSlot = (data) => api.post("/interviews/slots", data);
export const getOpenSlots = () => api.get("/interviews/slots");
export const getMySlots = () => api.get("/interviews/my-slots");
export const bookSlot = (id) => api.put(`/interviews/slots/${id}/book`);

// ─── Code Execution API ───────────────────────────────────────────
export const executeCode = (data) => api.post("/code/execute", data);
export const getLanguages = () => api.get("/code/languages");

// ─── Interviews API ───────────────────────────────────────────────
export const createInterview = (data) => api.post("/interviews", data);
export const getInterviews = () => api.get("/interviews");
export const getInterviewById = (id) => api.get(`/interviews/${id}`);
export const updateInterview = (id, data) => api.put(`/interviews/${id}`, data);
export const deleteInterview = (id) => api.delete(`/interviews/${id}`);
export const getStreamToken = () => api.get("/interviews/stream-token");

// ─── AI API ──────────────────────────────────────────────────────
export const getAIHint = (data) => api.post("/ai/hint", data);
export const analyzeCode = (data) => api.post("/ai/analyze", data);
export const chatWithAI = (data) => api.post("/ai/chat", data);

// ─── Comment API ──────────────────────────────────────────────────
export const getComments = (problemId) => api.get(`/comments/${problemId}`);
export const addComment = (data) => api.post("/comments", data);

// ─── User API ─────────────────────────────────────────────────────
export const getLeaderboard = () => api.get("/users/leaderboard");
export const getAllUsers = () => api.get("/users");

// ─── Recommendations API ─────────────────────────────────────────
export const getRecommendations = (limit = 10) => api.get(`/recommendations?limit=${limit}`);
export const getPerformanceStats = () => api.get("/recommendations/stats");
export const recalculateMetrics = () => api.post("/recommendations/recalculate");

// ─── Behavior Analytics API ──────────────────────────────────────
export const trackBehavior = (data) => api.post("/behavior/track", data);
export const getReadinessScore = () => api.get("/behavior/readiness");
export const getUserBehavior = (userId) => api.get(`/behavior/user/${userId}`);

// ─── AI Interview API ────────────────────────────────────────────
export const startAIInterview = (data) => api.post("/ai-interview/start", data);
export const sendInterviewMessage = (id, message) => api.post(`/ai-interview/${id}/message`, { message });
export const endAIInterview = (id) => api.post(`/ai-interview/${id}/end`);
export const getInterviewHistory = (page = 1) => api.get(`/ai-interview/history?page=${page}`);
export const getInterviewSession = (id) => api.get(`/ai-interview/${id}`);

// ─── Organization API ────────────────────────────────────────────
export const createOrganization = (data) => api.post("/organizations", data);
export const getOrganizations = (page = 1) => api.get(`/organizations?page=${page}`);
export const getOrganization = (id) => api.get(`/organizations/${id}`);
export const addOrgMember = (id, data) => api.post(`/organizations/${id}/members`, data);
export const removeOrgMember = (orgId, userId) => api.delete(`/organizations/${orgId}/members/${userId}`);
export const getOrgLeaderboard = (id) => api.get(`/organizations/${id}/leaderboard`);
export const getOrgAnalytics = (id) => api.get(`/organizations/${id}/analytics`);

// ─── System Metrics API (Admin) ──────────────────────────────────
export const getSystemHealth = () => api.get("/metrics/system");
export const getSystemPerformance = (days = 7) => api.get(`/metrics/performance?days=${days}`);
export const getEndpointStats = () => api.get("/metrics/endpoints");

export default api;
