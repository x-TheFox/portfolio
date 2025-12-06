# Visual Demos & Screenshots

This file documents how to capture screenshots and visual demos for GitHub (`docs/assets/`) using either the MCP browser (if available) or manual capture.

## Screenshots to capture
- Homepage under each persona (Recruiter, Engineer, Designer, CTO, Gamer, Curious) — 1440x900
- Chat widget flow invoking a tool call — 1024x768
- Behavior tracker dev tools and heatmap — 1024x768
- Admin CMS screens (profile, skills, case studies) — 1440x900
- Intake multi-turn conversation — 393x852 (mobile)

## Using MCP Browser (automated)
If you have an MCP tool enabled that can open the browser and take screenshots, follow the instructions in your tool to navigate to the dev server or deployed Vercel site and screenshot the necessary pages. Save images to `docs/assets/`.

## Manual Capture
1. Open the website in the browser.
2. Use device emulation (Chrome DevTools) to set viewport size.
3. Reproduce the state (e.g., send a few chat messages, open code sample, navigate to projects).
4. Take screenshot and save to `docs/assets/` with descriptive filenames.

## Filenames & Sizes
- `homepage-recruiter-1440x900.png`
- `homepage-engineer-1440x900.png`
- `chat-toolcall-1024x768.png`
- `admin-profile-1440x900.png`
- `intake-mobile-393x852.png`
