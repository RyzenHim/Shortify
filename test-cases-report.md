# Shortify — Manual Test Cases Report

**Project:** Shortify URL Shortener (NestJS backend + Next.js frontend)
**Generated:** June 29, 2026
**Purpose:** Manual QA checklist — test each scenario and mark **Pass** or **Fail**

---

## How to Use This Document

Start backend (`be/`, port 8080) and frontend (`fe/`, port 3000) with MongoDB running.

Work through sections in order for first-time setup; otherwise test by area.

Mark **Result** column: `Pass`, `Fail`, or `N/A`.

Add notes in **Comments** for failures (screenshot, error message, steps to reproduce).

---

## Legend

| Column       | Description                                        |
| ------------ | -------------------------------------------------- |
| **ID**       | Unique test case identifier                        |
| **Priority** | P1 = critical, P2 = important, P3 = nice-to-have   |
| **Type**     | UI = frontend, API = backend only, E2E = full flow |
| **Result**   | Pass / Fail / N/A                                  |
| **Comments** | Notes, bug ID, actual vs expected                  |

---

## 1. Environment & Application Bootstrap

| ID     | Priority | Type | Test Case                                  | Steps (detailed)                                                                                                                                                                                                                                                                                    | Expected Result                                                                                  | Result | Comments |
| ------ | -------- | ---- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------ | -------- |
| ENV-01 | P1       | API  | Backend starts with valid`.env`            | 1) Create`be/.env` (copy from `be/.env.example` or fill required vars). 2) Ensure `MONGODB_URI` (or `URI`) is set. 3) Ensure `JWT_ACCESS_SECRET` + `JWT_REFRESH_SECRET` are set (or accept defaults). 4) Start backend: `cd be && npm run start:dev`. 5) Wait for “Server is running on port 8080”. | Server starts successfully without crashing;`/api/docs` is reachable.                            | Passed |          |
| ENV-02 | P1       | API  | Backend rejects missing MongoDB URI        | 1) Temporarily unset/empty`MONGODB_URI` and `URI` in `be/.env`. 2) Restart backend. 3) Observe startup logs.                                                                                                                                                                                        | Nest fails during config validation with message “MONGODB_URI or URI is required”.               |        |          |
| ENV-03 | P2       | API  | Swagger docs available                     | 1) Start backend. 2) Open browser to`http://localhost:8080/api/docs`. 3) Verify endpoints list includes `/api/auth/*`, `/api/public/urls`, `/api/urls/*`, `/api/admin/*`.                                                                                                                           | Swagger UI loads; interactive “Try it out” works (where auth is required, UI shows bearer auth). |        |          |
| ENV-04 | P1       | UI   | Frontend starts                            | 1) Create`fe/.env.local`. 2) Ensure `NEXT_PUBLIC_API_URL` points to backend `/api`. 3) Start frontend: `cd fe && npm run dev`. 4) Open `http://localhost:3000`.                                                                                                                                     | Frontend loads and route changes work (no runtime crash).                                        |        |          |
| ENV-05 | P2       | API  | Root/health endpoint returns expected text | 1) Start backend. 2) Call`GET http://localhost:8080/api/` or `GET /` depending on server prefixing.                                                                                                                                                                                                 | Response body equals “Hello World!” (as implemented in`AppController`).                          |        |          |
| ENV-06 | P2       | API  | CORS allows frontend origin                | 1) With frontend running, open DevTools → Network. 2) Perform a guest shorten request from UI. 3) Confirm backend responds without CORS errors.                                                                                                                                                     | Requests succeed; no browser CORS error for the configured`FRONTEND_URL`.                        |        |          |

---

## 2. Public Home Page — Guest URL Shortening

