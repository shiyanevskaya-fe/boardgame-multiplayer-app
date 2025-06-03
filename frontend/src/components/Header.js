import React, {useState, useEffect} from 'react';
import '../styles/Header.css';
import NavMenu from './NavMenu.js';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(()=>{
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 650);
    };

    // Вызов функции при монтировании компонента
    handleResize();

    // Добавление слушателя события resize
    window.addEventListener('resize', handleResize);

    // Очистка слушателя при размонтировании компонента
    return () => {
      window.removeEventListener('resize', handleResize);
    }
  },[]);

  const toggleMenu = ()=>{
    setIsMenuOpen(!isMenuOpen);
  }
  
  return (
    <header id="header">
        {isMobile ? (
          <>
            {/* Кнопка для открытия/закрытия меню на мобильных устройствах */}
            <button className="hamburger" onClick={toggleMenu}>
              <div className='hamburger-lines'>
                <span className={`hamburger-line ${isMenuOpen ? 'open' : ''}`}></span>
                <span className={`hamburger-line ${isMenuOpen ? 'open' : ''}`}></span>
                <span className={`hamburger-line ${isMenuOpen ? 'open' : ''}`}></span>
              </div>
            </button>

            {isMenuOpen && (
              <div className="mobile-menu">
                <button className='close-mobile-menu' onClick={toggleMenu}>
                  <div className='close-mobile-menu-cross'>
                    <span className='cross-line'></span>
                    <span className='cross-line'></span>
                  </div>
                </button>
                <img src="icons/ic_logo.png" alt="logo_game"/>
                <NavMenu direction='column'/>
              </div>
            )}
          </>
        ) : (
          <>
            <img src="icons/ic_logo.png" alt="logo_game"/>
            <NavMenu direction='row'/>
          </>
        )}
        
    </header>
    );
  };
  
  export default Header;