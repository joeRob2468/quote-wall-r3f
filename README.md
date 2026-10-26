# Quote Wall

## Development

Start the database, then run the dev server:

```bash
docker compose up -d
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

To seed the database with initial data:

```bash
npm run seed
```

## Production (Docker + Cloudflare Tunnel)

### First-time setup

**1. Set up your Cloudflare tunnel**

Go to Cloudflare Zero Trust → Networks → Tunnels, create a tunnel, and point a public hostname to `http://app:3000`. Copy the tunnel token.

**2. Create your env file**

```bash
cp .env.prod.example .env.prod
```

Fill in all values — secrets, your tunnel domain, and the tunnel token. Generate `NEXTAUTH_SECRET` with:

```bash
openssl rand -base64 32
```

**3. Build and start**

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

On first run, optionally seed the database:

```bash
docker exec quote_wall_app npx -y tsx src/db/seed/seed.ts
```

Database migrations run automatically on each container startup.

### Subsequent deploys

```bash
git pull
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```
