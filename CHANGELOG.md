# 📝 Changelog

All notable changes to **Zenoa AI (v3)** are documented in this file.

---

## 🚀 v3.7.0 (2025-08-18)

### ✨ Features
- **🖼️ Text-to-Image & Image-to-Image:** Added support for both text-to-image and image-to-image generation modes with full localization support.
- **🎨 Color Palette Screen:** Added a dedicated Color Palette screen integrated with theme management, allowing users to customize accent colors across 13 supported languages.

### 🔧 Improvements
- **🏷️ Version Display:** Simplified version display in Settings and Splash screens.
- **🧹 Android Quick Actions:** Removed unused Android Quick Actions implementation and related icon assets.

---

## 🚀 v3.6.0 (2025-08-10)

### ✨ Features
- **👤 Profile Avatar Selection:** Added `ImageSelectionModal` for choosing profile avatars with localized strings across all supported languages and `avatar` field support in profile updates.
- **⬆️ Scroll to Top:** Implemented `ScrollToTop` component and integrated it into `HomeScreen`, `GalleryScreen`, and `FavoriteScreen`.
- **🔥 Community Trending Filter:** Replaced the `hot` filter with `trending` in community filters, updating state management and multi-language translations.
- **📊 Daily Quota Display:** Enhanced quota information in `SettingsScreen` with daily context and reset time, plus image quota validation and warnings in generation screens.
- **⚙️ Dynamic Options Service:** Implemented options service and hook for fetching available generation options in `AdvancedSettingsScreen`.
- **🚩 Image Reporting & Account Deletion:** Enhanced image reporting in `ImageViewer`, added account deletion handling in `EditProfileScreen`, and implemented complete logout and local data cleanup on account deletion or email restriction.

### 🔧 Improvements
- **⚙️ Settings UI:** Refactored `SettingsScreen` to enhance UI components and improve notification handling.
- **🍞 Custom Toast:** Integrated custom toast configuration across the app and fixed toast visibility duration.
- **🃏 ImageCard:** Added `hideFavorite` prop and updated visibility logic in `GenerateScreen` and `AdvancedSettingsScreen`.
- **🔐 Auth Flow:** Improved email restriction handling in the authentication flow and removed unused user quota logic.

---

## 🚀 v3.5.0 (2025-08-07)

### ✨ Features
- **🔐 Google Sign-In Modal Flow:** Implemented updated authentication flow with Google Sign-In and `LoginBottomSheet` featuring an animated blurry overlay.
- **🍞 Toast System Upgrade:** Replaced `@masumdev/rn-toast` with `react-native-toast-message` and implemented a custom `useToast` hook.

### 🔧 Improvements
- **📊 Free Plan Quota:** Updated default image quota handling for free plan users in `userService` and `authStore`.
- **🧹 State Reset:** Reset favorite and popular images cleanly on `clearImages` action.
- **📦 Build Config:** Updated `versionCode` to `14` in `build.gradle` and `app.config.ts`.

---

## 🚀 v3.4.0 (2025-07-28)

### ✨ Features
- **🚩 Image Flagging:** Added flagging and reporting functionality for images in `ImageViewer` with full multi-language localization.

### 🔧 Improvements
- **♿ Accessibility & Styling:** Improved styling and accessibility in `ImageViewer`.

---

## 🚀 v3.3.0 (2025-07-27)

### 🔧 Improvements
- **🎨 Dynamic Login Branding:** Replaced `SparklesIcon` with dynamic theme-aware favicon in `LoginScreen`.
- **🎭 Style Management:** Enhanced styles management in `generationStore` and updated `onToggle` handling in `AdvancedSettingsScreen`.
- **🌐 Localization & Cleanup:** Updated localization in `LoginScreen` and `SettingsScreen`, and removed unused `onImageDeleted` prop from `ImageViewer`.

---

## 🚀 v3.2.0 (2025-07-22)

### ✨ Features
- **⭐ Favorites Screen & Gallery Layout:** Implemented dedicated `FavoriteScreen` and `GalleryLayout`.
- **❤️ Inline Favorite Toggle:** Integrated favorite toggle functionality directly in `ImageCard` and refined `HomeScreen` layout.

### 🔧 Improvements
- **🖼️ ImageViewer:** Simplified aspect ratio handling and enhanced creator display with user avatar and name.
- **⚡ Generation Logic:** Refactored image generation logic, added utility functions, and streamlined response handling.
- **🔄 Loading State:** Updated loading state management for favorite images in `imageStore` and `FavoriteScreen`.

---

## 🚀 v3.1.1 (2025-07-16)

### 🔧 Improvements
- **⚡ List Performance:** Enabled `removeClippedSubviews` across multiple screens for smoother scrolling and improved build configurations.
- **📱 Android 13+ Permissions:** Removed unnecessary `READ_MEDIA_IMAGES` permission from `AndroidManifest.xml`.

---

## 🚀 v3.1.0 (2025-07-15)

### ✨ Features
- **⚙️ Settings Screen:** Added dedicated `SettingsScreen` and integrated it into app navigation.
- **🔒 Plan Limits & Lock Indicators:** Added `LockIcon` component and enforced plan limits in `AdvancedSettingsScreen`.
- **🔍 Community Filter Menu:** Added filter functionality with a filter menu in `CommunityScreen`.
- **🔐 Image Privacy Toggle:** Added privacy toggle functionality in `ImageViewer` and updated privacy state in `imageStore`.
- **🖼️ Fullscreen Image Viewer:** Integrated `react-native-image-viewing` for fullscreen image display and connected `generationStore` in `ImageViewer` for reusing prompts and settings.
- **⭐ App Rating:** Implemented localized in-app rating prompts and improved keyboard handling in profile screens.

### 🔧 Improvements
- **📐 Types & Services:** Consolidated generation settings, standardized API response handling in `imageService` and `userService`, and cleaned up unused console logs.
- **❤️ Favorite Count Display:** Updated favorite indicator to consistently display favorite count and icon in `GalleryScreen`.
- **🤖 CI/CD Workflow:** Updated GitHub Actions Android build workflow (`upload-artifact@v4`, package.json version extraction, and dependency installation).

---

## 🌟 v3.0.0 (2025-07-10) - Major v3 Overhaul

### ✨ Features
- **🌍 Multi-Language Localization:** Added full localization support and language selection across 13 languages (`en`, `ar`, `de`, `es`, `fr`, `hi`, `id`, `mr`, `pa`, `pt`, `ta`, `te`, `zh`).
- **🔔 Push Notifications:** Implemented FCM token management and notification API/service via Firebase Messaging & Notifee.
- **👥 Community Feed:** Added community image feed translations, `UserAvatar` component, and improved image deletion logic.
- **🔒 Image Privacy Settings:** Added privacy settings for image generation with multi-language support.
- **👤 Enhanced Profiles:** Added `bio` field to `EditProfileScreen` and account deletion reason selection with email restriction handling.
- **💀 Skeleton Loaders & Haptics:** Replaced `ImageSkeleton` with skeleton loaders inside `ImageCard` and added haptic feedback and animations across screens.

### 🔧 Improvements
- **🔌 Backend API Integration:** Refactored `userService` and stores (`authStore`, `generationStore`) to integrate with backend APIs for user data management.
- **🎨 Theme & Branding:** Refactored theme management and updated light/dark favicons.
- **🧹 Code Quality:** Removed unused dependencies, optimized `useEffect` hooks, enabled console log removal in Babel production config, and updated `GalleryScreen` header styling.

---

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
