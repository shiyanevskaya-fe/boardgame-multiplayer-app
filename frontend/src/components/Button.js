import React from 'react';
import '../styles/Button.css';

const Button = ({text, onClick}) => {
    return (
        <button className='button-game' onClick={onClick}>
            {text}
        </button>
    );
}

export default Button;