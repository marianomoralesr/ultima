"use client";

import { TimelineContent } from "./timeline-animation";
import { Button } from "./button";
import { ChevronRight, Shield, Star } from "lucide-react";
import { motion, useAnimationControls } from "motion/react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import AnimatedVehicleGrid from "../AnimatedVehicleGrid";

// Simple HighlightText component
const HighlightText: React.FC<{ text: string; className?: string; inView?: boolean; transition?: any }> = ({ text, className }) => {
  return (
    <span className={className}>
      {text}
    </span>
  );
};

type TimelineStep = {
  label: string;
  date: string;
  active: boolean;
  completed: boolean;
};

interface SvgIconProps extends React.SVGProps<SVGSVGElement> {}

const LightingIcon: React.FC<SvgIconProps> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    fill="none"
    viewBox="0 0 24 24"
    {...props}
  >
    <path
      stroke="#fff"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M15.5 2H8L5 13.5h4L7 22 20 8h-6z"
    />
    <path
      stroke="#fff"
      strokeLinecap="round"
      strokeWidth="1.5"
      d="m10.5 5.5-1 4"
    />
  </svg>
);

function HeroTrefa() {
  const firstDivControls = useAnimationControls();
  const secondDivControls = useAnimationControls();

  const [steps, setSteps] = useState<TimelineStep[]>([
    { label: "Regístrate", date: "Ahora", active: true, completed: true },
    { label: "Llena tus datos", date: "1 minuto", active: false, completed: false },
    { label: "Sube tus documentos", date: "3 minutos", active: false, completed: false },
    { label: "Obtén tu respuesta", date: "Menos de 24h", active: false, completed: false },
  ]);

  const heroRef = useRef<HTMLElement | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [animationState, setAnimationState] = useState("initial");

  useEffect(() => {
    // Simulate timeline progression - slower and more subtle
    const timer = setTimeout(() => {
      if (currentStep < steps.length - 1) {
        const newSteps = [...steps];

        // Complete current step
        newSteps[currentStep].completed = true;

        // Activate next step
        newSteps[currentStep + 1].active = true;

        setSteps(newSteps);
        setCurrentStep(currentStep + 1);
      } else {
        // Reset to start the loop over
        const resetSteps = steps.map((step, idx) => ({
          ...step,
          active: idx === 0,
          completed: idx === 0,
        }));

        setSteps(resetSteps);
        setCurrentStep(0);
      }
    }, 3500); // Progress every 3.5 seconds - more subtle

    return () => clearTimeout(timer);
  }, [currentStep, steps]);

  // Animation sequence using useEffect to create the loop - More subtle animation
  useEffect(() => {
    const animationSequence = async () => {
      // Step 1: Animate first div from left 0% to 100% - slower and smoother
      await firstDivControls.start({
        left: "95%",
        transition: { duration: 8, ease: [0.25, 0.1, 0.25, 1] },
      });

      // Step 2: Fade out first div gently
      await firstDivControls.start({
        opacity: 0,
        transition: { duration: 1, ease: "easeOut" },
      });

      // Step 3: Reset first div position (instantly)
      firstDivControls.set({ left: "0%" });

      // Step 4: Show second div gently
      await secondDivControls.start({
        opacity: 1,
        transition: { duration: 1, ease: "easeIn" },
      });

      // Step 5: Animate second div from left 0% to 100% - slower and smoother
      await secondDivControls.start({
        left: "95%",
        transition: { duration: 8, ease: [0.25, 0.1, 0.25, 1] },
      });

      // Step 6: Fade out second div gently
      await secondDivControls.start({
        opacity: 0,
        transition: { duration: 1, ease: "easeOut" },
      });

      // Step 7: Reset second div position (instantly)
      secondDivControls.set({ left: "0%" });

      // Step 8: Show first div again gently
      firstDivControls.start({
        opacity: 1,
        transition: { duration: 1, ease: "easeIn" },
      });

      // Longer delay before restarting the sequence
      setTimeout(animationSequence, 1000);
    };

    // Start the animation sequence
    animationSequence();
  }, [firstDivControls, secondDivControls]);

  return (
    <main
      className="min-h-screen relative overflow-x-hidden bg-neutral-100"
      ref={heroRef}
    >
      {/* Animated Vehicle Grid Background */}
      <AnimatedVehicleGrid maxVehicles={30} gradientDirection="diagonal" />
      <section className="w-full py-28 md:grid md:grid-cols-2 flex flex-col md:place-content-center max-w-screen-xl xl:px-0 md:px-10 px-4 mx-auto text-black">
        <article className="space-y-5 flex-col flex justify-center text-left pb-10">
          <a
            href="/perfilacion-bancaria"
            className="bg-white/70 backdrop-blur-sm sm:text-sm text-xs w-fit p-1 flex gap-1.5 items-center shadow-[0px_1px_4px_rgba(0,0,0,0.1),_0px_1px_1px_rgba(0,0,0,0.15)] rounded-full hover:shadow-lg transition-shadow"
          >
            <span className="bg-[#FF6801] border-[#E65D00] border [box-shadow:inset_0px_-2px_6px_2px_#ff8533,inset_0px_4px_6px_2px_#ffa366] p-1 inline-block rounded-full px-2.5 text-white">
              Nuevo
            </span>
            <p>portal de financiamiento automotriz</p>
            <ChevronRight />
          </a>

          <TimelineContent
            animationNum={0}
            timelineRef={heroRef}
            as="h1"
            className="xl:text-7xl md:text-6xl text-5xl font-bold"
            style={{ fontFamily: 'Be Vietnam Pro, sans-serif' }}
          >
            Estrena un auto seminuevo en{' '}
            <br className="hidden md:block" />
            <HighlightText
              text="tiempo récord."
              inView={true}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="bg-gradient-to-br from-white/90 via-orange-50/50 to-white/85 backdrop-blur-xl border border-white/60 shadow-[0_8px_32px_0_rgba(255,255,255,0.8),_inset_0_1px_0_0_rgba(255,255,255,0.9)] rounded-2xl font-bold px-3 py-1 leading-tight"
            />
          </TimelineContent>


          <div className="flex gap-5 items-center">
            <TimelineContent as="div" animationNum={2} timelineRef={heroRef}>
              <Link to="/autos">
                <Button
                  className="bg-primary hover:bg-primary/90 text-white h-14 px-8 shadow-lg transition-all duration-200 hover:shadow-xl"
                  size="lg"
                >
                  <span className="flex gap-2 items-center text-lg font-semibold">
                    <LightingIcon /> Ver Inventario
                  </span>
                </Button>
              </Link>
            </TimelineContent>
          </div>
        </article>

        <div
          className="p-5 pb-10 relative space-y-5 bg-gradient-to-br from-white/85 via-orange-50/40 to-white/80 backdrop-blur-xl border border-white/60 shadow-[0_8px_32px_0_rgba(255,255,255,0.5),_inset_0_1px_0_0_rgba(255,255,255,0.9)] rounded-2xl z-0"
        >
          <div className="absolute top-0 left-0 w-full h-full border-[1.4px] border-[#DDDFE1] rounded-2xl z-0">
            <div className="absolute -top-2.5 left-0 w-full h-2 inline-block rounded-full">
              <motion.div
                className="bg-neutral-100 rounded-full w-10 h-4 absolute left-[40%] before:absolute before:left-2 before:top-1 before:content-[''] before:w-6 before:h-2 before:bg-white before:border-2 before:border-[#DDDFE1] before:rounded-full"
                initial={{ left: "0%", opacity: 1 }}
                animate={firstDivControls}
              />
            </div>
            <div className="absolute bottom-0.5 left-0 w-full h-2 inline-block rounded-full">
              <motion.div
                className="bg-neutral-100 rounded-full w-10 h-4 absolute left-[40%] before:absolute before:left-2 before:top-1 before:content-[''] before:w-6 before:h-2 before:bg-white before:border-2 before:border-[#DDDFE1] before:rounded-full"
                initial={{ left: "0%", opacity: 0 }}
                animate={secondDivControls}
              />
            </div>
            <div className="absolute -top-3 -left-3 w-6 h-6 bg-neutral-100 inline-block rounded-full z-[1]" />
            <div className="absolute -right-3 -top-3 w-6 h-6 bg-neutral-100 inline-block rounded-full z-[1]" />
            <div className="absolute -bottom-3 -left-3 w-6 h-6 bg-neutral-100 inline-block rounded-full z-[1]" />
            <div className="absolute -bottom-3 -right-3 w-6 h-6 bg-neutral-100 inline-block rounded-full z-[1]" />
            <div
              className="absolute w-full -top-2 h-2 left-0 z-[1] before:absolute before:-left-2 before:-top-0 before:content-[''] before:w-4 before:h-4 before:bg-white before:border-4 before:border-[#DDDFE1] before:rounded-full after:absolute after:-right-2 after:-top-0 after:content-[''] after:w-4 after:h-4 after:bg-white after:border-4 after:border-[#DDDFE1] after:rounded-full"
            />
            <div
              className="absolute w-full -bottom-0 h-2 left-0 z-[1] before:absolute before:-left-2 before:-top-0 before:content-[''] before:w-4 before:h-4 before:bg-white before:border-4 before:border-[#DDDFE1] before:rounded-full after:absolute after:-right-2 after:-top-0 after:content-[''] after:w-4 after:h-4 after:bg-white after:border-4 after:border-[#DDDFE1] after:rounded-full"
            />
          </div>

          <div className="w-full bg-white/30 backdrop-blur-sm border-2 border-white/40 rounded-xl p-3">
            <div className="bg-gradient-to-br from-white/70 via-white/50 to-white/60 backdrop-blur-md border border-white/50 relative rounded-lg shadow-[0_4px_16px_0_rgba(255,255,255,0.4),_inset_0_1px_0_0_rgba(255,255,255,0.8)]">
              <div className="absolute left-2 top-2 bottom-2 flex flex-col justify-between before:content-[''] before:w-2 before:h-2 before:rounded-full before:bg-[#DDDFE1] after:content-[''] after:w-2 after:h-2 after:rounded-full after:bg-[#DDDFE1]" />
              <div className="absolute right-2 top-2 bottom-2 flex flex-col justify-between before:content-[''] before:w-2 before:h-2 before:rounded-full before:bg-[#DDDFE1] after:content-[''] after:w-2 after:h-2 after:rounded-full after:bg-[#DDDFE1]" />
              <div className="flex gap-2 text-sm relative py-3 px-4 items-center justify-between">
                <div className="flex gap-0 justify-start overflow-hidden -space-x-4 flex-shrink-0">
                  <figure className="xl:w-10 xl:h-10 w-8 h-8 border-2 rounded-full flex-shrink-0 border-white bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-xs">
                    5K+
                  </figure>
                  <figure className="xl:w-10 xl:h-10 w-8 h-8 border-2 rounded-full flex-shrink-0 border-white relative z-[1] bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-white" />
                  </figure>
                  <figure className="xl:w-10 xl:h-10 w-8 h-8 border-2 rounded-full flex-shrink-0 border-white relative z-[2] bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                    <Star className="w-4 h-4 text-white fill-white" />
                  </figure>
                </div>
                <span className="font-medium xl:text-sm sm:text-xs text-[10px] inline-block leading-relaxed flex-1 text-left" style={{ fontFamily: 'DM Sans, sans-serif', marginLeft: '8px' }}>
                  La agencia de autos seminuevos{' '}
                  <HighlightText
                    text="mejor calificada del país"
                    inView={true}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="bg-gradient-to-r from-orange-100 to-orange-200 dark:from-orange-400 dark:to-orange-500 font-bold text-[10px] sm:text-xs xl:text-sm px-1 py-0 leading-tight"
                  />{' '}
                  con más de 5,000 autos vendidos.
                </span>
              </div>
            </div>
          </div>

          <div
            className={`w-full transition-colors duration-1000 border-2 rounded-xl p-3 ${
              steps[2].completed
                ? "bg-green-200 border-green-600"
                : "bg-[#F3F3F6] border-[#DDDFE1]"
            }`}
          >
            <div className="bg-gradient-to-br from-white/70 via-white/50 to-white/60 backdrop-blur-md border border-white/50 relative rounded-lg shadow-[0_4px_16px_0_rgba(255,255,255,0.4),_inset_0_1px_0_0_rgba(255,255,255,0.8)]">
              <div
                className={`absolute left-2 top-2 bottom-2 flex flex-col justify-between before:content-[''] before:w-2 before:h-2 before:rounded-full ${
                  steps[2].completed
                    ? "before:bg-green-400 after:bg-green-400"
                    : "before:bg-[#DDDFE1] after:bg-[#DDDFE1]"
                } after:content-[''] after:w-2 after:h-2 after:rounded-full`}
              />
              <div
                className={`absolute right-2 top-2 bottom-2 flex flex-col justify-between before:content-[''] before:w-2 before:h-2 before:rounded-full ${
                  steps[2].completed
                    ? "before:bg-green-400 after:bg-green-400"
                    : "before:bg-[#DDDFE1] after:bg-[#DDDFE1]"
                } after:content-[''] after:w-2 after:h-2 after:rounded-full`}
              />

              <h1
                className={`p-4 px-8 text-xl border-b-2 ${
                  steps[2].completed ? "border-green-600" : "border-[#DFDFE3]"
                }`}
              >
                Financiamiento Digital
              </h1>
              <div className="p-4 px-8">
                <figure className="rounded-full flex gap-3">
                  <div className="xl:w-20 xl:h-20 w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden bg-gray-100">
                    <img
                      src="/images/fer-help.png"
                      alt="Asesor TREFA"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <article>
                    <h1 className="font-semibold xl:text-lg text-sm">
                      Aplica desde tu celular
                    </h1>
                    <p className="text-gray-900 xl:text-sm text-xs">
                      100% en línea
                    </p>
                    <span
                      className={`mt-2 inline-block xl:text-sm text-xs transition-all duration-1000 ${
                        steps[2].completed
                          ? "bg-green-100 text-green-600"
                          : "bg-orange-100 text-orange-600"
                      } px-3 font-semibold py-1 rounded-full`}
                    >
                      {steps[2].completed ? "Aprobado" : "En Proceso"}
                    </span>
                  </article>
                </figure>
              </div>
              <div className="px-8 p-4">
                <div className="relative">
                  {/* Timeline Bar */}
                  <div className="w-[85%] mx-auto h-2 bg-gray-200 rounded-full">
                    {/* Completed Progress */}
                    <div
                      className={`h-full ${
                        steps[2].completed ? "bg-green-500" : "bg-[#FF6801]"
                      } rounded-full transition-all duration-1000 ease-in-out`}
                      style={{
                        width: `${(currentStep / (steps.length - 1)) * 100}%`,
                      }}
                    />
                  </div>

                  {/* Timeline Points */}
                  <div className="absolute w-[95%] xl:-top-3 -top-2 left-[2.5%] right-[2.5%] flex items-center justify-between">
                    {steps.map((step, index) => (
                      <div key={index} className="flex flex-col items-center">
                        {/* Circle Point */}
                        <div
                          className={`xl:w-8 xl:h-8 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-1000 delay-300 ${
                            step.completed || step.active
                              ? steps[2].completed
                                ? "bg-green-500 border-green-500"
                                : "bg-[#FF6801] border-[#E65D00]"
                              : "bg-white border-gray-200"
                          }`}
                        >
                          <div
                            className={`xl:w-4 xl:h-4 w-3 h-3 rounded-full delay-500 ${
                              step.active || step.completed
                                ? "bg-white"
                                : "bg-gray-200"
                            }`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="w-full flex items-center justify-between">
                    {steps.map((step, index) => (
                      <div key={index} className="flex flex-col items-center">
                        {/* Label */}
                        <div className="mt-4 text-center">
                          <div className="xl:text-sm text-xs font-medium">
                            {step.label}
                          </div>
                          <div
                            className={`transition-opacity xl:text-base text-xs duration-1000 delay-500 ${
                              step.active || step.completed
                                ? "opacity-100"
                                : "opacity-0"
                            }`}
                          >
                            {step.date}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            className={`w-full border-2 rounded-xl p-3 ${
              animationState === "complete"
                ? "bg-green-200 border-green-600"
                : "bg-white/30 backdrop-blur-sm border-white/40"
            }`}
          >
            <div className="bg-gradient-to-br from-white/70 via-white/50 to-white/60 backdrop-blur-md border border-white/50 relative rounded-lg shadow-[0_4px_16px_0_rgba(255,255,255,0.4),_inset_0_1px_0_0_rgba(255,255,255,0.8)]">
              <div className="sm:flex justify-between items-center relative px-7 p-4">
                <article className="pb-2">
                  <h1 className="font-semibold xl:text-xl text-sm">
                    ¿Listo para empezar?
                  </h1>
                  <p className="text-gray-800 xl:text-base text-xs">
                    Elige tu auto de nuestro inventario
                  </p>
                </article>

                <Link
                  to="/escritorio/registro"
                  className="bg-primary text-white px-6 py-2.5 rounded-lg hover:bg-primary/90 transition-colors font-semibold flex items-center gap-2 whitespace-nowrap"
                >
                  Registrarme
                  <span>→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section id="trefa-video" className="w-full py-16 bg-white">
        <div className="max-w-screen-xl mx-auto px-4 md:px-10 xl:px-0">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Descubre cómo funciona TREFA
            </h2>
            <p className="text-lg text-gray-600">
              Un proceso simple y transparente de principio a fin
            </p>
          </div>
          <div className="rounded-3xl overflow-hidden shadow-2xl max-w-4xl mx-auto">
            <div className="relative aspect-video bg-gray-900">
              <iframe
                className="absolute top-0 left-0 w-full h-full"
                src="https://www.youtube.com/embed/p-nMlle-xfw?rel=0"
                title="TREFA - Conoce nuestra historia"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default HeroTrefa;
