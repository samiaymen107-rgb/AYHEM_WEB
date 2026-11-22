package tn.ayhem.ai

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Memory
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay

private val Navy = Color(0xFF06152D)
private val Panel = Color(0xFF0B2446)
private val Cyan = Color(0xFF20CFFF)
private val Ice = Color(0xFFEAF8FF)

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent { AyhemApp() }
    }
}

@Composable
private fun AyhemApp() {
    var showSplash by remember { mutableStateOf(true) }
    LaunchedEffect(Unit) {
        delay(2_000)
        showSplash = false
    }
    MaterialTheme(
        colorScheme = darkColorScheme(
            primary = Cyan, secondary = Color(0xFF6BAEFF),
            background = Navy, surface = Panel, onPrimary = Navy,
            onBackground = Ice, onSurface = Ice
        )
    ) {
        Surface(Modifier.fillMaxSize(), color = Navy) {
            if (showSplash) SplashScreen() else HomeScreen()
        }
    }
}

@Composable
private fun SplashScreen() {
    val pulse = rememberInfiniteTransition(label = "pulse")
    val scale by pulse.animateFloat(
        initialValue = 0.96f, targetValue = 1.04f,
        animationSpec = infiniteRepeatable(tween(900), RepeatMode.Reverse),
        label = "logoPulse"
    )
    Box(
        Modifier.fillMaxSize().background(
            Brush.verticalGradient(listOf(Color(0xFF06152D), Color(0xFF092B55), Color(0xFF020B19)))
        ),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            BrainMark(Modifier.size(148.dp).scale(scale))
            Spacer(Modifier.height(22.dp))
            Text("AYHEM AI", color = Color.White, fontSize = 30.sp, fontWeight = FontWeight.ExtraBold, letterSpacing = 3.sp)
            Text("عقل رقمي • رؤية مستقبلية", color = Cyan, fontSize = 15.sp)
            Spacer(Modifier.height(30.dp))
            CircularProgressIndicator(color = Cyan, strokeWidth = 2.dp, modifier = Modifier.size(24.dp))
        }
    }
}

@Composable
private fun BrainMark(modifier: Modifier = Modifier) {
    Box(
        modifier.background(
            Brush.radialGradient(listOf(Color(0xFF155EAA), Color(0xFF09264B), Navy)),
            CircleShape
        ).padding(18.dp),
        contentAlignment = Alignment.Center
    ) {
        Icon(Icons.Default.Memory, contentDescription = "AYHEM AI", tint = Cyan, modifier = Modifier.fillMaxSize())
    }
}

@Composable
private fun HomeScreen() {
    var selected by remember { mutableStateOf("الرئيسية") }
    val items = listOf("الرئيسية", "الذاكرة", "الأمان", "الإعدادات")
    Column(
        Modifier.fillMaxSize().background(
            Brush.verticalGradient(listOf(Navy, Color(0xFF0A2850), Navy))
        ).statusBarsPadding().navigationBarsPadding().padding(horizontal = 20.dp)
    ) {
        Spacer(Modifier.height(24.dp))
        Row(verticalAlignment = Alignment.CenterVertically) {
            BrainMark(Modifier.size(54.dp))
            Spacer(Modifier.width(12.dp))
            Column {
                Text("AYHEM AI", color = Color.White, fontSize = 24.sp, fontWeight = FontWeight.Bold)
                Text("عقلك الرقمي", color = Cyan, fontSize = 13.sp)
            }
            Spacer(Modifier.weight(1f))
            Icon(Icons.Default.AutoAwesome, contentDescription = null, tint = Cyan)
        }
        Spacer(Modifier.height(34.dp))
        Text("مرحباً بك", color = Color.White, fontSize = 29.sp, fontWeight = FontWeight.Bold)
        Text("مساحتك الذكية لتنظيم المعرفة والأفكار", color = Color(0xFFB7D5EA), fontSize = 15.sp)
        Spacer(Modifier.height(24.dp))
        FeatureCard("الذاكرة الرقمية", "حفظ وتنظيم المعلومات والأفكار", Icons.Default.Memory)
        Spacer(Modifier.height(12.dp))
        FeatureCard("الحماية والخصوصية", "إدارة الوصول وحماية بياناتك", Icons.Default.Security)
        Spacer(Modifier.height(12.dp))
        FeatureCard("المساعد الذكي", "واجهة جاهزة لربط خدمات الذكاء الاصطناعي", Icons.Default.AutoAwesome)
        Spacer(Modifier.weight(1f))
        Row(
            Modifier.fillMaxWidth().background(Panel, RoundedCornerShape(18.dp)).padding(8.dp),
            horizontalArrangement = Arrangement.SpaceAround
        ) {
            items.forEach { item ->
                TextButton(onClick = { selected = item }) {
                    Text(item, color = if (selected == item) Cyan else Color(0xFF9CB9D2), fontSize = 12.sp)
                }
            }
        }
        Spacer(Modifier.height(14.dp))
        Text("الإصدار 1.0 • AYHEM AI", color = Color(0xFF6F8DA8), fontSize = 11.sp, modifier = Modifier.fillMaxWidth(), textAlign = TextAlign.Center)
        Spacer(Modifier.height(12.dp))
    }
}

@Composable
private fun FeatureCard(title: String, subtitle: String, icon: androidx.compose.ui.graphics.vector.ImageVector) {
    Row(
        Modifier.fillMaxWidth().background(Panel, RoundedCornerShape(20.dp)).padding(18.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(Modifier.size(46.dp).background(Color(0xFF103B68), RoundedCornerShape(14.dp)), contentAlignment = Alignment.Center) {
            Icon(icon, contentDescription = null, tint = Cyan)
        }
        Spacer(Modifier.width(14.dp))
        Column {
            Text(title, color = Color.White, fontWeight = FontWeight.SemiBold, fontSize = 16.sp)
            Spacer(Modifier.height(3.dp))
            Text(subtitle, color = Color(0xFFA9C7DF), fontSize = 12.sp)
        }
    }
}
