---
name: Frontend entrypoint sync
description: Keep the deployed root frontend entrypoint aligned with the nested frontend source copy when both are tracked.
---

When changing frontend UI in this workspace, update both the root app entrypoint and the nested frontend copy if they contain the same app, then verify the deployed branch includes the root entrypoint.

**Why:** A UI fix can appear correct in the nested frontend repository while the running Render app still serves the root entrypoint.

**How to apply:** Search both entrypoints for the target component before editing, apply the same behavioral change to each, and push the relevant root file to the deployment branch.