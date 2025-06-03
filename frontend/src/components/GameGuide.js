import React, { useState } from "react";
import "../styles/GameGuide.css";
import DiceRoll from "./DiceRoll";

const GameGuide = () => {
    const [hoveredStep, setHoveredStep] = useState(null);

    return (
        <div id="game-guide">
            <div className="wrapper">
                <h2>как играть онлайн?</h2>
                <div className="game-guide-description">
                    Смартфон - ваш личный «средневековый арсенал», где вы видите свои карты, ресурсы и выбираете действия.
                </div>
                <div className="steps-game">
                    {[1, 2, 3].map((value) => (
                        <div
                            key={value}
                            className="step-game"
                            onMouseEnter={() => setHoveredStep(value)}
                            onMouseLeave={() => setHoveredStep(null)}
                        >
                            <DiceRoll value={value} isHovered={hoveredStep === value} />
                            <h4>{value === 1 ? "Создайте комнату" : value === 2 ? "Соберите друзей" :  "Начните игру"}</h4>
                            <div className="step-text">
                                {value === 1 
                                    ? "Создайте комнату с помощью дополнительного устройства" 
                                    : value === 2 
                                    ? "Отсканируйте с мобильных устройств QR-код" 
                                    : "Нажмите кнопку 'играть', когда все будут в сборе"}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default GameGuide;
