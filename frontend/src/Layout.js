import React, { useState, useEffect } from 'react';

const Layout = ({ children }) => {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    if (dark) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [dark]);

  return (
    <div className="min-h-screen relative">
      <button
        className="absolute top-4 right-4 px-3 py-2 rounded bg-light-accent text-white dark:bg-dark-accent"
        onClick={() => setDark(!dark)}
      >
        {dark ? 'Light' : 'Dark'}
      </button>
      {children}
    </div>
  );
};

export default Layout;
