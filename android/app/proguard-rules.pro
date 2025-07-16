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

# Keep React Native Config
-keep class com.lugg.RNCConfig.** { *; }
-keep class com.facebook.react.modules.** { *; }

# Keep important React Native classes
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }

# Keep your app's main classes
-keep class com.sumit.zenoaai.** { *; }

# Rules for Firebase
-keep class com.google.firebase.** { *; }

# Rules for SVG components
-keep class com.horcrux.svg.** { *; }

# Rules for FastImage
-keep public class com.dylanvann.fastimage.* { *; }

# Hermes engine optimizations
-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.jni.** { *; }

# Remove debugging info
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
}