import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './styles/EndGamePage.css'; // Импорт стилей

const EndGame = () => {
    const pathParts = window.location.pathname.split('/');
    const roomCode = pathParts[pathParts.length - 1];

    const [tableScore, setTableScore] = useState([]);

    useEffect(() => {
        const fetchScores = async () => {
            try {
                const response = await axios.get(`http://192.168.1.66:8000/api/rooms/${roomCode}/game/results/`);
                setTableScore(response.data.table_score);
            } catch (error) {
                console.error('Ошибка при получении результатов игры:', error);
            }
        };

        fetchScores();
    }, [roomCode]);

    return (
        <div className="endgame-container">
            <h2>Конец игры</h2>
            <table className="endgame-table">
                <thead>
                    <tr>
                        <th>Город</th>
                        <th>Игрок</th>
                        <th>Очки</th>
                    </tr>
                </thead>
                <tbody>
                    {tableScore.map((player, index) => (
                        <tr key={player.id}>
                            <td>{player.city_name}</td>
                            <td>{player.name}</td>
                            <td>{player.score}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default EndGame;
