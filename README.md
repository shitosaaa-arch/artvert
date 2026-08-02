This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## PostgreSQL and Prisma

Sprint 3 uses PostgreSQL through Prisma ORM `6.19.2` and `@prisma/client` `6.19.2`. Use a supported external provider such as Neon or Prisma Postgres; Vercel's legacy Postgres product is not assumed.

Copy `.env.example`, use `AUTH_USER_DIRECTORY=json` only for local development, and set `AUTH_USER_DIRECTORY=prisma`, `DATABASE_URL`, and `DIRECT_URL` in production. Prisma mode fails closed when its database configuration is missing or unavailable.

Run `npm run db:validate`, `npm run db:generate`, and `npm run db:migrate` locally. Commit generated migration files, then run `npm run db:deploy` in production. Do not use `db push` for production migrations.

## Knowledge releases

Sprint 4 stores canonical knowledge envelopes in PostgreSQL and exports immutable, checksum-verified JSON releases. Local development uses `KNOWLEDGE_EXPORT_STORE=filesystem` under `data/generated/knowledge`; production must configure a real Blob export implementation before selecting Blob mode. The future Doctor engine consumes only the active generated JSON release through the knowledge reader, never PostgreSQL directly.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
