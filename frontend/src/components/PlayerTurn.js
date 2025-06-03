import React, {useEffect, useState} from 'react';
import "../styles/PlayerTurn.css";
import axios from 'axios';
import SelectFromCrossRoad from "./SelectFromCrossRoad.js";
import PlayerCardsDisplay from "./PlayerCardsDisplay.js";


const PlayerTurn = ({ player, roomCode }) => {
    const [status, setStatus] = useState(null);
    const [handCards, setHandCards] = useState([]);
    const [isCrossroad, setIsCrossroad] = useState(false);

    const fetchTurn = async () => {
        try {
            const response_player_status = await axios.post(
                `http://192.168.1.66:8000/api/rooms/${roomCode}/player/status/`,
                {
                    'room_code': roomCode,
                    'player_id': player.id
                }
            );

            const player_status = response_player_status.data;
            setStatus(player_status);

            try{
                const response_player_hand = await axios.get(
                    `http://192.168.1.66:8000/api/rooms/${roomCode}/players/${player.id}/hand/`
                );
    
                const playerHand = response_player_hand.data;
                setHandCards(playerHand);
                console.log(response_player_hand.data);

                if(player_status === "set_cards"){
                    if(playerHand.length === 0){
                        try {
                            const response_top_card_from_deck = await axios.get(
                                `http://192.168.1.66:8000/api/cards/deck/${roomCode}/top/`
                            );
        
                            const top_card_from_deck = response_top_card_from_deck.data;
        
                            try {
                                await axios.post(
                                    `http://192.168.1.66:8000/api/rooms/${roomCode}/players/${player.id}/add-hand-card/${top_card_from_deck.id}/`, {
                                        'id_card_in_deck': top_card_from_deck.id,
                                    }
                                ); 

                                setIsCrossroad(true);
                            } catch(error){
                                console.error("Ошибка при добавлении карты:", error);
                            }
                        } catch(error_top_card){
                            console.error("Ошибка при получении верхней карты из колоды:", error_top_card);
                        }
                    }
                } else if(player_status === "playing_cards"){
                    if(playerHand.length === 0){
                        await axios.post(
                            `http://192.168.1.66:8000/api/rooms/${roomCode}/player/status/edit/`, {
                                'room_code': roomCode,
                                'player_id': player.id,
                                'new_status': "waiting"
                            }
                        );

                        await axios.post(
                            `http://192.168.1.66:8000/api/rooms/${roomCode}/epidemic/`, {
                                'player_id': player.id,
                            }
                        );

                        await axios.get(
                            `http://192.168.1.66:8000/api/rooms/${roomCode}/end-game/check/`
                        ); 

                        await axios.get(
                            `http://192.168.1.66:8000/api/rooms/${roomCode}/current-player/edit/`
                        );

                                             
                    }
                }
            } catch(error_hand){
                console.error("Ошибка получения карт игрока:", error_hand);
            }
        } catch(error_player_status){
            console.error("Ошибка при получении статуса игрока: ", error_player_status);
        }
    };

    useEffect(() => {
        fetchTurn();
    }, [roomCode, player.id]);

    const handleCardSelect = async() => {
        await fetchTurn();
    };

    if(status === "set_cards"){
        return(
            <SelectFromCrossRoad
                roomCode={roomCode}
                onCardSelect={handleCardSelect}
                player={player}
            />
        )
    }

    if(status === "playing_cards"){
        return(
            <PlayerCardsDisplay 
                cards={handCards} 
                roomCode = {roomCode}
                action = {handleCardSelect}
            />
        )
    }

    return (
        <div className="player-turn">
            <div>Загрузка данных...</div>
        </div>
    );
}
  

export default PlayerTurn;