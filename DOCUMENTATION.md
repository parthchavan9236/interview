# MERN-Based Remote Technical Interview Platform
## Research Documentation & Architecture

---

## 1. ER Diagram (Entity Relationship)

```mermaid
erDiagram
    User ||--o{ Submission : submits
    User ||--o{ Interview : participates
    User ||--o{ Comment : writes
    User ||--o{ BehaviorAnalytics : generates
    User ||--o| UserPerformanceMetrics : has
    User ||--o{ AIInterviewSession : takes
    User }o--o| Organization : "belongs to"
    
    Organization ||--o{ User : "has members"
    
    Problem ||--o{ Submission : "receives"
    Problem ||--o{ Comment : "has"
    Problem ||--o{ BehaviorAnalytics : "tracked for"
    
    Contest ||--o{ ContestSubmission : "contains"
    Contest }o--o{ Problem : "includes"
    User ||--o{ ContestSubmission : submits
    
    Interview ||--o{ InterviewSlot : "has slots"
    
    Submission ||--o{ PlagiarismReport : "checked by"
    
    User {
        ObjectId _id PK
        String clerkId UK
        String name
        String email UK
        String password
        String role "candidate|interviewer|admin"
        Number totalPoints
        Object streak
        Array badges
        Array solvedProblems
        ObjectId organizationId FK
        Boolean isDeleted
        Boolean isFlagged
    }

    Problem {
        ObjectId _id PK
        String title
        String description
        String difficulty "Easy|Medium|Hard"
        Array tags
        Array testCases
        Array examples
        Object starterCode
        ObjectId createdBy FK
    }

    Submission {
        ObjectId _id PK
        ObjectId user FK
        ObjectId problem FK
        String code
        String language
        String status "accepted|wrong_answer|error|..."
        Number executionTime
        Number memoryUsage
        Array results
    }

    UserPerformanceMetrics {
        ObjectId _id PK
        ObjectId userId FK "unique"
        Number performanceScore "0-100"
        Number accuracy "0-100"
        Number avgSolveTime
        Object solvedByDifficulty
        Array topicStrengths
        String currentRecommendedDifficulty
        Array difficultyHistory
        Number solveVelocity
    }

    BehaviorAnalytics {
        ObjectId _id PK
        ObjectId userId FK
        String sessionId UK
        ObjectId problemId FK
        Number typingSpeed
        Number tabSwitchCount
        Boolean copyPasteDetected
        Number interviewReadinessScore
        Array suspiciousFlags
        String riskLevel
    }

    SystemMetrics {
        ObjectId _id PK
        String date UK "YYYY-MM-DD"
        Number totalApiCalls
        Number avgResponseTime
        Number errorRate
        Object statusCodeBreakdown
        Array endpointMetrics
    }

    Organization {
        ObjectId _id PK
        String name
        String slug UK
        ObjectId owner FK
        Array members
        String subscriptionPlan
        Object settings
    }

    AIInterviewSession {
        ObjectId _id PK
        ObjectId userId FK
        String topic
        String difficulty
        String interviewType
        String status "active|completed|abandoned"
        Array conversation
        Object scores
        Object feedback
        Number duration
    }

    Contest {
        ObjectId _id PK
        String title
        Date startTime
        Date endTime
        Array problems
    }

    Interview {
        ObjectId _id PK
        ObjectId interviewer FK
        ObjectId candidate FK
        String status
    }
```

---

## 2. System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        A[React.js SPA<br/>Vite + Tailwind CSS]
    end

    subgraph "API Gateway"
        B[Express.js Server]
        B1[Helmet Security]
        B2[Rate Limiter]
        B3[CORS]
        B4[Response Time Middleware]
    end

    subgraph "Authentication"
        C1[JWT Custom Auth]
        C2[Clerk SSO]
    end

    subgraph "Core Services"
        D1[Problem Service]
        D2[Submission Service]
        D3[Contest Service]
        D4[Interview Service]
    end

    subgraph "Advanced Systems"
        E1["Adaptive Recommendation<br/>(IRT Algorithm)"]
        E2["Behavior Analytics<br/>(Readiness Score)"]
        E3["AI Interview<br/>(Gemini API)"]
        E4["System Metrics<br/>(Performance Monitor)"]
        E5["Multi-Tenant<br/>(Organization Isolation)"]
    end

    subgraph "Background Jobs"
        F1[Inngest Workers]
        F2[Submission Processor]
        F3[Metrics Flusher]
    end

    subgraph "Data Layer"
        G1[(MongoDB Atlas)]
        G2["Cache Service<br/>(Redis-Ready)"]
    end

    subgraph "Real-time"
        H1[Socket.IO]
        H2[WebRTC Signaling]
    end

    A --> B
    B --> B1 --> B2 --> B3 --> B4
    B --> C1
    B --> C2
    B --> D1 & D2 & D3 & D4
    B --> E1 & E2 & E3 & E4 & E5
    D2 --> F1
    E4 --> F3
    D1 & D2 & D3 & E1 & E2 & E3 & E4 & E5 --> G1
    D1 & D2 --> G2
    B --> H1 --> H2
