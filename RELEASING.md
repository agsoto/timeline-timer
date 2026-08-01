# Releasing Timeline Timer

Releases are built by GitHub Actions for Windows, Linux, Intel macOS, and Apple Silicon macOS. The workflow creates a draft GitHub release so its installers can be checked before publication.

## Publish a version

1. Set the same version in the npm, Cargo, and Tauri manifests and lockfiles:

   ```sh
   npm run version:set -- 0.2.0
   ```

2. Move the relevant notes from `Unreleased` into a dated version in `CHANGELOG.md`.
3. Run the checks listed in `CONTRIBUTING.md`, then commit and push the version change.
4. Create and push a matching tag:

   ```sh
   git tag v0.2.0
   git push origin main v0.2.0
   ```

   The release workflow can also be started manually from GitHub Actions; it derives the tag from the manifest version.

5. Open the generated draft release, smoke-test the appropriate installer, edit the generated notes if needed, and publish it.

The initial packages are unsigned. Windows SmartScreen and macOS Gatekeeper may therefore warn users. Code signing can be added later without changing this release process.
