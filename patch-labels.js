const fs = require("fs");
const path = require("path");

const formsDir = path.join(__dirname, "components/forms");
const files = fs.readdirSync(formsDir).filter(f => f.endsWith(".tsx"));

files.forEach(file => {
  const filePath = path.join(formsDir, file);
  let code = fs.readFileSync(filePath, "utf8");
  
  if (code.includes('Date (YYYY-MM-DD)')) {
      code = code.replace(/Date \(YYYY-MM-DD\)/g, "Date");
      fs.writeFileSync(filePath, code);
      console.log("Patched label in", file);
  }
});
