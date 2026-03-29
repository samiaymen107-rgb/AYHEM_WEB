import React, { useEffect, useState } from 'react';

const repos = [
  "AYHEM_WEB",
  "AYHEM",
  "AYHEM_WEB_CLONE"
];

function App() {
  const [data, setData] = useState([]);
  const [status, setStatus] = useState("جاهز");

  // جلب بيانات المستودعات من GitHub API
  const fetchRepos = async () => {
    setStatus("جاري جلب البيانات...");
    try {
      const results = await Promise.all(
        repos.map(repo =>
          fetch(`https://api.github.com/repos/samiaymen107-rgb/${repo}`)
            .then(res => res.json())
        )
      );
      setData(results);
      setStatus("✅ تم الربط بجميع المستودعات");
    } catch (err) {
      setStatus("❌ فشل الاتصال");
    }
  };

  useEffect(() => {
    fetchRepos();
  }, []);

  return (
    <div style={{ padding: "20px", fontFamily: "Arial", background: "#f4f4f4" }}>
      <h1>AYHEM – النظام المركزي</h1>
      <p>{status}</p>

      <button onClick={fetchRepos} style={{ padding: "10px", marginBottom: "20px" }}>
        إعادة المزامنة
      </button>

      {data.map(repo => (
        <div key={repo.id} style={{
          background: "#fff",
          padding: "15px",
          marginBottom: "10px",
          borderRadius: "8px",
          boxShadow: "0 2px 5px rgba(0,0,0,0.1)"
        }}>
          <h2>{repo.name}</h2>
          <p>{repo.description}</p>
          <p>⭐ Stars: {repo.stargazers_count}</p>
          <p>🍴 Forks: {repo.forks_count}</p>
          <a href={repo.html_url} target="_blank">فتح المستودع</a>
        </div>
      ))}
    </div>
  );
}

export default App;