```

---

## 3. Adaptive Difficulty Algorithm

### Mathematical Foundation

The recommendation engine implements a simplified **Item Response Theory (IRT)** model:

```
performanceScore = (accuracy × 0.4) + (speedScore × 0.3) + (consistencyScore × 0.3)
```

Where:
- **accuracy** = (correctSubmissions / totalSubmissions) × 100
- **speedScore** = max(0, 100 − (avgSolveTime / expectedTime) × 50)
- **consistencyScore** = min(100, solveVelocity × 33.3)

### Difficulty Progression State Machine

```mermaid
stateDiagram-v2
    [*] --> Easy : New User
    Easy --> Medium : score ≥ 70 AND solved ≥ 5
    Medium --> Hard : score ≥ 70 AND solved ≥ 3
    Medium --> Easy : score < 40
    Hard --> Medium : score < 40
```

### Weak Topic Detection
- Topics with accuracy < 50% AND attempts ≥ 3 are flagged
- 60% of recommendations target weak topics
- 30% are general at recommended difficulty
- 10% are stretch problems (one level harder)

---

## 4. Security Architecture

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Transport | HTTPS/TLS | Encrypted communication |
| Headers | Helmet.js | XSS, clickjacking, and MIME sniffing protection |
| Auth | JWT + Clerk | Dual authentication (custom + SSO) |
| Password | bcrypt (12 rounds) | Password hashing with salt |
| Rate Limiting | express-rate-limit | DDoS prevention (200 req/15min dev, 100 prod) |
| Input Validation | express-validator | SQL injection and XSS prevention |
| RBAC | Custom middleware | Role-based access (candidate, interviewer, admin) |
| Behavior Monitoring | BehaviorAnalytics | Suspicious activity detection |
| Data Privacy | Soft delete pattern | GDPR-compliant data handling |

### Authentication Flow
```
Client → Bearer Token → Auth Middleware
  ├─ Try JWT verification (custom users)
  │   └─ Decode → Find user by userId → Attach to req
  └─ Try Clerk verification (SSO users)
      └─ Verify token → Find user by clerkId → Attach to req
```

---

## 5. Scalability Strategy

### Horizontal Scaling Plan

```mermaid
graph LR
    LB[Load Balancer<br/>Nginx/ALB] --> S1[Node Instance 1]
    LB --> S2[Node Instance 2]
    LB --> S3[Node Instance N]
    S1 & S2 & S3 --> R[(Redis Cluster<br/>Sessions + Cache)]
    S1 & S2 & S3 --> DB[(MongoDB Atlas<br/>Replica Set)]
    S1 & S2 & S3 --> Q[Message Queue<br/>Bull/RabbitMQ]
```

### How This System Scales to 1M Users

| Component | Current | At Scale |
|-----------|---------|----------|
| **Cache** | In-memory Map | Redis Cluster (sub-ms reads) |
| **Database** | Single MongoDB | Replica Set + Sharding |
| **Sessions** | JWT (stateless) | Already scalable (no server state) |
| **File Storage** | Local | S3/CloudFront CDN |
| **Background Jobs** | Inngest | Inngest + Bull Queue workers |
| **Search** | MongoDB queries | Elasticsearch (problem search) |
| **Real-time** | Socket.IO single | Socket.IO + Redis adapter |
| **Metrics** | In-memory buffer | Redis pub/sub + InfluxDB |

### Database Indexing Strategy

All models include strategic compound indexes:
- `User`: email, totalPoints (leaderboard), role, isDeleted
- `Submission`: (user, problem), (user, createdAt), (status), (isFlagged)
- `UserPerformanceMetrics`: userId (unique), performanceScore, difficulty
- `BehaviorAnalytics`: (userId, createdAt), sessionId, riskLevel
- `AIInterviewSession`: (userId, status), (topic, difficulty), scores

---

## 6. Interview Readiness Score Algorithm

```
readinessScore = 100 − Σ(penalties)

