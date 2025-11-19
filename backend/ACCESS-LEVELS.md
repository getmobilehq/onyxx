# Onyx Access Levels & Permissions (Updated Model)

## Overview
Onyx uses a **multi-tenant architecture** with **role-based access control (RBAC)**. Each organization is isolated, and users have different permission levels based on their role and special flags.

---

## New Access Model (November 2025)

### User Roles

#### 1. **Manager** (Organization Level)
The primary organization-level role with full operational permissions.

**Default Configuration:**
- **New signups automatically get:** `role='manager'` + `is_organization_owner=true`
- First user of an organization is the organization owner

**Permissions:**
- ✅ Full building management (create, read, update, delete)
- ✅ Create and manage assessments
- ✅ View and generate reports
- ✅ User management (invite managers and assessors only)
- ✅ **Update organization** settings (name, description, etc.)
- ✅ Manage email subscriptions
- ✅ View analytics dashboard
- ❌ **Cannot delete organization** (platform admin only)
- ❌ **Cannot create platform admins** (admin-only privilege)

**Routes accessible to Managers:**
- `POST /buildings` - Create buildings
- `PUT /buildings/:id` - Update buildings
- `DELETE /buildings/:id` - Delete buildings (org owner only)
- `GET /users` - View users in organization
- `POST /users/invite` - Invite managers or assessors
- `DELETE /users/:id` - Delete users (org owner only)
- `PUT /organizations/:id` - Update organization
- `GET /email/*` - View email subscriptions
- `POST /email/subscriptions` - Create subscriptions

---

#### 2. **Assessor** (Field Level)
Field-level role focused on conducting assessments and viewing assigned work.

**Permissions:**
- ✅ View buildings (read-only)
- ✅ Conduct assessments (assigned to them)
- ✅ Upload photos and deficiencies
- ✅ View reports (read-only)
- ❌ Cannot create/edit buildings
- ❌ Cannot delete assessments
- ❌ Cannot invite users
- ❌ Cannot manage organization settings

**Limited to:**
- `GET /buildings` - View buildings
- `GET /buildings/:id` - View building details
- `GET /assessments` - View assessments
- `POST /assessments` - Create assessments
- `PUT /assessments/:id` - Update assigned assessments
- `GET /reports` - View reports

---

#### 3. **Admin** (Platform Level - Super Admin)
**Special role with `is_platform_admin=true` flag.**

This is a **cross-organization super administrator** with full system access.

**Creation:**
- ✅ **Can only be created by another platform admin**
- ❌ Organization owners (managers) cannot create platform admins
- Set via `is_platform_admin=true` flag during user invitation

**Permissions:**
- ✅ **Full access to all organizations**
- ✅ Create, update, and **delete organizations**
- ✅ Create other platform admins
- ✅ Override any organization-level permission
- ✅ Access cross-organization analytics
- ✅ Manage system-wide settings

**Platform Admin Only Routes:**
- `DELETE /organizations/:id` - Delete organizations
- Creating users with `is_platform_admin=true`

---

## Special Flags

### `is_organization_owner` (Boolean)
- Marks the **creator/owner** of an organization
- Automatically set to `true` for first user during registration
- Grants additional permissions within the organization:
  - Delete buildings
  - Delete users
  - Update organization settings
- Can be transferred to another user
- Used for organization management operations

### `is_platform_admin` (Boolean)
- **Super admin flag** for cross-organization access
- Grants full system access across all organizations
- Can only be set by existing platform admins
- Default: `false` for all regular users
- Bypasses all organization-level restrictions

---

## Multi-Tenant Isolation

**All database queries are scoped by `organization_id`** to ensure tenant isolation:

```sql
SELECT * FROM buildings WHERE organization_id = $1
SELECT * FROM users WHERE organization_id = $1
```

**Exception:** Platform admins (`is_platform_admin=true`) can access data across organizations.

---

## Authentication Flow

