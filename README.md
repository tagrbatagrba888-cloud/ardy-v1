# ARDY V1 — Agricultural Investment Platform

Monorepo scaffold:
- `mobile`: Expo React Native user app (Arabic RTL).
- `api`: Node.js + Express + Prisma + PostgreSQL API.
- `admin`: lightweight Next.js-style admin UI (static React entry for V1 demo).

## Requirements
Node.js 20+, npm, PostgreSQL 15+.

## API
```bash
cd api
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

API runs on `http://localhost:4000`.

## Mobile
```bash
cd mobile
npm install
npx expo start
```

Set `EXPO_PUBLIC_API_URL` to the API URL if needed.

## Admin
```bash
cd admin
npm install
npm run dev
```

## Important
This is an engineering V1 foundation. Payment, KYC, e-signature, custody, regulated investment-unit issuance, and production authentication must be connected only through the licensed/approved entities and contracts applicable to the final Egyptian legal structure.


## Phone-only deployment
راجع `DEPLOY_FROM_PHONE.md`. التطبيق مصمم الآن ليعمل عبر Backend مستضاف بدل الاعتماد على localhost في هاتف المستخدم.
