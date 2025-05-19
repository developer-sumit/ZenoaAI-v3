# 📝 Changelog

## 🚀 v2.0.0 (2025-05-19) - Major Update 🌟

### ✨ Features

- **🛠️ Advanced Settings:** Added dedicated Advanced Settings screen with improved navigation and UI
- **⭐ Favorites:** Added ability to favorite and organize images in Gallery with local storage integration
- **📣 Feedback:** Implemented feedback submission service for user suggestions and integrated with Profile
- **🖼️ Art Styles:** Added 31 more art styles (total 56) with search functionality in Advanced Settings
- **🎨 UI/UX:**
  - Improved art style selection with visual previews and new style options
  - Added fullscreen mode for image viewing 🖼️
  - Implemented reuse functionality for prompts and settings 🔄
  - Enhanced search capabilities in Gallery with new SearchIcon component 🔍
  - Added icons for aspect ratios in image creation settings 📐

### 🔧 Improvements

- **⚡ Performance:**
  - Removed console logs in production for better performance
  - Enhanced image generation process with controlled concurrency
  - Added network awareness for better offline experience
  - Added Firestore support for improved data synchronization 🔄
- **📊 Code Architecture:**
  - Refactored icon management with specific icon imports for improved maintainability
  - Improved authentication handling
  - Cleaned up component structure across the application
  - Refactored the entire codebase for better code organization
- **🎯 UI Elements:**
  - Updated primary color from orange to teal in theme configuration 🎭
  - Added new icons for improved navigation (ChevronUp, ChevronDown, Fullscreen)
  - Implemented EmptyState component for better user feedback
  - Replaced toast notification system with @masumdev/rn-toast for reliability 🍞
  - Added Clear button for prompt and settings reset 🧹

### 🐛 Bug Fixes

- Fixed fullscreen image bug where images disappeared in fullscreen mode and after returning to normal view 🖼️
- Fixed authentication timeout issue where users were signed out after 40-60 minutes 🔐
- Fixed various UI inconsistencies across components
- Improved navigation flow and screen transitions 🔄
- Enhanced error handling in image generation process ⚠️
- Fixed route handling for Advanced Settings screen

## 🔄 v1.0.3 (2025-05-09)

### 🔧 Improvements

- **♿ Accessibility:** Improved screen reader support for visually impaired users.

## 🔄 v1.0.2 (2025-05-07)

### 🐛 Bug Fixes

- Resolved issues with redirect links for "Privacy Policy" and "Terms of Service."

## 🎉 v1.0 (2025-02-05) - Initial Release

### ✨ Features

- **🚀 Core:** Initial release of Zenoa AI.

- **🔐 Authentication:** Secure authentication implemented with Firebase and Google Sign-In.

- **🎨 UI/UX:** Added support for dark and light themes with automatic switching.

- **🖼️ AI Image Generation:** Integrated Pollinations API for stable image generation.

- **🎭 Image Creation:**

  - Implemented 25+ art styles with visual previews.
  - Added controls for aspect ratio and quality.
  - Included negative prompt support.
  - Enabled seed control for reproducible results.
  - Added prompt suggestions for enhanced user experience.

- **🏞️ Gallery:**

  - Developed an image viewer with metadata display.
  - Enabled image downloading and sharing.
  - Added search and style filtering capabilities.

- **👤 Profile Management:**

  - Introduced user profile customization.
  - Added account deletion functionality.

- **💾 Storage:** Implemented an offline-first approach with Firestore sync.

- **📜 Legal:** Added terms of service and privacy policy with website redirects.

### 🔧 Improvements

- Optimized image loading and caching for better performance ⚡
- Implemented token refresh mechanism to maintain user sessions 🔄
- Added a clear button for prompt and style reset 🧹
- Enhanced toast notifications for improved user feedback 📢
- Optimized UI for various device sizes 📱

### 🐛 Bug Fixes

- Fixed toast notifications appearing behind modals.
- Resolved authentication session persistence issues 🔐
- Corrected image aspect ratio calculation in gallery view 📐
- Fixed token refresh logic to prevent unnecessary signouts.
