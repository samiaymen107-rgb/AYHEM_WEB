package tn.ayhem.ai

import android.os.Bundle
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Memory
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.nio.charset.StandardCharsets
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec
import android.content.Context

private val Navy = Color(0xFF06152D)
private val Panel = Color(0xFF0B2446)
private val Cyan = Color(0xFF20CFFF)
private val Ice = Color(0xFFEAF8FF)

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent { AyhemApp(applicationContext) }
    }
}

private object SecureTokenStore {
    private const val PREFS = "ayhem_secure_session"
    private const val ALIAS = "ayhem_session_key"

    private fun key(context: Context): SecretKey {
        val store = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
        (store.getKey(ALIAS, null) as? SecretKey)?.let { return it }
        val generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore")
        generator.init(
            KeyGenParameterSpec.Builder(ALIAS, KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT)
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setRandomizedEncryptionRequired(true)
                .build()
        )
        return generator.generateKey()
    }

    fun save(context: Context, token: String) {
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.ENCRYPT_MODE, key(context))
        val encrypted = cipher.doFinal(token.toByteArray(StandardCharsets.UTF_8))
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        prefs.edit().putString("iv", android.util.Base64.encodeToString(cipher.iv, android.util.Base64.NO_WRAP))
            .putString("token", android.util.Base64.encodeToString(encrypted, android.util.Base64.NO_WRAP)).apply()
    }

    fun read(context: Context): String? = try {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val iv = android.util.Base64.decode(prefs.getString("iv", null), android.util.Base64.NO_WRAP)
        val data = android.util.Base64.decode(prefs.getString("token", null), android.util.Base64.NO_WRAP)
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.DECRYPT_MODE, key(context), GCMParameterSpec(128, iv))
        String(cipher.doFinal(data), StandardCharsets.UTF_8)
    } catch (_: Exception) { null }

    fun clear(context: Context) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().clear().apply()
    }
}

private data class MemoryItem(val id: String, val title: String, val content: String, val category: String)

private object AyhemCloud {
    private fun request(path: String, method: String, body: String? = null, token: String? = null): String {
        val connection = (URL(BuildConfig.SUPABASE_URL + path).openConnection() as HttpURLConnection)
        connection.requestMethod = method
        connection.connectTimeout = 15000
        connection.readTimeout = 15000
        connection.setRequestProperty("apikey", BuildConfig.SUPABASE_PUBLISHABLE_KEY)
        connection.setRequestProperty("Content-Type", "application/json")
        connection.setRequestProperty("Accept", "application/json")
        if (token != null) connection.setRequestProperty("Authorization", "Bearer $token")
        if (body != null) {
            connection.doOutput = true
            connection.setRequestProperty("Prefer", "return=representation")
            connection.outputStream.use { it.write(body.toByteArray(StandardCharsets.UTF_8)) }
        }
        val code = connection.responseCode
        val stream = if (code in 200..299) connection.inputStream else connection.errorStream
        val response = stream?.bufferedReader()?.use { it.readText() } ?: ""
        connection.disconnect()
        if (code !in 200..299) {
            val message = try { JSONObject(response).optString("msg", JSONObject(response).optString("message", "HTTP $code")) }
            catch (_: Exception) { "HTTP $code" }
            throw IllegalStateException(message)
        }
        return response
    }

    fun signIn(email: String, password: String): String {
        val body = JSONObject().put("email", email).put("password", password).toString()
        val result = JSONObject(request("/auth/v1/token?grant_type=password", "POST", body))
        return result.getString("access_token")
    }

    fun listMemories(token: String): List<MemoryItem> {
        val result = JSONArray(request("/rest/v1/ayhem_memories?select=id,title,content,category&order=created_at.desc&limit=100", "GET", token = token))
        return (0 until result.length()).map { i ->
            val item = result.getJSONObject(i)
            MemoryItem(item.getString("id"), item.optString("title"), item.optString("content"), item.optString("category"))
        }
    }

