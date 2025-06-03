import React from 'react';
import '../styles/NavMenu.css';

const NavMenu = ({direction = "row"}) =>{
    const scrollToSection = (id) =>{
        let element = document.getElementById(id);
        let mobile_menu = document.querySelector(".mobile-menu"); 

        if(element){
            element.scrollIntoView({behavior: "smooth"});

            if(mobile_menu){
                mobile_menu.style.display = "none";
            }
        }
    }
    const NavItem = ({ text, sectionId }) => (
        <div className="nav-item" onClick={() => scrollToSection(sectionId)}>
            {text}
        </div>
    )
        
    return (
        <nav className={`nav-menu ${direction}`}>
            <NavItem text="Главная" sectionId="hero-block"/>
            <NavItem text="Об игре" sectionId="about-game"/>
            <NavItem text="Как играть онлайн?" sectionId="game-guide"/>
            <NavItem text="Правила игры" sectionId="rules-game"/>
        </nav>
    );
}

export default NavMenu;