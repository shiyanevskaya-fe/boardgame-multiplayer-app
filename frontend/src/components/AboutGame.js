import React, { useEffect, useState } from 'react';
import '../styles/AboutGame.css';
import TurningCards from './TurningCards.js';

const AboutGame = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsVisible(entry.isIntersecting);
            },
            { threshold: 0.8 }
        );
    
        const aboutGame = document.getElementById("about-game");
        if (aboutGame) observer.observe(aboutGame);
    
        return () => {
            if (aboutGame) observer.unobserve(aboutGame);
        };
    }, []);
    


    return (
        <div id="about-game" className={isVisible ? "visible" : ""}>
            <div className='wrapper'>
                <img src="images/man_sitting.png" alt="" className='hero-img'/>
                <TurningCards isVisible={isVisible}/>
                <div className='about-game-text'>
                    <h2>что такое страдающее средневековье?</h2>
                    <div className='about-game-description'>
                        <div className='paragraph-1'>
                            Жизнь средневековых людей тяжела и полна страданий. Воины уходят в Крестовые походы, 
                            Эпидемии выкашивают целые поселения, а выживших с радостью сжигает инквизиция. 
                        </div>
                        <div className='paragraph-2'>
                            В это непростое время вам придется возглавить один из городов и <span className='comment'>привести его к процветанию</span> 
                            сделать так, чтобы в нем хоть кто-нибудь выжил.
                        </div>
                    </div>
                    
                    <div className='features-game'>
                        <h3>чтобы выжить, придется</h3>
                        <div className='features-game-cards'>
                            <div className='features-game-card'>
                                <img src="icons/ic_epidemic.png" alt=""/>
                                <div>Укрощать эпидемии</div>
                            </div>
                            <div className='features-game-card'>
                                <img src="icons/ic_thief.png" alt=""/>
                                <div>Воровать славу</div>
                            </div>
                            <div className='features-game-card'>
                                <img src="icons/ic_betrayal.png" alt=""/>
                                <div>Играть против всех</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AboutGame;