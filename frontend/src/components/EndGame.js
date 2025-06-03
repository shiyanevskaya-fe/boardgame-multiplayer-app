import React from 'react';
import '../styles/EndGame.css';

const EndGame = () => {
    return(
        <div id="end-game">
            <h2>конец игры</h2>
            <div className='end-game-container'>
                <div className='end-game-step1 item'>
                    <div className='item-content'>
                        <h3>когда игра заканчивается?</h3>
                        <div>Игра заканчивается, если:</div>
                        <div>1) К концу чьего-то хода в городе любого игрока оказывается 10 жителей.</div>
                        <div>2) Колода исчерпана (сброс не замешивается обратно в колоду).</div>
                    </div>
                </div>
                <div className='end-game-step2 item'>
                    <div className='item-content'>
                        <h3>подсчет очков</h3>
                        <div>
                            Очки жителей города складываются с Реликвиями, если они есть. Побеждает тот, у кого больше всех очков.
                        </div>
                        <div>
                            При равном количестве очков побеждает тот, у кого больше Реликвий. При равном количестве Реликвий сравниваются очки Крестового Похода. При равном количестве очков Крестового Похода сравнивается количество жителей.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default EndGame;
