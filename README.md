# Bioclim — Site

Institutional multi-page static site for Bioclim, the ERA5-Land bioclimatic
variable service. Served via **Docker + nginx** at `https://xbioclim.org`;
the REST API and GeoTIFF downloads live on `https://data.xbioclim.org`
(see `alrobles/ecoseek-bioclim`).

## Structure

- `index.html` — landing / hero
- `data.html` — variables, browse & batch download
- `docs.html` — REST API endpoints & client examples
- `contact.html` — project links
- `app.js` — frontend logic, talks to `https://data.xbioclim.org`
- `style.css` — shared styles (dark-mode toggle)
- `Dockerfile` + `nginx.conf` — static server (gzip, no-cache)
- `docker-compose.yml` — container on `127.0.0.1:8660`

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

Code MIT · Data © Copernicus (ERA5-Land) · by alrobles.