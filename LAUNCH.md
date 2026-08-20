# Test launch (Vercel + Neon)

Live site: https://split-website-v86m.vercel.app/

Split is already wired: if `DATABASE_URL` (or `POSTGRES_URL`) is set, everything is saved in Neon. If it is not set, this laptop still uses the local file (demo only).

## 1. Add Neon on the live Vercel project (easiest)

1. Open the **v86m** project on Vercel (the one whose Visit link is `split-website-v86m.vercel.app`).
2. Open **Storage** → **Create Database** → **Neon** → Free plan → Create.
3. Vercel adds `DATABASE_URL` for you.
4. **Deployments** → latest → **⋯** → **Redeploy** (needed so the site picks up the notebook).

### Or create Neon yourself

1. https://neon.tech → sign up with GitHub → New project → Free.
2. Copy the connection string (`postgresql://...`).
3. Vercel project → **Settings → Environment Variables**.
4. Name: `DATABASE_URL`. Value: paste the string. Environments: Production **and** Preview.
5. Save, then **Redeploy**.

Check: https://split-website-v86m.vercel.app/api/health should show `"db": true`.

## 3. What to test on that URL

1. Open `/join` — sign up as a café.
2. Open `/hq` or `/join/applications` — tap **Approve**.
3. You will see a staff login: **name** + **password** and a link `/venue/your-cafe`.
4. Sign in → **Edit menu** (prices + photos) → **Print table QRs**.
5. Phone: scan a QR → order → pay.

Demo café still works: `/venue/qahwa`  
- Owner: **Aisha** / `owner123`  
- Waiter: **Noor** / `waiter123`

## 4. Update the site later

On this PC:

```
git add .
git commit -m "what you changed"
git push
```

Vercel rebuilds by itself. You do not edit the live site on Vercel.

## 5. Upgrade later

Same Neon project → paid plan. Data stays. No rebuild of Split required.
