import React, { useState, useEffect } from 'react';

function Navbar() {
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    document.body.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <nav className="fixed top-0 w-full bg-gray-800 text-white p-4 flex justify-center items-center z-10">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-bold">Tutor</h1>
        <button onClick={toggleTheme} className="px-4 py-2 rounded">
          {isDarkMode ? (
            <span role="img" aria-label="Modo Claro">☀️</span>
          ) : (
            <span role="img" aria-label="Modo Escuro">🌙</span>
          )}
        </button>
      </div>
    </nav>
  );
}

export default Navbar;