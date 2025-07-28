# ONYX Render.com Deployment Checklist

## 🗄️ Database Setup (PostgreSQL)

Your Render PostgreSQL instance:
- **Database Name**: adakole_onyx232
- **Connection String**: `postgresql://realjumbo:Lq9Fc7E2bmsl3w01DCV1P1OpdpEP8Opr@dpg-d240atvgi27c738goi7g-a.oregon-postgres.render.com/adakole_onyx232`

### Step 1: Run Database Migrations

1. **Connect to your database**:
   - In Render Dashboard, go to your PostgreSQL instance
   - Click "Connect" → "PSQL Command"
   - Or use any PostgreSQL client with the connection string

2. **Run the setup script**:
   ```bash
   psql postgresql://realjumbo:Lq9Fc7E2bmsl3w01DCV1P1OpdpEP8Opr@dpg-d240atvgi27c738goi7g-a.oregon-postgres.render.com/adakole_onyx232 < backend/setup-database.sql
   ```

3. **Verify tables were created**:
   ```sql
   \dt
   ```
   You should see: organizations, users, buildings, elements, assessments, etc.

## 🚀 Backend Deployment

### Step 2: Deploy Backend Service

1. **In Render Dashboard**:
   - New → Web Service
   - Connect GitHub repo: `getmobilehq/onyxx`
   - **Name**: `onyx-backend` (or your preferred name)
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

2. **Add Environment Variables** (copy exactly):
   ```bash
   DATABASE_URL=postgresql://realjumbo:Lq9Fc7E2bmsl3w01DCV1P1OpdpEP8Opr@dpg-d240atvgi27c738goi7g-a.oregon-postgres.render.com/adakole_onyx232
   
   JWT_SECRET=LQcIb5ut1ehZ9RCSy4SzRRglMVpF/ge2ilbgOsWJV2efLZCTT8/R886Myq94XwjkfjEmOMwiZBn4UDKwsp2fpQ==
   
   JWT_REFRESH_SECRET=hAffhkKws0s1R1L7cmXI2lBTN+5+lDND6i+DfNOaeo97xWo0ZJ87rwpDhz4GW2Kf14kadd8SZqzd8zU75jCH8g==
   
   JWT_EXPIRE=7d
   
   JWT_REFRESH_EXPIRE=30d
   
   CLIENT_URL=https://[your-frontend-name].onrender.com
   
   CLOUDINARY_CLOUD_NAME=univel
   
   CLOUDINARY_API_KEY=258567296487466
   
   CLOUDINARY_API_SECRET=wkBJfzT8PrtCI1-e6xb-oj_ovSo
   ```

3. **Deploy and wait for build to complete**

4. **Test backend health**:
   ```
   https://[your-backend-name].onrender.com/api/health
   ```

## 🎨 Frontend Deployment

### Step 3: Deploy Frontend Static Site

1. **In Render Dashboard**:
   - New → Static Site
   - Connect GitHub repo: `getmobilehq/onyxx`
   - **Name**: `onyx-frontend` (or your preferred name)
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

2. **Add Environment Variable**:
   ```bash
   VITE_API_URL=https://[your-backend-name].onrender.com/api
   ```

3. **Deploy and wait for build**

## ✅ Post-Deployment Verification

### Step 4: Test Everything

1. **Backend Health Check**:
   - Visit: `https://[backend].onrender.com/api/health`
   - Should return: `{"status":"OK","message":"Onyx Backend API is running"}`

2. **Frontend Access**:
   - Visit: `https://[frontend].onrender.com`
   - Should see login page

3. **Test Login**:
   - Email: `admin@onyx.com`
   - Password: `password123`

4. **Security Verification**:
   - Try 11 failed login attempts (should trigger rate limit)
   - Check headers: https://securityheaders.com/?q=[your-frontend-url]

5. **Test Core Features**:
   - Create a building
   - Start an assessment
   - Complete assessment workflow
   - Generate a report

## 🔧 Troubleshooting

### Common Issues:

1. **"Cannot connect to database"**:
   - Verify DATABASE_URL is set correctly
   - Check if database is active in Render dashboard
   - Ensure SSL is enabled (it is by default)

2. **"CORS error" on frontend**:
   - Update CLIENT_URL in backend env vars
   - Must include https:// prefix
   - No trailing slash

3. **"Build failed"**:
   - Check build logs in Render dashboard
   - Ensure all dependencies are in package.json
   - Try building locally first

4. **"Login not working"**:
   - Verify JWT secrets match exactly
   - Check if database migrations ran successfully
   - Look at backend logs for errors

## 📊 Monitoring

### After Deployment:

1. **Enable Notifications**:
   - Settings → Notifications
   - Enable failure alerts

2. **Monitor Performance**:
   - Dashboard → Metrics
   - Watch for memory/CPU spikes

3. **Check Logs Regularly**:
   - Look for rate limit triggers
   - Monitor for errors
   - Track API response times

## 🎉 Success Criteria

- [ ] Database migrations completed
- [ ] Backend deployed and healthy
- [ ] Frontend deployed and accessible
- [ ] Login working with admin@onyx.com
- [ ] Rate limiting verified (10 attempts)
- [ ] Security headers showing A+ rating
- [ ] Assessment workflow functional
- [ ] No errors in logs

## 🚨 Important Security Notes

1. **Never commit .env.production files**
2. **Rotate JWT secrets every 90 days**
3. **Monitor rate limit logs for attacks**
4. **Keep dependencies updated monthly**
5. **Review audit logs weekly**

---

**Support**: 
- Render Status: https://status.render.com
- Render Docs: https://render.com/docs
- GitHub Issues: https://github.com/getmobilehq/onyxx/issues