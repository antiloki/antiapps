# antiApps colors-v1: competitors, comparison outlines, docs structure
Draft for Dan's review (branch `app-palettes-v1`, not on main). Our-side facts come from each repo README / plan as of 15 Oct 2026. Competitor facts are only those read on the cited pages on 15 Oct 2026; anything not verified is marked **unknown**. Prices change, so re-check before publishing.

## Palettes (antiloki keeps charcoal #211e1b / copper #c97c5c)
| App | Painting | bg | panel | ink | accent (buttons) | accent text |
|---|---|---|---|---|---|---|
| antiHunt | Bruegel, Harvesters | #1b1c14 olive-black | #25261b | #efead6 | #d4a72c wheat gold | #e8c25a |
| antiPost | Goya, Saturn | #1a1112 black-red | #251718 | #f1e4e2 | #a8202c crimson | #ef6a6a |
| antiBot | Rembrandt, Anatomy Lesson | #111a1b teal-black | #172426 | #e6efec | #d99a3c candle amber | #f0b862 |
| antiQA | Bosch, Garden | #121a15 moss-black | #19241d | #ebf1ea | #e07a9a flesh pink | #f4a3bc |
| antiDrive | Géricault, Raft of the Medusa (palette already made by antiDrive agent on branch `antidrive-palette`, kept as is) | #1c1b1a stone | #262523 | #e5e2d8 | #b3171f blood red | #e0787b |

---
## antiHunt vs Apollo.io
Why: the best-known lead database + outreach tool for small sellers. (Explee was the v1 plan's comparison; Apollo is the bigger name.)
Sources: https://www.apollo.io/pricing ; ours: /workspace/antihunt-plan-v2.md, antihunt landing.
| Row | Apollo.io | antiHunt |
|---|---|---|
| Where leads come from | Apollo's own contact database (pricing FAQ: select/export up to 10,000 records) | People who publicly ask for what you sell on YouTube, X, Instagram, found in your own signed-in browser |
| Proof per lead | **unknown** | Screenshot of the original post/comment |
| Who sends outreach | Email sequencing, automated (on every plan) | Drafts only; you send |
| Pricing model | Credits per billing cycle, unused credits expire, add-on credits recur | Per contactable lead, first 10 free (plan v2) |
| Free tier | Free plan, no time limit; Gmail only on free | Free 10-lead sample pack |
| Data use limits | Internal business use only; reselling needs separate agreement | Lead packs are a local SQLite file you own |
| AI | AI features on Professional | Uses the AI CLI you already pay for; no API key stored |
| Where data lives | Apollo cloud | Your machine (127.0.0.1) |

## antiPost vs Buffer
Sources: https://buffer.com/pricing ; ours: danilosilvadev/antipost README (0.1.4+).
| Row | Buffer | antiPost |
|---|---|---|
| Price | Free; Essentials $5/mo per channel, Team $10/mo per channel (annual) | **TBD** (not public) |
| Channels | 12 incl. X, Instagram, YouTube, LinkedIn, TikTok, Threads, Bluesky | X, Instagram, YouTube |
| Free-plan limit | 10 scheduled posts per channel | **TBD** |
| Comments / DMs | Reply to comments on all plans; AI replies 5/week free; DMs **unknown** | Comments and DMs in one inbox |
| Approval | Approval workflows on Team plan only | Nothing published or sent until you approve, every plan |
| AI | Built-in AI Assistant | Agents run on your own CLIs (Codex, Claude Code, Grok, Cursor, Gemini) |
| Data | Buffer cloud | One local SQLite file; secrets in OS keychain |
| Leads | Not offered (verify) | Lead capture + antiHunt lead import |
| Agent access | Integrations with ChatGPT, Claude, Cursor; public API with request limits | Local MCP server |

## antiBot vs OpenClaw
Sources: https://docs.openclaw.ai/ , https://github.com/openclaw/openclaw ; ours: antiloki/openBot README.
| Row | OpenClaw | antiBot |
|---|---|---|
| Form | Self-hosted Gateway process + web Control UI + macOS app | Desktop app (Tauri v2, Rust backend) |
| Runtime need | Node 24.16+/26 | Single app; no Node runtime (verify after Rust-only rule) |
| AI access | API key from your chosen provider | CLIs you're already signed in to (Claude Code, Codex, Gemini, custom); no API key field |
| Chat surfaces | Discord, Signal, Slack, Telegram, WhatsApp, iMessage, and more | Desktop chat per agent (messaging channels **unknown/none**) |
| Multi-agent | Multi-agent routing, isolated sessions | Persistent agents with own workspace + agent-to-agent messages with hop limit |
| Memory | Sessions, memory | Per-agent notes + shared user memory, injected into prompt |
| Schedules | Cron, hooks, webhooks | Cron routines posting into chat |
| Storage | Config at ~/.openclaw/openclaw.json; DB **unknown** | SQLite ~/.openbot/openbot.db |
| License / price | MIT, no paid tier | **TBD** |

## antiQA vs Playwright Test
Sources: https://playwright.dev/docs/intro ; ours: antiqa README (0.0.8).
| Row | Playwright Test | antiQA |
|---|---|---|
| Install | npm, needs Node 22/24/26 | One offline static binary (`antiqa`) |
| Browsers | Chromium, WebKit, Firefox | Chromium via CDP (others **unknown**) |
| Terminal apps | Not covered | PTY terminal driver |
| Accessibility | Via add-on (axe) **verify** | Vendored axe-core |
| Writing tests | You write TS/JS specs | Packs + play/2 scripts, agent prompts, triage and gates |
| Reports | HTML reporter, UI mode | Reports + triage (format **verify**) |
| CI | Suggests a GitHub Actions workflow | Local gate, no CI required |
| Language | TypeScript/JS | Rust |
| Maturity | Mature, Microsoft-backed (**verify wording**) | Alpha 0.0.x |

## antiDrive vs Google Drive
Already drafted and merged by antiDrive agent (PR #11, antidrive/index.html "Compared" section). Keep; only re-color.

---
## Proposed docs structure (same for each app, at /<app>/docs/, antiDrive already has /antidrive/docs/)
1. Overview: what it kills, who it's for
2. Install: Linux / Windows / macOS / Android (as available), system requirements
3. Quick start: first 5 minutes
4. Concepts: app-specific (below)
5. Guides: task how-tos
6. Configuration and data: where files/SQLite live, backups, keychain
7. Privacy and security
8. Troubleshooting + FAQ
9. Changelog (from GitHub releases)

App-specific sections:
- antiHunt: browser extension setup; sources (YouTube, X, Instagram, LinkedIn, Gmail); scoring hot/warm/cold; proof screenshots; drafts and sending rules; lead packs (.db), CSV export, MCP; pricing per lead; opt-outs.
- antiPost: setup wizard; connecting X/Instagram/YouTube (OAuth dev apps); agents and CLIs; inbox; posts board and approvals; MCP tools reference; antiHunt lead import.
- antiBot: agents and providers; memory; cron routines; agent-to-agent messaging (`openbot send`, POST /v1/send); workspace folders; CLI detection.
- antiQA: CLI reference; packs; play/2 format; browser and terminal drivers; accessibility checks; gates and triage; reports; conformance.