1. **User registers** → Creates `role='manager'` + `is_organization_owner=true` + new organization
2. **User logs in** → Receives JWT tokens (access + refresh)
3. **JWT Payload includes:**
   ```json
   {
     "id": "user-id",
     "email": "user@example.com",
     "role": "manager|assessor",
     "organization_id": "org-id",
     "is_platform_admin": false
   }
   ```
4. **Middleware checks:**
   - `authenticate()` - Verifies JWT token
   - `authorize('manager')` - Checks role permissions
   - `requireOrganizationOwner()` - Checks is_organization_owner flag
   - `requirePlatformAdmin()` - Checks is_platform_admin flag

---

## Permission Matrix

| Feature | Manager (Org Owner) | Manager (Regular) | Assessor | Platform Admin |
|---------|---------------------|-------------------|----------|----------------|
| View Buildings | ✅ | ✅ | ✅ | ✅ |
| Create Buildings | ✅ | ✅ | ❌ | ✅ |
| Edit Buildings | ✅ | ✅ | ❌ | ✅ |
| Delete Buildings | ✅ | ❌ | ❌ | ✅ |
| View Assessments | ✅ | ✅ | ✅ | ✅ |
| Create Assessments | ✅ | ✅ | ✅ | ✅ |
| Edit Assessments | ✅ | ✅ | ✅ (own) | ✅ |
| Complete Assessments | ✅ | ✅ | ✅ (own) | ✅ |
| View Reports | ✅ | ✅ | ✅ | ✅ |
| Generate Reports | ✅ | ✅ | ❌ | ✅ |
| View Users | ✅ | ✅ | ❌ | ✅ |
| Invite Managers/Assessors | ✅ | ✅ | ❌ | ✅ |
| Create Platform Admins | ❌ | ❌ | ❌ | ✅ |
| Delete Users | ✅ | ❌ | ❌ | ✅ |
| Update Organization | ✅ | ❌ | ❌ | ✅ |
| Delete Organization | ❌ | ❌ | ❌ | ✅ |
| Email Management | ✅ | ✅ | ❌ | ✅ |
| Security Settings | ✅ | ❌ | ❌ | ✅ |
| Analytics Dashboard | ✅ | ✅ | ❌ | ✅ |
| Cross-Organization Access | ❌ | ❌ | ❌ | ✅ |

---

## Role Assignment

### During Registration (Signup)
```json
{
  "role": "manager",
  "is_organization_owner": true,
  "is_platform_admin": false
}
```

### Invited Users
- **By Manager:** Can invite `role='manager'` or `role='assessor'` with `is_organization_owner=false`, `is_platform_admin=false`
- **By Platform Admin:** Can invite any role including `is_platform_admin=true`

---

## Migration from Old Model

### Old Structure (Pre-November 2025)
```
- admin: Organization admin (highest org-level access)
- manager: Mid-level operations
- assessor: Field assessor
```

### New Structure (November 2025+)
```
- manager (with is_organization_owner): Replaces old "admin" role
- manager (regular): Same as before
- assessor: Same as before
- Platform Admin (is_platform_admin=true): New super admin level
```

### Key Changes
1. ✅ Registration now creates **managers** instead of admins
2. ✅ `is_organization_owner` flag moved to manager role
3. ✅ Organization owners can update but **cannot delete** organizations
4. ✅ Platform admins (is_platform_admin) are the only true "admins"
5. ✅ Managers can only invite managers and assessors (not platform admins)

---

## Security Considerations

1. **Platform Admin Creation:** Only existing platform admins can create new platform admins
2. **Organization Isolation:** All non-admin users are strictly scoped to their organization
3. **Owner Privileges:** Organization owners have elevated permissions but cannot cross organizational boundaries
4. **Deletion Controls:** Only platform admins can delete organizations (prevents accidental data loss)

---

## Future Enhancements

- [ ] Custom role creation with granular permissions
- [ ] Department/team-based access control within organizations
- [ ] API key access for integrations
- [ ] Audit logging for platform admin actions
- [ ] Organization owner transfer workflow
