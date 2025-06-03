import React, { useState, useEffect } from 'react';
import '../styles/RulesGame.css';
import CourseGame from './CourseGame.js';
import DescriptionMaps from './DescriptionMaps.js';
import Epidemic from './Epidemic.js';
import Crusade  from './Crusade.js';
import EndGame from './EndGame.js';

const RulesGame = () =>{
    const [activeRule, setActiveRule] = useState('Ход игры');
    const [activeComponent, setActiveComponent] = useState(<CourseGame />);
    const [isMobile, setIsMobile] = useState(false);

    // Функция для отслеживания размера экрана
    const handleResize = () => {
        setIsMobile(window.innerWidth < 732);
    };

    // Эффект для отслеживания изменения размера экрана
    useEffect(() => {
        handleResize(); // Устанавливаем начальное значение
        window.addEventListener('resize', handleResize); // Добавляем слушатель

        return () => {
            window.removeEventListener('resize', handleResize); // Убираем слушатель при размонтировании
        };
    }, []);

    const showRuleGame = (component, name) => {
        setActiveComponent(component);
        setActiveRule(name);
    };

    const NavRuleGameItem = ({text, ruleGameComponent}) => {
        const isActive = activeRule === text;

        return (
        <div 
            className={`nav-rule-game ${isActive ? 'active' : ''}`}
            onClick={() => showRuleGame(ruleGameComponent, text)}
        >
            {text}
        </div>
    );
        
    }
    return (
        <div className="wrapper">
            <div className="nav-rules-game">
                {/* Если экран не маленький, отображаем меню, иначе скрываем */}
                {!isMobile && (
                    <>
                        <NavRuleGameItem text="Ход игры" ruleGameComponent={<CourseGame />} />
                        <NavRuleGameItem text="Описание карт" ruleGameComponent={<DescriptionMaps />} />
                        <NavRuleGameItem text="Эпидемия" ruleGameComponent={<Epidemic />} />
                        <NavRuleGameItem text="Крестовый поход" ruleGameComponent={<Crusade />} />
                        <NavRuleGameItem text="Конец игры" ruleGameComponent={<EndGame />} />
                    </>
                )}
            </div>
            <div id="rules-game">
                {/* При маленьком экране показываем все компоненты */}
                {isMobile ? (
                    <>
                        <CourseGame />
                        <DescriptionMaps />
                        <Epidemic />
                        <Crusade />
                        <EndGame /> 
                    </>
                ) : (
                    activeComponent
                )}
            </div>
        </div>
    )
}

export default RulesGame;