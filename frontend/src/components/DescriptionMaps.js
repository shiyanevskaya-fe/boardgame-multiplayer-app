import React from 'react';
import '../styles/DescriptionMaps.css';

const DescriptionMaps = () =>{
    return (
        <div id="description-maps">
            <h2>Описание карт</h2>
            <div className='description-maps-desciption'>
                Жители делятся на три сословия. Карты нужно выкладывать в ряд сословия,
                к которому они принадлежат.
            </div>

            <div className='description-maps-container'>
                <div className='map'>
                    <div className='map-content'>
                        <img src="./images/class_courtiers.png"/>
                        <div>
                            <h4>Придворные</h4> - рыцари, благородные девы и все те, кто им прислуживает. Ставьте персонажей с <span className='red'>красным</span> флажком в верхний ряд.
                        </div>
                    </div>
                </div>    
                <div className='map'>
                    <div className='map-content'>
                        <img src="./images/inquisitor.png" />
                        <div>
                            <h4>Священники</h4> - все те, кто день и ночь молится за благополучие города. Ставьте персонажей с <span className='blue'>синим</span> флажком в средний ряд.
                        </div>
                    </div>
                </div>
                <div className='map'>
                    <div className='map-content'>
                        <img src="./images/peasant.png"/>
                        <div>
                            <h4>Простолюдины</h4> - палачи, крестьяне и все, кому не повезло. Ставьте персонажей с <span className='green'>зелёным</span> флажком в нижний ряд.
                        </div>
                    </div>
                </div>
                <div className='map'>
                    <div className='map-content'>
                        <img src="./images/grey_card.png"/>
                        <div>
                            Те, кто по воле случая может оказаться в любом сословии. Ставьте персонажей с <span className='gray'>серым</span> флажком, куда захочешь.
                        </div>
                    </div> 
                </div>
                <div className='designations-on-maps'>
                    <h3>обозначения на картах</h3>
                    <div className='map-content'>
                        <div>
                            <img src="../icons/ic_po.png"/>
                            Числа на флажках - победные очки (ПО). Именно их количество определит победителя в конце игры.
                        </div>
                        <div>
                            <img src="../icons/ic_cg.png"/>
                            Число справа - очки Крестового Похода. Если у персонажа есть этот значок, то он считается Крестоносцем. Если нет, то он - мирный житель.
                        </div>
                        <div>
                            <img src="../icons/ic_im.png"/>
                            Число внизу - иммунитет. Чем меньше это значение, тем раньше персонаж умрет во время Эпидемии.
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
    )
}

export default DescriptionMaps;