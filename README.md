# Docker up down
```
docker compose up -d
```

```
docker compose down -v
```

# DB backup

```
docker compose exec db pg_dump -U postgres app_db > backup/backup_$(date +%Y%m%d_%H%M%S).sql
```

```
docker compose exec -T db psql -U postgres app_db < backup/backup_20251228_185228.sql
```

# DB Migration

```
docker compose exec web pnpm db:migrate
```

# Problems

At the deployment environment, aplication can not get environment value. However, it can be available at build stage.