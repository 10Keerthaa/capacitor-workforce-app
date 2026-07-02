const url = "https://vfkuorrjumhithwupxkt.supabase.co/rest/v1/master_materials?select=*&limit=5";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZma3VvcnJqdW1oaXRod3VweGt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3NTU5MzAsImV4cCI6MjA5NzMzMTkzMH0.3PcmQSmJbhzZVO1wWaMcZG4TDl_aJApKMJ-jmTek_u8";

fetch(url, {
  headers: {
    "apikey": key,
    "Authorization": `Bearer ${key}`
  }
})
.then(res => res.json())
.then(data => {
  console.log(JSON.stringify(data, null, 2));
})
.catch(err => console.error(err));
