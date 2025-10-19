import config from "./config"

export default function App() {
  const handle = () => {
    fetch(`${config.apiUrl}/v1/users/1`)
      .then(response => response.json())
      .then(data => console.log(data))
      .catch(error => console.error(error))
  }

  return (
    <button onClick={handle}>Test</button>
  )
}