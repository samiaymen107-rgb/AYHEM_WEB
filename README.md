import React from 'react';

// Header ذكي
const Header = () => (
  <header style={{ background: '#111', color: '#00bfff', textAlign: 'center', padding: '25px' }}>
    <h1>AYHEM_WEB – أول عقل رقمي حي</h1>
    <p>واجهة ذكية متكاملة مع البيانات القديمة والحالية</p>
  </header>
);

// شريط تنقل ذكي
const Nav = () => {
  const links = [
    {name:'التثبيت', href:'#installation'},
    {name:'الميزات', href:'#features'},
    {name:'المعمارية', href:'#architecture'},
    {name:'المساهمة', href:'#contribute'},
    {name:'استكشاف الأخطاء', href:'#errors'},
    {name:'المزامنة الذكية', href:'#sync'}
  ];
  return (
    <nav style={{ display: 'flex', justifyContent: 'center', gap: '20px', background: '#222', padding: '10px' }}>
      {links.map(l => <a key={l.href} href={l.href} style={{ color:'#fff', textDecoration:'none', fontWeight:'bold' }}>{l.name}</a>)}
    </nav>
  );
};

// قسم عام
const Section = ({ id, title, children }) => (
  <section id={id} style={{ background:'#fff', borderRadius:'12px', margin:'15px 0', padding:'20px', boxShadow:'0 3px 8px rgba(0,0,0,0.12)' }}>
    <h2>{title}</h2>
    {children}
  </section>
);

// زر مزامنة ذكي
const SyncButton = () => {
  const [status, setStatus] = React.useState('');
  const sync = async () => {
    setStatus('جاري المزامنة الذكية...');
    try {
      await new Promise(res => setTimeout(res, 2000)); // محاكاة عملية المزامنة
      setStatus('✅ تمت المزامنة مع جميع المستودعات والذاكرة الدائمة!');
    } catch {
      setStatus('❌ حدث خطأ أثناء المزامنة.');
    }
  };
  return (
    <div>
      <button onClick={sync} style={{ padding:'12px 18px', border:'none', borderRadius:'6px', background:'#00bfff', color:'#fff', cursor:'pointer', fontWeight:'bold' }}>بدء المزامنة الذكية</button>
      <p>{status}</p>
    </div>
  );
};

// Footer
const Footer = () => (
  <footer style={{ textAlign:'center', padding:'15px', background:'#222', color:'#aaa' }}>
    &copy; 2026 AYHEM – أول عقل رقمي حي
  </footer>
);

// التطبيق الرئيسي المدمج
function App() {
  return (
    <div style={{ fontFamily:'Arial, sans-serif', margin:0, padding:0, background:'#f9f9f9', color:'#222' }}>
      <Header />
      <Nav />
      <main style={{ maxWidth:'1200px', margin:'auto', padding:'20px' }}>
        
        <Section id="installation" title="تعليمات التثبيت">
          <ol>
            <li>تأكد من تثبيت Node.js على جهازك.</li>
            <li>قم بتنزيل المشروع عبر <code>git clone https://github.com/samiaymen107-rgb/AYHEM_WEB.git</code></li>
            <li>انتقل إلى مجلد المشروع عبر <code>cd AYHEM_WEB</code></li>
            <li>قم بتثبيت الاعتماديات عبر <code>npm install</code></li>
          </ol>
        </Section>

        <Section id="features" title="ميزات المشروع">
          <ul>
            <li>واجهة مستخدم تفاعلية وسهلة الاستخدام.</li>
            <li>دعم للغات متعددة.</li>
            <li>أداء عالي مع إمكانية التخصيص.</li>
          </ul>
        </Section>

        <Section id="architecture" title="تفاصيل المعمارية">
          <p><strong>Frontend:</strong> React.js لواجهة المستخدم.</p>
          <p><strong>Backend:</strong> Node.js + Express لتعزيز أداء الخادم.</p>
        </Section>

        <Section id="contribute" title="إرشادات المساهمة">
          <ol>
            <li>قم بعمل Fork للمشروع.</li>
            <li>أنشئ فرعًا جديدًا (<code>git checkout -b feature/اسم-الميزة</code>)</li>
            <li>قم بتقديم تغييراتك (<code>git commit -m 'إضافة ميزة جديدة'</code>)</li>
            <li>ادفع الفرع إلى مستودعك (<code>git push origin feature/اسم-الميزة</code>)</li>
            <li>افتح طلب سحب.</li>
          </ol>
        </Section>

        <Section id="errors" title="قسم استكشاف الأخطاء">
          <ul>
            <li><strong>لم يتمكن من تثبيت الاعتماديات:</strong> تأكد من أن لديك الإصدارة الصحيحة من Node.js.</li>
            <li><strong>الأخطاء عند تشغيل التطبيق:</strong> تحقق من تسجيلات الأخطاء في وحدة التحكم.</li>
            <li><strong>التطبيق لا يستجيب:</strong> تحقق من اتصالك بالإنترنت أو جرب إعادة تشغيل التطبيق.</li>
          </ul>
          <p>إذا واجهت أي مشكلة، فلا تتردد في طرح الأسئلة في قسم المشكلات على GitHub.</p>
        </Section>

        <Section id="sync" title="المزامنة الذكية مع أيهم">
          <SyncButton />
        </Section>

      </main>
      <Footer />
    </div>
  );
}

export default App;
