import React from 'react';
import "../styles/Feedback.css";
import Button from './Button.js';

const Feedback = () => {
    const handleSendEmail = () => {
        const email = "ar.33@list.ru";

        const subject = encodeURIComponent("Вопрос по сайту");

        window.location.href = `mailto:${email}?subject=${subject}`;
    };

    return(
        <div id="feedback">
            <div className='feedback-container'>
                <h2>Остались вопросы?</h2>
                <div>
                    Что-то непонятно? Нашли баг или  хотите поделиться идеей? Напишите нам — будем рады обратной связи!
                </div>
                <Button text="написать" onClick={handleSendEmail}/>
            </div>
        </div>
    )
}

export default Feedback;