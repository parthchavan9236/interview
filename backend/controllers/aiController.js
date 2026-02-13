const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "mock-key");

// ── Comprehensive System Prompt ──────────────────────────────────────
const SYSTEM_PROMPT = `You are **CodeInterview AI** — an advanced, world-class AI assistant built into the CodeInterview Platform, a MERN-stack based coding & interview preparation platform.

## Your Capabilities
You can answer ANY question in the world — programming, algorithms, data structures, system design, databases, web development, machine learning, math, science, history, general knowledge, career advice, and more. You are an expert in ALL domains.

## About This Platform (Project Context)
This is a **Final Year B.Tech Computer Science project** — an all-in-one coding interview preparation platform built on the MERN stack.

### Tech Stack
- **Frontend**: React.js, Vite, Tailwind CSS, React Query, Zustand
- **Backend**: Node.js, Express.js, MongoDB (Mongoose), JWT Authentication
- **Real-time**: Socket.IO for live chat, WebRTC (SimplePeer) for video calls
- **AI**: Google Gemini API for intelligent assistance
- **Code Execution**: Piston API (sandboxed multi-language execution)
- **Other**: Winston (logging), Helmet (security), Rate Limiting, Docker

### Core Features
1. **Practice Problems** — 50+ DSA problems (Easy/Medium/Hard) with multi-language code editor (Monaco), auto-evaluation via Piston API, and test case validation
2. **Live Interview Rooms** — WebRTC video/audio, collaborative code editor, real-time whiteboard, Socket.IO chat, role-based access (interviewer/candidate)
3. **Contest Mode** — Timed competitive coding contests with leaderboards and contest submissions
4. **AI Assistant** — You! Powered by Gemini for hints, code analysis, interview feedback, and general Q&A
5. **Peer Mock Interviews** — Schedule mock interviews, post availability slots, book sessions
6. **Leaderboard & Gamification** — XP points, streaks, badges, global ranking system
7. **Resume Builder** — Auto-generated resume from platform activity + fully customizable sections
8. **Admin Dashboard** — CRUD for problems/users, RBAC, audit logging, suspicious activity flagging, system health monitoring
9. **Performance Reports** — Downloadable analytics with MongoDB aggregation pipelines
10. **Plagiarism Detection** — N-gram Jaccard similarity algorithm for code submissions
11. **Notification System** — Real-time activity alerts and push subscriptions
12. **Cloud-Ready** — Dockerized with docker-compose, Winston logging, graceful shutdown, environment configs

### Architecture Overview
- **MVC Pattern** with Service Layer
- **Authentication**: Custom JWT + Clerk integration, role-based access (candidate, interviewer, admin)
- **Security**: Helmet, rate limiting, IP/device logging, token refresh
- **Database**: MongoDB with indexed models for Users, Problems, Submissions, Contests, Notifications, AuditLogs, etc.
- **Caching**: In-memory cache service (Redis-ready)

### API Endpoints
- \`/api/auth\` — Registration, login, JWT token management
- \`/api/problems\` — CRUD operations on coding problems
- \`/api/submissions\` — Code submission, evaluation, stats
- \`/api/interviews\` — Interview scheduling & management
- \`/api/code\` — Code execution via Piston API
- \`/api/ai\` — AI hints, code analysis, chat, interview feedback
- \`/api/contests\` — Contest management & submissions
- \`/api/admin\` — Admin operations & audit logs
- \`/api/notifications\` — Notification management
- \`/api/reports\` — Performance report generation
- \`/api/users\` — Leaderboard & user management

## Response Guidelines
1. **Be comprehensive and accurate** — give detailed, well-structured answers
2. **Use markdown formatting** — use headers, bold, code blocks, bullet points for clarity
3. **For code questions** — provide working code examples with explanations
4. **For project questions** — reference the platform features, tech stack, and architecture
5. **For interview prep** — provide tips, common patterns, and example solutions
6. **Be encouraging and supportive** — help users build confidence
7. **If unsure** — be honest and suggest where to find the answer
8. **Keep responses concise but complete** — respect the user's time`;

