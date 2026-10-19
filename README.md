# SAKJ Signature Café

A React + TypeScript café website with a responsive menu, online ordering, Supabase-backed admin login and dashboard, and a free Cloudflare Pages deployment setup. The website keeps the **SAKJ Signature Café** name regardless of its hosting address.

## Before publishing

Replace the sample café location and hours in `src/App.tsx` before launch. The eight café products and prices are defined in `src/lib/menu.ts` and `supabase/schema.sql`. The eight supplied product photos are kept as individual original PNGs in `public/menu/products/`; the square menu cards display them without cropping. Existing hero/story photos and fonts still load from third-party hosts.

The project has not been published by this repository. A hosting URL only exists after you create and deploy a Cloudflare Pages project; availability of `sakj-signature-cafe.pages.dev` cannot be reserved or guaranteed in advance.

## 1. Install and run the site locally

1. Install the current Node.js LTS release from [nodejs.org](https://nodejs.org/).
2. Open this project folder in Visual Studio Code.
3. In VS Code choose **Terminal → New Terminal**, then run:

   ```powershell
   npm.cmd install
   npm.cmd run dev
   ```

4. Open the local address printed in the terminal (normally `http://localhost:5173`). Press `Ctrl+C` in the terminal to stop the local server.

The public site can be previewed without Supabase; the eight-item SAKJ menu is shown. Orders and admin sign-in need Supabase configuration before they work.

## 2. Create the free Supabase database and admin account

1. Create an account at [supabase.com](https://supabase.com/) and create a project on the free plan. Choose a strong database password and save it securely. Supabase free projects may be paused after inactivity and have usage limits; check the current Supabase pricing and service terms before launch.
2. In the Supabase project open **SQL Editor → New query**.
3. Open this project's `supabase/schema.sql`, copy the whole file into the SQL Editor, and choose **Run**. This creates the menu, orders, and admin tables; enables row-level security; inserts the eight SAKJ menu items; and provides a database function that calculates order totals using current database prices.
4. Open **Authentication → Users → Add user**. Create the café administrator with an email and a strong password. Do not enable public sign-ups.
5. Open the new user's details and copy their **User UID**.
6. In **SQL Editor → New query**, replace `PASTE-USER-UID-HERE` in this statement with the copied UID, then run it:

   ```sql
   insert into public.admins (user_id)
   values ('PASTE-USER-UID-HERE');
   ```

   Only add trusted staff to `public.admins`. The dashboard checks this table, and database row-level security independently restricts admin data.
7. In Supabase open **Project Settings → API**. Copy the **Project URL** and the public **publishable key** (or legacy `anon` key). These are public browser values: never use or publish the `service_role` key in this website.
8. For local testing, copy `.env.example` to `.env.local` and fill in the two values:

   ```dotenv
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-public-publishable-or-anon-key
   ```

   In Windows PowerShell, restart with `npm.cmd run dev` after changing environment variables.

### Update an existing Supabase project

Before deploying this menu update, open **SQL Editor → New query**, copy the contents of `supabase/menu_migration.sql`, and choose **Run**. It updates the six existing sample product IDs, adds the two missing café products, and removes other menu rows so the public menu contains exactly these eight items. This changes menu rows only; order records and their saved item details are not changed. If you have added custom menu products that you want to keep, export them before running the migration.

### Product photographs

Each of the eight supplied drink photos is included individually under `public/menu/products/` in menu order. Their root-relative URLs are set in `src/lib/menu.ts`, `supabase/schema.sql`, and `supabase/menu_migration.sql`. The site uses the local product-photo path as a fallback if the Supabase row's `image_url` is blank. Run the migration when applying the menu update to store these photo paths in Supabase as well. No image-upload feature exists in the current admin dashboard.

### Careers and Instagram

The public recruitment page is available at `/careers`. It uses the supplied café/team photographs, lists the five open positions and eligibility information, and directs applications to Instagram. Applicants choose a position and are asked to mention it when messaging the café at [`@sakj_siganature_cafe`](https://www.instagram.com/sakj_siganature_cafe/). The same Instagram profile is linked from the site footer. There is no application form or hiring backend in this project.

## 3. Deploy on a free provider subdomain

Cloudflare Pages is the first choice for this static React/Vite site. Its free `pages.dev` subdomain includes HTTPS, supports SPA fallback through the included `public/_redirects`, and does not require purchasing a domain. Free-tier quotas and terms can change; verify Cloudflare's current Pages plan and that your intended commercial café use complies with its terms.

1. Create a [GitHub](https://github.com/) account if you do not already have one. Create a new **private** repository and upload/push the contents of this folder. Do not upload `.env.local` or any secret key. If you use git from the project terminal:

   ```powershell
   git init
   git add .
   git commit -m "Create SAKJ Signature Cafe website"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
   git push -u origin main
   ```

   Git may ask you to sign in to GitHub. If Git reports that this folder already has a repository, do not run `git init`; connect the existing repository instead.
2. Sign in to the [Cloudflare dashboard](https://dash.cloudflare.com/) and choose **Workers & Pages → Create application → Pages → Connect to Git**. Authorize GitHub, select the repository, and choose the `main` branch.
3. Set the build configuration:
   - Framework preset: **Vite**
   - Build command: `npm run build`
   - Build output directory: `dist`
4. Add the environment variables in the Pages project's **Settings → Variables and Secrets** for the **Production** environment:
   - `VITE_SUPABASE_URL` = your Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase publishable key (or legacy anon key)
5. Save the variables and start the first deployment. Vite embeds `VITE_` variables during the build, so a change to them requires a new deployment. Trigger **Retry deployment** or push a new commit after adding/changing them.
6. After Cloudflare reports **Success**, open the exact `https://....pages.dev` address shown in Pages. If the suggested project name is unavailable, choose another unique Pages project name, such as `sakj-signature-cafe-<your-city>`, and use the actual address Cloudflare assigns. `sakj-signature-cafe.pages.dev` is only a preference, not a reservation.
7. HTTPS is provided by Cloudflare for the assigned Pages hostname. Use the `https://` URL printed in the project overview as the live address.

Netlify is a reasonable free-tier alternative if you prefer it: import the same GitHub repository, use build command `npm run build`, publish directory `dist`, and configure the same two variables in **Site configuration → Environment variables**. The included `public/_redirects` file also supplies the SPA route fallback. Netlify assigns a `*.netlify.app` address; use that actual assigned address. Review current free plan limits and commercial-use terms for either provider.

## 4. Allow Supabase authentication from the live site

After Cloudflare deployment succeeds, copy its exact HTTPS address. In Supabase:

1. Open **Authentication → URL Configuration**.
2. Set **Site URL** to the actual deployed HTTPS origin, such as `https://your-assigned-name.pages.dev` (no path or trailing slash).
3. Add these **Redirect URLs**:
   - `https://your-assigned-name.pages.dev/**`
   - `http://localhost:5173/**` (for local testing)
4. Save. Replace `your-assigned-name` with the real assigned project name. Do the equivalent if using Netlify.

The public menu is at `/`. Staff sign-in is at `/admin/login`, and the protected dashboard is at `/admin`, all on the assigned hosting domain.

## 5. Test the actual deployed site

1. Open the actual `https://...pages.dev` URL in a private/incognito browser window. Confirm the SAKJ Signature Café home page and menu load.
2. Add a menu item, submit a test order with a phone number you can access, and check **Supabase → Table Editor → orders**. The admin dashboard should show it. Use a real café contact and remove/cancel any test orders before opening for business.
3. Visit `https://...pages.dev/admin/login`, sign in with the Supabase Auth user you created, and confirm the browser lands on `/admin`. Update the test order status and confirm it changes in Supabase.
4. Open `/admin` in a signed-out private browser window and confirm it redirects to `/admin/login`.
5. Try an unavailable menu item and a deliberately changed client-side total if testing; the database function only accepts currently available menu items and calculates its own prices.
6. If sign-in fails, check the Supabase Auth **Site URL/Redirect URLs**, the deployed environment-variable names/values, and whether you redeployed after setting them. If the dashboard shows no orders, confirm the SQL ran and that your admin's user UID is in `public.admins`.

Orders placed online are saved for staff to confirm; this starter does not take online payments, calculate taxes/delivery, or promise real-time inventory locking. Confirm availability, pickup/delivery details, applicable taxes, privacy obligations, and local food-business rules before accepting customers. Supabase and hosting free tiers have quotas, support limitations, and service terms: monitor usage and budget for a paid plan if the café outgrows them.

## Submit the site to Google Search Console

After deploying, add the URL-prefix property `https://sakj-signature-cafe.pages.dev/` in [Google Search Console](https://search.google.com/search-console/), complete Google's ownership verification, and submit `https://sakj-signature-cafe.pages.dev/sitemap.xml` under **Sitemaps**. The deployed `robots.txt` also points crawlers to this sitemap. If the hosting address changes, update both files before deploying.

## Connect a custom domain later

You do not need `signature.cafe` or any custom domain to launch. If you later acquire a domain, add it in Cloudflare Pages **Custom domains**, follow Cloudflare's DNS instructions, and then update the Supabase Site URL and Redirect URLs to include the new HTTPS domain. Keep the Pages hostname as a fallback if you wish.