| ID      | Priority | Type | Test Case                                      | Steps                                                                    | Expected Result                                                         | Result | Comments |
| ------- | -------- | ---- | ---------------------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------- | ------ | -------- |
| HOME-01 | P1       | UI   | Shorten valid HTTPS URL (guest)                | Go to`/`, enter `https://example.com/page`, click **Shorten URL**        | Short link displayed; toast "Short URL ready"                           |        |          |
| HOME-02 | P1       | UI   | Copy short URL (guest)                         | After HOME-01, click**Copy**                                             | Toast "Copied"; clipboard has short URL                                 |        |          |
| HOME-03 | P1       | E2E  | Guest redirect works                           | Open short URL in browser (`/api/{code}`)                                | 302 redirect to original URL; click count increments                    |        |          |
| HOME-04 | P1       | UI   | Shorten same URL twice while logged out        | As guest, shorten URL, click**Shorten URL** again without changing input | Second short link created successfully; no validation error             |        |          |
| HOME-05 | P2       | UI   | URL without protocol auto-normalized           | Enter`example.com/path`, submit                                          | URL accepted;`https://` prepended server-side                           |        |          |
| HOME-06 | P2       | UI   | URL with trailing spaces                       | Enter`https://example.com ` (trailing space), submit                     | URL accepted after trim/normalize                                       |        |          |
| HOME-07 | P1       | UI   | Invalid URL rejected                           | Enter`not-a-url`, submit                                                 | Error "Enter a valid URL" shown; no API call or toast error             |        |          |
| HOME-08 | P2       | UI   | Empty URL rejected                             | Leave field empty, submit                                                | Error "Enter a valid URL"                                               |        |          |
| HOME-09 | P2       | UI   | Marketing sections render                      | Scroll home page                                                         | Hero, features, and CTA sections visible                                |        |          |
| HOME-10 | P2       | UI   | Navbar links work                              | Click Dashboard, Login                                                   | Navigate to correct routes                                              |        |          |
| HOME-11 | P1       | UI   | Shorten while logged in uses authenticated API | Login, go to`/`, shorten URL                                             | Toast "Short URL created"; link saved to account (visible in dashboard) |        |          |
| HOME-12 | P1       | UI   | Shorten same URL twice while logged in (home)  | Login, shorten URL on home, click**Shorten URL** again                   | Second link created; no "Enter a valid URL" error                       |        |          |
| HOME-13 | P2       | UI   | Input value persists after success             | After shorten, check input field                                         | Original destination URL remains in input (allows re-submit)            |        |          |

---

## 3. Authentication — Registration

| ID     | Priority | Type | Test Case                     | Steps                                                     | Expected Result                                                   | Result | Comments |
| ------ | -------- | ---- | ----------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------- | ------ | -------- |
| REG-01 | P1       | UI   | Register with valid data      | `/auth/register`: name ≥2 chars, valid email, password ≥8 | Account created; toast "Account created"; redirect to`/dashboard` |        |          |
| REG-02 | P1       | API  | Register duplicate email      | POST`/api/auth/register` with existing email              | 409: "An account with this email already exists"                  |        |          |
| REG-03 | P1       | UI   | Register — name too short     | Name = "A"                                                | Client error: name min 2 characters                               |        |          |
| REG-04 | P1       | UI   | Register — invalid email      | Email = "bad-email"                                       | Client error: valid email required                                |        |          |
| REG-05 | P1       | UI   | Register — password too short | Password = "1234567"                                      | Client error: password min 8 characters                           |        |          |
| REG-06 | P2       | UI   | Register page link to login   | Click "Login" link                                        | Navigates to`/auth/login`                                         |        |          |
| REG-07 | P2       | API  | Email stored lowercase        | Register with`User@Test.com`                              | Email saved as lowercase in DB/response                           |        |          |

---

## 4. Authentication — Login & Logout

| ID      | Priority | Type | Test Case                            | Steps                                            | Expected Result                                                                | Result | Comments |
| ------- | -------- | ---- | ------------------------------------ | ------------------------------------------------ | ------------------------------------------------------------------------------ | ------ | -------- |
| AUTH-01 | P1       | UI   | Login with valid credentials         | `/auth/login` with registered user               | Toast "Welcome back"; redirect to`/dashboard`; session in localStorage         |        |          |
| AUTH-02 | P1       | UI   | Login — unknown email                | Use unregistered email                           | Error toast; field error on email if message contains "email"                  |        |          |
| AUTH-03 | P1       | UI   | Login — wrong password               | Valid email, wrong password                      | Error toast; field error on password                                           |        |          |
| AUTH-04 | P1       | API  | Login — Google account with password | Login to Google-only account with email/password | 401: "This account uses Google sign-in..."                                     |        |          |
| AUTH-05 | P1       | API  | Login — disabled account             | Login as disabled user                           | 401: "This account has been disabled..."                                       |        |          |
| AUTH-06 | P2       | UI   | `/auth` redirects to login           | Visit`/auth`                                     | Redirects to`/auth/login`                                                      |        |          |
| AUTH-07 | P1       | UI   | Logout clears session                | Click**Logout** in dashboard                     | Redirect to login; localStorage tokens cleared;`/dashboard` redirects to login |        |          |
| AUTH-08 | P2       | UI   | Forgot password link                 | Click "Forgot Password?" on login                | **Known gap:** `/auth/forgot-password` page does not exist (404)               |        |          |
| AUTH-09 | P2       | UI   | Protected route without token        | Visit`/dashboard` logged out                     | Redirect to`/auth/login`                                                       |        |          |
| AUTH-10 | P2       | UI   | Session persists on page refresh     | Login, refresh dashboard                         | User remains logged in                                                         |        |          |

