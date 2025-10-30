import React from 'react';
import { Link } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';

const animate = keyframes`
  0% {
    transform: rotateY(270deg);
  }
  12.5% {
    transform: rotateY(90deg);
  }
  100% {
    transform: rotateY(90deg);
  }
`;

const SlideshowLink = styled(Link)`
  display: block;
  text-decoration: none;
  color: inherit;
  cursor: pointer;
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.02);
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
  animation: ${animate} 16s linear infinite;
  animation-delay: calc(${props => props.delay} * 2s);
  padding: 20px;
  box-sizing: border-box;
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
  color: #FF6801;
  font-size: 1.5em;
  line-height: 1.2em;
  margin: 15px 0 10px 0 !important;
  padding: 8px 12px;
  transform: rotateY(180deg) translateY(8px) translateZ(10px);
  transform-style: preserve-3d;
  backface-visibility: hidden;
  font-weight: 900;
`;

const SlideSubtitle = styled.span`
  position: relative;
  display: block;
  margin-top: 8px;
  line-height: 1.1em;
  padding: 4px 0;
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
      image: "https://res.cloudinary.com/drznoiotp/image/upload/v1761702252/Frame_40_1_of78jj.png"
    },
    {
      id: 1,
      title: "Comienza tu proceso",
      subtitle: "aquí",
      image: "https://res.cloudinary.com/drznoiotp/image/upload/v1761702104/Frame_40_2_yagqiu.png"
    },
    {
      id: 2,
      title: "Financiamiento",
      subtitle: "100% en línea",
      image: "https://res.cloudinary.com/drznoiotp/image/upload/v1761702252/Frame_40_1_of78jj.png"
    },
    {
      id: 3,
      title: "Comienza tu proceso",
      subtitle: "aquí",
      image: "https://res.cloudinary.com/drznoiotp/image/upload/v1761702104/Frame_40_2_yagqiu.png"
    },
    {
      id: 4,
      title: "Financiamiento",
      subtitle: "100% en línea",
      image: "https://res.cloudinary.com/drznoiotp/image/upload/v1761702252/Frame_40_1_of78jj.png"
    },
    {
      id: 5,
      title: "Comienza tu proceso",
      subtitle: "aquí",
      image: "https://res.cloudinary.com/drznoiotp/image/upload/v1761702104/Frame_40_2_yagqiu.png"
    },
    {
      id: 6,
      title: "Financiamiento",
      subtitle: "100% en línea",
      image: "https://res.cloudinary.com/drznoiotp/image/upload/v1761702252/Frame_40_1_of78jj.png"
    },
    {
      id: 7,
      title: "Comienza tu proceso",
      subtitle: "aquí",
      image: "https://res.cloudinary.com/drznoiotp/image/upload/v1761702104/Frame_40_2_yagqiu.png"
    }
  ];

  return (
    <SlideshowLink to="/acceder">
      <SlideshowContainer>
        {slides.map((slide) => (
          <Slide
            key={slide.id}
            delay={slide.id}
          >
            <SlideTitle>
              {slide.title}
              <SlideSubtitle>{slide.subtitle}</SlideSubtitle>
            </SlideTitle>
            <SlideImage src={slide.image} alt={`slide-${slide.id}`} />
          </Slide>
        ))}
      </SlideshowContainer>
    </SlideshowLink>
  );
};

export default Slideshow;
