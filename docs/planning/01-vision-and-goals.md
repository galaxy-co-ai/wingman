# 01 - Vision and Goals

## Problem Statement
Why are we building this? What pain point does it solve?

Working with Claude Code in a raw terminal creates friction that breaks developer flow:

1. **Workflow Disconnect**: Developers constantly tab-switch between the Claude terminal and their browser to see app changes. The AI conversation is isolated from the actual work output.

2. **Blind to Changes**: No visibility into what files Claude is modifying. You only know something changed when you check manually or see build output.

3. **Context Loss**: Every new terminal session starts fresh. Previous conversations, context, and progress are lost unless manually managed.

---

## Vision Statement
What does Wingman become when it's successful?

Wingman makes working with Claude feel like true pair programming - your AI conversation, live app preview, and file activity all in one view. Sessions persist, context carries forward, and you never lose your flow.

---

## Success Criteria
How do we know when we've succeeded? (Measurable goals)

| Metric | Target |
|--------|--------|
| Primary workflow tool | You use Wingman instead of raw terminal for 90%+ of Claude sessions |
| Session continuity | Can resume any previous session with full context |
| Zero tab-switching | App preview visible without leaving Wingman |
| File awareness | See file changes within 1 second of them happening |
| Progress visibility | Real-time project roadmap/task progress tracking visible as you work |

---

## Non-Goals
What are we explicitly NOT building? (Prevents scope creep)

- **Not for manual code editing** - Claude Code handles file changes; Wingman is for directing and observing, not typing code yourself
- **Not rebuilding AI engines** - We integrate existing providers (Claude, OpenAI, Gemini, Ollama), not create our own
- **Not a team collaboration tool** - Single-user focus (for now)
- **Not a cloud service** - Desktop app, your data stays local (for now)

---

## Key Differentiators
What makes Wingman different from alternatives?

- **Unified workspace** - Chat, live app preview, file activity, and project roadmap in one view
- **Multi-AI with cost optimization** - Switch between Claude, OpenAI, Gemini, and free local models based on task complexity
- **Integrated project management** - Full roadmap/sprint tracking that lives alongside your AI conversations
- **Persistent sessions** - Never lose context; pick up any conversation where you left off
- **Desktop-native** - Your data stays local, no cloud dependency
