# Billy - Personal Executive Function Prosthetic

***Named after my late dog Billy - my personal digital assistant***

## 1. Introduction: The Neurodivergent Productivity Crisis

### 1.1 The Failure of Linear Productivity Paradigms

The contemporary productivity software market is saturated with tools designed for the neurotypical mind. Applications such as Todoist, Things3, and Asana rely on a fundamental assumption: that the user possesses a functioning executive control system capable of prioritizing tasks based on objective importance and managing linear time effectively. For the estimated 5% of the global population with Attention Deficit Hyperactivity Disorder (ADHD), these assumptions are not merely incorrect; they are actively detrimental.

The ADHD brain does not process urgency and importance in the same way as a neurotypical brain. Instead, it operates on an "Interest-Based Nervous System" (IBNS), a term coined by Dr. William Dodson to describe a neurology that is fueled by four specific triggers: Interest, Challenge, Novelty, and Urgency (ICNU). Traditional list-based applications fail to activate these triggers. A flat list of tasks is static; it lacks novelty. A list sorted by "Priority 1" flags fails to convey genuine urgency until the deadline is imminent, often leading to "time blindness"—the inability to sense the passing of time or the proximity of future events.

Furthermore, traditional tools exacerbate "object permanence" deficits. In a scrolling list, items that move off-screen effectively cease to exist for the ADHD user. This "out of sight, out of mind" phenomenon leads to the accumulation of hidden debt—tasks that are captured but never reviewed, creating a "Wall of Awful" that induces shame and avoidance. The result is a cycle of productivity bankruptcy: the user adopts a new tool (Novelty), inputs all their tasks (Hyperfocus), and then abandons the tool once the list becomes long enough to require scrolling (Overwhelm).

### 1.2 Product Vision: Billy

Billy represents a paradigm shift from "List Management" to "Thought Spatialization." It is a desktop application designed to function as a cognitive prosthetic for the executive dysfunction characteristic of ADHD. Rather than forcing the user to conform to a rigid database of rows and columns, Billy maps tasks onto an infinite 2D spatial canvas.

This approach leverages the brain's spatial navigation hardware (the hippocampus) to offload the burden from the working memory (the prefrontal cortex). By representing tasks as nodes in a graph, we allow users to cluster related items visually, creating "neighborhoods" of work. This spatial arrangement combats object permanence issues: users can zoom out to see the entire landscape of their responsibilities or zoom in to focus on a specific cluster, utilizing a "Semantic Zoom" mechanism that alters the information density based on the viewport level.

Crucially, Billy is engineered as a Local-First application. ADHD users often struggle with distraction; placing their task manager inside a web browser (alongside social media and email) is a design flaw. Billy runs as a native desktop binary using Tauri, ensuring high performance and an isolated environment. It utilizes on-device Artificial Intelligence (Transformers.js) to assist with the most difficult barrier to productivity: task initiation. The AI helps decompose vague, overwhelming projects into actionable micro-steps and surfaces related tasks via vector similarity search, all without sending a single byte of data to the cloud.

### 1.3 The Strategic Necessity of Privacy and Performance

The decision to build a local-first architecture is not purely technical; it is an ethical mandate for this demographic.

**Data Sovereignty:** Users with executive dysfunction often document sensitive personal failures, medical appointments, and chaotic thoughts in their journals. This data requires the highest standard of privacy—local storage.

**Latency and Friction:** For an ADHD brain, a 500ms delay in loading a page is enough of a friction point to derail a train of thought. Billy leverages PGLite (WASM PostgreSQL) and Tauri (Rust) to achieve near-instantaneous interaction speeds that Electron-based or web-based apps cannot match.

**Offline Reliability:** Productivity does not cease when the internet connection drops. A local-first architecture ensures the tool is always available, removing yet another barrier to engagement.

---

## 2. Why Billy Exists: My Personal Story

