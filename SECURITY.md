# Security Policy

InSIS+ runs inside students' logged-in InSIS sessions, so security and privacy problems are taken seriously.

## Supported versions

Only the latest release gets fixes. Please update before reporting.

## Reporting a vulnerability

**Do not open a public issue.** Use GitHub's private vulnerability reporting
([Security → Report a vulnerability](../../security/advisories/new)). Include the version, the browser, the InSIS
page, steps to reproduce and the impact. Please don't include real personal data; a description of the page is enough.

You can expect an acknowledgement within 7 days and a fix or a plan within 30 days. We'll credit you in the release
notes unless you prefer otherwise.

## What counts

In scope, for example:

- Data from InSIS leaving the browser, or being readable by other sites or extensions.
- InSIS content being executed or injected as HTML (XSS) by the extension.
- The extension submitting forms, sending requests or taking any action the user didn't make.
- Anything that weakens InSIS's own protections (for example breaking CSRF tokens or session handling).

Out of scope: vulnerabilities in InSIS itself (report those to VŠE's IT department), and issues that need a
compromised browser or machine.
