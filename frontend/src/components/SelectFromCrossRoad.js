import React, {useEffect, useState} from 'react';
import "../styles/PlayerTurn.css";
import axios from 'axios';
import "../styles/SelectFromCrossRoad.css";
import Button from "./Button.js";
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';

const SelectFromCrossRoad = ({roomCode, onCardSelect, player}) => {
    const [cards, setCards] = useState([]);

    useEffect(() => {
        const fetchCards = async () => {
            try {
              const response_crossroad = await axios.get(`http://192.168.1.66:8000/api/cards/deck/${roomCode}/crossroad/`);
              setCards(response_crossroad.data);
              console.log(response_crossroad.data);
            } catch (error) {
              console.error("Ошибка получения карт с перекрестка", error);
            }
        };

        fetchCards();

    }, [roomCode]);

    const handleSelect = async (card) => {
        console.log(`id_card_in_deck: ${card.id}`);
        await axios.post(`http://192.168.1.66:8000/api/cards/deck/${roomCode}/update-crossroad/`,{
            'id_card_in_deck': card.id,
        });
        await axios.post(
            `http://192.168.1.66:8000/api/rooms/${roomCode}/players/${player.id}/add-hand-card/${card.id}/`, {
                'id_card_in_deck': card.id,
            }
        );
        await axios.post(
            `http://192.168.1.66:8000/api/rooms/${roomCode}/player/status/edit/`, {
                'room_code': roomCode,
                'player_id': player.id,
                'new_status': "playing_cards"
            }
        );
        onCardSelect();
    }

    return (
        <div className="select-from-crossroad">
            <h2>Выберите карту с перекрестка:</h2>

            <Swiper slidesPerView={1} loop={true}>
                {(cards.length > 0) ? (
                    cards.map((card, i) => (
                        <SwiperSlide key={i}>
                            <img src={card.card_data.image} />
                            <Button text="Выбрать" onClick={() => handleSelect(card)}/>
                        </SwiperSlide>
                    ))
                ) : (
                    <div>Получаем данные...</div>
                )}
            </Swiper>
            <h4>*Свапай в стороны, чтобы посмотреть все варианты</h4>
        </div>
    );
      
};
  

export default SelectFromCrossRoad;