---

## 5. Authentication — Admin Login (API)

| ID          | Priority | Type | Test Case                     | Steps                                              | Expected Result                                 | Result | Comments |
| ----------- | -------- | ---- | ----------------------------- | -------------------------------------------------- | ----------------------------------------------- | ------ | -------- |
| ADM-AUTH-01 | P1       | API  | Admin login with admin user   | POST`/api/auth/admin/login` with admin credentials | 200; tokens returned                            |        |          |
| ADM-AUTH-02 | P1       | API  | Admin login with regular user | POST`/api/auth/admin/login` with user role         | 401: "This account does not have admin access." |        |          |

---

## 6. Authentication — Token Refresh & Session

| ID     | Priority | Type | Test Case                             | Steps                                                                   | Expected Result                                                                              | Result | Comments |
| ------ | -------- | ---- | ------------------------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------ | -------- |
| TOK-01 | P1       | API  | Refresh with valid token              | POST`/api/auth/refresh` with valid userId + refreshToken                | New access + refresh tokens returned                                                         |        |          |
| TOK-02 | P1       | API  | Refresh with invalid token            | POST with wrong refresh token                                           | 401: "Invalid refresh token"                                                                 |        |          |
| TOK-03 | P2       | E2E  | Auto-refresh on 401                   | Wait for access token expiry (or simulate), make authenticated API call | Request retried after refresh; succeeds                                                      |        |          |
| TOK-04 | P2       | E2E  | Refresh failure clears session        | Invalidate refresh token, trigger API call                              | Session cleared from localStorage                                                            |        |          |
| TOK-05 | P2       | API  | Logout clears refresh hash            | POST`/api/auth/logout` with JWT                                         | Refresh token invalidated server-side                                                        |        |          |
| TOK-06 | P3       | UI   | Frontend logout does not call backend | Logout via UI; check network tab                                        | **Known gap:** only localStorage cleared; server refresh token may remain valid until expiry |        |          |
| TOK-07 | P2       | API  | GET`/api/auth/me`                     | Call with valid JWT                                                     | Returns`{ sub, email, role }`                                                                |        |          |
| TOK-08 | P1       | API  | Protected endpoint without JWT        | Call`GET /api/urls` without token                                       | 401 Unauthorized                                                                             |        |          |

---

## 7. Authentication — Google OAuth

| ID       | Priority | Type | Test Case                              | Steps                                                                       | Expected Result                                                           | Result | Comments |
| -------- | -------- | ---- | -------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ------ | -------- |
| OAUTH-01 | P1       | E2E  | Google sign-in flow                    | Click "Continue with Google" (if button present) or visit`/api/auth/google` | Redirect to Google; on success redirect to`/auth/callback` then dashboard |        |          |
| OAUTH-02 | P1       | UI   | OAuth callback success                 | Complete Google login                                                       | Toast "Signed in with Google"; session stored                             |        |          |
| OAUTH-03 | P1       | UI   | OAuth callback missing params          | Visit`/auth/callback` without query params                                  | Toast error; redirect to login                                            |        |          |
| OAUTH-04 | P2       | UI   | OAuth callback invalid user JSON       | Visit with malformed`user` param                                            | Toast error; redirect to login                                            |        |          |
| OAUTH-05 | P2       | E2E  | Existing email links to Google account | Google login with email already registered locally                          | No duplicate account; user logged in                                      |        |          |
| OAUTH-06 | P3       | UI   | GitHub OAuth                           | Check login/register for GitHub button                                      | **Known gap:** not implemented (README mentions it)                       |        |          |

---

## 8. Dashboard — Overview

