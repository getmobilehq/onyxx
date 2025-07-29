# ONYX Frontend Deployment on Render

## Quick Deploy Steps:

### 1. Create Static Site in Render Dashboard

1. **Go to Render Dashboard** → **New** → **Static Site**
2. **Connect GitHub repository**: `getmobilehq/onyxx`
3. **Configure build settings**:
   - **Name**: `onyx-frontend` (or your preference)
   - **Branch**: `main`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

### 2. Add Environment Variable

Add this single environment variable:
```
VITE_API_URL=https://onyx-backend-f7vh.onrender.com/api
```

### 3. Deploy

Click **Create Static Site** and wait for the build to complete.

## 🔒 Security Headers (Optional)

After deployment, you can add custom headers in Render:

1. Go to **Settings** → **Redirects/Rewrites**
2. Add a rewrite rule:
   - **Source**: `/*`
   - **Destination**: `/index.html`
   - **Type**: Rewrite

3. Go to **Settings** → **Headers**
4. Add security headers:
   - `X-Frame-Options: DENY`
   - `X-Content-Type-Options: nosniff`
   - `Referrer-Policy: strict-origin-when-cross-origin`

## 📱 Expected Result:

Once deployed, you'll get a URL like:
```
https://onyx-frontend.onrender.com
```

You should be able to:
1. Access the login page
2. Login with `admin@onyx.com` / `password123`
3. Navigate through the dashboard
4. Create buildings and assessments

## 🚨 Troubleshooting:

**Blank page or routing issues?**
- Make sure the rewrite rule is set up (/* → /index.html)

**API connection errors?**
- Verify VITE_API_URL is set correctly
- Check browser console for CORS errors
- Ensure backend DATABASE_URL is fixed

**Build failures?**
- Check if all dependencies are in package.json
- Look at build logs for specific errors

## ✅ Success Criteria:

- [ ] Frontend builds and deploys
- [ ] Login page loads
- [ ] Can login successfully
- [ ] Dashboard displays after login
- [ ] No console errors
- [ ] API calls work properly