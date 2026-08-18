# SriLaYa Naturals — Documentation

## Developer Docs (this folder)

| File | Purpose |
|------|---------|
| [DESIGN.md](DESIGN.md) | Architecture and design decisions |
| [SETUP.md](SETUP.md) | Local development setup |
| [staging-environment.md](staging-environment.md) | Staging environment notes |
| [TEST_CASES.md](TEST_CASES.md) | Test case reference |
| [FEATURE_BACKLOG.md](FEATURE_BACKLOG.md) | Feature backlog |
| [Enhancements.md](Enhancements.md) | Enhancement notes |
| [PAYMENT_SECURITY_AUDIT.md](PAYMENT_SECURITY_AUDIT.md) | Payment security audit |
| [PAYMENT_SECURITY_CHECKLIST.md](PAYMENT_SECURITY_CHECKLIST.md) | Payment security checklist |
| [PCI_COMPLIANCE.md](PCI_COMPLIANCE.md) | PCI compliance reference |
| [pre-push-hook.sh](pre-push-hook.sh) | Git pre-push hook (image upload reminder) — see install instructions inside |

## Business & Operational Docs

All Word documents (.docx) are maintained in OneDrive — **do not add .docx files to this folder.**

**OneDrive location:**
```
C:\Users\HP\OneDrive\SriLaYa Business Plan\SriLaYa Naturals Business Plan\
```

### Folder structure

| Folder | Contents |
|--------|---------|
| `01 - Technical\01 - Architecture & Design` | Backend reference, design document, UI/UX guides |
| `01 - Technical\02 - Launch & Release` | Go-live checklist, launch readiness, image upload guide, release versioning |
| `01 - Technical\03 - Operations & Support` | Admin guide, owner operations, customer support, SEO guide |
| `01 - Technical\04 - Infrastructure & Security` | Security hardening, observability, incident response, backup & recovery |
| `02 - Operations` | Staff onboarding, returns SOP, customer support |
| `03 - Business & Finance` | Pricing, investment plan, growth scenarios, legal & finance |
| `04 - Marketing` | SEO content plan, social media guidelines |

## Other Local Files (not in git)

| File | Location |
|------|---------|
| DB credentials (all environments) | `D:\CompanyWebsite\SriLaYa_Database_Reference.docx` |
| Env file backups | `D:\CompanyWebsite\Env_Backups\` |
| Staging DB backup | `D:\CompanyWebsite\staging_backup_YYYYMMDD.dump` |
| Product image tracker | `D:\CompanyWebsite\SriLaYa_Product_Image_Tracker.xlsx` |
| Label status tracker | `D:\CompanyWebsite\SriLaYa_Label_Status_Tracker.xlsx` |
| Local product images | `apps/web/public/images/products/` (git-ignored) |

<!-- redeploy trigger 2026-08-18T06:04:06Z -->
<!-- redeploy retry 2026-08-18T06:21:28Z -->
<!-- redeploy trigger after Preview DATABASE_URL fix 2026-08-18T09:28:57Z -->
<!-- redeploy trigger to pick up rotated staging DATABASE_URL 2026-08-18T10:07:26Z -->
