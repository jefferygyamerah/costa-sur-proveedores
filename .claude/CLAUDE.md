# Costa Sur Proveedores

Community-driven directory of trusted local service providers for Costa Sur, Panama. Residents from any community (Villa Valencia, Woodlands, Caminos del Sur, etc.) recommend providers verified by house number + community.

## Scope

Local trades and home services only (plumbers, AC repair, gardening, fumigation, etc.). NOT white-collar professionals — that's Visto (soyvisto.com), a separate project.

## Stack

- Static frontend: vanilla HTML/CSS/JS, no framework
- Backend: Google Sheets + Apps Script (same pattern as Villa Valencia portal)
- Deploy: GitHub Pages or similar static hosting

## How It Works

- `apps-script/Code.gs` handles POST (submissions) and GET (approved providers as JSON)
- Google Sheet has one sheet "Proveedores" with an "Estado" column
- New submissions land as "pendiente" — set to "aprobado" in the sheet to publish
- The frontend fetches approved providers via GET and renders them
- Falls back to demo data if Apps Script URL not configured

## Conventions

- Spanish primary language
- Mobile-first CSS
- Category slugs: `aires`, `catering`, `jardineria`, `linea-blanca`, `plomeria`, `general`, `fumigacion`, `techo`, `solar`, `vidrios`
- Do NOT update `~/claude-assistant/knowledge/`, MEMORY.md, or task backlog
