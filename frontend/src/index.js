import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';  // importa o TailwindCSS
import App from './App';
import Layout from './Layout';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Layout>
      <App />
    </Layout>
  </React.StrictMode>
);
