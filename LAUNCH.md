# Test launch (Vercel + Neon)

You do the accounts. Split is already wired: if `DATABASE_URL` is set, everything is saved in Neon. If it is not set, this laptop still uses the local file (demo only).

## 1. Neon (the notebook)

1. Sign up at https://neon.tech (GitHub login is fine) **or** add Neon from the Vercel Marketplace.
2. Create a project on the **Free** plan.
3. Copy the connection string (looks like `postgresql://...`).

## 2. Vercel (the always-on computer)

1. https://vercel.com → **Add New** → **Project** → import `split-om/Split-Website`.
2. Framework: Next.js. Root: leave default.
3. **Settings → Environment Variables** → add:

   `DATABASE_URL` = the Neon string (Production + Preview).

4. Deploy. You get a free URL like `https://split-website.vercel.app`.

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
