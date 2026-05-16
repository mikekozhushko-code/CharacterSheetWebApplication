---
name: Major refactor May 2026
description: Large-scale code improvements done in May 2026 session — auth interceptors, alert removal, security fixes, naming fixes
type: project
---

Completed refactor in session on 2026-05-06:

**Why:** User asked for full code quality and optimization pass before further development.

**How to apply:** These are now baseline — don't revert. If touching auth/API layer, refer to the new singleton authApi pattern.

Changes made:
- `Frontend/src/Api.jsx`: authApi changed from factory function to singleton axios instance with JWT refresh interceptor (queue-based, handles concurrent 401s)
- All frontend files: replaced `authApi()` with `authApi` (13 files total)
- `LoginPage.jsx`: removed alert(), added inline error state + loading state
- `RegistrationPage.jsx`: fixed swapped error labels (email/username were reversed), added submit error display, password match validation
- `Profile.jsx`: removed alert(), logout now clears both token and refresh
- `Characters.jsx`: removed alert() calls
- `App.jsx`: /shared/:token route changed from PrivateRoute to public (no auth required)
- `GameTable.jsx`: fixed crash when localStorage token is null
- `Backend/config/settings.py`: CORS now reads from env CORS_ALLOWED_ORIGINS, added REFRESH_TOKEN_LIFETIME=7d + ROTATE_REFRESH_TOKENS, DEFAULT_PERMISSION_CLASSES changed to IsAuthenticated, added pagination (PAGE_SIZE=20)
- `Backend/characters/views.py`: fixed "To much character" typo → ValidationError with proper message, SharedCharacterView permission_classes = [AllowAny], cleaned imports
- `Backend/accounts/views.py`: removed unused render import, added permission_classes=[AllowAny] to CheckUniqueView
- `Backend/reqirement.txt` renamed to `requirements.txt`, Dockerfile updated accordingly
