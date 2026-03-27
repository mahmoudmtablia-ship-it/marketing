# Deploy To Vercel

## 1. Push The Project To GitHub

Create a new GitHub repository, then push this project to it.

## 2. Import The Repository In Vercel

In Vercel:

1. Create a new project
2. Import the GitHub repository
3. Keep the framework preset as `Next.js`
4. Set the build command to `npm run build:vercel` for the first deployment

## 3. Add Required Environment Variables

Set these in the Vercel project settings:

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `AUTH_ADMIN_EMAIL`
- `AUTH_ADMIN_PASSWORD`
- `AUTH_USER_EMAIL`
- `AUTH_USER_PASSWORD`

Optional:

- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `GROQ_API_KEY`
- `GROQ_MODEL`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `SEARCH_CACHE_TTL_SECONDS`
- `COMPARE_CACHE_TTL_SECONDS`

Use the values from `.env.example` as the starting shape.

## 4. Database Setup

This app needs a PostgreSQL database before production works correctly.

Recommended hosted options:

- Vercel Postgres
- Neon
- Supabase
- Railway Postgres

After the database is created, set the final production `DATABASE_URL` in Vercel.

## 5. Prisma Notes

The project runs `prisma generate` automatically during install through:

```json
"postinstall": "prisma generate"
```

For this repo's current MVP state, the first Vercel deployment can apply the schema using:

```json
"build:vercel": "prisma generate && prisma db push && next build"
```

This is included in `package.json`.

Because this repo does not yet contain committed Prisma migrations, do one of these before going live:

1. Use `npm run build:vercel` as the temporary Vercel build command
2. Or generate and commit proper migrations, then switch to `prisma migrate deploy`

For a more production-safe setup later:

1. Create real Prisma migrations
2. Change the Vercel build command back to `npm run build`
3. Run migrations separately with `prisma migrate deploy`

## 6. First Production Values

Set:

- `NEXTAUTH_URL=https://your-project-name.vercel.app`

After you attach a custom domain, update `NEXTAUTH_URL` to that domain.

## 7. Redeploy

After environment variables are saved, trigger a redeploy from Vercel.

## 8. Seed Data

If you want demo data in production, run the seed once against the same production database:

```bash
npm run prisma:seed
```

Do this carefully and only after the schema exists.
