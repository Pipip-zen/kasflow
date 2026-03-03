import { Routes, Route } from 'react-router-dom'

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
      <Routes>
        <Route path="/" element={
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4 text-green-600">Welcome to KasFlow</h1>
            <p className="text-lg text-muted-foreground">App routes are configured successfully.</p>
          </div>
        } />
        {/* Add more routes here, e.g., <Route path="/login" element={<Login />} /> */}
      </Routes>
    </div>
  )
}

export default App
