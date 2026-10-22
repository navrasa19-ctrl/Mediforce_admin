# API integration checklist

All paths below are relative to `VITE_API_BASE_URL`.

| Feature | Method | Path |
|---|---|---|
| Login | POST | `/api/v1/auth/login` |
| Current identity | GET | `/api/v1/auth/me` |
| Pending coordinators | GET | `/api/v1/admin/users/coordinators/pending` |
| Approved coordinators | GET | `/api/v1/admin/users/coordinators/approved` |
| Accept coordinator | POST | `/api/v1/admin/users/coordinators/:userId/accept` |
| Reject coordinator | POST | `/api/v1/admin/users/coordinators/:userId/reject` |
| Pending approvers | GET | `/api/v1/admin/users/approvers/pending` |
| Approved approvers | GET | `/api/v1/admin/users/approvers/approved` |
| Managed approvers | GET | `/api/v1/admin/users/approvers` |
| Create approver | POST | `/api/v1/admin/users/approvers` |
| Deactivate approver | DELETE | `/api/v1/admin/users/approvers/:userId` |
| Set responsibility | PATCH | `/api/v1/admin/users/:userId/approval-responsibility` |
| Replace department scope | PATCH | `/api/v1/admin/users/:userId/department-scope` |
| Pending employee compliance | GET | `/api/v1/admin/employees/compliance/pending` |
| Employee compliance details | GET | `/api/v1/admin/employees/:employeeId/compliance` |
| Review one document | PATCH | `/api/v1/admin/employees/:employeeId/compliance/documents/:documentId/review` |
| Review documents in bulk | PATCH | `/api/v1/admin/employees/:employeeId/compliance/documents/review-bulk` |
| Approve overall compliance | PATCH | `/api/v1/admin/employees/:employeeId/compliance/approve` |
| Complete onboarding | POST | `/api/v1/admin/employees/:userId/onboard` |
| Stream/download document | GET | `/api/v1/employees/compliance/documents/:documentId` |

Bulk document review is not exposed as a separate bulk action button in this starter; the individual review flow is implemented. Add the bulk UI after confirming the exact live detail/list response shapes.
