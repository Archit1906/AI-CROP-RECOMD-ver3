import fs from 'fs';

async function test() {
  try {
    const res = await fetch('http://localhost:8000/api/weather/Chennai');
    const data = await res.text();
    console.log("STATUS:", res.status);
    console.log("DATA TYPE:", typeof data);
    console.log("DATA LENGTH:", data.length);
    console.log("DATA START:", data.substring(0, 100));
  } catch (e) {
    console.error("ERROR:", e);
  }
}

test();
