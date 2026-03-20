# Costa Sur Proveedores

Community-driven directory of trusted local service providers for Costa Sur, Panama. Residents from any community (Villa Valencia, Woodlands, Caminos del Sur, etc.) recommend providers verified by house number + community.

## Scope

Local trades and home services only (plumbers, AC repair, gardening, fumigation, etc.). NOT white-collar professionals — that's Visto (soyvisto.com), a separate project.

## Stack

- Static frontend: vanilla HTML/CSS/JS, no framework
- Backend: Supabase (Postgres + auto-generated REST API)
- Deploy: GitHub Pages, Netlify, or Cloudflare Pages

## Data Model

- `providers` — name, category, service, phone, email, status (pending/approved)
- `recommendations` — links provider to a community + house_number, with optional comment
- `communities` — reference table of known residential communities

## Conventions

- Spanish primary language
- Mobile-first CSS
- Category slugs: `aires`, `catering`, `jardineria`, `linea-blanca`, `plomeria`, `general`, `fumigacion`, `techo`, `solar`, `vidrios`
- Submissions go to `pending` status — admin approves via Supabase dashboard
- Do NOT update `~/claude-assistant/knowledge/`, MEMORY.md, or task backlog
