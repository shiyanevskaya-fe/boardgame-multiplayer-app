import React, { useEffect, useState } from 'react';
import Button from './components/Button.js';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './styles/JoinRoomScreen.css';

const JoinRoom = () => {
    const [name, setName] = useState('');

    const pathParts = window.location.pathname.split('/');
    const roomCode = pathParts[pathParts.length - 1];

    const navigate = useNavigate();

    useEffect(() => {
        axios.get(`http://192.168.1.66:8000/api/rooms/${roomCode}/check-session/`, {
            withCredentials: true
        })
        .then(response => {
            if (response.data.exists) {
                console.log(response.data);
                const status = response.data.room_status;
                if (status === "created") {
                    navigate(`/waiting/${roomCode}`);
                } else if (status === "in_progress") {
                    navigate(`/game/${roomCode}`);
                }
            }
        })
        .catch(err => {
            console.error("Ошибка при проверке сессии:", err);
        });
    }, [roomCode]);

    const handleJoinRoom = () => {
        const input_name = document.querySelector("input[name=player_name]");
        const hidden_hint = document.querySelector("div.hidden-hint");

        console.log(input_name);

        if(!name){
            input_name.style.border = "2px solid #990000";
            hidden_hint.style.display = "block";
        }
        else{
            input_name.style.border = "none";
            hidden_hint.style.display = "none";

            axios.post('http://192.168.1.66:8000/api/rooms/join/', {
                name: name,
                room_code: roomCode
            },{
                withCredentials: true
            }
            )
            .then(response => {
                localStorage.setItem('player', JSON.stringify(response.data));
                navigate(`/waiting/${roomCode}`);
            })
            .catch(error => {
                if (error.response && error.response.status === 403) {
                    alert("Вы уже присоединились к этой комнате с этого устройства.");
                } else if (error.response.status === 400 && error.response.data.error === "Комната переполнена") {
                    alert("Комната переполнена. Максимум 4 игрока.");
                }else {
                    console.error("Ошибка подключения:", error.response?.data || error.message);
                }
            });
        }

        
    }
    
    return(
        <div className="JoinRoom">
            <div id="join-room-screen">
                <div className='info-block'>
                    <h3>Подключение к комнате</h3>
                    <div className='form-join'>
                        <div>
                            <div>Имя:</div>
                            <input type="text" name="player_name" onChange={(e) => setName(e.target.value)}/>
                            <div className='hidden-hint'>Поле не может быть пустым</div>
                        </div>
                        <Button text="присоединиться" onClick={handleJoinRoom}/>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default JoinRoom;