| ID      | Priority | Type | Test Case                              | Steps                               | Expected Result                                   | Result | Comments |
| ------- | -------- | ---- | -------------------------------------- | ----------------------------------- | ------------------------------------------------- | ------ | -------- |
| DASH-01 | P1       | UI   | Dashboard loads for authenticated user | Login, visit`/dashboard`            | Welcome message, stats cards, recent URLs section |        |          |
| DASH-02 | P1       | UI   | Stats show correct totals              | Create URLs with known click counts | Total URLs, Total Clicks, Active Links match data |        |          |
| DASH-03 | P2       | UI   | Recent URLs list (max 5)               | Create 6+ URLs                      | Only 5 most recent shown                          |        |          |
| DASH-04 | P2       | UI   | Copy from recent URLs                  | Click copy on a recent URL          | Toast "Copied"                                    |        |          |
| DASH-05 | P2       | UI   | Empty state                            | New user with no URLs               | "No URLs yet" message shown                       |        |          |
| DASH-06 | P2       | UI   | New URL button                         | Click**New URL**                    | Navigates to`/dashboard/urls`                     |        |          |
| DASH-07 | P2       | UI   | View all link                          | Click**View all**                   | Navigates to`/dashboard/urls`                     |        |          |
| DASH-08 | P2       | UI   | Loading skeletons                      | Slow network / first load           | Skeleton placeholders shown while loading         |        |          |

---

## 9. URL Management — Create (Authenticated)

| ID       | Priority | Type | Test Case                                  | Steps                                                                              | Expected Result                                                                   | Result | Comments |
| -------- | -------- | ---- | ------------------------------------------ | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------ | -------- |
| URL-C-01 | P1       | UI   | Create URL with destination only           | `/dashboard/urls`: enter `https://example.com`, submit                             | Toast "Short URL created"; URL appears in list                                    |        |          |
| URL-C-02 | P1       | UI   | Create same URL twice (dashboard)          | Create URL, click**Create short URL** again without changing destination           | Second URL created; no "Enter a valid URL" error; destination field retains value |        |          |
| URL-C-03 | P1       | UI   | Create with title                          | Add title "Campaign Q2", submit                                                    | URL saved with title displayed in list                                            |        |          |
| URL-C-04 | P1       | UI   | Create with custom alias                   | Custom alias`my-link-2026`, submit                                                 | Short code uses custom alias                                                      |        |          |
| URL-C-05 | P1       | API  | Duplicate custom alias                     | Create two URLs with same`customCode`                                              | Second returns 409: "This short code is already in use"                           |        |          |
| URL-C-06 | P1       | UI   | Custom alias too short                     | Alias = "abc" (3 chars)                                                            | Validation/API error: min 4 characters                                            |        |          |
| URL-C-07 | P1       | UI   | Custom alias invalid characters            | Alias = "my link!"                                                                 | Error: only letters, numbers,`_`, `-`                                             |        |          |
| URL-C-08 | P2       | UI   | Custom alias too long                      | Alias > 32 chars                                                                   | Validation error                                                                  |        |          |
| URL-C-09 | P2       | UI   | Title max length                           | Title > 80 chars                                                                   | Validation error or truncated per schema                                          |        |          |
| URL-C-10 | P1       | UI   | Invalid destination URL                    | Enter`not-valid`                                                                   | Field error "Enter a valid URL"                                                   |        |          |
| URL-C-11 | P2       | UI   | URL without protocol                       | Enter`example.com`                                                                 | Accepted; normalized to`https://example.com`                                      |        |          |
| URL-C-12 | P2       | UI   | Title and custom code cleared after create | Create with title + alias                                                          | After success, title and alias fields empty; destination retained                 |        |          |
| URL-C-13 | P1       | API  | Create without auth                        | POST`/api/urls` without JWT                                                        | 401 Unauthorized                                                                  |        |          |
| URL-C-14 | P2       | API  | Auto-generated short code format           | Create without custom code                                                         | 7-char unique code generated                                                      |        |          |
| URL-C-15 | P2       | UI   | Duplicate original URLs allowed            | Create two entries with same`originalUrl`                                          | Both succeed with different short codes                                           |        |          |
| URL-C-16 | P1       | UI   | Destination rejects private IP             | Enter`http://127.0.0.1/secret` and submit                                          | Validation error: local/private addresses can't be shortened                      |        |          |
| URL-C-17 | P1       | UI   | Destination rejects localhost hostname     | Enter`http://localhost/test` and submit                                            | Validation error: local/private addresses can't be shortened                      |        |          |
| URL-C-18 | P1       | UI   | Destination rejects non-http(s) scheme     | Enter`ftp://example.com/resource` and submit                                       | Validation error: only http:// and https:// supported                             |        |          |
| URL-C-19 | P2       | UI   | Destination trims leading/trailing spaces  | Enter`https://example.com/page` and submit                                         | URL accepted after trim/normalize                                                 |        |          |
| URL-C-20 | P1       | UI   | Custom alias underscores allowed           | Set`customCode = my_alias_1` and submit                                            | Alias accepted; short code matches alias                                          |        |          |
| URL-C-21 | P1       | UI   | Custom alias rejects leading hyphen        | Set`customCode = -myalias` and submit                                              | Validation error: can't start/end with a hyphen                                   |        |          |
| URL-C-22 | P1       | UI   | Custom alias rejects trailing hyphen       | Set`customCode = myalias-` and submit                                              | Validation error: can't start/end with a hyphen                                   |        |          |
| URL-C-23 | P1       | UI   | Custom alias rejects consecutive hyphens   | Set`customCode = my--alias` and submit                                             | Validation error: consecutive hyphens aren't allowed                              |        |          |
| URL-C-24 | P1       | API  | Custom alias length > 32 rejected (server) | Use`customCode` length 33–50 (e.g. `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`) and submit | 400/409/validation error: server enforces max 32 characters (Zod shortCodeSchema) |        |          |
| URL-C-25 | P2       | UI   | Custom alias rejects invalid characters    | Set`customCode = my$alias` and submit                                              | Validation error: only letters, numbers,`_`, and `-` allowed (server/frontend)    |        |          |

