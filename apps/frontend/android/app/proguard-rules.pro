# Capacitor
-keep class com.getcapacitor.** { *; }
-keep class com.capacitor.** { *; }
-keepclassmembers class * {
    @com.getcapacitor.annotation.CapacitorPlugin <methods>;
}
-keep @com.getcapacitor.annotation.CapacitorPlugin class * {
    <init>(...);
}

# Keep Capacitor plugin classes
-keep class org.apache.cordova.** { *; }
-keep public class * extends com.getcapacitor.Plugin { *; }

# JavaScript interface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Prevent stripping of React Native bridge (if ever needed)
-keep class com.facebook.react.** { *; }

# Keep annotations
-keepattributes *Annotation*
-keepattributes SourceFile,LineNumberTable
