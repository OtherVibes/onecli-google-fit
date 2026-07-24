# LinkedIn Chromium connector

The LinkedIn browser connector is a separate session-backed connector for
workflows that require the LinkedIn UI. The existing LinkedIn OAuth connection
remains available for API-supported workflows.

## Login flow

1. The Connectors page asks the local browser worker to create a one-time login
   session.
2. The worker opens an isolated Chromium profile at LinkedIn.
3. The user completes login in that window.
4. The worker stores the resulting browser storage state in OneCLI's encrypted
   vault and returns only a connection ID and account metadata.

The agent must never receive a cookie, storage-state file, CDP endpoint, or
arbitrary browser execution capability.

## Action contract

The worker accepts typed actions only. Write actions pass OneCLI policy
evaluation and manual approval before any UI operation. Approval is bound to
the exact action, target, and input.

The next implementation step is the local worker with authenticated
`start-login`, `status`, and `execute-action` endpoints.
