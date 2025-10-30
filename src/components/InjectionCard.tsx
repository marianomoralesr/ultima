import React from 'react';
import styled, { keyframes } from 'styled-components';

const animate = keyframes`
  0% {
    transform: rotateY(270deg);
  }
  10%, 100% {
    transform: rotateY(90deg);
  }
`;

const SlideshowContainer = styled.div`
  position: relative;
  width: 300px;
  height: 400px;
  transform-style: preserve-3d;
  perspective: 1000px;
`;

const Slide = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: start;
  justify-content: start;
  transform: rotateY(270deg);
  transform-style: preserve-3d;
  animation: ${animate} 40s linear infinite;
  animation-delay: calc(${props => props.delay} * 4s);
  margin-bottom: ${props => props.marginBottom};
`;

const SlideImage = styled.img`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 20px;
`;

const SlideTitle = styled.h2`
  position: relative;
  z-index: 1000;
  color: #000000;
  font-size: 1.5em;
  line-height: 0.98em;
  margin-bottom: 10px !important;
  transform: rotateY(180deg) translateY(8px) translateZ(10px);
  transform-style: preserve-3d;
  backface-visibility: hidden;
  font-weight: 900;
`;

const SlideSubtitle = styled.span`
  position: relative;
  top: 50%;
  left: 5px;
  line-height: 0.9em;
  padding-right: 10px;
  font-size: 1em;
  font-weight: 300;
  transform: translateZ(30px);
  backface-visibility: hidden;
`;

const Slideshow = () => {
  const slides = [
    {
      id: 0,
      title: "Financiamiento",
      subtitle: "100% en línea",
      image: "https://res.cloudinary.com/drznoiotp/image/upload/v1761702252/Frame_40_1_of78jj.png",
      marginBottom: "7px"
    },
    {
      id: 1,
      title: "Comienza tu proceso",
      subtitle: "aquí",
      image: "https://res.cloudinary.com/drznoiotp/image/upload/v1761702104/Frame_40_2_yagqiu.png",
      marginBottom: "0px"
    },
    // ... more slides
  ];

  return (
    <SlideshowContainer>
      {slides.map((slide) => (
        <Slide 
          key={slide.id}
          delay={slide.id}
          marginBottom={slide.marginBottom}
        >
          <SlideTitle>
            {slide.title} <SlideSubtitle>{slide.subtitle}</SlideSubtitle>
          </SlideTitle>
          <SlideImage src={slide.image} alt={`slide-${slide.id}`} />
        </Slide>
      ))}
    </SlideshowContainer>
  );
};

export default Slideshow;