---

## 10. URL Management — List, Search & Filter

| ID       | Priority | Type | Test Case                 | Steps                                              | Expected Result                 | Result | Comments |
| -------- | -------- | ---- | ------------------------- | -------------------------------------------------- | ------------------------------- | ------ | -------- |
| URL-L-01 | P1       | UI   | URL list loads            | Visit`/dashboard/urls`                             | All user's URLs displayed       |        |          |
| URL-L-02 | P2       | UI   | Search by title           | Search partial title                               | Matching URLs shown             |        |          |
| URL-L-03 | P2       | UI   | Search by short code      | Search short code                                  | Matching URL shown              |        |          |
| URL-L-04 | P2       | UI   | Search by original URL    | Search destination URL text                        | Matching URLs shown             |        |          |
| URL-L-05 | P2       | UI   | Filter active links       | Set filter to**Active**                            | Only active URLs shown          |        |          |
| URL-L-06 | P2       | UI   | Filter inactive links     | Set filter to**Inactive**                          | Only inactive URLs shown        |        |          |
| URL-L-07 | P2       | UI   | No matches empty state    | Search nonsense string                             | "No links match this view."     |        |          |
| URL-L-08 | P2       | API  | Pagination defaults       | GET`/api/urls`                                     | page=1, limit=20, correct total |        |          |
| URL-L-09 | P3       | API  | Pagination limit clamping | GET with limit=200                                 | Limit capped at 100             |        |          |
| URL-L-10 | P1       | API  | User sees only own URLs   | User A and User B each create URLs; list as User A | Only User A's URLs returned     |        |          |

---

## 11. URL Management — Edit

| ID       | Priority | Type | Test Case               | Steps                             | Expected Result                           | Result | Comments |
| -------- | -------- | ---- | ----------------------- | --------------------------------- | ----------------------------------------- | ------ | -------- |
| URL-E-01 | P1       | UI   | Open edit modal         | Click pencil icon on a URL        | Edit modal opens with current values      |        |          |
| URL-E-02 | P1       | UI   | Update destination URL  | Change destination, save          | Toast "URL updated"; list reflects change |        |          |
| URL-E-03 | P1       | UI   | Update title            | Change title, save                | Title updated in list                     |        |          |
| URL-E-04 | P1       | UI   | Deactivate link         | Uncheck "Active short link", save | URL marked Inactive; redirect returns 404 |        |          |
| URL-E-05 | P1       | UI   | Reactivate link         | Re-enable active toggle, save     | URL marked Active; redirect works again   |        |          |
| URL-E-06 | P1       | UI   | Reset click count       | Check "Reset click count", save   | Clicks set to 0                           |        |          |
| URL-E-07 | P2       | UI   | Close edit modal        | Click X or cancel area            | Modal closes without saving               |        |          |
| URL-E-08 | P1       | UI   | Invalid URL in edit     | Enter invalid URL, save           | Field error "Enter a valid URL"           |        |          |
| URL-E-09 | P1       | API  | Edit another user's URL | PATCH`/api/urls/{otherUserId}`    | 403: "You do not have access to this URL" |        |          |
| URL-E-10 | P1       | API  | Edit non-existent URL   | PATCH with invalid MongoDB id     | 404: "URL not found"                      |        |          |

