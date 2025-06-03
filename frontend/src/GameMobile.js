import React, {useState, useEffect} from 'react';
import PlayersCity from './components/PlayersCity.js';
import PlayerTurn from './components/PlayerTurn.js';
import './styles/GameMobile.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';


const GameMobile = () =>{
    const navigate = useNavigate();

    const pathParts = window.location.pathname.split('/');
    const roomCode = pathParts[pathParts.length - 2];

    const player = JSON.parse(localStorage.getItem('player'));

    const [currentPlayerId, setCurrentPlayerId] = useState(null);

    useEffect(() => {
        const socket = new WebSocket(`ws://192.168.1.66:8000/ws/rooms/${roomCode}/`);

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.action === "player_change") {
                console.log("Текущий пользовать изменился");
                setCurrentPlayerId(data.payload.id);
            }
            if(data.action === "changed_status_room"){
                if(data.payload === "finished"){
                    navigate(`/end-game/${roomCode}`);
                }
            }
        };
        
        const fetchCurrentPlayer = async () => {
          try {
            const response_current_player = await axios.get(`http://192.168.1.66:8000/api/rooms/${roomCode}/current-player/`);
            setCurrentPlayerId(response_current_player.data.id);
          } catch (err) {
            console.error("Не удалось получить текущего игрока:", err);
          }
        };
      
        fetchCurrentPlayer();

        return () => {
            socket.close();
        };
    }, [roomCode]);

    return(
        <div className='GameMobile'>
            {player.id === currentPlayerId ? (
                <PlayerTurn 
                    player={player} 
                    roomCode={roomCode}
                />
            ) : (
                <PlayersCity
                    player={player}
                    isCurrent={player.id === currentPlayerId}
                    roomCode={roomCode}
                />
            )}
        </div>
    )
}

export default GameMobile;