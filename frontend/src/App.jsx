import React, {useEffect, useState} from 'react'
import './styles/App.css'
import axios from 'axios';

function App() {

  const [message, setMessage] = useState("Loading...");

  useEffect(() => {
    axios.get("http://localhost:8000")
      .then(response => setMessage(response.data.message))
      .catch(error => setMessage(error))
  }, [])

  return (
    <React.Fragment>
      <h1>Watermark CMS</h1>
      <p>{message}</p>
    </React.Fragment>
  )
}

export default App
