import React from 'react';
import '../styles/CourseGame.css';

const CourseGame = () =>{
    return (
        <div id="course-game">
            <div className='course-game-description'>
                <h2>Ход игры</h2>
                <div>
                    Каждый игрок ходит по очереди. <br/>
                    Каждый ход состоит из нескольких этапов:
                </div>
            </div>
            <div className='course-game-container'>
                <div className='course-game-step1 item'>
                    <div className='item-content'>
                        <div>
                            <h4>1 этап</h4>
                            <h3>Набор карт</h3>
                        </div>
                        <div>
                            1) Автоматически получаете одну верхнюю карту из колоды.
                        </div>
                        <div>
                            2) Вибираете одну из трех карт, лежащих на перекрестке.
                        </div>
                    </div>
                </div>
                <div className='course-game-step1 image'>
                    <img src="images/crossroad.png"/>
                    <div>Перекресток - это три карты, лежащие в открытую рядом с колодой</div>
                </div>
                <div className='course-game-step2 item'>
                    <div className='item-content'>
                        <div className='course-game-step2-title'>
                            <h4>2 этап</h4>
                            <h3>Розыгрыш карт</h3>
                        </div>

                        <div className='description'>
                            <div className='column'>
                                <div>
                                    1) Выберите одну карту из своей руки и выложите ее в свой или чужой город.
                                </div>
                                <div>
                                    2) Если у карты есть знак (➶) (мгновенное свойство), то сразу же примените
                                    его.
                                </div>
                            </div>

                            <div className='column'>
                                <div>
                                    3) Выберите и разыграйте следующую карту по тем же правилам.
                                </div>
                                <div>
                                    4) Если в процессе хода вы получили дополнительные карты, то продолжайте
                                    разыгрывать их до тех пор, пока карты у вас на руке не закончатся.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className='course-game-step3 item'>
                    <div className='item-content'>
                        <h3>во время розыгрыша карт важно, что</h3>
                        <div className='column'>
                            <div>
                                1) Карты можно разыгрывать в любом порядке.
                            </div>
                            <div>
                                2) Нельзя скидывать карты в сброс просто потому, что они вам не нравятся.
                            </div>
                            <div>
                                3) Все карты должны быть выложены в города или использованы.
                            </div>
                        </div>
                    </div>
                </div>
                <div className='course-game-step4 item'>
                    <div className='item-content'>
                        <div className='course-game-step4-title'>
                            <h4>3 этап</h4>
                            <h3>Эпидемия</h3>
                        </div>
                        <div className='description'>
                            <div className='column'>
                                В конце хода игрока, в чьём городе бушует Эпидемия, начинают умирать люди. По умолчанию, первыми умирают жители с самым низким
                                значением иммунитета. Но некоторые Эпидемии работают иначе.
                            </div>
                            <div className='column'>
                                Например, Лепра сначала убивает Священников. Это значит, что сначала болезнь будет убивать всех жителей из сословия Священники,
                                а затем начнёт убивать остальных жителей по обычным правилам.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className='course-game-background-image'>
                <img src="images/example_move.png"/>
            </div>
        </div>
        
    )
}

export default CourseGame;