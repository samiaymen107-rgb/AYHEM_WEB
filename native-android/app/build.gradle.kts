plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
}

android {
    namespace = "tn.ayhem.ai"
    compileSdk = 34

    defaultConfig {
        applicationId = "tn.ayhem.ai"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"
    }

    buildFeatures {\n        compose = true\n        buildConfig = true\n    }\n\n    defaultConfig {\n        buildConfigField("String", "SUPABASE_URL", "\\\"https://qmasgqvfnjlticwmovpn.supabase.co\\\"")\n        buildConfigField("String", "SUPABASE_PUBLISHABLE_KEY", "\\\"sb_publishable_GB0GnqMhdTWnQTsTfL--AQ_boZuXaH3\\\"")\n    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
    packaging { resources { excludes += "/META-INF/{AL2.0,LGPL2.1}" } }
}

dependencies {
    implementation(platform("androidx.compose:compose-bom:2024.06.00"))
    implementation("androidx.activity:activity-compose:1.8.2")
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.core:core-splashscreen:1.0.1")
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
    debugImplementation("androidx.compose.ui:ui-tooling")
}
