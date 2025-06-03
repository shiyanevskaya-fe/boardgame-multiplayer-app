import React from 'react';
import "../styles/Footer.css";
import NavMenu from "./NavMenu.js";

const Footer = () => {
    return (
        <footer id="footer">
            <div className='wrapper'>
                <img src="icons/ic_logo.png" alt="logo_game"/>
                <NavMenu direction='column'/>
            </div>
            
        </footer>
    );
}

export default Footer;