---
name: GitHub push safety
description: Shared repository branches can receive concurrent commits and may move to a new canonical URL.
---

When pushing user-requested changes, fetch and rebase the remote branch if a non-fast-forward rejection occurs; never force-push shared branches. Treat GitHub repository-moved notices as informational unless the push itself fails.

**Why:** The frontend repository received concurrent commits while a UI fix was being prepared, so a direct push was rejected.

**How to apply:** Preserve remote work by rebasing the local change onto the latest target branch before pushing again.