**Motion failed me because:**
- Too complicated, didn't know where to start
- Too many options causing decision paralysis  
- Didn't learn my patterns or tendencies
- Time-based only, ignored energy and chronotype

**What I actually need:**
- Visual control (see all tasks, hierarchy, organization)
- Learning system (understands MY completion patterns)
- Decision support (reduces 50 tasks to 3 when paralyzed)
- Energy respect (not just time available)
- Progressive enhancement (works immediately, gets smarter over time)

**Billy's Core Promise:**
Build a tool that learns me - my habits, my flaws, my capacity - and helps me improve without judgment. A cognitive prosthetic that respects my brain's actual operating system (Interest-Based), not the neurotypical fantasy (Importance-Based).

---

## 3. Technical Architecture

### 3.1 The Technology Stack

| Component | Technology | Version | Role | Justification |
|-----------|-----------|---------|------|---------------|
| Application Shell | Tauri | v2.0+ | OS Integration, Window Management | 30MB footprint vs Electron's 100MB+, enables future MCP |
| Frontend Framework | React | v18+ | UI Components, State Management | Extensive ecosystem, React Flow support |
| Visualization Engine | React Flow | v12+ | Infinite Canvas, Node Graph | Specialized for node-based UIs, semantic zoom |
| Database Engine | PGLite | v0.2+ | Persistence, Vector Search | Postgres in WASM, native pgvector support |
| AI Inference | Transformers.js | v3.0+ | Local Embeddings | WebGPU acceleration, privacy-preserving |
| State Management | Zustand | v4.5+ | Transient Client State | Lightweight, works well with React Flow |
| Build Tooling | Vite | v5+ | Bundling, HMR | Fast dev cycle, worker thread support |

### 3.2 Why These Choices

**Tauri over Electron:**
- 30-40MB binary vs 100MB+ (matters for distribution)
- Rust backend = better security + performance
- Future MCP integration without needing it now
- Learning new tool = technical growth

**PGLite over SQLite:**
- Native pgvector support (semantic search without separate vector DB)
- Full Postgres SQL (JSONB, advanced queries)
- IndexedDB VFS = works in Tauri webview on all platforms

**React Flow over Custom Canvas:**
- Battle-tested for node graphs
- Semantic zoom support built-in
- Performance optimizations handled
- Don't reinvent the wheel

**Local ML over Cloud:**
- Zero API costs (sustainable)
- Privacy-preserving (ADHD data stays local)
- Works offline (ADHD users have chaotic lives)
- Forces better engineering (algorithms > API calls)

### 3.3 Intelligent Auto-Layout (Optional Enhancement)

**The Problem:** Users don't know where to spatially position tasks

**The Solution:** Force-directed simulation using d3-force
- New tasks generate embeddings via Transformers.js
- System queries similar tasks using pgvector
- d3-force simulation pulls new task toward semantic neighbors
- After 3 seconds of stability, node auto-pins to location
- User can always override by manually dragging

**Rationale:** Reduces cognitive load of "where does this go?", creates organic clustering, respects spatial memory through stable positions

**Implementation:** Week 3-4 task (post-foundation)

---

## 4. Core Features (MVP Scope)

### 4.1 Spatial Task Canvas

**The Problem:** Scrolling lists cause "out of sight, out of mind" for ADHD brains

**The Solution:** Infinite 2D canvas where tasks are visual nodes
- Drag to position tasks spatially
- Group related tasks into clusters
- Zoom out for overview, zoom in for details
- Semantic zoom changes information density by viewport level

### 4.2 Energy Accounting System

**The Problem:** Tools assume capacity is constant, but ADHD brains have variable energy

**The Solution:** Spoon theory + constraint satisfaction
- Tasks tagged with energy cost (1-5 scale)
- Different energy types (cognitive, physical, creative)
- Filter tasks by current energy level
- Prevents scheduling impossible work

### 4.3 "What Now?" Decision Support

**The Problem:** 50 tasks = decision paralysis, can't choose where to start