Penalties:
  - Tab switches:    min(20, tabSwitchCount × 2)
  - Idle ratio:      min(30, (idleTime / totalDuration) × 30)  
  - Copy/paste:      min(20, copyPasteCount × 10)
  - Low keystrokes:  15 (if duration > 60s AND keystrokes < 50)

Risk classification:
  - Low:    0 suspicious flags
  - Medium: 1-2 suspicious flags  
  - High:   3+ suspicious flags
```

---

## 7. Comparison with Existing Platforms

| Feature | LeetCode | HackerRank | **Our Platform** |
|---------|----------|------------|-----------------|
| Adaptive Difficulty | ❌ Manual | ❌ Manual | ✅ IRT-based engine |
| Behavior Analytics | ❌ | ❌ | ✅ Full tracking |
| AI Interviewer | ❌ | ❌ | ✅ Gemini-powered |
| Multi-Tenant | ❌ | ✅ | ✅ Organization-scoped |
| Readiness Score | ❌ | ❌ | ✅ Behavioral scoring |
| System Monitoring | Internal | Internal | ✅ Built-in metrics |
| Video Interviews | ❌ | ✅ | ✅ WebRTC + Socket.IO |
| Open Source | ❌ | ❌ | ✅ MERN stack |

---

## 8. Research Contributions

1. **Adaptive Problem Recommendation**: Applied simplified IRT model to coding problem recommendation, demonstrating feasibility of personalized learning paths in interview preparation platforms.

2. **Behavioral Biometrics for Interview Integrity**: Implemented keystroke dynamics and interaction pattern analysis as lightweight proctoring indicators, contributing to remote assessment security research.

3. **Conversational AI for Technical Assessment**: Designed a provider-agnostic AI interview system with dynamic question generation, follow-up depth tracking, and multi-dimensional scoring.

4. **Multi-Tenant Architecture for EdTech**: Demonstrated shared-schema multi-tenancy pattern suitable for institution-level deployment with subscription-based feature gating.

---

## 9. Future Scope

- **Machine Learning Integration**: Train custom models on user performance data for better recommendations
- **Video Proctoring**: Computer vision-based attention detection during contests
- **Collaborative Coding**: Real-time pair programming with interviewer
- **Natural Language Processing**: Auto-grading of behavioral interview responses
- **Mobile Application**: React Native cross-platform app
- **Blockchain Certificates**: Verifiable skill certificates on blockchain
- **Advanced Analytics Dashboard**: Predictive analytics for hiring decisions

---

## 10. API Reference

### New Endpoints Added

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/recommendations` | ✅ | Personalized problem recommendations |
| GET | `/api/recommendations/stats` | ✅ | Performance metrics |
| POST | `/api/recommendations/recalculate` | ✅ | Recalculate user metrics |
| POST | `/api/behavior/track` | ✅ | Track behavior event |
| GET | `/api/behavior/readiness` | ✅ | Interview readiness score |
| GET | `/api/behavior/user/:userId` | Admin | User behavior summary |
| GET | `/api/metrics/system` | Admin | System health |
| GET | `/api/metrics/performance` | Admin | API performance stats |
| GET | `/api/metrics/endpoints` | Admin | Per-endpoint breakdown |
| POST | `/api/organizations` | ✅ | Create organization |
| GET | `/api/organizations` | ✅ | List organizations |
| GET | `/api/organizations/:id` | ✅ | Get organization |
| POST | `/api/organizations/:id/members` | Org Admin | Add member |
| DELETE | `/api/organizations/:id/members/:userId` | Org Admin | Remove member |
| GET | `/api/organizations/:id/leaderboard` | ✅ | Org leaderboard |
| GET | `/api/organizations/:id/analytics` | ✅ | Org analytics |
| POST | `/api/ai-interview/start` | ✅ | Start AI interview |
| POST | `/api/ai-interview/:id/message` | ✅ | Send response |
| POST | `/api/ai-interview/:id/end` | ✅ | End + get scores |
| GET | `/api/ai-interview/history` | ✅ | Past sessions |
| GET | `/api/ai-interview/:id` | ✅ | Session detail |
