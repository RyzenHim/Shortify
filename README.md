# Shortify

Production-ready URL shortener built with NestJS, Next.js App Router, MongoDB, Mongoose, TypeScript, Redux Toolkit, TanStack Query, Axios, and Tailwind CSS.

## Features

- User registration and login
- Guest URL shortening without authentication
- JWT access and refresh token flow
- Google and GitHub OAuth strategy support
- Admin login with role-based guards
- Authenticated URL CRUD
- Public short URL redirect
- Consistent API response format: `{ success, message, data }`
- Global exception filter, Helmet, CORS, throttling, Swagger docs
- Responsive SaaS UI with dashboard, URL management, profile, settings, admin, 404, and 500 pages

## Project Structure

- `be/src/auth` - JWT, OAuth, auth controllers, strategies, and auth service
- `be/src/users` - user schema and user persistence service
- `be/src/urls` - URL schema, CRUD API, and redirect controller
- `be/src/admin` - admin-only API routes
- `be/src/common` - guards, decorators, filters, interceptors, pipes, shared types
- `fe/src/app` - Next.js App Router routes and layouts
- `fe/src/components` - reusable UI and layout components
- `fe/src/features` - auth and URL API/state modules
- `fe/src/lib` - API client and shared types
- `fe/src/store` - Redux Toolkit store

## Environment

Copy the examples and fill in real values:

```bash
cp be/.env.example be/.env
cp fe/.env.example fe/.env.local
```

Backend:

```bash
cd be
npm install
npm run start:dev
```

Frontend:

```bash
cd fe
npm install
npm run dev
```

Default URLs:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8080/api`
- Swagger: `http://localhost:8080/api/docs`

## API Overview

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/admin/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/auth/google`
- `POST /api/public/urls`
- `POST /api/urls`
- `GET /api/urls`
- `GET /api/urls/:id`
- `PATCH /api/urls/:id`
- `DELETE /api/urls/:id`
- `GET /api/:shortCode`
- `GET /api/admin/urls`
- `DELETE /api/admin/urls/:id`
- `GET /api/admin/users`
- `PATCH /api/admin/users/:id/disable`
- `PATCH /api/admin/users/:id/enable`

Guest users can shorten and copy links through `POST /api/public/urls`.
Saved history, custom aliases, editing, deleting, profile, settings, and analytics-style dashboard views require authentication.

## Quality Checks

```bash
cd be
npm run build
npm test -- --runInBand

cd ../fe
npm run lint
npx tsc --noEmit
```

## Deployment Notes

- Backend is Render-ready through `npm run build` and `npm run start:prod`.
- Frontend is Vercel-ready; set `NEXT_PUBLIC_API_URL` to the deployed backend `/api` URL.
- Use strong JWT secrets in production.
- Configure OAuth callback URLs to match deployed domains.
- Keep `.env` files out of source control.
