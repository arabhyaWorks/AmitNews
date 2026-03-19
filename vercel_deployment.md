# Samachar Group - Vercel Deployment Guide

Deploying the Samachar platform requires setting up two separate projects on Vercel: one for the Express API backend and one for the React frontend. Both will pull from the same central GitHub repository.

---

## Part 1: Prepare Your Code
1. Ensure your entire `Samachar` folder (which contains the `frontend` and `backend` subdirectories) is pushed to a single GitHub Repository.
2. Ensure you have your NeonDB Database URL and any other API secrets ready.

---

## Part 2: Deploy the Backend (Express API)
1. Go to your [Vercel Dashboard](https://vercel.com/dashboard) and click **"Add New Project"**.
2. Connect your GitHub account and import your `Samachar` repository.
3. In the "Configure Project" menu:
   - **Root Directory:** Click "Edit" and type `backend`. Click Save.
   - **Framework Preset:** Leave as `Other`.
   - **Environment Variables:** Paste in everything from your backend `.env` file (e.g., `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGINS`). For `CORS_ORIGINS`, you can set it to `*` initially, or update it later once your frontend has a live URL.
4. Click **Deploy**. 
5. Vercel will launch your backend as Serverless Functions (using the `vercel.json` file we created).
6. **Save the Backend URL**: Once deployed, copy the exact live URL (e.g., `https://samachar-api.vercel.app`). Make sure it **does not** have a trailing slash (`/`) at the end.

---

## Part 3: Deploy the Frontend (React App)
1. Go back to your [Vercel Dashboard](https://vercel.com/dashboard) and click **"Add New Project"**.
2. Import the exact same `Samachar` GitHub repository again.
3. In the "Configure Project" menu:
   - **Root Directory:** Click "Edit" and type `frontend`. Click Save.
   - **Framework Preset:** Let Vercel auto-detect it as `Create React App`.
   - **Environment Variables:** Add the following variable:
     - **Name:** `REACT_APP_BACKEND_URL`
     - **Value:** *(Paste the live backend URL you copied from Part 2)*
4. Click **Deploy**.

---

## Part 4: Finalizing Security (Optional but Recommended)
Once your frontend is live, it will have a URL like `https://samachar-group.vercel.app`. 
1. Go back to your **Backend Project** settings in Vercel.
2. Under **Environment Variables**, find `CORS_ORIGINS`.
3. Change its value from `*` to your new Frontend URL (e.g., `https://samachar-group.vercel.app`).
4. **Redeploy** the backend to lock down API access exclusively to your frontend application.

Your website is now securely live and SEO optimized!