---

## 12. URL Management — Delete

| ID       | Priority | Type | Test Case                       | Steps                              | Expected Result                            | Result | Comments |
| -------- | -------- | ---- | ------------------------------- | ---------------------------------- | ------------------------------------------ | ------ | -------- |
| URL-D-01 | P1       | UI   | Delete confirmation modal       | Click trash icon                   | Confirmation modal with URL details        |        |          |
| URL-D-02 | P1       | UI   | Cancel delete                   | Open modal, click Cancel           | Modal closes; URL remains                  |        |          |
| URL-D-03 | P1       | UI   | Confirm delete                  | Click**Delete URL**                | Toast "URL deleted"; URL removed from list |        |          |
| URL-D-04 | P1       | E2E  | Deleted URL no longer redirects | Delete URL, visit old short link   | 404 "Short URL not found"                  |        |          |
| URL-D-05 | P1       | API  | Delete without auth             | DELETE`/api/urls/{id}` without JWT | 401                                        |        |          |
| URL-D-06 | P1       | API  | Delete another user's URL       | DELETE as wrong user               | 403                                        |        |          |

---

## 13. Redirect & Click Analytics

| ID     | Priority | Type | Test Case                                    | Steps                              | Expected Result                               | Result | Comments |
| ------ | -------- | ---- | -------------------------------------------- | ---------------------------------- | --------------------------------------------- | ------ | -------- |
| RED-01 | P1       | E2E  | Active URL redirects                         | Visit`{API_BASE}/api/{shortCode}`  | 302 to original URL                           |        |          |
| RED-02 | P1       | E2E  | Click count increments                       | Visit short URL multiple times     | `clicks` increases in dashboard               |        |          |
| RED-03 | P1       | API  | Unknown short code                           | GET`/api/nonexistent123`           | 404: "Short URL not found"                    |        |          |
| RED-04 | P1       | E2E  | Inactive URL does not redirect               | Deactivate URL, visit short link   | 404; no redirect                              |        |          |
| RED-05 | P2       | E2E  | Guest URL redirect                           | Create guest URL, visit short link | Redirect works; clicks increment              |        |          |
| RED-06 | P2       | UI   | Dashboard click totals update                | After redirects, refresh dashboard | Total Clicks stat updated                     |        |          |
| RED-07 | P3       | API  | Route does not intercept multi-segment paths | GET`/api/auth/google`              | OAuth route works (not treated as short code) |        |          |

---

## 14. Profile

| ID      | Priority | Type | Test Case                              | Steps                                               | Expected Result                                            | Result | Comments |
| ------- | -------- | ---- | -------------------------------------- | --------------------------------------------------- | ---------------------------------------------------------- | ------ | -------- |
| PROF-01 | P1       | UI   | Profile page displays user info        | Visit`/dashboard/profile`                           | Name, email, role, provider shown                          |        |          |
| PROF-02 | P1       | UI   | Edit profile name                      | Click Edit, change name, save                       | Toast "Profile updated"; name updated                      |        |          |
| PROF-03 | P1       | UI   | Profile name validation                | Name = "A"                                          | Error: min 2 characters                                    |        |          |
| PROF-04 | P2       | UI   | Email and role read-only               | Try editing email/role fields                       | Fields read-only                                           |        |          |
| PROF-05 | P1       | UI   | Change password (local account)        | Reset password modal: valid current + new + confirm | Toast "Password updated successfully"                      |        |          |
| PROF-06 | P1       | UI   | Wrong current password                 | Enter wrong current password                        | Error toast                                                |        |          |
| PROF-07 | P1       | UI   | Password confirm mismatch              | New ≠ confirm                                       | Error "New passwords do not match"                         |        |          |
| PROF-08 | P1       | UI   | Google account — no password reset     | Login via Google, visit profile                     | Password reset button hidden; message about Google sign-in |        |          |
| PROF-09 | P2       | API  | Google account password change blocked | PATCH`/api/auth/password` as Google user            | 400: Google accounts message                               |        |          |