    fun addMemory(token: String, title: String, content: String, category: String) {
        val body = JSONObject().put("title", title).put("content", content)
            .put("category", category).put("evidence_level", "unverified").toString()
        request("/rest/v1/ayhem_memories", "POST", body, token)
    }

    fun deleteMemory(token: String, id: String) {
        request("/rest/v1/ayhem_memories?id=eq.$id", "DELETE", token = token)
    }
}

@Composable
private fun AyhemApp(context: Context) {
    var showSplash by remember { mutableStateOf(true) }
    LaunchedEffect(Unit) { delay(2000); showSplash = false }
    MaterialTheme(colorScheme = darkColorScheme(primary = Cyan, secondary = Color(0xFF6BAEFF), background = Navy, surface = Panel, onPrimary = Navy, onBackground = Ice, onSurface = Ice)) {
        Surface(Modifier.fillMaxSize(), color = Navy) {
            if (showSplash) SplashScreen() else MainShell(context)
        }
    }
}

@Composable
private fun SplashScreen() {
    val pulse = rememberInfiniteTransition(label = "pulse")
    val scale by pulse.animateFloat(0.96f, 1.04f, infiniteRepeatable(tween(900), RepeatMode.Reverse), label = "logoPulse")
    Box(Modifier.fillMaxSize().background(Brush.verticalGradient(listOf(Navy, Color(0xFF092B55), Color(0xFF020B19)))), contentAlignment = Alignment.Center) {
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
    Box(modifier.background(Brush.radialGradient(listOf(Color(0xFF155EAA), Color(0xFF09264B), Navy)), CircleShape).padding(18.dp), contentAlignment = Alignment.Center) {
        Icon(Icons.Default.Memory, contentDescription = "AYHEM AI", tint = Cyan, modifier = Modifier.fillMaxSize())
    }
}

@Composable
private fun MainShell(context: Context) {
    var selected by remember { mutableStateOf("الرئيسية") }
    var token by remember { mutableStateOf(SecureTokenStore.read(context)) }
    var memories by remember { mutableStateOf(emptyList<MemoryItem>()) }
    var busy by remember { mutableStateOf(false) }
    var message by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()

    LaunchedEffect(token) {
        if (token != null) {
            busy = true
            try { memories = withContext(Dispatchers.IO) { AyhemCloud.listMemories(token!!) }; message = "" }
            catch (e: Exception) { message = "تعذر تحميل الذاكرة: ${e.message}" }
            finally { busy = false }
        }
    }

    Column(Modifier.fillMaxSize().background(Brush.verticalGradient(listOf(Navy, Color(0xFF0A2850), Navy))).statusBarsPadding().navigationBarsPadding().padding(horizontal = 20.dp)) {
        Spacer(Modifier.height(18.dp))
        Row(verticalAlignment = Alignment.CenterVertically) {
            BrainMark(Modifier.size(48.dp))
            Spacer(Modifier.width(12.dp))
            Column { Text("AYHEM AI", color = Color.White, fontSize = 23.sp, fontWeight = FontWeight.Bold); Text("عقلك الرقمي", color = Cyan, fontSize = 13.sp) }
            Spacer(Modifier.weight(1f))
            Icon(Icons.Default.AutoAwesome, contentDescription = null, tint = Cyan)
        }
        Spacer(Modifier.height(20.dp))
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            listOf("الرئيسية", "الذاكرة", "الأمان", "الإعدادات").forEach { item ->
                TextButton(onClick = { selected = item }) { Text(item, color = if (selected == item) Cyan else Color(0xFF9CB9D2), fontSize = 12.sp) }
            }
        }
        when (selected) {
            "الذاكرة" -> MemoryScreen(Modifier.weight(1f), token, memories, busy, message,
                onLogin = { email, password ->
                    scope.launch {
                        busy = true; message = ""
                        try {
                            val newToken = withContext(Dispatchers.IO) { AyhemCloud.signIn(email, password) }
                            SecureTokenStore.save(context, newToken)
                            token = newToken
                        } catch (e: Exception) { message = "تعذر تسجيل الدخول: ${e.message}" }
                        finally { busy = false }
                    }
                },
                onAdd = { title, content, category ->
                    scope.launch {
                        busy = true; message = ""
                        try { withContext(Dispatchers.IO) { AyhemCloud.addMemory(token!!, title, content, category) }; memories = withContext(Dispatchers.IO) { AyhemCloud.listMemories(token!!) }; message = "تم حفظ المعلومة في الذاكرة السحابية." }
                        catch (e: Exception) { message = "لم يتم الحفظ: ${e.message}" }
                        finally { busy = false }
                    }
                },
                onDelete = { id ->
                    scope.launch {
                        busy = true
                        try { withContext(Dispatchers.IO) { AyhemCloud.deleteMemory(token!!, id) }; memories = memories.filterNot { it.id == id }; message = "تم الحذف." }
                        catch (e: Exception) { message = "تعذر الحذف: ${e.message}" }
                        finally { busy = false }
                    }
                },
                onLogout = { SecureTokenStore.clear(context); token = null; memories = emptyList(); message = "تم تسجيل الخروج." }
            )
            "الأمان" -> InfoScreen("الحماية والخصوصية", "تُحمى جلسة الدخول محلياً بتشفير Android Keystore. وتُقيّد سجلات الذاكرة بسياسات RLS في Supabase.")
            "الإعدادات" -> InfoScreen("الإعدادات", "AYHEM AI 1.1 • خادم الذاكرة: Supabase • الاتصال يتطلب تسجيل الدخول.")
            else -> {
                Text("مرحباً بك", color = Color.White, fontSize = 29.sp, fontWeight = FontWeight.Bold)
                Text("مساحتك الذكية لتنظيم المعرفة والأفكار", color = Color(0xFFB7D5EA), fontSize = 15.sp)
                Spacer(Modifier.height(24.dp))
                FeatureCard("الذاكرة الرقمية", "حفظ واسترجاع المعلومات عبر Supabase", Icons.Default.Memory) { selected = "الذاكرة" }
                Spacer(Modifier.height(12.dp))
                FeatureCard("الحماية والخصوصية", "تشفير جلسة الدخول وعزل بيانات الحساب", Icons.Default.Security) { selected = "الأمان" }
                Spacer(Modifier.height(12.dp))
                FeatureCard("المساعد الذكي", "واجهة المساعد قيد الربط", Icons.Default.AutoAwesome) { message = "سيتم ربط المساعد في مرحلة لاحقة." }
                Spacer(Modifier.weight(1f))
                if (message.isNotBlank()) Text(message, color = Cyan, fontSize = 12.sp)
                Text("AYHEM AI • الإصدار 1.1", color = Color(0xFF6F8DA8), fontSize = 11.sp, modifier = Modifier.fillMaxWidth(), textAlign = TextAlign.Center)
            }
        }
    }
}

