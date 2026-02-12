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

export default api;
