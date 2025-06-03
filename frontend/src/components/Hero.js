import React from 'react';
import '../styles/Hero.css';
import Header from './Header.js';
import Button from './Button.js';
import { useNavigate } from 'react-router-dom';

const Hero = () => {

    const navigate = useNavigate();

    const handleCreateConnection = () => {
        navigate('/connection');
    }
    
  return (
    <>
        <div id="hero-block">
            <div className='wrapper'>
                <Header />
                <div className='hero'>
                    {/* Блок с текстовой информацией */}
                    <div className='hero-text-description'>
                        {/* Заголовок секции */}
                        <div className='title-hero'>
                            <h2>страдающее</h2>
                            <h1>средневековье</h1>
                        </div>

                        {/* Описание игры */}
                        <div className='description-hero'>
                            Собирайте друзей, разбрасывайте чуму, крадите очки крестовых походов и саботируйте целые города — играйте в безумную 
                            карточную стратегию из любой таверны мира. Никаких грязных карт, только виртуальный хаос с автоматическим подсчётом!
                        </div>

                        {/* Кнопка для начала игры */}
                        <Button text="Играть" onClick={handleCreateConnection}/>
                    </div>
                </div>
            </div>
        </div>
    </>
    
    );
  };
  
  export default Hero;