@Composable
private fun MemoryScreen(modifier: Modifier = Modifier, token: String?, memories: List<MemoryItem>, busy: Boolean, message: String,
    onLogin: (String, String) -> Unit, onAdd: (String, String, String) -> Unit, onDelete: (String) -> Unit, onLogout: () -> Unit) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var title by remember { mutableStateOf("") }
    var content by remember { mutableStateOf("") }
    var category by remember { mutableStateOf("عام") }
    Column(modifier.fillMaxWidth()) {
        Text("الذاكرة الرقمية", color = Color.White, fontSize = 24.sp, fontWeight = FontWeight.Bold)
        if (token == null) {
            Text("سجّل الدخول إلى حسابك لحفظ معلوماتك بشكل خاص.", color = Color(0xFFB7D5EA), fontSize = 13.sp)
            Spacer(Modifier.height(12.dp))
            OutlinedTextField(email, { email = it }, label = { Text("البريد الإلكتروني") }, singleLine = true, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(password, { password = it }, label = { Text("كلمة المرور") }, singleLine = true, visualTransformation = PasswordVisualTransformation(), modifier = Modifier.fillMaxWidth())
            Button(onClick = { onLogin(email.trim(), password) }, enabled = !busy && email.contains("@") && password.isNotBlank(), modifier = Modifier.fillMaxWidth()) { Text(if (busy) "جارٍ الاتصال..." else "تسجيل الدخول") }
        } else {
            Text("متصل بالذاكرة السحابية الخاصة بحسابك", color = Cyan, fontSize = 12.sp)
            Spacer(Modifier.height(8.dp))
            OutlinedTextField(title, { title = it }, label = { Text("عنوان المعلومة") }, singleLine = true, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(content, { content = it }, label = { Text("المحتوى") }, modifier = Modifier.fillMaxWidth(), minLines = 2)
            OutlinedTextField(category, { category = it }, label = { Text("التصنيف") }, singleLine = true, modifier = Modifier.fillMaxWidth())
            Button(onClick = { onAdd(title.trim(), content.trim(), category.trim()); title = ""; content = "" }, enabled = !busy && title.isNotBlank() && content.isNotBlank(), modifier = Modifier.fillMaxWidth()) {
                Icon(Icons.Default.Add, contentDescription = null); Spacer(Modifier.width(6.dp)); Text("حفظ في الذاكرة")
            }
            Spacer(Modifier.height(8.dp))
            Text("المحفوظات (${memories.size})", color = Color.White, fontWeight = FontWeight.SemiBold)
            LazyColumn(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(memories, key = { it.id }) { item ->
                    Row(Modifier.fillMaxWidth().background(Panel, RoundedCornerShape(14.dp)).padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                        Column(Modifier.weight(1f)) {
                            Text(item.title, color = Color.White, fontWeight = FontWeight.Bold)
                            Text(item.content, color = Color(0xFFB7D5EA), fontSize = 12.sp)
                            Text(item.category, color = Cyan, fontSize = 10.sp)
                        }
                        TextButton(onClick = { onDelete(item.id) }) { Text("حذف", color = Color(0xFFFF8A8A)) }
                    }
                }
            }
            TextButton(onClick = onLogout) { Text("تسجيل الخروج") }
        }
        if (message.isNotBlank()) Text(message, color = Cyan, fontSize = 12.sp)
        if (busy) LinearProgressIndicator(Modifier.fillMaxWidth(), color = Cyan)
    }
}

@Composable
private fun InfoScreen(title: String, body: String) {
    Column(Modifier.fillMaxWidth().background(Panel, RoundedCornerShape(18.dp)).padding(18.dp)) {
        Text(title, color = Color.White, fontSize = 22.sp, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(10.dp))
        Text(body, color = Color(0xFFB7D5EA), fontSize = 14.sp)
    }
}

@Composable
private fun FeatureCard(title: String, subtitle: String, icon: androidx.compose.ui.graphics.vector.ImageVector, onClick: () -> Unit) {
    Surface(onClick = onClick, modifier = Modifier.fillMaxWidth(), color = Panel, shape = RoundedCornerShape(20.dp)) {
        Row(Modifier.padding(18.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(Modifier.size(46.dp).background(Color(0xFF103B68), RoundedCornerShape(14.dp)), contentAlignment = Alignment.Center) { Icon(icon, contentDescription = null, tint = Cyan) }
            Spacer(Modifier.width(14.dp))
            Column { Text(title, color = Color.White, fontWeight = FontWeight.SemiBold, fontSize = 16.sp); Spacer(Modifier.height(3.dp)); Text(subtitle, color = Color(0xFFA9C7DF), fontSize = 12.sp) }
        }
    }
}
