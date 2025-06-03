import React, { useEffect } from "react";
import './styles/WaitingRoom.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';


const WaitingRoom = () => {
    const pathParts = window.location.pathname.split('/');
    const roomCode = pathParts[pathParts.length - 1];

    const navigate = useNavigate();

    useEffect(() => {
        const interval = setInterval(() => {
          axios.get(`http://192.168.1.66:8000/api/rooms/${roomCode}/status/`)
            .then(response => {
              if (response.data === "in_progress") {
                clearInterval(interval);
                navigate(`/game/${roomCode}/player`);
              }
            })
            .catch(error => {
              console.error("Ошибка при получении статуса комнаты:", error);
            });
        }, 3000); 
    
        return () => clearInterval(interval); 
      }, [roomCode, navigate]);

    return(
        <div className="WaitingRoom">
            <div id="waiting-room">
                <div className="info-block">
                    <h3>ожидание <br/>  начала игры</h3>
                </div>
            </div>
        </div>
    )
}

export default WaitingRoom;