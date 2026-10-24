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
| Eligible employees for onboarding | GET | `/api/v1/admin/employees/onboarding-eligible` |
| List departments (Admin, paginated) | GET | `/api/v1/departments?page=1&limit=20&isActive=true` |
| Create department and optional grades (Admin) | POST | `/api/v1/departments` |
| Department detail and mapped grades (Admin) | GET | `/api/v1/departments/:departmentId` |
| List mapped grades (Admin) | GET | `/api/v1/departments/:departmentId/grades` |
| Add department grade batch (Admin) | POST | `/api/v1/departments/:departmentId/grades` |
| Rename department (Admin) | PATCH | `/api/v1/departments/:departmentId` |
| Active departments for registration | GET | `/api/v1/departments/registration` |
| Active grades by department | GET | `/api/v1/grades/registration?departmentId=:departmentId` |
| Complete onboarding | POST | `/api/v1/admin/employees/:userId/onboard` |
| Stream/download document | GET | `/api/v1/employees/compliance/documents/:documentId` |

Bulk document review is not exposed as a separate bulk action button in this starter; the individual review flow is implemented. Add the bulk UI after confirming the exact live detail/list response shapes.

Department management expects the paginated department envelope (`data.items` and `data.pagination`), department detail with a `grades` array, and the documented create/add/rename operations. Department creation with grades and grade batches must be supported transactionally by a transaction-capable MongoDB deployment. The frontend does not create, deactivate, or delete Grade or Department records beyond the documented operations.
