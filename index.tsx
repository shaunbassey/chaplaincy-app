
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

/**
 * Initializes the React application by mounting it to the 'root' element.
 * Includes a check to ensure the DOM is ready if the element isn't found immediately.
 */
const mountApp = () => {
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    if (document.readyState === 'loading') {
      // If the document is still loading, wait for it to finish.
      document.addEventListener('DOMContentLoaded', mountApp);
    } else {
      // If the document is loaded and 'root' is still missing, log an error.
      console.error("Critical Error: The 'root' element was not found in the DOM. Please ensure index.html contains <div id='root'></div>.");
    }
    return;
  }

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

// Start the mounting process
mountApp();
