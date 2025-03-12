# Zenoa AI

<img alt="Zenoa AI Logo" src="src/assets/favicon.png">

## Overview

Zenoa AI is a feature-rich mobile application that enables users to create stunning AI-generated images. With an intuitive interface and powerful backend integration, users can transform text descriptions into beautiful visual art in seconds.

## Features

- **AI Image Generation**: Convert text prompts to high-quality images
- **Multiple Art Styles**: Choose from various artistic styles and modify parameters
- **Image Gallery**: Browse, manage and share your generated images
- **User Profiles**: Customize your profile and view your creation history
- **Dark/Light Mode**: Comfortable viewing experience in any lighting condition
- **Persistent Login**: Stay logged in across app restarts
- **Account Switching**: Easily switch between multiple Google accounts

## Tech Stack

- **React Native**: Cross-platform mobile framework
- **Firebase**: Authentication, Firestore database, and storage
- **Google Sign-In**: User authentication
- **Zustand**: State management
- **React Navigation**: Navigation and routing
- **React Native Reanimated**: Advanced animations
- **Shopify Flash List**: High-performance lists
- **React Native Encrypted Storage**: Secure data storage

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Android Studio (for Android builds)
- Xcode (for iOS builds)
- Firebase project with Google authentication enabled
- Image generation API access (compatible with the app's API config)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/developer-sumit/zenoa-ai.git
   cd zenoa-ai
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   yarn
   ```

3. Install iOS dependencies (macOS only):
   ```bash
   cd ios && pod install && cd ..
   ```

### Environment Configuration

Create a `.env` file for development and a `.env.production` for production in the root directory for development:

```
API_URL=your_development_api_url
API_KEY=your_development_api_key
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_firebase_domain
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=your_firebase_sender_id
FIREBASE_APP_ID=your_firebase_app_id
GOOGLE_WEB_CLIENT_ID=your_google_web_client_id
```

**IMPORTANT**: IMPORTANT: Add both `.env` and `.env.production` files to your `.gitignore` to prevent exposing sensitive keys.

### Firebase Configuration

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication with Google as a sign-in method
3. Create a Firestore database
4. Set up appropriate security rules for Firestore
5. Get your Firebase configuration and add it to your environment files

### Keystore Setup for Android

1. Create a `keystore.properties` file in the `android/` directory with the following content:

   ```
   storePassword=your_keystore_password
   keyPassword=your_key_password
   keyAlias=your_key_alias
   storeFile=your_keystore_filename.keystore
   ```

2. Place your release keystore file in the `app` directory
3. **IMPORTANT**: Add `keystore.properties` and your keystore file to `.gitignore`
4. Update your Google Services configuration:
   - Download `google-services.json` from Firebase console
   - Place it in the `app` directory
   - Make sure this file is included in version control (it doesn't contain secrets)

### Running the App

#### Development:

```bash
# Start Metro bundler
npx react-native start
```

#### Production Builds

```bash
# Android Release Build
cd android && ./gradlew assembleRelease

# iOS Release Build (macOS only)
cd ios && xcodebuild -workspace YourApp.xcworkspace -scheme YourApp -configuration Release
```

## Deployment

### Android

1. Ensure you have configured the `keystore.properties` file correctly
2. Make sure your production environment variables are set in `.env.production`
3. Create a release build:

```bash
cd android && ./gradlew bundleRelease
```

4. The AAB file will be generated at `android/app/build/outputs/bundle/release/app-release.aab`
5. Upload this file to the Google Play Console

#### iOS (macOS only)

1. Configure the app signing in Xcode
2. Archive the application through Xcode
3. Upload to App Store Connect through the Xcode Organizer

## Troubleshooting

- If you encounter build errors, verify that all environment variables are correctly set
- For keystore issues, double-check the keystore.properties file and ensure the keystore file exists at the specified path

## Contributing

Please read CONTRIBUTING.md for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
