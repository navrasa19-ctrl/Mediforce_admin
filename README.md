# MediForce Health — Admin Dashboard

A fresh React + Vite web admin dashboard based on `MediForce_Admin_Dashboard_Developer_Handoff.md`.
It is a **web dashboard**, not an Android app. `app-release.apk` is the existing Flutter mobile application; this project does not modify it.

## Start locally

1. Install Node.js 18+ (Node 20+ recommended).
2. Extract this folder.
3. Open a terminal in this folder and run:

   ```bash
   npm install
   ```
4. Copy `.env.example` to `.env` and replace `VITE_API_BASE_URL` with the real backend host. The host was not included in the handoff, so it is intentionally not guessed.
5. Run:

   ```bash
   npm run dev
   ```

6. Open the local URL printed by Vite.

## Build

```bash
npm run build
npm run preview
```

## Included pages

- Admin Login (existing `POST /api/v1/auth/login`; no public signup)
- Overview (counts derived from documented list endpoints; no invented summary endpoint)
- Coordinator applications (pending/approved, accept/reject)
- Approver applications and management (pending/approved, create, responsibility, department scope, deactivate)
- Department and grade management (paginated department list, create, inspect mappings, add grades, rename)
- Employee compliance queue, detail, document review, bulk review and overall approval
- Employee onboarding

## API integration notes

- Uses `VITE_API_BASE_URL` and documented `/api/v1` routes.
- Protected calls use `Authorization: Bearer <accessToken>`.
- Login expects `tokens.accessToken` per the handoff. The response is handled defensively, but confirm the live response shape with the backend owner.
- No demo records are presented as live records. When the backend is not configured/reachable, pages show an error and setup hint.
- Employee onboarding uses the documented eligible-employee, department-registration, and department-dependent grade-registration lookup routes. The UI stores selected `_id` values and sends IDs to the existing onboarding endpoint. Confirm the updated backend revision is deployed before live verification.
- Document previews/downloads use the protected blob endpoint, not public storage paths.
- Browser localStorage is used for the access token to keep the starter simple. For production, prefer a secure HttpOnly cookie/session architecture if the backend supports it.

## Known setup requirement

You need the real backend URL and a provisioned Admin account. The APK alone does not provide the backend URL, API credentials, or a complete backend contract.
