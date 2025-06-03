import React, {useState, useEffect} from 'react';
import './styles/Game.css';
import PlayersCity from './components/PlayersCity.js';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Game = () => {
    const navigate = useNavigate();
    
    const pathParts = window.location.pathname.split('/');
    const roomCode = pathParts[pathParts.length - 1];

    const [players, setPlayers] = useState(0);
    const [cards, setCards] = useState([]);

    const [currentPlayerId, setCurrentPlayerId] = useState(null);

    const [crusadePoints, setCrusadePoints] = useState();
    const [countRelics, setCountRelics] = useState();

    useEffect(() => {
        const socket = new WebSocket(`ws://192.168.1.66:8000/ws/rooms/${roomCode}/`);

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.action === "player_change") {
                setCurrentPlayerId(data.payload.id);
            }
            if(data.action === "crossroad_update"){
                setCards(data.payload);
            }
            if(data.action === "crusade_points_update"){
                setCrusadePoints(data.payload);
            }
            if(data.action === "count_relics_update"){
                setCountRelics(data.payload);
            }
            if(data.action === "changed_status_room"){
                if(data.payload === "finished"){
                    navigate(`/end-game/${roomCode}`);
                }
            }
        };
        const fetchPlayers = async () => {
            try {
                const response = await axios.get(`http://192.168.1.66:8000/api/rooms/${roomCode}/players/`);
                setPlayers(response.data);
            } catch (error) {
                console.error("Ошибка получения списка игроков", error);
            }
        };

        fetchPlayers();

        return () => {
            socket.close();
        };

    }, [roomCode]);

    useEffect(() => {
        const fetchCards = async () => {
            try {
                const r = await axios.get(`http://192.168.1.66:8000/api/cards/deck/${roomCode}/crossroad/`);
                setCards(r.data);
            } catch (error) {
                console.error("Ошибка получения первых трех карт", error);
            }
        };


        const fetchCrusadePoints = async () => {
            try{
                const r = await axios.get(`http://192.168.1.66:8000/api/rooms/${roomCode}/crusade-points-view/`);
                setCrusadePoints(r.data);
            } catch (error){
                console.error("Ошибка получения очков крестового похода", error);
            }
        };

        const fetchCountRelics = async () => {
            try{
                const r = await axios.get(`http://192.168.1.66:8000/api/rooms/${roomCode}/count-relics-view/`);
                setCountRelics(r.data);
            } catch (error){
                console.error("Ошибка получения количества реликвий", error);
            }
        };

        fetchCards();
        fetchCrusadePoints();
        fetchCountRelics();
    }, [roomCode]);

    useEffect(() => {
        const fetchCurrentPlayer = async () => {
            try {
                const response_current_player = await axios.get(`http://192.168.1.66:8000/api/rooms/${roomCode}/current-player/`);
                setCurrentPlayerId(response_current_player.data.id);
            } catch (err) {
                console.error("Не удалось получить текущего игрока:", err);
            }
        };
        fetchCurrentPlayer();
    }, [roomCode]);

    const renderPlayerCities = () => {
        const cities = [];

        for(let i = 0; i < players.length; i++){
            cities.push(
              <PlayersCity
                  key={players[i].id}
                  player={players[i]}
                  isCurrent={players[i].id === currentPlayerId}
                  roomCode={roomCode}
              />
            );
        }

        return cities;
    };

    const renderThreeCards = () => {
        if(cards.length > 0){
            return cards.map((card, index) => (
                <div key={index} className='deck-cards'>
                    <img src={card.card_data.image} />
                </div>
            ));
        }
        
    }
  

    return(
        <div className='Game'>    
            {renderPlayerCities()}        
            <div className='central-panel'>
                <div className='crusade-points'>
                    <img src='/images/crusade_points.png'/>
                    <div className='text-info'>
                        <h3>{crusadePoints}</h3>
                        <div>очков крестового<br/> похода</div>
                    </div>
                </div>
                <div className='cross-road'>
                    <img src="/images/deck_cards.png"/>
                    {renderThreeCards()}
                </div>
                <div className='relics-info'>
                    <div className='text-info'>
                        <h3>{countRelics}</h3>
                        <div>количество<br/> реликвий</div>
                    </div>
                    <img src="/images/relic.png"/>
                    
                </div>
            </div>
        </div>
    )
}

export default Game;