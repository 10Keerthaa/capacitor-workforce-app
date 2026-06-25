const fs = require("fs");
const path = require("path");

const formsDir = path.join(__dirname, "components/forms");
const files = fs.readdirSync(formsDir).filter(f => f.endsWith(".tsx"));

files.forEach(file => {
  const filePath = path.join(formsDir, file);
  let code = fs.readFileSync(filePath, "utf8");
  
  // Find the table name from the insert statement
  const tableMatch = code.match(/supabase\.from\(['"]([^'"]+)['"]\)\.insert/);
  if (!tableMatch) return;
  const tableName = tableMatch[1];
  
  // Replace the generic catch/fetch logic with the fallback logic
  code = code.replace(/\.catch\(\s*err\s*=>\s*console\.error\([^)]+\)\s*\);?/, `.then(async (res) => {
            if (!res.ok) {
              await supabase.from('${tableName}').update({
                agent_status: 'pending_manager_review',
                agent_metadata: { error: true, reason: '?? System Error: AI Overloaded. Rerouted to Manual Review.' }
              }).eq('id', data[0].id);
              alert("? Record Saved.\\n\\n?? The AI Assistant is currently experiencing high traffic. Your request has been securely routed directly to the Manager for manual approval.");
            }
          }).catch(async (err) => {
            console.error("Agent call failed:", err);
            await supabase.from('${tableName}').update({
              agent_status: 'pending_manager_review',
              agent_metadata: { error: true, reason: '?? System Error: AI Connection Failed. Rerouted to Manual Review.' }
            }).eq('id', data[0].id);
          });`);
          
  fs.writeFileSync(filePath, code);
  console.log("Patched", file);
});
