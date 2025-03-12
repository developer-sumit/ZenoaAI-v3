# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html


# Keep generated classes
-keep class com.sumit.zenoaai.BuildConfig { *; }

# Keep all environment variables
-keepclassmembers class com.sumit.zenoaai.BuildConfig {
  public static <fields>;
}

# Keep specific environment variables needed by your app
-keepclassmembers class com.sumit.zenoaai.BuildConfig {
    public static final String FIREBASE_API_KEY;
    public static final String FIREBASE_AUTH_DOMAIN;
    public static final String FIREBASE_PROJECT_ID;
    public static final String FIREBASE_STORAGE_BUCKET;
    public static final String FIREBASE_MESSAGING_SENDER_ID;
    public static final String FIREBASE_APP_ID;
    public static final String FIREBASE_MEASUREMENT_ID;
    public static final String GOOGLE_WEB_CLIENT_ID;
    public static final String GOOGLE_ADMOB_APP_ID;
    # Add any other environment variables you need to keep
}

# Keep React Native Config
-keep class com.lugg.RNCConfig.** { *; }
-keep class com.facebook.react.modules.** { *; }