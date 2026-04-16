import React from 'react';
import '../styles/pages.css';

function Home() {
  return (
    <div className="home">
      <header className="header">
        <h1>Welcome to HnH TV</h1>
        <p>Your favorite streaming platform</p>
      </header>
      <main className="main-content">
        <section>
          <h2>Get Started</h2>
          <p>This is a MERN Stack application. Start building your features!</p>
        </section>
      </main>
    </div>
  );
}

export default Home;
