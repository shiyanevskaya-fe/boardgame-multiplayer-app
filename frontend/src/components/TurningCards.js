import React from 'react';
import "../styles/TurningCards.css";

const TurningCards = ({isVisible}) => {
    return(
        <div className={`container-card ${isVisible ? "animate" : "reset"}`}s>
            <div className='card static'>
                <div className='shirt left'></div>
            </div>
            <div className='card'>
                <div className='shirt'></div>
                <div className='front-side'></div>
            </div>
            <div className='card static'>
                <div className='shirt right'></div>
            </div>
            
        </div>
    );
}

export default TurningCards;