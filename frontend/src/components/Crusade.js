import React from 'react';
import '../styles/Crusade.css';

const Crusade = () => {
    return (
        <div id="crusade">
            <h2>Крестовый поход</h2>
            <div className='crusade-desciption'>
                Крестовые Походы занимали особое место в жизни средневековых воинов. Жители городов, которые могли держать оружие, должны были откликнуться на призыв и отправиться в боевой Поход к вечной славе и богатству. В нашей игре самым храбрым воинам достанется одна из священных Реликвий. Обычно в Крестовый Поход выдвигаются <span className='accent-text'>Крестоносцы</span>.
            </div>
            <div className='crusade-container'>
                <div className='crusade-step1 item'>
                    <div className='item-content'>
                        <h3>как начать крестовый поход?</h3>
                        <div>
                            Крестовый поход начинается, когда разыгрывается житель со свойством “Отправляет в Крестовый Поход”
                        </div>
                    </div>
                    
                </div>
                <div className='crusade-step1 image'>
                    <img src="images/crusade_maps.png"/>
                </div>
                <div className='crusade-step2 item'>
                    <div className='item-content'>
                        <h3>как происходит крестовый поход?</h3>
                        <div className='crusade-step2-content'>
                            <div className='column'>
                                <div>1) Когда разыгрывается карта, город, к которому относится этот житель, отправляет своих Крестоносцев на Священную Войну.</div>
                                <div>
                                    <span className='accent-text'>Важно</span>: Епископ отправляет все города в Поход.
                                </div>
                            </div>
                            <div className='column'>
                                <div>2) Карты Крестоносцев сбрасываются. Подсчитывается сумма очков Крестого Похода всех крестоносцев этого города.</div>
                                <div>3) Игрок получает жетоны Крестового Похода.</div>
                                <div><span className='accent-text'>Важно</span>: Если общая сумма - отрицательная, то игрок возвращает жетоны на Святую Землю.</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className='crusade-step3 image'>
                    <img src="images/relics.png"/>
                </div>
                <div className='crusade-step3 item'>
                    <div className='item-content'>
                        <h3>Захват Святой земли</h3>
                        <div>
                            Когда на столе заканчиваются очки Крестового похода, Святая Земля считается захваченной. Игрок с самым большим количеством очков Крестового Похода получает карту Реликвий.
                        </div>
                        <div>
                            Карта Реликвий принесет обладателю дополнительные победные очки при подсчете в конце игры.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Crusade;