// ── Smart Knowledge Base (works without API key) ─────────────────────
function getSmartResponse(message) {
    const q = message.toLowerCase();

    // Greetings
    if (q.match(/^(hi|hello|hey|hii+|good\s*(morning|evening|afternoon))/))
        return "Hello! 👋 I'm **CodeInterview AI**, your intelligent assistant.\n\n I can help with:\n- 💻 **Coding & DSA** — algorithms, data structures, code debugging\n- 🎯 **Interview Prep** — tips, questions, behavioral advice\n- 📚 **This Project** — features, tech stack, architecture\n- 🌍 **General Knowledge** — any topic!\n\nWhat would you like to know?";

    // Project / Platform
    if (q.match(/project|platform|about|what is this|tell me about|describe/))
        return "## 🚀 CodeInterview Platform\n\nA **MERN-stack** all-in-one coding interview preparation platform — built as a **Final Year B.Tech CS project**.\n\n### ✨ Core Features\n| # | Feature | Description |\n|---|---------|------------|\n| 1 | **Practice Problems** | 50+ DSA problems (Easy/Medium/Hard), Monaco editor, Piston API execution |\n| 2 | **Live Interview Rooms** | WebRTC video/audio, collaborative code editor, whiteboard, Socket.IO chat |\n| 3 | **Contest Mode** | Timed competitive coding with leaderboards |\n| 4 | **AI Assistant** | Gemini-powered hints, code analysis, chat |\n| 5 | **Mock Interviews** | Schedule & book peer interview sessions |\n| 6 | **Leaderboard** | XP points, streaks, badges, global ranking |\n| 7 | **Resume Builder** | Auto-generated from platform activity + custom sections |\n| 8 | **Admin Dashboard** | RBAC, audit logs, problem/user management |\n| 9 | **Plagiarism Detection** | N-gram Jaccard similarity for submissions |\n| 10 | **Performance Reports** | MongoDB aggregation-based analytics |\n| 11 | **Notifications** | Real-time alerts & push subscriptions |\n| 12 | **Cloud-Ready** | Docker, Winston logging, graceful shutdown |\n\n### 🏗️ Architecture\nMVC pattern with service layer, custom JWT + Clerk auth, role-based access (candidate/interviewer/admin), Helmet security, rate limiting.";

    // Tech stack
    if (q.match(/tech\s*stack|technolog|built with|framework|tools used|mern/))
        return "## 🛠️ Tech Stack\n\n| Layer | Technologies |\n|-------|-------------|\n| **Frontend** | React.js, Vite, Tailwind CSS, React Query, Zustand, Lucide React |\n| **Backend** | Node.js, Express.js, MongoDB, Mongoose ODM |\n| **Authentication** | Custom JWT + Clerk integration, bcrypt |\n| **Real-time** | Socket.IO (chat), WebRTC/SimplePeer (video) |\n| **AI** | Google Gemini 1.5 Flash API |\n| **Code Execution** | Piston API (sandboxed, multi-language) |\n| **Editor** | Monaco Editor (VS Code engine) |\n| **Security** | Helmet.js, express-rate-limit, CORS |\n| **Logging** | Winston (file + console transports) |\n| **DevOps** | Docker, docker-compose, environment configs |\n| **State Mgmt** | React Query (server), Zustand (client) |";

    // Features
    if (q.match(/feature|what can (it|this) do|capabilit|function/))
        return "## ✨ Platform Features\n\n1. **📝 Practice Problems** — 50+ curated DSA problems across Easy, Medium, Hard. Multi-language support (JavaScript, Python, C++, Java). Auto-evaluation with Piston API.\n\n2. **🎥 Live Interview Rooms** — WebRTC video/audio calls, collaborative Monaco code editor, real-time whiteboard drawing, Socket.IO chat messaging.\n\n3. **🏆 Contest Mode** — Timed coding competitions, real-time leaderboards, contest-specific submissions.\n\n4. **🤖 AI Assistant** — Gemini-powered coding hints, code complexity analysis, interview feedback generation.\n\n5. **📅 Peer Mock Interviews** — Post availability slots, book sessions with other users, instant meeting creation.\n\n6. **📊 Leaderboard & Gamification** — XP system, daily streaks, achievement badges, global ranking.\n\n7. **📄 Resume Builder** — Auto-generated from your coding activity + fully customizable sections.\n\n8. **🔐 Admin Dashboard** — CRUD operations, RBAC, audit logging, suspicious activity detection, system health monitoring.\n\n9. **🔍 Plagiarism Detection** — N-gram Jaccard similarity algorithm.\n\n10. **📈 Performance Reports** — Downloadable analytics via MongoDB aggregation.";

    // Authentication
    if (q.match(/auth|login|sign\s*(in|up)|jwt|clerk|token|session|password/))
        return "## 🔐 Authentication System\n\nThe platform uses a **dual authentication** approach:\n\n### Custom JWT Authentication\n- **Registration**: Name, email, password (bcrypt hashed), role selection\n- **Login**: Email + password → JWT token issued\n- **Token**: Stored in localStorage, auto-attached via Axios interceptor\n- **Middleware**: `protectRoute` verifies JWT on protected endpoints\n\n### Clerk Integration\n- Optional SSO via Clerk (Google, GitHub, etc.)\n- Syncs Clerk users with MongoDB on first login\n- Seamless fallback between custom and Clerk auth\n\n### Role-Based Access Control (RBAC)\n- **Candidate** — Practice problems, take interviews\n- **Interviewer** — Conduct interviews, view submissions\n- **Admin** — Full platform management";

    // Database / MongoDB
    if (q.match(/database|mongodb|mongoose|schema|model|collection/))
        return "## 🗄️ Database Architecture\n\n**MongoDB** with **Mongoose ODM** — 13 collections:\n\n| Collection | Purpose |\n|-----------|--------|\n| `users` | User profiles, roles, XP, streaks |\n| `problems` | Coding problems with test cases |\n| `submissions` | Code submissions with results |\n| `interviews` | Interview sessions metadata |\n| `interviewslots` | Scheduling availability |\n| `comments` | Problem discussions |\n| `contests` | Coding competition details |\n| `contestsubmissions` | Contest-specific submissions |\n| `notifications` | Activity alerts |\n| `auditlogs` | Admin action tracking |\n| `performancereports` | Analytics data |\n| `plagiarismreports` | Similarity detection results |\n| `pushsubscriptions` | Push notification subscriptions |\n\nAll models use Mongoose schemas with indexes for performance.";

    // API
    if (q.match(/api|endpoint|route|rest|backend route/))
        return "## 🌐 API Endpoints\n\n| Route | Methods | Purpose |\n|-------|---------|--------|\n| `/api/auth` | POST | Register, login, JWT management |\n| `/api/problems` | GET, POST, PUT, DELETE | CRUD for coding problems |\n| `/api/submissions` | GET, POST | Submit code,  get results & stats |\n| `/api/interviews` | GET, POST, PUT, DELETE | Interview management |\n| `/api/code` | POST, GET | Code execution (Piston), languages |\n| `/api/ai` | POST | AI chat, hints, code analysis |\n| `/api/contests` | GET, POST, PUT, DELETE | Contest management |\n| `/api/admin` | GET, POST | Admin operations, audit logs |\n| `/api/notifications` | GET, POST, PUT | Notification management |\n| `/api/reports` | GET, POST | Performance analytics |\n| `/api/users` | GET | Leaderboard, user listing |\n| `/api/comments` | GET, POST | Problem discussions |\n\nAll protected routes require JWT in the `Authorization: Bearer <token>` header.";

    // Algorithms / DSA
    if (q.match(/algorithm|sort|sorting|search|searching|bfs|dfs|dijkstra/))
        return "## 📊 Common Algorithms\n\n### Sorting Algorithms\n| Algorithm | Time (Best) | Time (Worst) | Space | Stable? |\n|-----------|------------|-------------|-------|---------|\n| Bubble Sort | O(n) | O(n²) | O(1) | ✅ |\n| Selection Sort | O(n²) | O(n²) | O(1) | ❌ |\n| Insertion Sort | O(n) | O(n²) | O(1) | ✅ |\n| Merge Sort | O(n log n) | O(n log n) | O(n) | ✅ |\n| Quick Sort | O(n log n) | O(n²) | O(log n) | ❌ |\n| Heap Sort | O(n log n) | O(n log n) | O(1) | ❌ |\n\n### Graph Algorithms\n- **BFS** — Level-order, shortest path (unweighted), O(V+E)\n- **DFS** — Backtracking, topological sort, cycle detection, O(V+E)\n- **Dijkstra** — Shortest path (weighted), O((V+E) log V)\n- **Bellman-Ford** — Handles negative weights, O(VE)\n- **Floyd-Warshall** — All-pairs shortest path, O(V³)\n\n### Searching\n- **Linear Search** — O(n), unsorted arrays\n- **Binary Search** — O(log n), sorted arrays\n- **Ternary Search** — O(log₃ n), unimodal functions\n\nWant code examples? Just ask!";

    // Big O / Complexity
    if (q.match(/complexity|big\s*o|time\s*complex|space\s*complex|asymptotic/))
        return "## ⏱️ Big O Complexity Cheat Sheet\n\n| Complexity | Name | Example | Growth |\n|-----------|------|--------|--------|\n| O(1) | Constant | Array access, hash lookup | ⚡ |\n| O(log n) | Logarithmic | Binary search | 🟢 |\n| O(n) | Linear | Single loop, linear search | 🟡 |\n| O(n log n) | Linearithmic | Merge sort, quick sort | 🟠 |\n| O(n²) | Quadratic | Nested loops, bubble sort | 🔴 |\n| O(n³) | Cubic | Triple nested loops, Floyd-Warshall | 🔴 |\n| O(2ⁿ) | Exponential | Recursive fibonacci, subsets | 💀 |\n| O(n!) | Factorial | Permutations | 💀 |\n\n### Tips\n- Always analyze **worst case** unless specified otherwise\n- **Space complexity** is equally important\n- **Amortized** analysis averages over sequences (e.g., dynamic arrays)\n- Drop constants and lower-order terms: O(3n + 5) → O(n)";

    // Data structures
    if (q.match(/data\s*struct|array|linked\s*list|stack|queue|tree|graph|hash|heap|trie/))
        return "## 📦 Data Structures Overview\n\n| Structure | Access | Search | Insert | Delete | Use Case |\n|-----------|--------|--------|--------|--------|----------|\n| **Array** | O(1) | O(n) | O(n) | O(n) | Random access, cache-friendly |\n| **Linked List** | O(n) | O(n) | O(1) | O(1) | Dynamic size, frequent insert/delete |\n| **Stack** | O(n) | O(n) | O(1) | O(1) | LIFO — undo, parentheses matching |\n| **Queue** | O(n) | O(n) | O(1) | O(1) | FIFO — BFS, scheduling |\n| **Hash Map** | — | O(1)* | O(1)* | O(1)* | Key-value lookup, counting |\n| **BST** | O(log n) | O(log n) | O(log n) | O(log n) | Sorted data, range queries |\n| **Heap** | O(1)† | O(n) | O(log n) | O(log n) | Priority queue, top-K |\n| **Trie** | — | O(m) | O(m) | O(m) | Prefix search, autocomplete |\n| **Graph** | — | O(V+E) | O(1) | O(V+E) | Networks, paths, relationships |\n\n*average case, †min/max only";

    // Dynamic programming
    if (q.match(/dynamic\s*programming|dp|memoiz|tabulation|overlapping/))
        return "## 🧩 Dynamic Programming\n\n### Concept\nDP solves problems by breaking them into **overlapping subproblems** and storing results to avoid re-computation.\n\n### Two Approaches\n1. **Top-Down (Memoization)** — Recursive + cache\n2. **Bottom-Up (Tabulation)** — Iterative, fill table\n\n### Common DP Patterns\n| Pattern | Examples |\n|---------|----------|\n| **1D DP** | Fibonacci, climbing stairs, coin change |\n| **2D DP** | Longest common subsequence, edit distance |\n| **Knapsack** | 0/1 knapsack, subset sum, partition |\n| **String DP** | Palindrome, regex matching |\n| **Tree DP** | Max path sum, diameter |\n| **Interval DP** | Matrix chain multiplication |\n\n### Steps to Solve\n1. Define the **state** (what changes?)\n2. Write the **recurrence relation**\n3. Identify **base cases**\n4. Decide **top-down or bottom-up**\n5. Optimize space if possible\n\n```javascript\n// Example: Fibonacci with memoization\nfunction fib(n, memo = {}) {\n    if (n <= 1) return n;\n    if (memo[n]) return memo[n];\n    return memo[n] = fib(n-1, memo) + fib(n-2, memo);\n}\n```";

    // Interview tips
    if (q.match(/interview\s*tip|how to prepare|crack\s*interview|placement|prepare for/))
        return "## 🎯 Interview Preparation Guide\n\n### Technical Round Tips\n1. **Practice Daily** — Solve 2-3 problems/day on this platform\n2. **Focus on Patterns** — Sliding window, two pointers, BFS/DFS, DP\n3. **Think Aloud** — Communicate your approach before coding\n4. **Start Simple** — Begin with brute force, then optimize\n5. **Test Edge Cases** — Empty input, single element, large input\n\n### Top Interview Topics\n| Priority | Topics |\n|----------|--------|\n| 🔴 Must Know | Arrays, Strings, Hash Maps, Linked Lists |\n| 🟠 Important | Trees, Graphs, BFS/DFS, Binary Search |\n| 🟡 Good to Know | DP, Greedy, Backtracking, Heaps |\n| 🟢 Bonus | Tries, Segment Trees, Bit Manipulation |\n\n### Behavioral Tips\n- Use the **STAR method** (Situation, Task, Action, Result)\n- Prepare 3-4 stories about challenges & teamwork\n- Ask thoughtful questions about the company\n\n### System Design (for experienced)\n- Start with **requirements** → **high-level design** → **detailed design**\n- Know: Load balancers, databases, caching, microservices\n\n💪 Keep practicing on this platform and you'll ace it!";

    // Two sum
    if (q.match(/two\s*sum/))
        return "## Two Sum Problem\n\n**Problem:** Given an array and a target, find two numbers that add up to the target.\n\n### Approach 1: Brute Force — O(n²)\n```javascript\nfunction twoSum(nums, target) {\n    for (let i = 0; i < nums.length; i++) {\n        for (let j = i + 1; j < nums.length; j++) {\n            if (nums[i] + nums[j] === target) return [i, j];\n        }\n    }\n    return [];\n}\n```\n\n### Approach 2: Hash Map — O(n) ✅\n```javascript\nfunction twoSum(nums, target) {\n    const map = new Map();\n    for (let i = 0; i < nums.length; i++) {\n        const complement = target - nums[i];\n        if (map.has(complement)) return [map.get(complement), i];\n        map.set(nums[i], i);\n    }\n    return [];\n}\n```\n\n**Key Insight:** Use a hash map to store seen numbers. For each number, check if its complement exists.";

    // System design
    if (q.match(/system\s*design|scalab|architect|high\s*level\s*design|microservice/))
        return "## ⚙️ System Design Essentials\n\n### Key Concepts\n| Concept | Description |\n|---------|------------|\n| **Load Balancing** | Distribute traffic (Round Robin, Least Connections) |\n| **Caching** | Redis/Memcached for frequent reads |\n| **Database Sharding** | Horizontal partitioning for scale |\n| **CDN** | Edge servers for static content |\n| **Message Queues** | RabbitMQ/Kafka for async processing |\n| **Microservices** | Decompose into independent services |\n\n### Design Process\n1. **Clarify Requirements** — Functional + non-functional\n2. **Estimate Scale** — Users, requests/sec, storage\n3. **High-Level Design** — Components + data flow\n4. **Detailed Design** — Database schema, API contracts\n5. **Bottlenecks** — Identify and resolve\n\n### Common Designs\n- URL Shortener, Chat System, News Feed\n- Video Streaming, E-commerce, Notification Service\n\nThis platform itself is a great system design example: MERN + WebRTC + Socket.IO + microservice-ready architecture!";

    // React / frontend
    if (q.match(/react|component|hook|usestate|useeffect|jsx|virtual\s*dom|vite/))
        return "## ⚛️ React.js Essentials\n\n### Core Concepts\n- **Components** — Reusable UI building blocks (functional preferred)\n- **JSX** — HTML-like syntax in JavaScript\n- **Props** — Data passed from parent to child\n- **State** — Internal component data (useState)\n- **Virtual DOM** — Efficient re-rendering via diffing algorithm\n\n### Important Hooks\n```javascript\nuseState()      // Local state management\nuseEffect()     // Side effects (API calls, subscriptions)\nuseRef()        // Mutable refs, DOM access\nuseContext()    // Global state sharing\nuseMemo()       // Expensive computation caching\nuseCallback()   // Function memoization\n```\n\n### This Platform Uses\n- **React Query** (TanStack) — Server state management\n- **Zustand** — Client-side state\n- **React Router** — Client-side routing\n- **Vite** — Lightning-fast build tool\n\n### Tips\n- Keep components small and focused\n- Lift state up when needed\n- Use `key` prop in lists for performance";

    // Node / Express / Backend
    if (q.match(/node|express|backend|server|middleware|rest\s*api/))
        return "## 🟢 Node.js & Express.js\n\n### Why Node.js?\n- **Non-blocking I/O** — Handles many concurrent connections\n- **Single-threaded** event loop with async callbacks\n- **npm** — Largest package ecosystem\n\n### Express.js Architecture\n```\nRequest → Middleware Stack → Route Handler → Response\n```\n\n### This Platform's Backend Structure\n```\nbackend/\n├── server.js          # Entry point, middleware, routes\n├── config/            # DB connection, environment\n├── controllers/       # Business logic\n├── models/            # Mongoose schemas\n├── routes/            # API route definitions  \n├── middleware/        # Auth, logging, rate limiting\n├── services/          # Cache, logger, email\n└── socket/            # Socket.IO handlers\n```\n\n### Key Middleware Used\n- `helmet` — Security headers\n- `cors` — Cross-origin requests\n- `express-rate-limit` — Rate limiting\n- Custom `protectRoute` — JWT verification";

    // WebRTC / Socket.IO
    if (q.match(/webrtc|socket|real\s*time|video\s*call|peer|simplepeer/))
        return "## 📡 Real-Time Features\n\n### Socket.IO\nUsed for:\n- **Live chat** in interview rooms\n- **Real-time code sync** in collaborative editor\n- **Whiteboard drawing** synchronization\n- **Event broadcasting** to connected clients\n\n### WebRTC (via SimplePeer)\nUsed for:\n- **Peer-to-peer video** calls\n- **Audio streaming** in interviews\n- **Low latency** direct browser-to-browser connection\n\n### How It Works\n```\n1. User A creates interview room\n2. Socket.IO establishes signaling channel\n3. WebRTC negotiates peer connection\n4. Video/audio streams directly P2P\n5. Code changes sync via Socket.IO events\n```\n\nThis gives the platform **Zoom-like interview capability** entirely in the browser!";

    // Docker
    if (q.match(/docker|container|deploy|devops|compose|cloud/))
        return "## 🐳 Docker & Deployment\n\n### Docker Setup\nThe platform includes:\n- `Dockerfile` — Multi-stage build for the backend\n- `docker-compose.yml` — Orchestrates backend + MongoDB\n\n### docker-compose.yml\n```yaml\nservices:\n  backend:\n    build: ./backend\n    ports: [\"5000:5000\"]\n    depends_on: [mongodb]\n  mongodb:\n    image: mongo:7\n    ports: [\"27017:27017\"]\n    volumes: [mongo-data:/data/db]\n```\n\n### Cloud Deployment Options\n| Platform | Suitable For |\n|----------|-------------|\n| **Railway** | Full-stack, free tier |\n| **Render** | Backend + static hosting |\n| **Vercel** | Frontend deployment |\n| **AWS EC2** | Full control |\n| **DigitalOcean** | VPS with Docker |";

    // Resume
    if (q.match(/resume|cv|builder|portfolio/))
        return "## 📄 Resume Builder\n\nThe platform includes a **built-in resume builder** with:\n\n### Auto-Generated Content\n- Problems solved count (Easy/Medium/Hard breakdown)\n- Recent solved problems\n- Platform achievements & badges\n- User profile info\n\n### Customizable Sections\n- Personal details (job title, phone, GitHub, LinkedIn)\n- Professional summary\n- Skills (add/remove tags)\n- Education history\n- Work experience\n- Projects with tech stack\n- Languages with proficiency\n\n### Features\n- 📝 Side-by-side edit panel + live preview\n- 💾 Auto-saves to localStorage\n- 🖨️ Print / Export as PDF\n- 📱 Responsive A4 format\n\nNavigate to the **Resume** page to try it!";

    // Thanks
    if (q.match(/thank|thanks|thx/))
        return "You're welcome! 😊 Happy to help. Keep coding and you'll ace your interviews! 🚀";

    // Help / What can you do
    if (q.match(/help|what can you|capabilities|what do you/))
        return "## 🤖 What I Can Do\n\n| Category | Topics |\n|----------|--------|\n| 💻 **Coding** | Any programming language, debugging, optimization |\n| 📊 **DSA** | Arrays, trees, graphs, DP, sorting, searching |\n| 🎯 **Interview** | Tips, common questions, mock practice |\n| ⚙️ **System Design** | Architecture, scalability, databases |\n| 📚 **This Project** | Features, tech stack, architecture, APIs |\n| 🌐 **Web Dev** | React, Node, Express, MongoDB, CSS |\n| 🔐 **Security** | Auth, JWT, encryption, best practices |\n| 🐳 **DevOps** | Docker, deployment, CI/CD, cloud |\n| 🌍 **General** | Math, science, career advice, anything! |\n\nJust type your question and I'll do my best to help!";

    // Coding question patterns
    if (q.match(/sliding\s*window|two\s*pointer|fast\s*slow/))
        return "## 🪟 Sliding Window & Two Pointer Patterns\n\n### Sliding Window\nUsed for **subarray/substring** problems with contiguous elements.\n\n```javascript\n// Max sum subarray of size k\nfunction maxSumSubarray(arr, k) {\n    let maxSum = 0, windowSum = 0;\n    for (let i = 0; i < arr.length; i++) {\n        windowSum += arr[i];\n        if (i >= k) windowSum -= arr[i - k];\n        if (i >= k - 1) maxSum = Math.max(maxSum, windowSum);\n    }\n    return maxSum;\n}\n```\n\n### Two Pointers\nUsed for **sorted arrays** or problems requiring pair comparisons.\n\n```javascript\n// Two sum in sorted array\nfunction twoSumSorted(arr, target) {\n    let left = 0, right = arr.length - 1;\n    while (left < right) {\n        const sum = arr[left] + arr[right];\n        if (sum === target) return [left, right];\n        sum < target ? left++ : right--;\n    }\n    return [-1, -1];\n}\n```";

    // Default: intelligent generic response
    if (q.match(/what|how|why|when|where|who|explain|define|describe|can you|could you|tell me/))
        return `Great question! Here's what I know about **"${message.trim()}"**:\n\nI'm CodeInterview AI — while I'm currently running in offline mode, I have extensive knowledge about:\n\n- **This platform's** architecture, features, and tech stack\n- **DSA & Algorithms** — sorting, searching, graphs, DP, trees\n- **Interview preparation** — tips, patterns, common problems\n- **Web development** — React, Node.js, MongoDB, and more\n\nTry asking something specific like:\n- "Explain the tech stack of this project"\n- "What is dynamic programming?"\n- "Give me interview tips"\n- "How does the resume builder work?"\n\nI'll give you a detailed, helpful answer! 💡`;

    return `Thanks for your message! 🤖\n\nI'm **CodeInterview AI**, here to help. Here are some things you can ask me:\n\n- 📚 **"Tell me about this project"** — Full platform overview\n- 🛠️ **"What is the tech stack?"** — Technologies used\n- 📊 **"Explain Big O notation"** — Complexity analysis\n- 🧩 **"What is dynamic programming?"** — DP explained\n- 🎯 **"Interview tips"** — Preparation strategies\n- 💻 **"Explain Two Sum"** — Problem walkthrough\n- ⚙️ **"System design basics"** — Architecture concepts\n\nJust ask and I'll provide a detailed answer! 😊`;
}