---

## 15. Settings — Theme & Preferences

| ID     | Priority | Type | Test Case                         | Steps                                                | Expected Result                               | Result | Comments |
| ------ | -------- | ---- | --------------------------------- | ---------------------------------------------------- | --------------------------------------------- | ------ | -------- |
| SET-01 | P1       | UI   | Switch to light theme             | Settings → Light                                     | UI switches to light mode immediately         |        |          |
| SET-02 | P1       | UI   | Switch to dark theme              | Settings → Dark                                      | UI switches to dark mode                      |        |          |
| SET-03 | P1       | UI   | Change accent color               | Select each accent (teal, blue, violet, rose, amber) | Accent applied to buttons, links, focus rings |        |          |
| SET-04 | P1       | UI   | Preferences persist after refresh | Change theme/accent, refresh page                    | Preferences restored                          |        |          |
| SET-05 | P2       | E2E  | Preferences sync to account       | Change theme while logged in, re-login               | Preferences loaded from server profile        |        |          |
| SET-06 | P2       | UI   | Save current preferences button   | Click**Save current preferences**                    | Toast "Preferences saved"                     |        |          |
| SET-07 | P2       | API  | Invalid theme value               | PATCH preferences with invalid theme                 | 400 validation error                          |        |          |
| SET-08 | P2       | API  | Invalid accent value              | PATCH with invalid accentColor                       | 400 validation error                          |        |          |

---

## 16. Admin Dashboard

| ID     | Priority | Type | Test Case                             | Steps                                           | Expected Result                                  | Result | Comments |
| ------ | -------- | ---- | ------------------------------------- | ----------------------------------------------- | ------------------------------------------------ | ------ | -------- |
| ADM-01 | P1       | UI   | Admin sidebar link visible for admin  | Login as admin                                  | Admin nav item visible in sidebar                |        |          |
| ADM-02 | P2       | UI   | Admin sidebar hidden for regular user | Login as regular user                           | Admin nav item not shown                         |        |          |
| ADM-03 | P2       | UI   | Non-admin can open`/admin` page       | Regular user navigates to`/admin`               | Page loads but API calls return 403 toast errors |        |          |
| ADM-04 | P1       | UI   | Admin stats display                   | Login as admin, visit`/admin`                   | Total URLs, Guest URLs, Users counts shown       |        |          |
| ADM-05 | P1       | UI   | Search admin URLs                     | Search by short code, original URL, owner email | Filtered results shown                           |        |          |
| ADM-06 | P1       | UI   | Admin delete URL                      | Click delete on a URL                           | Toast "URL removed"; URL gone from list          |        |          |
| ADM-07 | P1       | UI   | Disable user                          | Click**Disable** on active user                 | User status shows Disabled                       |        |          |
| ADM-08 | P1       | UI   | Enable user                           | Click**Enable** on disabled user                | User status shows Active                         |        |          |
| ADM-09 | P1       | E2E  | Disabled user cannot login            | Disable user, attempt login                     | Login fails with disabled message                |        |          |
| ADM-10 | P1       | API  | Non-admin admin API access            | Regular user calls GET`/api/admin/urls`         | 403 Forbidden                                    |        |          |
| ADM-11 | P2       | UI   | Guest URL badge                       | View guest URL in admin list                    | "Guest" badge displayed                          |        |          |
| ADM-12 | P2       | API  | Admin delete non-existent URL         | DELETE invalid id                               | 404                                              |        |          |

---

## 17. Navigation & Layout

| ID     | Priority | Type | Test Case                    | Steps                                   | Expected Result                                | Result | Comments |
| ------ | -------- | ---- | ---------------------------- | --------------------------------------- | ---------------------------------------------- | ------ | -------- |
| NAV-01 | P2       | UI   | Dashboard sidebar navigation | Click Overview, URLs, Profile, Settings | Correct pages load; active state highlighted   |        |          |
| NAV-02 | P2       | UI   | Sidebar collapse/expand      | Toggle sidebar collapse (desktop)       | Sidebar width changes; icons remain accessible |        |          |
| NAV-03 | P2       | UI   | Mobile bottom nav            | Resize to mobile, use nav tabs          | All dashboard sections reachable               |        |          |
| NAV-04 | P2       | UI   | Navbar hidden on dashboard   | Visit dashboard routes                  | Public navbar not shown; dashboard shell used  |        |          |
| NAV-05 | P2       | UI   | Navbar shown on home         | Visit`/`                                | Public navbar visible                          |        |          |
| NAV-06 | P3       | UI   | 404 page                     | Visit`/unknown-route`                   | Custom not-found page renders                  |        |          |
| NAV-07 | P3       | UI   | Error page                   | Trigger runtime error (if possible)     | Error boundary page renders                    |        |          |

