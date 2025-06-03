import React, {useEffect, useState} from 'react';
import "../styles/PlayersCity.css";
import axios from 'axios';

const PlayersCity = ({ player, isCurrent, roomCode }) => {
    const [cards, setCards] = useState([]);
    const [cardsActiveEpidemic, setCardsActiveEpidemic] = useState([]);

    const [crusadePoints, setCrusadePoints] = useState(0);
    const [countRelics, setCountRelics] = useState(0);

    const fetchPlayedCard = async() => {
        try{
            const played_cards = await axios.post(
            `http://192.168.1.66:8000/api/rooms/${roomCode}/player/played-cards/`,{
                'player_id': player.id
            });
            setCards(played_cards.data.played_cards);
            setCardsActiveEpidemic(played_cards.data.epidemics);
        } catch(error){
            console.error("Ошибка при получении сыгранных карт в городе", error);
        }
    
    };

    const fetchCrusadePoints = async () => {
            try{
                const r = await axios.post(`http://192.168.1.66:8000/api/rooms/${roomCode}/player/crusade-points-view/`,
                    {
                        'player_id': player.id
                    }
                );
                setCrusadePoints(r.data);
            } catch (error){
                console.error("Ошибка получения очков крестового похода", error);
            }
        };

    const fetchCountRelics = async () => {
        try{
            const r = await axios.post(`http://192.168.1.66:8000/api/rooms/${roomCode}/player/count-relics-view/`,
                {
                    'player_id': player.id
                }
            );
            setCountRelics(r.data);
        } catch (error){
            console.error("Ошибка получения количества реликвий", error);
        }
    };

    useEffect(()=>{
        const socket = new WebSocket(`ws://192.168.1.66:8000/ws/rooms/${roomCode}/`);
        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.action === "changed_played_cards") {
                if(data.payload.id === player.id){
                    setCards(data.payload.played_cards);
                    console.log(data.payload);
                    setCardsActiveEpidemic(data.payload.epidemics);
                }
            }
            if(data.action === "changed_player_crusade_points"){
                if(data.player_id === player.id){
                    setCrusadePoints(data.payload);
                }
            }
            if(data.action === "changed_player_count_relics"){
                if(data.player_id === player.id){
                    setCountRelics(data.payload);
                }
            }
        };

        fetchPlayedCard();

        fetchCrusadePoints();
        fetchCountRelics();

        return () => {
            socket.close();
        };
    }, [roomCode, player.id]);

    return (
      <div className={`players-city ${isCurrent ? "current-player" : ""}`}>
        <div className='players-info'>
            <div className='about-player'>
                <div className='names'>
                    <div className='player-name'>{player.name}</div>
                    <div className='name-city'>{player.city_name}</div>
                </div>
                <div className='crusade-info'>
                    <div className='crusade-points-info'>
                        <h3>{crusadePoints}</h3>
                        <div>очков крестового<br/> похода</div>
                    </div>
                    <div className='relics-info'>
                        <h3>{countRelics}</h3>
                        <div>количество<br/> реликвий</div>
                    </div>
                </div>
            </div>
            
                        
            <div className='hotbed_epidemic'>
                {(cardsActiveEpidemic != null) ? (
                    cardsActiveEpidemic.map((card_epidemic, i)=>(
                        (card_epidemic.hotbed_city === player.id ? (
                            <img src={card_epidemic.hotbed_image}/>
                        ) : (
                            <div></div>
                        ))
                ))
                ) : (
                    <div></div>
                )}
            </div>
        </div>

        <div className='city-info'>
            <div className='epidemic-maps'>
                {cards
                .filter(card => card.card_data.card_group_in_deck === 'epidemic')
                .map((card, i) => (
                    <img key={`epedemic-${i}`} src={card.card_data.image} alt="" />
                ))}
            </div>

            <div className='maps-residents'>
                <div className='courtiers'>
                    {cards
                    .filter(card => card.card_data.card_group_in_deck === 'court')
                    .map((card, i) => (
                        <img key={`courtiers-${i}`} src={card.card_data.image} alt="" />
                    ))}
                </div>

                <div className='priests'>
                    {cards
                    .filter(card => card.card_data.card_group_in_deck === 'priest')
                    .map((card, i) => (
                        <img key={`priests-${i}`} src={card.card_data.image} alt="" />
                    ))}
                </div>

                <div className='commoners'>
                    {cards
                    .filter(card => card.card_data.card_group_in_deck === 'peasant')
                    .map((card, i) => (
                        <img key={`commoners-${i}`} src={card.card_data.image} alt="" />
                    ))}
                </div>
            </div>
        </div>
      </div>
    );
};
  

export default PlayersCity;