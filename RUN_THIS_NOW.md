# Quick Fix - Add Sample Buildings

The API is working correctly but returning 0 buildings because the database is empty.

## Run this command to add sample buildings:

```bash
cd /Users/josephagunbiade/Desktop/studio/onyx/backend
node add-sample-buildings.js
```

This will add 8 sample buildings to your database:
- Oak Tower Office Complex
- Riverside Apartments
- Central Mall
- Tech Campus Building A
- Memorial Hospital - East Wing
- Greenfield Elementary School
- Northside Warehouse
- City Hall

## After running the script:

1. **Refresh your browser**
2. You should see 8 buildings with images
3. The API will return real data from PostgreSQL

## To verify it worked:

Check the database directly:
```bash
cd backend
node check-and-clean-buildings.js
```

This will show you all buildings in the database.

## Success Indicators:

- ✅ Toast notification: "Buildings loaded from API: 8 found"
- ✅ 8 building cards with images
- ✅ Clicking on buildings shows details
- ✅ Network tab shows `GET http://localhost:5001/api/buildings` returning data

The API integration is working perfectly - you just need data in the database!