// ── Chat with AI (Main Assistant) ────────────────────────────────────
exports.chatWithAI = async (req, res) => {
    const { message, context, history } = req.body;

    if (!message || !message.trim()) {
        return res.status(400).json({ message: "Message is required." });
    }

    // Try Gemini API first, fall back to smart knowledge base
    try {
        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "mock-key") {
            throw new Error("No API key configured");
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Build conversation history for context
        const contents = [];

        // Add system instruction
        contents.push({ role: "user", parts: [{ text: SYSTEM_PROMPT + "\n\nAcknowledge that you understand and respond as CodeInterview AI." }] });
        contents.push({ role: "model", parts: [{ text: "Understood! I'm CodeInterview AI, ready to help with any question — coding, interviews, project details, or general knowledge. How can I assist you?" }] });

        // Add conversation history if provided
        if (history && Array.isArray(history)) {
            for (const msg of history.slice(-10)) {
                contents.push({
                    role: msg.role === "user" ? "user" : "model",
                    parts: [{ text: msg.content }]
                });
            }
        }

        // Add current message with optional context
        let userMessage = message;
        if (context) {
            userMessage = `[Context: ${JSON.stringify(context)}]\n\n${message}`;
        }
        contents.push({ role: "user", parts: [{ text: userMessage }] });

        const result = await model.generateContent({ contents });
        const response = await result.response;
        const text = response.text();

        res.json({ message: text });
    } catch (error) {
        // Graceful fallback to smart knowledge base
        console.log("AI falling back to knowledge base:", error.message);
        const reply = getSmartResponse(message);
        res.json({ message: reply });
    }
};

