import React, {useState, useEffect} from 'react';
import "../styles/PlayingCards.css";
import axios from 'axios';
import PlayingSpecialCards from "./PlayingSpecialCards.js";
import Modal from 'react-modal';

Modal.setAppElement('#root');

const PlayingCards = ({roomCode, card, action, setSelectedCard}) => {
    const player = JSON.parse(localStorage.getItem('player'));

    const [players, setPlayers] = useState([]);
    const [isSpecial, setIsSpecial] = useState(false);

    const [playerIdWhereKill, setPlayerIdWhereKill] = useState();
    const [playerIdToMovePeasantCards, setPlayerIdToMovePeasantCards] = useState();
    const [playerIdToMove, setPlayerIdToMove] = useState();
    
    const [nextPlayer, setNextPlayer] = useState([]);
    const [prevPlayer, setPrevPlayer] = useState([]);

    const [cardDescription, setCardDescription] = useState();


    const [modalAlertIsOpen, setmodalAlertIsOpen] = useState(false);

    const [cardIdPlay, setCardIdPlay] = useState();

    const [message, setMessage] = useState('');
    const [data, setData] = useState([]);
    const [groupedData, setGroupedData] = useState([]);
    const [selectedGroupCards, setSelectedGroupCards] = useState({});
    const [handleName, setHandleName] = useState('');
    const [showModalWithOneChoise, setShowModalWithOneChoise] = useState(false);
    const [showMultiChoiceModal, setShowMultiChoiceModal] = useState(false);

    const handleActions = {
        handleCureEpidemic: (item) => {
            handleCureEpidemic(item.id);
            setShowModalWithOneChoise(false);
        },
        handleStealCrusadePoints: (item) => {
            handleStealCrusadePoints(item.id);
            setShowModalWithOneChoise(false);
        },
        handleChoiseCourtKill: (item) => {
            handleChoiseCourtKill(item.id);
            setShowModalWithOneChoise(false);
        },
        handleResetCard: (item) => {
            handleResetCard(item.id);
            setShowModalWithOneChoise(false);
        },
        handleKillCourt: (item) => {
            handleKillCourt(item.id);
            setShowModalWithOneChoise(false);
        },
        handleDeleteCardAndGetCrusadePoints: (item) => {
            handleDeleteCardAndGetCrusadePoints(item.id);
            setShowModalWithOneChoise(false);
        },
        handleSendCourtCrusaderNeighbor: (item) => {
            handleSendCourtCrusaderNeighbor(item.player_id, item.card_id);
            setShowModalWithOneChoise(false);
        },
        handleMoveCard: (item) => {
            const playerId = item.other_player_id || item.player_id;
            const cardId = item.id_card_in_deck || item.card_id;

            handleMoveCard(playerId, cardId);
            setShowModalWithOneChoise(false);
        },
        handleChoiseCardToMove: (item) => {
            handleChoiseCardToMove(item.value);
            setShowModalWithOneChoise(false);
        },
        handleSwapCards: (selected) => {
            const entries = Object.entries(selected);
            if (entries.length === 2) {
            const [[p1, c1], [p2, c2]] = entries;
            handleSwapCards(p1, c1, p2, c2);
            } else {
            alert("Не выбраны две карты");
            }
            setShowMultiChoiceModal(false);
        },
        handleMovePeasantCard: (selected) => {
            Object.entries(selected).forEach(([player_id, card_id]) => {
                handleMovePeasantCard(card_id, player_id);
            });
            setShowMultiChoiceModal(false);
        },
        handleMoveCardMany:(selected) => {
            Object.entries(selected).forEach(([player_id, card_id]) => {
                handleMoveCard(player_id, card_id);
            });
        },
    };


    const fetchPlayers = async() => {
        try {
            const response_players = await axios.get(
                `http://192.168.1.66:8000/api/rooms/${roomCode}/players/`
            );

            setPlayers(response_players.data);
        } catch(error){
            console.error("Ошибка получения пользователей:", error);
        }
    };

    useEffect(() => {
        fetchPlayers();
        setCardDescription(card.card_data.description);
    }, [roomCode, player.id]);

    useEffect(() => {
        if (card.card_group_in_deck === "universal") {
            setIsSpecial(true);
        }
    }, [card]);

    const handleClickItem = async(pl) => {
        if((card.card_data.description === "require_discard_to_settle" && pl.id !== player.id) || (card.card_data.description !== "require_discard_to_settle")){
            try {
                const responce = await axios.post(
                    `http://192.168.1.66:8000/api/rooms/${roomCode}/player/add-played-card/`,{
                        'player_id': pl.id,
                        'id_card_in_deck': card.id,
                    }
                );

                if(responce.data.epidemics){
                    setMessage(responce.data.message);
                    setData(responce.data.epidemics);
                    setHandleName(responce.data.handle);
                    setShowModalWithOneChoise(true);
                    return;
                }

                if(responce.data.court_cards){
                    setMessage(responce.data.message);
                    setData(responce.data.court_cards);
                    setHandleName(responce.data.handle);
                    setShowModalWithOneChoise(true);
                    setPlayerIdWhereKill(responce.data.player_id_where_kill);
                    return;
                }

                if(responce.data.monks){
                    setMessage(responce.data.message);
                    setData(responce.data.monks);
                    setHandleName(responce.data.handle);
                    setShowModalWithOneChoise(true);
                    setPlayerIdToMove(responce.data.player_id_to_move);
                    return;
                }

                if(responce.data.commoner_crusader_cards){
                    setMessage(responce.data.message);
                    setData(responce.data.commoner_crusader_cards);
                    setHandleName(responce.data.handle);
                    setShowModalWithOneChoise(true);
                    setPlayerIdToMove(responce.data.player_id_to_move);
                    return;
                }

                if(responce.data.available_groups){
                    setMessage(responce.data.message);
                    setData(responce.data.available_groups);
                    setHandleName(responce.data.handle);
                    setShowModalWithOneChoise(true);
                    setNextPlayer(responce.data.neighbors.next_player);
                    setPrevPlayer(responce.data.neighbors.prev_player);
                    return;
                }

                if(responce.data.players_with_court){
                    setMessage(responce.data.message);
                    setData(responce.data.players_with_court);
                    setHandleName(responce.data.handle);
                    setShowModalWithOneChoise(true);

                    return;
                }

                if(responce.data.cards_women_neighbors){
                    const cardsObj = responce.data.cards_women_neighbors;
                    const groups = [
                        {
                            title: `Город: ${cardsObj.next_player.player_city_name}`,
                            group_key: cardsObj.next_player.player_id,
                            cards: cardsObj.next_player.cards
                        },
                        {
                            title: `Город: ${cardsObj.prev_player.player_city_name}`,
                            group_key: cardsObj.prev_player.player_id,
                            cards: cardsObj.prev_player.cards
                        }
                    ];
                    setPlayerIdToMove(responce.data.player_id_to_move);

                    setMessage(responce.data.message);
                    setGroupedData(groups);
                    setHandleName(responce.data.handle);
                    setSelectedGroupCards({});
                    setShowMultiChoiceModal(true);

                    return;
                }

                if(responce.data.all_played_cards){
                    setMessage(responce.data.message);
                    setData(responce.data.all_played_cards);
                    setHandleName(responce.data.handle);
                    setShowModalWithOneChoise(true);

                    setPlayerIdWhereKill(responce.data.player_id);
                    return;
                }

                if(responce.data.players_have_crusade_points){
                    setMessage(responce.data.message);
                    setData(responce.data.players_have_crusade_points);
                    setHandleName(responce.data.handle);
                    setShowModalWithOneChoise(true);

                    setPlayerIdToMove(responce.data.player);
                    return;
                }

                if(responce.data.court_crusader_neighbor){
                    setMessage(responce.data.message);
                    setData(responce.data.court_crusader_neighbor);
                    setHandleName(responce.data.handle);
                    setShowModalWithOneChoise(true);
                    setPlayerIdToMove(responce.data.player_id);
                    return;
                }

                if(responce.data.baby_kill_cards){
                    setMessage(responce.data.message);
                    setData(responce.data.baby_kill_cards);
                    setHandleName(responce.data.handle);
                    setShowModalWithOneChoise(true);
                    setPlayerIdToMove(responce.data.player_id);
                    return;
                }
            } catch(error){
                console.error("Ошибка при добавлении карты в город (при розыгрыше): ", error);
            }
            try {
                await axios.delete(
                    `http://192.168.1.66:8000/api/rooms/${roomCode}/player/delete-hand-card/`,{
                        data: {
                            'player_id': player.id,
                            'id_card_in_deck': card.id,
                        }
                        
                    }
                );
            } catch(error){
                console.error("Ошибка при удалении карты с руки: ", error);
            }
            action();
            setSelectedCard(null);
        }
        else if(card.card_data.description === "require_discard_to_settle" && pl.id === player.id){
            try{
                const response = await axios.post(
                    `http://192.168.1.66:8000/api/rooms/${roomCode}/require-discard-to-settle/`,
                    {
                        'player_id': player.id,
                        'card_id': card.id
                    }
                );
                if(response.data.can_play === false){
                    setmodalAlertIsOpen(true);
                    return;
                }
                else if(response.data.can_play && response.data.cards_hand){
                    setMessage(response.data.message);
                    setData(response.data.cards_hand);
                    setHandleName(response.data.handle);
                    setShowModalWithOneChoise(true);
                    setCardIdPlay(response.data.card_id_play);
                    return;
                }
                action();
                setSelectedCard(null);
            } catch(error){
                console.error("Ошибка при розыгрыше карты в своем городе",error);
            }
        }
    };

    const handleCureEpidemic = async (epidemicId) => {
        try {
            await axios.post(`http://192.168.1.66:8000/api/rooms/${roomCode}/cure-epidemic/`, {
                epidemic_id: epidemicId,
            });

            try {
                await axios.delete(
                    `http://192.168.1.66:8000/api/rooms/${roomCode}/player/delete-hand-card/`,{
                        data: {
                            'player_id': player.id,
                            'id_card_in_deck': card.id,
                        }
                        
                    }
                );
            } catch(error){
                console.error("Ошибка при удалении карты с руки: ", error);
            }
            
            action();
            setSelectedCard(null);
        } catch (error) {
            console.error("Ошибка при лечении эпидемии:", error);
        }
    };

    const handleKillCourt = async (courtCardId) => {
        try{
            const responce = await axios.post(`
                http://192.168.1.66:8000/api/rooms/${roomCode}/kill-court/`, 
                {
                    'player_id_where_kill': playerIdWhereKill,
                    'id_card_in_deck': courtCardId,
                    'card_description': cardDescription,
                    'player_id': player.id
                }
            );

            if(responce.data.next_player && responce.data.prev_player){
                const groups = [
                    {
                        title: `Город: ${responce.data.next_player.city_name}`,
                        group_key: responce.data.next_player.id,
                        cards: responce.data.next_player.peasant_cards.map(card => ({
                            card_id: card.id,
                            card_name: card.name,
                        }))
                    },
                    {
                        title: `Город: ${responce.data.prev_player.city_name}`,
                        group_key: responce.data.prev_player.id,
                        cards: responce.data.prev_player.peasant_cards.map(card => ({
                            card_id: card.id,
                            card_name: card.name,
                        }))
                    }
                ];

                setMessage(responce.data.message);
                setGroupedData(groups);
                setHandleName('handleMovePeasantCard');
                setSelectedGroupCards({});
                setShowMultiChoiceModal(true);
                setPlayerIdToMovePeasantCards(responce.data.player_id_to_move);
                return;
            }
            else{
                try {
                    await axios.delete(
                        `http://192.168.1.66:8000/api/rooms/${roomCode}/player/delete-hand-card/`,{
                            data: {
                                'player_id': player.id,
                                'id_card_in_deck': card.id,
                            }
                            
                        }
                    );

                    action();
                    setSelectedCard(null);
                } catch(error){
                    console.error("Ошибка при удалении карты с руки: ", error);
                }
            }
        }catch(error){
            console.error("Ошибка при удалении карты придворного: ", error);
        }
    };

    const handleMovePeasantCard = async (peasantCardId, fromPlayerId) => {

        try{
            await axios.post(`http://192.168.1.66:8000/api/rooms/${roomCode}/move-peasant-card/`, {
                'player_id_from_move': fromPlayerId,
                'player_id_to_move': playerIdToMovePeasantCards,
                'id_card_in_deck': peasantCardId,
            });

            try {
                await axios.delete(
                    `http://192.168.1.66:8000/api/rooms/${roomCode}/player/delete-hand-card/`,{
                        data: {
                            'player_id': player.id,
                            'id_card_in_deck': card.id,
                        }
                        
                    }
                );

                action();
                setSelectedCard(null);
            } catch(error){
                console.error("Ошибка при удалении карты с руки: ", error);
            }

        } catch(error){
            console.error("Ошибка при перемещении карты простолюдина: ", error);
        }
    };

    const handleMoveCard = async(player_id_from_move, card_id) => {
        try{
            await axios.post(
                `http://192.168.1.66:8000/api/rooms/${roomCode}/move-card/`,
                {
                    'player_id_from_move': player_id_from_move,
                    'player_id_to_move': playerIdToMove,
                    'card_id': card_id
                }
            );

            try {
                await axios.delete(
                    `http://192.168.1.66:8000/api/rooms/${roomCode}/player/delete-hand-card/`,{
                        data: {
                            'player_id': player.id,
                            'id_card_in_deck': card.id,
                        }
                        
                    }
                );

                action();
                setSelectedCard(null);
            } catch(error){
                console.error("Ошибка при удалении карты с руки: ", error);
            }
        }catch(error){
            console.error("Ошибка при перещении карты Монах: ", error);
        }
    };

    const handleChoiseCardToMove = async(group) => {        
        const response = await axios.post(
            `http://192.168.1.66:8000/api/rooms/${roomCode}/choise-card-to-move/`,
            {
                'next_player_id': nextPlayer.player_id,
                'prev_player_id': prevPlayer.player_id,
                'card_group': group
            }
        );

        if(response.data.cards_group_neighbors){
            // setCardsGroupNeighbors(response.data.cards_group_neighbors);
            // setShowCardsGroupNeighborsModal(true);

            const neighbors = response.data.cards_group_neighbors;

            const groups = [
                {
                    title: `Город: ${neighbors.next_player.player_city_name}`,
                    group_key: neighbors.next_player.player_id,
                    cards: neighbors.next_player.cards
                },
                {
                    title: `Город: ${neighbors.prev_player.player_city_name}`,
                    group_key: neighbors.prev_player.player_id,
                    cards: neighbors.prev_player.cards
                }
            ];

            setMessage(response.data.message);
            setGroupedData(groups);
            setHandleName(response.data.handle);
            setSelectedGroupCards({});
            setShowMultiChoiceModal(true);
        }
    };

    const handleSwapCards = async(next_player_id, next_player_card_id, prev_player_id, prev_player_card_id) => {
        await axios.post(
            `http://192.168.1.66:8000/api/rooms/${roomCode}/swap-cards/`,
            {
                'next_player_id': next_player_id,
                'next_player_card_id': next_player_card_id,
                'prev_player_id': prev_player_id,
                'prev_player_card_id': prev_player_card_id
            }
        );

        try {
            await axios.delete(
                `http://192.168.1.66:8000/api/rooms/${roomCode}/player/delete-hand-card/`,{
                    data: {
                        'player_id': player.id,
                        'id_card_in_deck': card.id,
                    }
                    
                }
            );

            action();
            setSelectedCard(null);
        } catch(error){
            console.error("Ошибка при удалении карты с руки: ", error);
        }
    };

    const handleChoiseCourtKill = async(player_id) => {
        const responce = await axios.post(
            `http://192.168.1.66:8000/api/rooms/${roomCode}/choise-court-kill/`,
            {
                'player_id': player_id
            }
        );

        if(responce.data.court_cards){
            setMessage(responce.data.message);
            setData(responce.data.court_cards);
            setHandleName(responce.data.handle);
            setShowModalWithOneChoise(true);
            setPlayerIdWhereKill(responce.data.player_id_where_kill);
            return;
        }
    };

    const handleDeleteCardAndGetCrusadePoints = async (card_id) => {
        try{
            await axios.post(
                `http://192.168.1.66:8000/api/rooms/${roomCode}/delete-card-and-get-crusade-points/`,
                {
                    'player_id': playerIdWhereKill,
                    'card_id': card_id
                }
            );

            await axios.delete(
                `http://192.168.1.66:8000/api/rooms/${roomCode}/player/delete-hand-card/`,{
                    data: {
                        'player_id': player.id,
                        'id_card_in_deck': card.id,
                    }
                    
                }
            );

            action();
            setSelectedCard(null);
            
        } catch(error){
            console.error("Ошибка при удалении карты и получении ко: ", error);
        }
    };

    const handleStealCrusadePoints = async (pl_id) => {
        try{
            await axios.post(
                `http://192.168.1.66:8000/api/rooms/${roomCode}/steal-crusade-points/`,
                {
                    'player_id_from': pl_id,
                    'player_id_to': playerIdToMove,
                }
            );

            await axios.delete(
                `http://192.168.1.66:8000/api/rooms/${roomCode}/player/delete-hand-card/`,{
                    data: {
                        'player_id': player.id,
                        'id_card_in_deck': card.id,
                    }
                    
                }
            );

            action();
            setSelectedCard(null);
        } catch(error){
            console.error("Ошибка при воровстве ко: ", error);
        }
    };

    const handleSendCourtCrusaderNeighbor = async (player_id_from, card_id) => {
        try{
            await axios.post(
                `http://192.168.1.66:8000/api/rooms/${roomCode}/send-court-crusade/`,
                {
                    'player_id_from': player_id_from,
                    'card_id': card_id,
                    'player_id_to': playerIdToMove
                }
            );

            await axios.delete(
                `http://192.168.1.66:8000/api/rooms/${roomCode}/player/delete-hand-card/`,{
                    data: {
                        'player_id': player.id,
                        'id_card_in_deck': card.id,
                    }
                    
                }
            );

            action();
            setSelectedCard(null);
        }catch(error){
            console.error("Ошибка при отправке придворного в крестовый поход: ", error);
        }
    };

    const handleResetCard = async(card_id) => {
        await axios.post(
            `http://192.168.1.66:8000/api/rooms/${roomCode}/reset-card/play-require-discard-to-settle/`,
            {
                'card_id': card_id,
                'player_id': player.id,
                'card_id_play': cardIdPlay
            }
        );
        action();
        setSelectedCard(null);
    };


    if(isSpecial){
        return (
            <PlayingSpecialCards 
                roomCode = {roomCode} 
                card = {card} 
                setIsSpecial = {setIsSpecial}
            />
        )
    }

    return(
        <>
        <Modal
            isOpen={modalAlertIsOpen}
            onRequestClose={() => setmodalAlertIsOpen(false)}
            contentLabel="Уведомление"
            className="modal"
            overlayClassName="modal-overlay"
            >
            <h2>Карту нельзя разыграть в своем городе, так как нет карт для сброса</h2>
        </Modal>

        <Modal 
        isOpen={showModalWithOneChoise} 
        onRequestClose={() => setShowModalWithOneChoise(false)}
        className="modal"
        overlayClassName="modal-overlay"
        >
        <h2>{message}</h2>
        {data.map(item => (
            <button key={item.card_id || item.id} onClick={() => handleActions[handleName]?.(item)}>
            <p>{item.card_name || item.name || item.label || item.other_player_city_name}</p>
            </button>
        ))}
        </Modal>

        <Modal 
        isOpen={showMultiChoiceModal} 
        onRequestClose={() => setShowMultiChoiceModal(false)}
        className="modal"
        overlayClassName="modal-overlay"
        >
        <h2>{message}</h2>
        {groupedData.map((group, i) => (
            <div key={i}>
            <h3>{group.title}</h3>
            {group.cards.map(card => (
                <label key={card.card_id}>
                <input
                    type="radio"
                    name={group.group_key}
                    value={card.card_id}
                    checked={selectedGroupCards[group.group_key] === card.card_id}
                    onChange={() =>
                    setSelectedGroupCards(prev => ({
                        ...prev,
                        [group.group_key]: card.card_id
                    }))
                    }
                />
                {card.card_name}
                </label>
            ))}
            </div>
        ))}

        <button onClick={() => handleActions[handleName]?.(selectedGroupCards)}>
            <p>Подтвердить</p>
        </button>
        </Modal>

          
        <div className='playing-cards'>
            <h2>Выберите город, в котором хотите разыграть <span className='accent'>{card.name}</span>:</h2>
            <div className='list-players'>
                {card.card_data.play_only_in_own_city ? (
                    <div
                    className='item-player'
                    key = {player.id}
                    onClick={() => {handleClickItem(player)}}>
                        {player.city_name}
                    </div>
                ) : (
                    (players.length > 0) ? (
                        players.map((value, i) => (
                            <div 
                            className='item-player' 
                            key={i}
                            onClick={() => {handleClickItem(value)}}>
                                {value.city_name}
                            </div>
                        ))
                    ) : (
                        <div>Загрузка данных...</div>
                    )
                )}
            </div>
        </div>
        </>
    )
}

export default PlayingCards;