const express = require("express");
const path = require("path");
const app = express();
const PORT = 8080;

// خدمة الملفات الثابتة
app.use(express.static(path.join(__dirname,"..","ayhem_dashboard")));

app.listen(PORT, ()=>console.log(`Dashboard ready at http://localhost:${PORT}`));
