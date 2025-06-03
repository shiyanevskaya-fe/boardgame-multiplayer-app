import React, { useEffect, useState }  from 'react';
import '../styles/ConnectionScreen.css';
import Button from './Button.js';
import {QRCodeSVG} from 'qrcode.react';
import axios from 'axios';
import Modal from 'react-modal';
import { useNavigate } from 'react-router-dom';

Modal.setAppElement('#root');
 
const ConnectionScreen = ({roomData}) => {
    const navigate = useNavigate();

    const roomLink = `http://192.168.1.66:3000/join/${roomData.code}`;

    const [players, setPlayers] = useState([]);

    const [modalDeleteIsOpen, setmodalDeleteIsOpen] = useState(false);
    const [modalAlertIsOpen, setmodalAlertIsOpen] = useState(false);
    const [selectedPlayer, setSelectedPlayer] = useState(null);

    if(roomData.status === 'in_progress'){
        navigate(`/game/${roomData.code}`);
    }

    useEffect(() => {
        const fetchPlayers = async () => {
          try {
            const response = await axios.get(`http://192.168.1.66:8000/api/rooms/${roomData.code}/players/`);
            setPlayers(response.data);
          } catch (error) {
            console.error("Ошибка получения списка игроков", error);
          }
        };
    
        const interval = setInterval(fetchPlayers, 2000);
        fetchPlayers();
    
        return () => clearInterval(interval);
    }, [roomData.code]);

    const handleRemovePlayer = async (playerId) => {
        try {
            await axios.delete(`http://192.168.1.66:8000/api/rooms/${roomData.code}/players/${playerId}/delete/`);
            setPlayers(players.filter(player => player.id !== playerId));
        } catch (error) {
          console.error("Ошибка при удалении игрока", error);
        }
    };

    const getCSRFToken = () => {
        const cookies = document.cookie.split('; ');
        const csrfToken = cookies.find(row => row.startsWith('csrftoken=')).split('=')[1];
        return csrfToken;
    };

    const handleStartGame = async () => {
        if(players.length < 3){
            setmodalAlertIsOpen(true);
        }
        else{
            const csrfToken = getCSRFToken();

            await axios.post(`http://192.168.1.66:8000/api/rooms/${roomData.code}/start/`,
                {
                    room_code: roomData.code
                },
                {
                    headers: {
                        'X-CSRFToken': csrfToken
                    }, 
                    withCredentials: true 
                })
            .then(response => {
                navigate(`/game/${roomData.code}`);
            })
            .catch(error => {
                console.error("Ошибка подключения:", error.response?.data || error.message);
            });
        }
    };
      

    return(
        <>
        <Modal
            isOpen={modalDeleteIsOpen}
            onRequestClose={() => setmodalDeleteIsOpen(false)}
            contentLabel="Подтверждение удаления"
            className="modal"
            overlayClassName="modal-overlay"
            >
            <h2>Удалить игрока "{selectedPlayer?.name}"?</h2>
            <div className="modal-buttons">
                <button onClick={async () => {
                    await handleRemovePlayer(selectedPlayer.id);
                    setmodalDeleteIsOpen(false);
                }}>Удалить</button>
                <button onClick={() => setmodalDeleteIsOpen(false)}>Отмена</button>
            </div>
        </Modal>
        <Modal
            isOpen={modalAlertIsOpen}
            onRequestClose={() => setmodalAlertIsOpen(false)}
            contentLabel="Уведомление"
            className="modal"
            overlayClassName="modal-overlay"
            >
            <h2>Игра доступна для 3-4 человек</h2>
        </Modal>
        <div id="connection-screen">
            <div className='info-block'>
                <div className='connection-method'>
                    <div className='connection-qr'>
                        <QRCodeSVG value={roomLink} size={256} />
                    </div>
                    <div className='connection-href'>
                        <h3>ссылка для подключения:</h3>
                        <div>{roomLink}</div>
                    </div>
                </div>

                <div className='waiting-room'>
                    <div className='players-panel'>
                        <h3>участники:</h3>
                        <div className='connected-players'>
                            {players.map(player => (
                                <div 
                                key={player.id} 
                                className='player-card'
                                onClick={() => {
                                    setSelectedPlayer(player);
                                    setmodalDeleteIsOpen(true);
                                }}
                                >{player.name}</div>
                            ))}
                        </div>
                    </div>
                    <Button text="Начать" onClick={handleStartGame}/>
                </div>
            </div>
        </div>
        </>
    );
}

export default ConnectionScreen;
