# Changelog

## v1.0.1 (2025-05-06)

### Features

- **Core:** Initial release of Zenoa AI.

- **Authentication:** Secure authentication implemented with Firebase and Google Sign-In.

- **UI/UX:** Added support for dark and light themes with automatic switching.

- **AI Image Generation:** Integrated Pollinations API for stable image generation.

- **Image Creation:**

  - Implemented 25+ art styles with visual previews.
  - Added controls for aspect ratio and quality.
  - Included negative prompt support.
  - Enabled seed control for reproducible results.
  - Added prompt suggestions for enhanced user experience.

- **Gallery:**

  - Developed an image viewer with metadata display.
  - Enabled image downloading and sharing.
  - Added search and style filtering capabilities.

- **Profile Management:**

  - Introduced user profile customization.
  - Added account deletion functionality.

- **Storage:** Implemented an offline-first approach with Firestore sync.

- **Legal:** Added terms of service and privacy policy with website redirects.

### Improvements

- Optimized image loading and caching for better performance.
- Implemented token refresh mechanism to maintain user sessions.
- Added a clear button for prompt and style reset.
- Enhanced toast notifications for improved user feedback.
- Optimized UI for various device sizes.

### Bug Fixes

- Fixed toast notifications appearing behind modals.
- Resolved authentication session persistence issues.
- Corrected image aspect ratio calculation in gallery view.
- Fixed token refresh logic to prevent unnecessary signouts.
