import React, {useEffect, useState} from 'react';
import "../styles/PlayerTurn.css";
import axios from 'axios';
import "../styles/SelectFromCrossRoad.css";
import Button from "./Button.js";
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import PlayingCards from "./PlayingCards.js";


const PlayerCardsDisplay = ({roomCode, cards, action}) => {
    const [selectedCard, setSelectedCard] = useState(null);

    const handlePlayCard = (card) => {
        setSelectedCard(card);
    };

    if (selectedCard != null) {
        return <PlayingCards card={selectedCard} roomCode={roomCode} action = {action} setSelectedCard={setSelectedCard}/>;
    }

    return (
        <div className="player-cards-display">
            <h2>Выберите карту, которую хотите разыграть:</h2>

            <Swiper slidesPerView={1} loop={true}>
                {cards.map((card, i) => (
                    <SwiperSlide key={i}>
                        <img src={card.card_data.image} alt={card.card_data.name} />
                        <Button text="Выбрать" onClick={() => handlePlayCard(card)}/>
                    </SwiperSlide>
                ))}
            </Swiper>
            <h4>*Свапай в стороны, чтобы посмотреть все варианты</h4>
        </div>
    );
      
};
  

export default PlayerCardsDisplay;