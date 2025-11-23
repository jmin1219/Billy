import { useEffect, useState } from 'react';
import { initDB } from './db/init';
import './App.css';

function App() {
  const [dbStatus, setDbStatus] = useState<string>('Initializing...');
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    async function testDB() {
      try {
        // Initialize database first
        const db = await initDB();
        
        // Test 1: Insert a task
        await db.query(`
          INSERT INTO nodes (title, energy, interest)
          VALUES ('Test Task', 3, 4)
        `);

        // Test 2: Read it back
        const result = await db.query('SELECT * FROM nodes');
        setTasks(result.rows);
        setDbStatus('✅ Database working!');
      } catch (error) {
        setDbStatus(`❌ Error: ${error}`);
        console.error(error);
      }
    }
    
    testDB();
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Billy - Database Test</h1>
      <p>{dbStatus}</p>
      <h3>Tasks in database:</h3>
      <pre>{JSON.stringify(tasks, null, 2)}</pre>
    </div>
  );
}

export default App;