// ── AI Hint for Problem Solving ──────────────────────────────────────
exports.getAIHint = async (req, res) => {
    const { code, problemTitle, language } = req.body;

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "mock-key") {
        return res.json({
            message: "**Hint (Demo Mode):**\n\n1. Think about edge cases — empty input, single element, duplicates\n2. Consider the time complexity of your current approach\n3. Could a different data structure help? (Hash Map, Stack, Queue)\n\n*Set GEMINI_API_KEY for personalized AI hints!*"
        });
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `${SYSTEM_PROMPT}\n\nThe user is solving the problem "${problemTitle}" in ${language}.
        
Current Code:
\`\`\`${language}
${code}
\`\`\`

Provide a concise, helpful hint to guide them. Do NOT write the full solution. Focus on:
1. Logic or syntax errors if any
2. A nudge toward the right approach
3. Key data structures or patterns that might help

Keep it brief and encouraging.`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        res.json({ message: text });
    } catch (error) {
        console.error("AI Hint Error:", error.message);
        res.status(500).json({ message: "Failed to generate hint." });
    }
};

// ── Code Analysis ────────────────────────────────────────────────────
exports.analyzeCode = async (req, res) => {
    const { code, problemTitle, language } = req.body;

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "mock-key") {
        return res.json({
            message: "**Code Analysis (Demo Mode):**\n\n- **Time Complexity:** Analyze your loops and recursive calls\n- **Space Complexity:** Check for extra data structures\n- **Suggestions:** Consider edge cases and input validation\n\n*Set GEMINI_API_KEY for real AI analysis!*"
        });
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `${SYSTEM_PROMPT}\n\nAnalyze the following ${language} code for the problem "${problemTitle}".
        
Code:
\`\`\`${language}
${code}
\`\`\`

Provide a structured analysis:
1. ⏱️ **Time Complexity** with explanation
2. 📦 **Space Complexity** with explanation
3. 🐛 **Potential Bugs** or edge cases missed
4. 🚀 **Optimization Suggestions**
5. ✅ **Code Quality** feedback

Be professional and thorough.`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        res.json({ message: text });
    } catch (error) {
        console.error("AI Analysis Error:", error.message);
        res.status(500).json({ message: "Failed to analyze code." });
    }
};

