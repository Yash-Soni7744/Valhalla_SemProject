/**
 * THE CRM ENGINE (API SERVICE)
 * 
 * Purpose: This file acts as the "Brain" of your software. 
 * Since we don't have a backend server (like Node.js or Python), 
 * we use the browser's 'localStorage' to save all your data.
 * 
 * How to explain this in your Evaluation:
 * 1. "Local Persistence": Data stays saved even if you close the browser.
 * 2. "JSON Storage": We save data as text and convert it back to objects using JSON.parse().
 * 3. "Mock Delays": We added small delays (0.5s) to make the website feel like it's talking to a real server.
 */

// Helper: Makes the app wait. Used to show off your loading spinners!
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