**The Solution:** Constraint satisfaction algorithm
- User indicates current state (time available, energy level, context)
- Algorithm filters to feasible tasks
- Ranks by ICNU scores (interest, challenge, novelty, urgency)
- Presents exactly 3 options with rationale

### 4.4 Behavioral Pattern Learning

**The Problem:** Tools don't learn when YOU actually work best

**The Solution:** Track completion patterns, detect chronotype
- Records when tasks created vs completed
- Learns time-of-day effectiveness
- Detects procrastination patterns
- Distinguishes avoidance vs genuine capacity issues

### 4.5 Semantic Task Intelligence

**The Problem:** Duplicate tasks, can't find related work

**The Solution:** Local embeddings (Transformers.js)
- Detects similar tasks ("Buy milk" vs "Get groceries")
- Semantic search (find "finance" tasks without keyword match)
- Auto-grouping by similarity

**Visual ICNU Feedback:**
- High-score tasks physically pulse or grow slightly larger
- Stale tasks (low novelty) desaturate and fade ("digital moss")
- Urgent tasks turn progressively redder as deadline approaches
- Creates visual hierarchy without manual prioritization

---

## 5. Out of Scope (Explicitly Deferred)

**NOT in MVP (can add post-Jan 13):**
- LLM-based task decomposition (Qwen/Phi-3)
- MCP integration (Obsidian, Todoist, Calendar)
- Multi-device sync
- Goal/Milestone hierarchy (defer complexity)
- Calendar integration
- Collaboration features
- Mobile app
- Advanced gamification (XP, streaks, rewards)

**Rationale:** These are valuable but not essential for core value prop (decision support + energy awareness). Ship foundation first, enhance later.

---

## 6. Success Criteria

### 6.1 For Me (Primary User)

**Measurable:**
- Decision latency: < 2 min from "I'm paralyzed" to starting a task
- Daily usage: Open Billy every workday for 2+ weeks
- Completion improvement: 20%+ increase in high-value task completion
- Capacity respect: Zero instances of suggesting impossible tasks

**Subjective:**
- Feels helpful, not judgmental
- Reduces overwhelm, doesn't add to it
- I trust the suggestions (transparency in reasoning)
- Becomes my default task system

### 6.2 For Recruiters (Secondary Goal)

**Technical demonstration:**
- Tauri + React Flow + PGLite architecture
- Constraint satisfaction implementation
- Local ML integration (embeddings)
- Behavioral pattern recognition algorithms
- Complex state management (spatial + temporal data)

**Portfolio value:**
- Solves novel problem (not CRUD tutorial)
- Shows systems thinking
- Clean, walkthrough-ready codebase
- Comprehensive technical documentation

---

## 7. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Scope creep (adding features mid-build) | HIGH | Critical | Strict scope defense, weekly validation against MVP list |
| Learning curve (Tauri/PGLite/React Flow new) | MEDIUM | High | Educator mode, build incrementally, ask questions |
| Timeline slip (7 weeks tight for desktop app) | MEDIUM | High | Weekly progress checks, descope if behind |
| Over-engineering algorithms | MEDIUM | Medium | Start simple (heuristics), add sophistication only if needed |
| RAM constraints (models too large) | LOW | Medium | Conservative model selection, test early |
| Building wrong thing again | LOW | Critical | Use it myself daily, iterate on real friction |

---

## 8. Development Principles

**For This Final Version:**

1. **Build for me first** - Ignore portfolio/product framing until it works
2. **Educator mode** - Understand every line of code (new tools require this)
3. **Validation loops** - Use daily, fix what annoys me
4. **Scope defense** - Defer anything not essential for "What now?" to work
5. **Progressive enhancement** - Ship simple algorithms, add ML as data accumulates
6. **Digital trail** - Log dev process in Obsidian, becomes portfolio narrative naturally

**This is the final version. No more restarts after this.**

---

*Named after my late dog Billy. Time to build something that actually helps.*