// ── Interview Feedback ───────────────────────────────────────────────
exports.generateInterviewFeedback = async (req, res) => {
    const { interviewData } = req.body;

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "mock-key") {
        return res.json({
            feedback: {
                rating: 4,
                comments: "Good problem-solving approach. Consider optimizing your solution and handling edge cases more thoroughly.",
                strengths: ["Clear Communication", "Structured Code", "Logical Thinking"],
                improvements: ["Time Complexity Analysis", "Edge Case Handling", "Code Optimization"]
            }
        });
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `${SYSTEM_PROMPT}\n\nGenerate interview feedback for:
${JSON.stringify(interviewData, null, 2)}

Return a JSON object with:
- rating (1-5)
- comments (string)
- strengths (array of strings)
- improvements (array of strings)

Return ONLY the JSON object, no markdown.`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        try {
            const feedback = JSON.parse(text.replace(/```json?\s*/g, "").replace(/```\s*/g, ""));
            res.json({ feedback });
        } catch {
            res.json({
                feedback: {
                    rating: 4,
                    comments: text,
                    strengths: ["Problem Solving"],
                    improvements: ["Optimization"]
                }
            });
        }
    } catch (error) {
        console.error("AI Feedback Error:", error.message);
        res.status(500).json({ message: "Failed to generate feedback." });
    }
};
