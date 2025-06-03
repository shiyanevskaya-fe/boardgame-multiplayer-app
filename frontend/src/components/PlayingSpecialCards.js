import React, {useState, useEffect} from 'react';
import "../styles/PlayingCards.css";
import axios from 'axios';

const PlayingSpecialCards = ({roomCode, card, setIsSpecial}) => {
    const player = JSON.parse(localStorage.getItem('player'));

    const handleClickItem = async(name_group) => {
        await axios.post(
            `http://192.168.1.66:8000/api/cards/deck/${roomCode}/edit-group/`,{
                'id_card_in_deck': card.id,
                'new_group': name_group
            }
        );
        setIsSpecial(false);
    }

    return(
        <div className='playing-special-cards'>
            <h2>Выберите сословие, в которое хотите разыграть <span className='accent'>{card.name}</span>:</h2>
            <div className='list-estates'>
                <div className='item-estate' onClick={() => handleClickItem("court")}>Придворные</div>
                <div className='item-estate' onClick={() => handleClickItem("priest")}>Священники</div>
                <div className='item-estate' onClick={() => handleClickItem("peasant")}>Простолюдины</div>
            </div>
            
        </div>
    )
}

export default PlayingSpecialCards;