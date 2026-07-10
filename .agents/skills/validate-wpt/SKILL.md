---
name: validate-wpt
description: Temporarily update this repository's web-platform-tests downloader to use the head commit from a web-platform-tests/wpt pull request, run the test suite, report the results, and restore the downloader afterward. Use when the user asks to validate, try, or test a WPT PR against this repo.
metadata:
  display-name: Validate WPT
  short-description: Validate WPT PRs
---

# Validate WPT

## Overview

Validate a `web-platform-tests/wpt` pull request against this repo by pinning `scripts/get-latest-platform-tests.js` to the PR head commit, running `npm test`, and restoring the script before finishing.

## Workflow

1. Parse the PR number from the user-provided WPT PR URL. Strip any URL fragment such as `#event-...` or `#issuecomment-...`; accept trailing slashes.

2. Confirm `scripts/get-latest-platform-tests.js` has no existing local edits before changing it. If it is already modified, do not overwrite or restore it without explicit user approval.

3. Get the PR head information with `gh`:

   ```sh
   gh pr view PR_NUMBER --repo web-platform-tests/wpt --json headRefOid,headRepositoryOwner,headRepository
   ```

   Use:

   - `headRefOid` as the `commitHash`
   - `headRepositoryOwner.login` as the GitHub owner
   - `headRepository.name` as the GitHub repo

4. Edit `scripts/get-latest-platform-tests.js`:

   - Replace the `commitHash` string with the PR head SHA.
   - Replace the owner and repo in `urlPrefix` so it points to the PR head repository.

   For a fork PR from `Dubzer/wpt`, use:

   ```js
   const urlPrefix = `https://raw.githubusercontent.com/Dubzer/wpt/${commitHash}/url/`;
   ```

   For a PR directly from `web-platform-tests/wpt`, keep:

   ```js
   const urlPrefix = `https://raw.githubusercontent.com/web-platform-tests/wpt/${commitHash}/url/`;
   ```

5. Run `npm test`.

6. Report the result:

   - State whether the run passed or failed.
   - Include the pass and fail counts when the test runner prints them.
   - Summarize any failing tests.
   - Wrap test names, URLs, expected values, actual values, backslashes, and angle-bracketed strings in backticks so Markdown does not interpret them.

7. Restore `scripts/get-latest-platform-tests.js` to its original state before finishing. If the file was clean before step 4, use:

   ```sh
   git checkout -- scripts/get-latest-platform-tests.js
   ```

   Confirm the restore succeeded with `git diff -- scripts/get-latest-platform-tests.js`.
