import React from "react";
import { motion } from "framer-motion";
import "../styles/DiceRoll.css";

const DiceRoll = ({ value, isHovered }) => {
    // Определяем угол поворота для каждого числа
    const rotations = {
        1: { x: 0, y: 0 },
        2: { x: 0, y: 180 },
        3: { x: 0, y: -90 },
        4: { x: 0, y: 90 },
        5: { x: -90, y: 0 },
        6: { x: 90, y: 0 },
    };

    const renderDots = (count) => {
        return Array.from({ length: count }).map((_, index) => (
            <div key={index} className="cdot"></div>
        ));
    }

    return (
        <div className="container-dice">
            <motion.div
                className="cube"
                animate={{
                    rotateX: isHovered ? 720 + rotations[value].x : rotations[value].x,
                    rotateY: isHovered ? 720 + rotations[value].y : rotations[value].y,
                }}
                transition={{
                    duration: 2,
                    ease: "easeInOut",
                }}
            >
                <div className="side front">{renderDots(1)}</div>
                <div className="side back">{renderDots(2)}</div>
                <div className="side right">{renderDots(3)}</div>
                <div className="side left">{renderDots(4)}</div>
                <div className="side top">{renderDots(5)}</div>
                <div className="side bottom">{renderDots(6)}</div>
            </motion.div>
        </div>
    );
};

export default DiceRoll;
