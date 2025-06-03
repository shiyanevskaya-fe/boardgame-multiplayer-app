import logo from './logo.svg';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Home.js';
import Connection from './Connection.js';
import JoinRoom from './JoinRoom.js';
import WaitingRoom from './WaitingRoom.js';
import Game from './Game.js';
import GameMobile from './GameMobile.js';
import EndGame from './EndGame.js';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/connection" element={<Connection />} />
        <Route path="/join/:code" element={<JoinRoom />}/>
        <Route path="/waiting/:code" element={<WaitingRoom />}/>
        <Route path="/game/:code" element={<Game />}/>
        <Route path="/game/:code/player" element={<GameMobile />}/>
        <Route path="/end-game/:code/" element={<EndGame />}/>
      </Routes>
    </Router>
  );
}

export default App;
