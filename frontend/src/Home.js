import logo from './logo.svg';
import './App.css';
import Hero from './components/Hero.js';
import AboutGame from './components/AboutGame.js';
import GameGuide from './components/GameGuide.js';
import RulesGame from './components/RulesGame.js';
import Footer from './components/Footer.js';
import Feedback from './components/Feedback.js';

function Home() {
  return (
    <div className="Home">
      <Hero />
      <AboutGame />
      <GameGuide/>
      <RulesGame />
      <Feedback />
      <Footer />
    </div>
  );
}

export default Home;
