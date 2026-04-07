import React from 'react';
import Radar from './Radar.jsx';

function Index() {
  return (
    <div className="App">
      <header style={{ padding: '20px', textAlign: 'center', background: '#FFD700' }}>
        <h1>SamaTaxi Driver App 🇸🇳</h1>
      </header>
      <main style={{ maxWidth: '600px', margin: '20px auto' }}>
        <Radar />
      </main>
    </div>
  );
}
export default Index;