---

## 18. API Response Contract & Error Handling

| ID     | Priority | Type | Test Case                      | Steps                     | Expected Result                             | Result | Comments |
| ------ | -------- | ---- | ------------------------------ | ------------------------- | ------------------------------------------- | ------ | -------- |
| API-01 | P1       | API  | Success response shape         | Any successful API call   | `{ success: true, message, data }`          |        |          |
| API-02 | P1       | API  | Error response shape           | Trigger 400/401/404       | `{ success: false, message, data: null }`   |        |          |
| API-03 | P1       | API  | Zod validation errors as array | Send invalid body         | 400; message is array of validation strings |        |          |
| API-04 | P2       | API  | Unhandled server error         | Trigger 500 (if testable) | Generic: "Something went wrong..."          |        |          |
| API-05 | P2       | UI   | Frontend error toast           | Trigger API error from UI | Toast shows API message via`getApiMessage`  |        |          |

---

## 19. Security & Edge Cases

| ID     | Priority | Type | Test Case                         | Steps                                      | Expected Result                                           | Result | Comments |
| ------ | -------- | ---- | --------------------------------- | ------------------------------------------ | --------------------------------------------------------- | ------ | -------- |
| SEC-01 | P1       | API  | Passwords never returned in API   | Register/login; inspect user object        | No password or hash in response                           |        |          |
| SEC-02 | P2       | API  | Refresh token hash not exposed    | Inspect user API responses                 | refreshTokenHash not returned                             |        |          |
| SEC-03 | P2       | E2E  | Disabled user with valid JWT      | Disable user while logged in; use app      | **Known gap:** JWT still works until expiry               |        |          |
| SEC-04 | P3       | API  | Rate limiting                     | Send 100+ requests/min                     | **Known gap:** Throttler configured but guard not applied |        |          |
| SEC-05 | P2       | UI   | XSS in URL title display          | Create URL with title containing`<script>` | Script not executed; safely rendered                      |        |          |
| SEC-06 | P2       | API  | JWT required on all`/urls` routes | Test GET/POST/PATCH/DELETE without token   | All return 401                                            |        |          |

---

## 20. Regression — Duplicate URL Bug (Fixed)

| ID     | Priority | Type | Test Case                                   | Steps                                                                    | Expected Result                            | Result | Comments |
| ------ | -------- | ---- | ------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------ | ------ | -------- |
| BUG-01 | P1       | UI   | Logged-in dashboard: shorten same URL twice | Login →`/dashboard/urls` → create URL → click **Create short URL** again | Both succeed; no false "Enter a valid URL" |        |          |
| BUG-02 | P1       | UI   | Logged-in home: shorten same URL twice      | Login →`/` → shorten → shorten again                                     | Both succeed                               |        |          |
| BUG-03 | P2       | UI   | Guest vs logged-in parity                   | Same URL flow logged out on home vs logged in on dashboard               | Both allow duplicate original URLs         |        |          |

---

## Test Summary

| Section              | Total Cases |
| -------------------- | ----------- |
| Environment          | 6           |
| Home / Guest         | 13          |
| Registration         | 7           |
| Login & Logout       | 10          |
| Admin Login API      | 2           |
| Tokens & Session     | 8           |
| Google OAuth         | 6           |
| Dashboard Overview   | 8           |
| URL Create           | 20          |
| URL List/Search      | 10          |
| URL Edit             | 10          |
| URL Delete           | 6           |
| Redirect & Analytics | 7           |
| Profile              | 9           |
| Settings             | 8           |
| Admin Dashboard      | 12          |
| Navigation           | 7           |
| API Contract         | 5           |
| Security             | 6           |
| Regression (Bug Fix) | 3           |
| **TOTAL**            | **183**     |

---

## Sign-off

| Role     | Name | Date | Signature |
| -------- | ---- | ---- | --------- |
| Tester   |      |      |           |
| Reviewer |      |      |           |
