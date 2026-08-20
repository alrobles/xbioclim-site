# 🌍 EcoSeek Bioclim — Site

Institutional single-page site for EcoSeek Bioclim, the ERA5-Land bioclimatic
variable service. Served as **static files via Docker + nginx** at
`https://xbioclim.org`; the REST API and GeoTIFF downloads live on
`https://data.xbioclim.org` (see `alrobles/ecoseek-bioclim`).

## Stack

- `index.html` — one-pager: Hero · Data · Download · Documentation · Contact
- `app.js` — frontend logic, talks to the REST API at `https://data.xbioclim.org`
- `ecoseek-logo.svg` / `favicon.svg` — brand assets (shared with ecoSeek)
- `Dockerfile` + `nginx.conf` — static server, gzip, no-cache for assets
- `docker-compose.yml` — container `xbioclim-site` on `127.0.0.1:8660`

## Deploy

```bash
cd /home/reumanlab/dev/xbioclim-site
docker compose up -d --build
curl -s 127.0.0.1:8660 | head
```

## Cloudflare Tunnel

In `/etc/cloudflared/config.yml` (tunnel `154c1f8f-…`):

```yaml
  - hostname: xbioclim.org
    service: http://127.0.0.1:8660
```

DNS: CNAME `xbioclim.org` → `154c1f8f-ad87-4dbe-b949-cf8a067dd4f9.cfargotunnel.com` (proxied).

## API (data.xbioclim.org)

- `GET /api/years`, `GET /api/variables`, `GET /api/summary`
- `GET /api/download/{year}/{file}?dataset=9km|1km`
- `GET /api/scripts?start=X&end=Y&fmt=bash|urls&dataset=…`

## License

Code MIT · Data © Copernicus (ERA5-Land) · Part of the EcoSeek ecosystem by alrobles.