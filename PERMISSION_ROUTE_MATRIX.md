# Permission Route Matrix

This matrix tracks write-capable routes and their enforced permission in `staff-console`, using centralized `PERMISSIONS.*` constants.

## Guarded write routes

| Route | Required permission | Enforcement |
| --- | --- | --- |
| `/user/new` | `PERMISSIONS.ADD_USER` (`add_user`) | `PermissionRoute` in `src/routes/sections.jsx` |
| `/payment/new` | `PERMISSIONS.ADD_PAYMENT` (`add_payment`) | `PermissionRoute` in `src/routes/sections.jsx` |
| `/payment/:id/edit` | `PERMISSIONS.EDIT_PAYMENT` (`edit_payment`) | `PermissionRoute` in `src/routes/sections.jsx` and page-level guard in `src/sections/payment/edit-payment-page.jsx` |
| `/template/new` | `PERMISSIONS.ADD_TEMPLATE` (`add_template`) | `PermissionRoute` in `src/routes/sections.jsx` |

## Write actions without dedicated routes

The following write actions are protected at component/action level because they happen in-table or in-dialog, not in standalone routes:

- Role permission add/edit/delete in `src/sections/role-permission/*`
- User edit/delete actions in `src/sections/user/*`
- Group edit/delete actions in `src/sections/groups/view/groups-view.jsx`
- Session, assessment, app-session, app-programme mutations in their section views

For these flows, backend authorization remains mandatory and authoritative.

## Constants migration coverage

- Navigation `permission` fields in `src/layouts/dashboard/config-navigation.jsx` now use `PERMISSIONS.*`.
- `Can` guards (`do` and `anyOf`) across implementation files now use `PERMISSIONS.*`.
- Route-level write guards remain in `src/routes/sections.jsx` via `WRITE_ROUTE_PERMISSION_MATRIX` from `src/permissions/constants.js`.
