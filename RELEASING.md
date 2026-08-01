# Releasing Timeline Timer

Releases are built by GitHub Actions for Windows, Linux, Intel macOS, and Apple Silicon macOS. The workflow creates a draft GitHub release, attaches `SHA256SUMS.txt` for every packaged asset, and leaves the release unpublished so its installers can be checked first.

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

5. Open the generated draft release, verify `SHA256SUMS.txt`, smoke-test the appropriate installer, edit the generated notes if needed, and publish it.

Packages are currently unsigned. Windows SmartScreen and macOS Gatekeeper may therefore warn users. Code signing can be added later without changing this release process.

## Submit the Windows package to WinGet

WinGet publication happens after the GitHub release is public because the manifest must use a stable, version-specific installer URL.

1. Confirm the package identifier and version do not already exist:

   ```powershell
   winget search --exact --id AGSoto.TimelineTimer
   ```

2. Generate a multi-file manifest from the release MSI with Microsoft's WingetCreate tool:

   ```powershell
   wingetcreate new https://github.com/agsoto/timeline-timer/releases/download/v0.2.0/Timeline.Timer_0.2.0_x64_en-US.msi --out manifests
   ```

3. Review the generated metadata and validate it:

   ```powershell
   winget validate --manifest manifests
   ```

4. Enable local manifests and test unattended installation, preferably in Windows Sandbox:

   ```powershell
   winget settings --enable LocalManifestFiles
   winget install --manifest manifests
   ```

5. Submit only that version's manifest files in a pull request to [`microsoft/winget-pkgs`](https://github.com/microsoft/winget-pkgs). WinGet availability begins after the repository's automated checks, moderator review, and merge are complete.
