# Fund Portal: setup (websites only, no terminal)

A read-only investor dashboard. Clients log in (no sign-up) and see balance, transaction history, profit by asset and date, holdings, and news. Everything is edited from `/admin`.

## 1. Supabase (database + login)

1. Go to supabase.com, then **New project**. Save the database password somewhere safe.
2. Open **SQL Editor → New query**, paste the full contents of `supabase/schema.sql`, and click **Run**.
3. Open **Authentication → Sign In / Providers** (or "Providers → Email") and turn **OFF** "Allow new users to sign up". This is what makes it login-only.
4. Open **Authentication → Users → Add user → Create new user**. Enter YOUR email and a password, and tick **Auto Confirm User**. This will be the admin.
5. Back in **SQL Editor**, run this (replace the email):
   ```sql
   update public.profiles set role = 'admin' where email = 'you@example.com';
   ```
6. Open **Project Settings → API** and copy the **Project URL** and the **anon public** key. You need them in step 3.

## 2. GitHub (code storage)

1. Unzip `fund-portal.zip` on your computer.
2. On github.com click **New repository**, name it, and create it.
3. Click **uploading an existing file** (or **Add file → Upload files**).
4. Open the unzipped folder and drag its **contents** (`src`, `supabase`, `index.html`, `package.json`, and the rest) into the page. Drag the files and folders inside, not the outer folder itself.
5. Click **Commit changes**.

## 3. Vercel (publishing)

1. On vercel.com choose **Add New → Project** and import the GitHub repo.
2. Framework should auto-detect as **Vite**. Leave the build settings alone.
3. Under **Environment Variables** add:
   - `VITE_SUPABASE_URL` = your Project URL
   - `VITE_SUPABASE_ANON_KEY` = your anon public key
4. Click **Deploy**.
5. When it finishes, copy the live address. In Supabase go to **Authentication → URL Configuration** and set **Site URL** to that address.

## 4. First use

1. Open your live site, then `/login`, and sign in with your admin email.
2. Go to `/admin` (there is an **Admin** button on your dashboard).
3. **Site & design**: set the firm name, logo, hero text and image, services, contact, disclaimer and colour palette, then click **Save site**.
4. **Clients**: add each client in Supabase under *Authentication → Users → Add user* (tick Auto Confirm). They then appear in Admin → Clients. Open one to set their name and add transactions and holdings.
5. **News**: publish articles. "Everyone" shows on the landing page; "Clients only" shows only inside client dashboards.

## How the numbers work

- Balance = deposits + profits − withdrawals − losses − fees.
- Enter every amount as a positive number and pick the type; the sign is applied automatically.
- "Profit" tab = all profit/loss entries with the asset and date they happened.
- Holdings are a separate "current positions" table you update by hand.

## Privacy policy, signed consent and visit logging

1. In Supabase **SQL Editor**, run these two files in order: `supabase/visit_logs.sql`, then `supabase/consent.sql`. (If you already ran an earlier `visit_logs.sql` with the banner version, just run `consent.sql`; it replaces the old insert rule.)
2. Upload the new files to GitHub; Vercel redeploys by itself. No new environment variables.
3. **Edit the policy** in Admin → Site & design → Privacy policy. It is a template with [brackets]; have a lawyer review it before go-live.
4. Clients have no sign-up. The first time a client logs in (after you create their account) they must read the policy, tick the box, type their full name as a signature, and press **Sign and continue**. They cannot reach their dashboard until they do. "Decline" signs them out.
5. The signature (name, date, policy version) is stored and shown in Admin → Clients. Changing the policy and ticking "make every client sign again" forces re-signing.
6. Visits are logged only for signed-in clients who have signed, and the database itself refuses logs from anyone else. View them in **Admin → Visits** (time, client, page, location, masked IP, timezone, language, device, OS, browser, screen) with filter and CSV export.
7. The policy is also public at `/privacy` and linked in the site footer and on the login page.

Location comes from Vercel's connection data (city-level, approximate) and works only on the live Vercel site. IPs are stored with the last part masked.

## Security notes

- Clients can only read their own rows. Only admin accounts can write. This is enforced in the database, not only in the screens.
- The anon key in the browser is meant to be public. Never put the Supabase `service_role` key into Vercel or GitHub.
- Password resets: Supabase → Authentication → Users → the user → send password recovery, or set a new password.
