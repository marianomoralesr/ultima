"use client";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Select from "@radix-ui/react-select";
import React, { useState } from "react";
import { Area, AreaChart } from "recharts";

import { type ChartConfig, ChartContainer } from "@/components/ui/charts";
import Marquee from "@/components/ui/marquee";
import { cn } from "@/lib/utils";
import {
  CheckCheck,
  ChevronDown,
  ChevronUp,
  CircleUser,
  Ellipsis,
  Mail,
  Phone,
  Settings,
  Trash,
} from "lucide-react";
import Header from "./header";

const customers = [
  {
    name: "doordash",
    img: `${process.env.NEXT_PUBLIC_ANIMATION_URL}/customer/doordash.png`,
  },
  {
    name: "eventbrite",
    img: `${process.env.NEXT_PUBLIC_ANIMATION_URL}/customer/eventbrite.png`,
  },
  {
    name: "smeg",
    img: `${process.env.NEXT_PUBLIC_ANIMATION_URL}/customer/smeg.png`,
  },
  {
    name: "surveymonkey",
    img: `${process.env.NEXT_PUBLIC_ANIMATION_URL}/customer/surveymonkey.png`,
  },
  {
    name: "zapier",
    img: `${process.env.NEXT_PUBLIC_ANIMATION_URL}/customer/zapier.png`,
  },
];
const chartData = [
  { monthName: "January", year: 0, months: 15, week: 8, today: 1 },
  { monthName: "February", year: 20, months: 2, week: 4, today: 2 },
  { monthName: "March", year: 45, months: 15, week: 8, today: 4 },
  { monthName: "April", year: 20, months: 42, week: 6, today: 3 },
  { monthName: "May", year: 55, months: 18, week: 9, today: 5 },
  { monthName: "June", year: 90, months: 42, week: 12, today: 6 },
];

const Calls = [
  { monthName: "January", year: 4, months: 7, week: 3, today: 2 },
  { monthName: "February", year: 40, months: 12, week: 6, today: 3 },
  { monthName: "March", year: 20, months: 10, week: 5, today: 2 },
  { monthName: "April", year: 60, months: 17, week: 8, today: 4 },
  { monthName: "May", year: 40, months: 14, week: 7, today: 3 },
  { monthName: "June", year: 90, months: 22, week: 12, today: 6 },
];

const Projects = [
  { monthName: "January", year: 20, months: 8, week: 4, today: 2 },
  { monthName: "February", year: 10, months: 12, week: 6, today: 3 },
  { monthName: "March", year: 20, months: 15, week: 7, today: 4 },
  { monthName: "April", year: 40, months: 18, week: 9, today: 5 },
  { monthName: "May", year: 30, months: 20, week: 10, today: 5 },
  { monthName: "June", year: 50, months: 22, week: 12, today: 6 },
];

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "hsl(var(--chart-base))",
  },
} satisfies ChartConfig;
function LayoutHubs() {
  const [selectedFilter, setSelectedFilter] = useState<string>("year");

  const filterData = (data: typeof chartData) => {
    return data.map((item) => ({
      monthName: item.monthName,
      desktop: item[selectedFilter as keyof typeof item], // Dynamically get the correct value
    }));
  };

  const filteredChartData = filterData(chartData);
  const filteredCalls = filterData(Calls);
  const filteredProjects = filterData(Projects);
  return (
    <>
      <Header />
      <main className="bg-layoutHubbg  2xl:p-0 sm:px-8 px-4 relative text-black">
        <div
          className="absolute h-full w-full opacity-5"
          style={{
            backgroundImage: `url(${process.env.NEXT_PUBLIC_ANIMATION_URL}/hero/diagonal-lines.png)`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />

        <div className="absolute w-[40%] h-[20rem] skew-y-12 left-0 top-[40%]  bg-gradient-to-b from-white/70 mix-blend-normal blur-[16.3px]" />
        <div className="absolute w-[40%] h-[20rem] skew-y-12 right-0 top-[10%]  bg-gradient-to-t from-white/70 mix-blend-normal blur-[16.3px]" />
        <section className="max-w-screen-xl  mx-auto relative z-[1]">
          <article className="relative grid pt-40 z-[2] sm:px-0 px-4 text-[#141414] space-y-4">
            <div className="w-fit relative border-2 border-white bg-layoutHubbg/40 backdrop-blur-sm rounded-full p-0.5 mx-auto">
              <svg
                width="233"
                className="absolute -left-56 -top-4 "
                height="52"
                viewBox="0 0 233 52"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g filter="url(#filter0_d_4528_1082)">
                  <path
                    d="M231 46H184.076C172.478 46 163.076 36.598 163.076 25V25C163.076 13.402 153.674 4 142.076 4H2"
                    stroke="url(#paint0_linear_4528_1082)"
                    stroke-width="2.5"
                    shape-rendering="crispEdges"
                  />
                </g>

                <g filter="url(#filter1_d_4528_1082)">
                  <rect x="111" width="12" height="8" rx="4" fill="white" />
                </g>
                <defs>
                  <filter
                    id="filter0_d_4528_1082"
                    x="0"
                    y="2.75"
                    width="233"
                    height="48.5"
                    filterUnits="userSpaceOnUse"
                    color-interpolation-filters="sRGB"
                  >
                    <feFlood flood-opacity="0" result="BackgroundImageFix" />
                    <feColorMatrix
                      in="SourceAlpha"
                      type="matrix"
                      values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                      result="hardAlpha"
                    />
                    <feOffset dy="2" />
                    <feGaussianBlur stdDeviation="1" />
                    <feComposite in2="hardAlpha" operator="out" />
                    <feColorMatrix
                      type="matrix"
                      values="0 0 0 0 0.74 0 0 0 0 0.74 0 0 0 0 0.74 0 0 0 0.14 0"
                    />
                    <feBlend
                      mode="normal"
                      in2="BackgroundImageFix"
                      result="effect1_dropShadow_4528_1082"
                    />
                    <feBlend
                      mode="normal"
                      in="SourceGraphic"
                      in2="effect1_dropShadow_4528_1082"
                      result="shape"
                    />
                  </filter>
                  <filter
                    id="filter1_d_4528_1082"
                    x="109"
                    y="0"
                    width="16"
                    height="12"
                    filterUnits="userSpaceOnUse"
                    color-interpolation-filters="sRGB"
                  >
                    <feFlood flood-opacity="0" result="BackgroundImageFix" />
                    <feColorMatrix
                      in="SourceAlpha"
                      type="matrix"
                      values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                      result="hardAlpha"
                    />
                    <feOffset dy="2" />
                    <feGaussianBlur stdDeviation="1" />
                    <feComposite in2="hardAlpha" operator="out" />
                    <feColorMatrix
                      type="matrix"
                      values="0 0 0 0 0.74 0 0 0 0 0.74 0 0 0 0 0.74 0 0 0 0.14 0"
                    />
                    <feBlend
                      mode="normal"
                      in2="BackgroundImageFix"
                      result="effect1_dropShadow_4528_1082"
                    />
                    <feBlend
                      mode="normal"
                      in="SourceGraphic"
                      in2="effect1_dropShadow_4528_1082"
                      result="shape"
                    />
                  </filter>
                  <linearGradient
                    id="paint0_linear_4528_1082"
                    x1="231"
                    y1="45.5059"
                    x2="24.4089"
                    y2="-22.7199"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop offset="0.335589" stop-color="white" />
                    <stop offset="1" stop-color="white" stop-opacity="0" />
                  </linearGradient>
                </defs>
              </svg>

              <svg
                width="233"
                className="absolute -right-56 -top-5 "
                height="52"
                viewBox="0 0 233 52"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g filter="url(#filter0_d_4529_1083)">
                  <path
                    d="M2 46H48.9237C60.5217 46 69.9237 36.598 69.9237 25V25C69.9237 13.402 79.3258 4 90.9237 4H231"
                    stroke="url(#paint0_linear_4529_1083)"
                    stroke-width="2.5"
                    shape-rendering="crispEdges"
                  />
                </g>
                <g filter="url(#filter1_d_4529_1083)">
                  <rect x="110" width="12" height="8" rx="4" fill="white" />
                </g>
                <defs>
                  <filter
                    id="filter0_d_4529_1083"
                    x="0"
                    y="2.75"
                    width="233"
                    height="48.5"
                    filterUnits="userSpaceOnUse"
                    color-interpolation-filters="sRGB"
                  >
                    <feFlood flood-opacity="0" result="BackgroundImageFix" />
                    <feColorMatrix
                      in="SourceAlpha"
                      type="matrix"
                      values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                      result="hardAlpha"
                    />
                    <feOffset dy="2" />
                    <feGaussianBlur stdDeviation="1" />
                    <feComposite in2="hardAlpha" operator="out" />
                    <feColorMatrix
                      type="matrix"
                      values="0 0 0 0 0.74 0 0 0 0 0.74 0 0 0 0 0.74 0 0 0 0.14 0"
                    />
                    <feBlend
                      mode="normal"
                      in2="BackgroundImageFix"
                      result="effect1_dropShadow_4529_1083"
                    />
                    <feBlend
                      mode="normal"
                      in="SourceGraphic"
                      in2="effect1_dropShadow_4529_1083"
                      result="shape"
                    />
                  </filter>
                  <filter
                    id="filter1_d_4529_1083"
                    x="108"
                    y="0"
                    width="16"
                    height="12"
                    filterUnits="userSpaceOnUse"
                    color-interpolation-filters="sRGB"
                  >
                    <feFlood flood-opacity="0" result="BackgroundImageFix" />
                    <feColorMatrix
                      in="SourceAlpha"
                      type="matrix"
                      values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                      result="hardAlpha"
                    />
                    <feOffset dy="2" />
                    <feGaussianBlur stdDeviation="1" />
                    <feComposite in2="hardAlpha" operator="out" />
                    <feColorMatrix
                      type="matrix"
                      values="0 0 0 0 0.74 0 0 0 0 0.74 0 0 0 0 0.74 0 0 0 0.14 0"
                    />
                    <feBlend
                      mode="normal"
                      in2="BackgroundImageFix"
                      result="effect1_dropShadow_4529_1083"
                    />
                    <feBlend
                      mode="normal"
                      in="SourceGraphic"
                      in2="effect1_dropShadow_4529_1083"
                      result="shape"
                    />
                  </filter>
                  <linearGradient
                    id="paint0_linear_4529_1083"
                    x1="2"
                    y1="45.5059"
                    x2="208.591"
                    y2="-22.7199"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop offset="0.335589" stop-color="white" />
                    <stop offset="1" stop-color="white" stop-opacity="0" />
                  </linearGradient>
                </defs>
              </svg>

              <div className="flex gap-2  items-center justify-center text-sm relative z-[2] bg-white  w-fit mx-auto p-1 rounded-full">
                <div className="sm:flex hidden gap-0 justify-center w-20 overflow-hidden ">
                  <figure className=" w-9 h-9 border-2 rounded-full flex-shrink-0 border-white translate-x-4 ">
                    <img
                      src={`${process.env.NEXT_PUBLIC_ANIMATION_URL}/people/image1.png`}
                      alt="image-1"
                      className="w-full h-full object-cover "
                    />
                  </figure>
                  <figure className=" w-9 h-9 border-2 rounded-full flex-shrink-0 border-white relative z-[1]">
                    <img
                      src={`${process.env.NEXT_PUBLIC_ANIMATION_URL}/people/image2.png`}
                      alt="image-2"
                      className="w-full h-full object-cover "
                    />
                  </figure>
                  <figure className=" w-9 h-9 border-2 rounded-full flex-shrink-0 border-white relative z-[2] -translate-x-4">
                    <img
                      src={`${process.env.NEXT_PUBLIC_ANIMATION_URL}/people/image4.png`}
                      alt="image"
                      className="w-full h-full object-cover "
                    />
                  </figure>
                </div>
                <span className="font-medium sm:text-base text-xs inline-block sm:pr-1 px-1">
                  HubSpot Customer Platform
                </span>
                <button className="p-2 px-3 gap-1 rounded-full  sm:text-base text-xs  flex items-center text-white bg-gradient-to-t from-zinc-900 to-zinc-950">
                  Get Started
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 15 15"
                    className="sm:w-5 w-4 sm:h-5 h-4"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M3.29297 7.77539H12.6263M12.6263 7.77539L9.1263 4.27539M12.6263 7.77539L9.1263 11.2754"
                      stroke="white"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <h1 className="2xl:text-7xl xl:text-7xl md:text-6xl sm:text-5xl text-4xl text-center font-semibold  tracking-tight">
              Grow better with <br /> LayoutSpot
            </h1>
            <p className="mx-auto  max-w-screen-md sm:w-[80%] text-center sm:text-base text-sm text-[#4D4D4D]">
              Software that's powerful, not overpowering. Seamlessly connect
              your data, teams, and customers on one AI-powered customer
              platform that grows with your business.
            </p>
            <div className="flex gap-2 justify-center items-center font-medium ">
              <a
                href="/"
                className="p-3 px-3 rounded-lg  text-white bg-gradient-to-t from-layoutHubBase to-orange-600"
              >
                Get a Demo
              </a>

              <a href="/" className="p-3 px-3 rounded-lg bg-white ">
                Get Started Free
              </a>
            </div>
            {/* <p className="text-center py-2">65% off during pre-sale.</p> */}
          </article>
          <div className="md:flex grid grid-cols-2  w-full relative justify-between items-end lg:mt-10 mt-20  lg:gap-4 md:gap-0">
            <svg
              width="1440"
              height="228"
              className="md:absolute md:-top-32 hidden  xl:-left-[20%] md:-left-[10%] -left-[60%] xl:w-[140%] w-[120%] "
              viewBox="0 0 1440 228"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g filter="url(#filter0_d_4532_1084)">
                <path
                  d="M343 111H272.263C255.142 111 241.263 97.1208 241.263 80V70C241.263 52.8792 227.384 39 210.263 39H1.66893e-06"
                  stroke="url(#paint0_linear_4532_1084)"
                  stroke-width="1.5"
                  shape-rendering="crispEdges"
                />
              </g>
              <g filter="url(#filter1_d_4532_1084)">
                <path
                  d="M414 111H325.169C308.049 111 294.169 97.1208 294.169 80V35C294.169 17.8792 280.29 4 263.169 4H9.99998"
                  stroke="url(#paint1_linear_4532_1084)"
                  stroke-width="1.5"
                  shape-rendering="crispEdges"
                />
              </g>
              <g filter="url(#filter2_d_4532_1084)">
                <path
                  d="M1036 111H1124.83C1141.95 111 1155.83 97.1208 1155.83 80V35C1155.83 17.8792 1169.71 4 1186.83 4H1440"
                  stroke="url(#paint2_linear_4532_1084)"
                  stroke-width="1.5"
                  shape-rendering="crispEdges"
                />
              </g>
              <g filter="url(#filter3_d_4532_1084)">
                <path
                  d="M1097 111H1167.74C1184.86 111 1198.74 97.1208 1198.74 80V70C1198.74 52.8792 1212.62 39 1229.74 39H1440"
                  stroke="url(#paint3_linear_4532_1084)"
                  stroke-width="1.5"
                  shape-rendering="crispEdges"
                />
              </g>
              <g filter="url(#filter4_d_4532_1084)">
                <path
                  d="M131 111L413 111"
                  stroke="url(#paint4_linear_4532_1084)"
                  stroke-width="1.5"
                  shape-rendering="crispEdges"
                />
              </g>
              <g filter="url(#filter5_d_4532_1084)">
                <path
                  d="M1016 111L1298 111"
                  stroke="url(#paint5_linear_4532_1084)"
                  stroke-width="1.5"
                  shape-rendering="crispEdges"
                />
              </g>
              <g filter="url(#filter6_d_4532_1084)">
                <path d="M478 223L951 223" stroke="white" stroke-width="1.5" />
              </g>
              <g filter="url(#filter7_d_4532_1084)">
                <path d="M439 200L439 150" stroke="white" stroke-width="1.5" />
              </g>
              <g filter="url(#filter8_d_4532_1084)">
                <path d="M990 200L990 150" stroke="white" stroke-width="1.5" />
              </g>
              <g filter="url(#filter9_d_4532_1084)">
                <path
                  d="M413 111V111C427.359 111 439 122.641 439 137V150"
                  stroke="white"
                  stroke-width="1.5"
                />
              </g>
              <g filter="url(#filter10_d_4532_1084)">
                <path
                  d="M1016 111V111C1001.64 111 990 122.641 990 137V150"
                  stroke="white"
                  stroke-width="1.5"
                />
              </g>
              <g filter="url(#filter11_d_4532_1084)">
                <path
                  d="M439 196V196C439 210.912 451.088 223 466 223L478 223"
                  stroke="white"
                  stroke-width="1.5"
                />
              </g>
              <g filter="url(#filter12_d_4532_1084)">
                <path
                  d="M990 196V196C990 210.912 977.912 223 963 223L951 223"
                  stroke="white"
                  stroke-width="1.5"
                />
              </g>
              <g filter="url(#filter13_d_4532_1084)">
                <rect
                  x="1164"
                  y="107"
                  width="12"
                  height="8"
                  rx="4"
                  fill="white"
                />
              </g>
              <g filter="url(#filter14_d_4532_1084)">
                <rect
                  x="272"
                  y="107"
                  width="12"
                  height="8"
                  rx="4"
                  fill="white"
                />
              </g>
              <g filter="url(#filter15_d_4532_1084)">
                <rect x="232" width="12" height="8" rx="4" fill="white" />
              </g>
              <g filter="url(#filter16_d_4532_1084)">
                <rect x="1206" width="12" height="8" rx="4" fill="white" />
              </g>
              <defs>
                <filter
                  id="filter0_d_4532_1084"
                  x="-2"
                  y="38.25"
                  width="347"
                  height="77.5"
                  filterUnits="userSpaceOnUse"
                  color-interpolation-filters="sRGB"
                >
                  <feFlood flood-opacity="0" result="BackgroundImageFix" />
                  <feColorMatrix
                    in="SourceAlpha"
                    type="matrix"
                    values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                    result="hardAlpha"
                  />
                  <feOffset dy="2" />
                  <feGaussianBlur stdDeviation="1" />
                  <feComposite in2="hardAlpha" operator="out" />
                  <feColorMatrix
                    type="matrix"
                    values="0 0 0 0 0.74 0 0 0 0 0.74 0 0 0 0 0.74 0 0 0 0.14 0"
                  />
                  <feBlend
                    mode="normal"
                    in2="BackgroundImageFix"
                    result="effect1_dropShadow_4532_1084"
                  />
                  <feBlend
                    mode="normal"
                    in="SourceGraphic"
                    in2="effect1_dropShadow_4532_1084"
                    result="shape"
                  />
                </filter>
                <filter
                  id="filter1_d_4532_1084"
                  x="8"
                  y="3.25"
                  width="408"
                  height="112.5"
                  filterUnits="userSpaceOnUse"
                  color-interpolation-filters="sRGB"
                >
                  <feFlood flood-opacity="0" result="BackgroundImageFix" />
                  <feColorMatrix
                    in="SourceAlpha"
                    type="matrix"
                    values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                    result="hardAlpha"
                  />
                  <feOffset dy="2" />
                  <feGaussianBlur stdDeviation="1" />
                  <feComposite in2="hardAlpha" operator="out" />
                  <feColorMatrix
                    type="matrix"
                    values="0 0 0 0 0.74 0 0 0 0 0.74 0 0 0 0 0.74 0 0 0 0.14 0"
                  />
                  <feBlend
                    mode="normal"
                    in2="BackgroundImageFix"
                    result="effect1_dropShadow_4532_1084"
                  />
                  <feBlend
                    mode="normal"
                    in="SourceGraphic"
                    in2="effect1_dropShadow_4532_1084"
                    result="shape"
                  />
                </filter>
                <filter
                  id="filter2_d_4532_1084"
                  x="1034"
                  y="3.25"
                  width="408"
                  height="112.5"
                  filterUnits="userSpaceOnUse"
                  color-interpolation-filters="sRGB"
                >
                  <feFlood flood-opacity="0" result="BackgroundImageFix" />
                  <feColorMatrix
                    in="SourceAlpha"
                    type="matrix"
                    values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                    result="hardAlpha"
                  />
                  <feOffset dy="2" />
                  <feGaussianBlur stdDeviation="1" />
                  <feComposite in2="hardAlpha" operator="out" />
                  <feColorMatrix
                    type="matrix"
                    values="0 0 0 0 0.74 0 0 0 0 0.74 0 0 0 0 0.74 0 0 0 0.08 0"
                  />
                  <feBlend
                    mode="normal"
                    in2="BackgroundImageFix"
                    result="effect1_dropShadow_4532_1084"
                  />
                  <feBlend
                    mode="normal"
                    in="SourceGraphic"
                    in2="effect1_dropShadow_4532_1084"
                    result="shape"
                  />
                </filter>
                <filter
                  id="filter3_d_4532_1084"
                  x="1095"
                  y="38.25"
                  width="347"
                  height="77.5"
                  filterUnits="userSpaceOnUse"
                  color-interpolation-filters="sRGB"
                >
                  <feFlood flood-opacity="0" result="BackgroundImageFix" />
                  <feColorMatrix
                    in="SourceAlpha"
                    type="matrix"
                    values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                    result="hardAlpha"
                  />
                  <feOffset dy="2" />
                  <feGaussianBlur stdDeviation="1" />
                  <feComposite in2="hardAlpha" operator="out" />
                  <feColorMatrix
                    type="matrix"
                    values="0 0 0 0 0.74 0 0 0 0 0.74 0 0 0 0 0.74 0 0 0 0.14 0"
                  />
                  <feBlend
                    mode="normal"
                    in2="BackgroundImageFix"
                    result="effect1_dropShadow_4532_1084"
                  />
                  <feBlend
                    mode="normal"
                    in="SourceGraphic"
                    in2="effect1_dropShadow_4532_1084"
                    result="shape"
                  />
                </filter>
                <filter
                  id="filter4_d_4532_1084"
                  x="129"
                  y="110.25"
                  width="286"
                  height="5.5"
                  filterUnits="userSpaceOnUse"
                  color-interpolation-filters="sRGB"
                >
                  <feFlood flood-opacity="0" result="BackgroundImageFix" />
                  <feColorMatrix
                    in="SourceAlpha"
                    type="matrix"
                    values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                    result="hardAlpha"
                  />
                  <feOffset dy="2" />
                  <feGaussianBlur stdDeviation="1" />
                  <feComposite in2="hardAlpha" operator="out" />
                  <feColorMatrix
                    type="matrix"
                    values="0 0 0 0 0.74 0 0 0 0 0.74 0 0 0 0 0.74 0 0 0 0.14 0"
                  />
                  <feBlend
                    mode="normal"
                    in2="BackgroundImageFix"
                    result="effect1_dropShadow_4532_1084"
                  />
                  <feBlend
                    mode="normal"
                    in="SourceGraphic"
                    in2="effect1_dropShadow_4532_1084"
                    result="shape"
                  />
                </filter>
                <filter
                  id="filter5_d_4532_1084"
                  x="1014"
                  y="110.25"
                  width="286"
                  height="5.5"
                  filterUnits="userSpaceOnUse"
                  color-interpolation-filters="sRGB"
                >
                  <feFlood flood-opacity="0" result="BackgroundImageFix" />
                  <feColorMatrix
                    in="SourceAlpha"
                    type="matrix"
                    values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                    result="hardAlpha"
                  />
                  <feOffset dy="2" />
                  <feGaussianBlur stdDeviation="1" />
                  <feComposite in2="hardAlpha" operator="out" />
                  <feColorMatrix
                    type="matrix"
                    values="0 0 0 0 0.74 0 0 0 0 0.74 0 0 0 0 0.74 0 0 0 0.14 0"
                  />
                  <feBlend
                    mode="normal"
                    in2="BackgroundImageFix"
                    result="effect1_dropShadow_4532_1084"
                  />
                  <feBlend
                    mode="normal"
                    in="SourceGraphic"
                    in2="effect1_dropShadow_4532_1084"
                    result="shape"
                  />
                </filter>
                <filter
                  id="filter6_d_4532_1084"
                  x="476"
                  y="222.25"
                  width="477"
                  height="5.5"
                  filterUnits="userSpaceOnUse"
                  color-interpolation-filters="sRGB"
                >
                  <feFlood flood-opacity="0" result="BackgroundImageFix" />
                  <feColorMatrix
                    in="SourceAlpha"
                    type="matrix"
                    values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                    result="hardAlpha"
                  />
                  <feOffset dy="2" />
                  <feGaussianBlur stdDeviation="1" />
                  <feComposite in2="hardAlpha" operator="out" />
                  <feColorMatrix
                    type="matrix"
                    values="0 0 0 0 0.74 0 0 0 0 0.74 0 0 0 0 0.74 0 0 0 0.14 0"
                  />
                  <feBlend
                    mode="normal"
                    in2="BackgroundImageFix"
                    result="effect1_dropShadow_4532_1084"
                  />
                  <feBlend
                    mode="normal"
                    in="SourceGraphic"
                    in2="effect1_dropShadow_4532_1084"
                    result="shape"
                  />
                </filter>
                <filter
                  id="filter7_d_4532_1084"
                  x="436.25"
                  y="150"
                  width="5.5"
                  height="54"
                  filterUnits="userSpaceOnUse"
                  color-interpolation-filters="sRGB"
                >
                  <feFlood flood-opacity="0" result="BackgroundImageFix" />
                  <feColorMatrix
                    in="SourceAlpha"
                    type="matrix"
                    values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                    result="hardAlpha"
                  />
                  <feOffset dy="2" />
                  <feGaussianBlur stdDeviation="1" />
                  <feComposite in2="hardAlpha" operator="out" />
                  <feColorMatrix
                    type="matrix"
                    values="0 0 0 0 0.74 0 0 0 0 0.74 0 0 0 0 0.74 0 0 0 0.14 0"
                  />
                  <feBlend
                    mode="normal"
                    in2="BackgroundImageFix"
                    result="effect1_dropShadow_4532_1084"
                  />
                  <feBlend
                    mode="normal"
                    in="SourceGraphic"
                    in2="effect1_dropShadow_4532_1084"
                    result="shape"
                  />
                </filter>
                <filter
                  id="filter8_d_4532_1084"
                  x="987.25"
                  y="150"
                  width="5.5"
                  height="54"
                  filterUnits="userSpaceOnUse"
                  color-interpolation-filters="sRGB"
                >
                  <feFlood flood-opacity="0" result="BackgroundImageFix" />
                  <feColorMatrix
                    in="SourceAlpha"
                    type="matrix"
                    values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                    result="hardAlpha"
                  />
                  <feOffset dy="2" />
                  <feGaussianBlur stdDeviation="1" />
                  <feComposite in2="hardAlpha" operator="out" />
                  <feColorMatrix
                    type="matrix"
                    values="0 0 0 0 0.74 0 0 0 0 0.74 0 0 0 0 0.74 0 0 0 0.14 0"
                  />
                  <feBlend
                    mode="normal"
                    in2="BackgroundImageFix"
                    result="effect1_dropShadow_4532_1084"
                  />
                  <feBlend
                    mode="normal"
                    in="SourceGraphic"
                    in2="effect1_dropShadow_4532_1084"
                    result="shape"
                  />
                </filter>
                <filter
                  id="filter9_d_4532_1084"
                  x="411"
                  y="110.25"
                  width="30.75"
                  height="43.75"
                  filterUnits="userSpaceOnUse"
                  color-interpolation-filters="sRGB"
                >
                  <feFlood flood-opacity="0" result="BackgroundImageFix" />
                  <feColorMatrix
                    in="SourceAlpha"
                    type="matrix"
                    values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                    result="hardAlpha"
                  />
                  <feOffset dy="2" />
                  <feGaussianBlur stdDeviation="1" />
                  <feComposite in2="hardAlpha" operator="out" />
                  <feColorMatrix
                    type="matrix"
                    values="0 0 0 0 0.74 0 0 0 0 0.74 0 0 0 0 0.74 0 0 0 0.14 0"
                  />
                  <feBlend
                    mode="normal"
                    in2="BackgroundImageFix"
                    result="effect1_dropShadow_4532_1084"
                  />
                  <feBlend
                    mode="normal"
                    in="SourceGraphic"
                    in2="effect1_dropShadow_4532_1084"
                    result="shape"
                  />
                </filter>
                <filter
                  id="filter10_d_4532_1084"
                  x="987.25"
                  y="110.25"
                  width="30.75"
                  height="43.75"
                  filterUnits="userSpaceOnUse"
                  color-interpolation-filters="sRGB"
                >
                  <feFlood flood-opacity="0" result="BackgroundImageFix" />
                  <feColorMatrix
                    in="SourceAlpha"
                    type="matrix"
                    values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                    result="hardAlpha"
                  />
                  <feOffset dy="2" />
                  <feGaussianBlur stdDeviation="1" />
                  <feComposite in2="hardAlpha" operator="out" />
                  <feColorMatrix
                    type="matrix"
                    values="0 0 0 0 0.74 0 0 0 0 0.74 0 0 0 0 0.74 0 0 0 0.14 0"
                  />
                  <feBlend
                    mode="normal"
                    in2="BackgroundImageFix"
                    result="effect1_dropShadow_4532_1084"
                  />
                  <feBlend
                    mode="normal"
                    in="SourceGraphic"
                    in2="effect1_dropShadow_4532_1084"
                    result="shape"
                  />
                </filter>
                <filter
                  id="filter11_d_4532_1084"
                  x="436.25"
                  y="196"
                  width="43.75"
                  height="31.75"
                  filterUnits="userSpaceOnUse"
                  color-interpolation-filters="sRGB"
                >
                  <feFlood flood-opacity="0" result="BackgroundImageFix" />
                  <feColorMatrix
                    in="SourceAlpha"
                    type="matrix"
                    values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                    result="hardAlpha"
                  />
                  <feOffset dy="2" />
                  <feGaussianBlur stdDeviation="1" />
                  <feComposite in2="hardAlpha" operator="out" />
                  <feColorMatrix
                    type="matrix"
                    values="0 0 0 0 0.74 0 0 0 0 0.74 0 0 0 0 0.74 0 0 0 0.14 0"
                  />
                  <feBlend
                    mode="normal"
                    in2="BackgroundImageFix"
                    result="effect1_dropShadow_4532_1084"
                  />
                  <feBlend
                    mode="normal"
                    in="SourceGraphic"
                    in2="effect1_dropShadow_4532_1084"
                    result="shape"
                  />
                </filter>
                <filter
                  id="filter12_d_4532_1084"
                  x="949"
                  y="196"
                  width="43.75"
                  height="31.75"
                  filterUnits="userSpaceOnUse"
                  color-interpolation-filters="sRGB"
                >
                  <feFlood flood-opacity="0" result="BackgroundImageFix" />
                  <feColorMatrix
                    in="SourceAlpha"
                    type="matrix"
                    values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                    result="hardAlpha"
                  />
                  <feOffset dy="2" />
                  <feGaussianBlur stdDeviation="1" />
                  <feComposite in2="hardAlpha" operator="out" />
                  <feColorMatrix
                    type="matrix"
                    values="0 0 0 0 0.74 0 0 0 0 0.74 0 0 0 0 0.74 0 0 0 0.14 0"
                  />
                  <feBlend
                    mode="normal"
                    in2="BackgroundImageFix"
                    result="effect1_dropShadow_4532_1084"
                  />
                  <feBlend
                    mode="normal"
                    in="SourceGraphic"
                    in2="effect1_dropShadow_4532_1084"
                    result="shape"
                  />
                </filter>
                <filter
                  id="filter13_d_4532_1084"
                  x="1162"
                  y="107"
                  width="16"
                  height="12"
                  filterUnits="userSpaceOnUse"
                  color-interpolation-filters="sRGB"
                >
                  <feFlood flood-opacity="0" result="BackgroundImageFix" />
                  <feColorMatrix
                    in="SourceAlpha"
                    type="matrix"
                    values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                    result="hardAlpha"
                  />
                  <feOffset dy="2" />
                  <feGaussianBlur stdDeviation="1" />
                  <feComposite in2="hardAlpha" operator="out" />
                  <feColorMatrix
                    type="matrix"
                    values="0 0 0 0 0.74 0 0 0 0 0.74 0 0 0 0 0.74 0 0 0 0.14 0"
                  />
                  <feBlend
                    mode="normal"
                    in2="BackgroundImageFix"
                    result="effect1_dropShadow_4532_1084"
                  />
                  <feBlend
                    mode="normal"
                    in="SourceGraphic"
                    in2="effect1_dropShadow_4532_1084"
                    result="shape"
                  />
                </filter>
                <filter
                  id="filter14_d_4532_1084"
                  x="270"
                  y="107"
                  width="16"
                  height="12"
                  filterUnits="userSpaceOnUse"
                  color-interpolation-filters="sRGB"
                >
                  <feFlood flood-opacity="0" result="BackgroundImageFix" />
                  <feColorMatrix
                    in="SourceAlpha"
                    type="matrix"
                    values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                    result="hardAlpha"
                  />
                  <feOffset dy="2" />
                  <feGaussianBlur stdDeviation="1" />
                  <feComposite in2="hardAlpha" operator="out" />
                  <feColorMatrix
                    type="matrix"
                    values="0 0 0 0 0.74 0 0 0 0 0.74 0 0 0 0 0.74 0 0 0 0.14 0"
                  />
                  <feBlend
                    mode="normal"
                    in2="BackgroundImageFix"
                    result="effect1_dropShadow_4532_1084"
                  />
                  <feBlend
                    mode="normal"
                    in="SourceGraphic"
                    in2="effect1_dropShadow_4532_1084"
                    result="shape"
                  />
                </filter>
                <filter
                  id="filter15_d_4532_1084"
                  x="230"
                  y="0"
                  width="16"
                  height="12"
                  filterUnits="userSpaceOnUse"
                  color-interpolation-filters="sRGB"
                >
                  <feFlood flood-opacity="0" result="BackgroundImageFix" />
                  <feColorMatrix
                    in="SourceAlpha"
                    type="matrix"
                    values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                    result="hardAlpha"
                  />
                  <feOffset dy="2" />
                  <feGaussianBlur stdDeviation="1" />
                  <feComposite in2="hardAlpha" operator="out" />
                  <feColorMatrix
                    type="matrix"
                    values="0 0 0 0 0.74 0 0 0 0 0.74 0 0 0 0 0.74 0 0 0 0.14 0"
                  />
                  <feBlend
                    mode="normal"
                    in2="BackgroundImageFix"
                    result="effect1_dropShadow_4532_1084"
                  />
                  <feBlend
                    mode="normal"
                    in="SourceGraphic"
                    in2="effect1_dropShadow_4532_1084"
                    result="shape"
                  />
                </filter>
                <filter
                  id="filter16_d_4532_1084"
                  x="1204"
                  y="0"
                  width="16"
                  height="12"
                  filterUnits="userSpaceOnUse"
                  color-interpolation-filters="sRGB"
                >
                  <feFlood flood-opacity="0" result="BackgroundImageFix" />
                  <feColorMatrix
                    in="SourceAlpha"
                    type="matrix"
                    values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                    result="hardAlpha"
                  />
                  <feOffset dy="2" />
                  <feGaussianBlur stdDeviation="1" />
                  <feComposite in2="hardAlpha" operator="out" />
                  <feColorMatrix
                    type="matrix"
                    values="0 0 0 0 0.74 0 0 0 0 0.74 0 0 0 0 0.74 0 0 0 0.14 0"
                  />
                  <feBlend
                    mode="normal"
                    in2="BackgroundImageFix"
                    result="effect1_dropShadow_4532_1084"
                  />
                  <feBlend
                    mode="normal"
                    in="SourceGraphic"
                    in2="effect1_dropShadow_4532_1084"
                    result="shape"
                  />
                </filter>
                <linearGradient
                  id="paint0_linear_4532_1084"
                  x1="343"
                  y1="110.153"
                  x2="26.1933"
                  y2="18.7402"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0.335589" stop-color="white" />
                  <stop offset="1" stop-color="white" stop-opacity="0" />
                </linearGradient>
                <linearGradient
                  id="paint1_linear_4532_1084"
                  x1="414"
                  y1="109.741"
                  x2="29.8737"
                  y2="21.8951"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0.335589" stop-color="white" />
                  <stop offset="0.831806" stop-color="white" stop-opacity="0" />
                </linearGradient>
                <linearGradient
                  id="paint2_linear_4532_1084"
                  x1="1036"
                  y1="109.741"
                  x2="1420.13"
                  y2="21.8951"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0.335589" stop-color="white" />
                  <stop offset="0.831806" stop-color="white" stop-opacity="0" />
                </linearGradient>
                <linearGradient
                  id="paint3_linear_4532_1084"
                  x1="1097"
                  y1="110.153"
                  x2="1413.81"
                  y2="18.7402"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0.335589" stop-color="white" />
                  <stop offset="1" stop-color="white" stop-opacity="0" />
                </linearGradient>
                <linearGradient
                  id="paint4_linear_4532_1084"
                  x1="131"
                  y1="111.5"
                  x2="413"
                  y2="111.5"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stop-color="white" stop-opacity="0" />
                  <stop offset="1" stop-color="white" />
                </linearGradient>
                <linearGradient
                  id="paint5_linear_4532_1084"
                  x1="1016"
                  y1="111.5"
                  x2="1298"
                  y2="111.5"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stop-color="white" />
                  <stop offset="1" stop-color="white" stop-opacity="0" />
                </linearGradient>
              </defs>
            </svg>
            <div className="xl:h-[22rem] col-span-1 row-span-1 order-1 md:order-none lg:h-[20rem] h-[18rem] md:w-full w-[98%]  bg-white rounded-xl p-2 lg:mr-0 ">
              <div className="bg-[#FCFCFC] border-[#F2F2F2] border w-full h-full rounded-xl px-3 py-3">
                <h1 className="text-center lg:text-base text-sm font-medium pb-2">
                  Your Weekly Activity
                </h1>
                <div>
                  <div className="bg-[#F7F7F7] border-gray-200 xl:h-[8.6rem] lg:h-[8.2rem] h-[7.6rem] overflow-hidden border flex flex-col justify-between rounded-xl relative">
                    <Select.Root onValueChange={setSelectedFilter}>
                      <Select.Trigger
                        className="inline-flex h-[30px] absolute top-1 right-1 z-10 items-center justify-center gap-[5px] rounded-xl bg-white px-2 text-xs leading-noneshadow-[0_2px_10px] shadow-black/10 outline-none hover:bg-mauve3  data-[placeholder]:text-black"
                        aria-label="Insights"
                      >
                        <Select.Value
                          placeholder="This Year"
                          className="lg:text-base text-sm"
                        />
                        <Select.Icon>
                          <ChevronDown className="lg:w-6 w-4 lg:h-6 h-4" />
                        </Select.Icon>
                      </Select.Trigger>
                      <Select.Portal>
                        <Select.Content className="z-50 overflow-hidden rounded-md bg-white shadow-[0px_10px_38px_-10px_rgba(22,_23,_24,_0.35),0px_10px_20px_-15px_rgba(22,_23,_24,_0.2)]">
                          <Select.ScrollUpButton className="flex h-[25px] cursor-default items-center justify-center bg-white ">
                            <ChevronUp />
                          </Select.ScrollUpButton>
                          <Select.Viewport className="p-[5px] lg:text-base text-sm">
                            <Select.Group>
                              <SelectItem value="year"> This year</SelectItem>
                              <SelectItem value="months">
                                This Months
                              </SelectItem>
                              <SelectItem value="week">This Week</SelectItem>
                              <SelectItem value="today">Today</SelectItem>
                            </Select.Group>

                            <Select.Separator className="m-[5px] h-px bg-violet6" />
                          </Select.Viewport>
                          <Select.ScrollDownButton className="flex h-[25px] cursor-default items-center justify-center bg-white text-violet11">
                            <ChevronDown />
                          </Select.ScrollDownButton>
                        </Select.Content>
                      </Select.Portal>
                    </Select.Root>
                    <h2 className="flex gap-2 items-center lg:text-xs text-[0.6rem] p-2 ">
                      17 Emails{" "}
                      <span className="bg-green-200 font-semibold   p-0.5 lg:px-1.5 px-0.5 text-green-600 border-green-300 border  rounded-full">
                        +4
                      </span>
                    </h2>
                    <ChartContainer
                      config={chartConfig}
                      className="p-0 lg:h-24 h-20 w-full "
                    >
                      <AreaChart
                        accessibilityLayer
                        data={filteredChartData}
                        margin={{
                          left: 12,
                          right: 12,
                        }}
                      >
                        <Area
                          dataKey="desktop"
                          type="natural"
                          fill="var(--color-desktop)"
                          fillOpacity={0.4}
                          stroke="var(--color-desktop)"
                        />
                      </AreaChart>
                    </ChartContainer>
                  </div>
                  <div className="grid grid-cols-2 pt-4 gap-2">
                    <div className="bg-[#F7F7F7] xl:h-28 lg:h-24 h-20 border-gray-200 overflow-hidden border rounded-xl flex flex-col lg:justify-between justify-end relative">
                      <h2 className="flex gap-1  lg:relative absolute top-0.5 left-0.5 items-center justify-between lg:text-xs text-[0.55rem] p-2 ">
                        25 Calls{" "}
                        <span className="bg-green-200   p-0.5 lg:px-2 px-0.5 text-green-600 border-green-300 border  rounded-full">
                          +7
                        </span>
                      </h2>
                      <ChartContainer
                        config={chartConfig}
                        className="p-0 h-16 w-full"
                      >
                        <AreaChart accessibilityLayer data={filteredCalls}>
                          <Area
                            dataKey="desktop"
                            type="natural"
                            fill="var(--color-desktop)"
                            fillOpacity={0.4}
                            stroke="var(--color-desktop)"
                          />
                        </AreaChart>
                      </ChartContainer>
                    </div>
                    <div className="bg-[#F7F7F7] xl:h-28 lg:h-24 h-20 border-gray-200 overflow-hidden border rounded-xl relative flex flex-col lg:justify-between justify-end">
                      <h2 className="flex gap-1 lg:relative absolute top-0.5 left-0.5 items-center justify-between lg:text-xs text-[0.55rem]  p-2">
                        15 Project{" "}
                        <span className="bg-green-200   p-0.5 lg:px-2 px-0.5 text-green-600 border-green-300 border  rounded-full">
                          +2
                        </span>
                      </h2>
                      <ChartContainer
                        config={chartConfig}
                        className="p-0 h-16 w-full"
                      >
                        <AreaChart accessibilityLayer data={filteredProjects}>
                          <Area
                            dataKey="desktop"
                            type="natural"
                            fill="var(--color-desktop)"
                            fillOpacity={0.4}
                            stroke="var(--color-desktop)"
                          />
                        </AreaChart>
                      </ChartContainer>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="xl:h-[14.5rem] lg:h-[14rem] h-[12.2rem] w-full col-span-1 row-span-1 order-3 md:order-none bg-white lg:rounded-xl md:mt-0 mt-2 rounded-l-xl ">
              <div className="relative flex items-center justify-center lg:h-24 h-20 bg-[url('/hero/pattern.png')] bg-cover bg-center">
                <figure className="p-2 bg-layoutHubBase/40 relative h-14 w-14 rounded-full">
                  <div className="bg-layoutHubBase rounded-full w-full h-full p-2">
                    <img
                      src={`${process.env.NEXT_PUBLIC_ANIMATION_URL}/hero/ai.svg`}
                      width={400}
                      height={400}
                      className="w-full h-full"
                      alt="ai.svg"
                    />
                  </div>
                </figure>
              </div>
              <article className="text-center lg:w-[80%] w-[95%] mx-auto space-y-2">
                <h1 className="font-medium lg:text-2xl text-xl">Ai Chatbot</h1>
                <p className="text-gray-600 lg:text-base text-xs leading-[120%]">
                  👋 Want to chat? I’am an AI chatbot here to help you find your
                  way.
                </p>
              </article>
            </div>
            <div className="xl:h-[14.5rem] lg:h-[14rem] h-[12.2rem] w-full col-span-1 row-span-1 order-4 md:order-none  bg-white lg:rounded-xl md:mt-0 mt-2 rounded-r-xl">
              <div className="relative flex items-center justify-center lg:h-24 h-20  bg-[url('/hero/pattern.png')] bg-cover bg-center">
                <figure className="p-2 bg-layoutHubBase/40 relative h-14 w-14 rounded-full">
                  <div className="bg-layoutHubBase rounded-full w-full h-full p-2">
                    <img
                      src={`${process.env.NEXT_PUBLIC_ANIMATION_URL}/hero/magic.svg`}
                      width={400}
                      height={400}
                      className="w-full h-full"
                      alt="magic.svg"
                    />
                  </div>
                </figure>
              </div>
              <article className="text-center lg:w-[80%] w-[95%] mx-auto space-y-2">
                <h1 className="font-medium lg:text-xl text-lg w-fit mx-auto rounded-full px-4 py-1 bg-layoutHubBase/20">
                  Layouts AI
                </h1>
                <p className="text-gray-600 leading-[120%] lg:text-base text-xs">
                  Repurpose your content with content remix
                </p>
              </article>
            </div>
            <div className="xl:h-[22rem] lg:h-[20rem] h-[18rem] col-span-1 row-span-1 order-2 md:order-none md:w-full w-[98%] ml-auto   bg-white rounded-xl p-2 lg:ml-0 ">
              <div className="bg-[#FCFCFC] border-[#F2F2F2] border w-full h-full rounded-xl px-3 py-3 overflow-hidden">
                <h1 className="text-center font-medium pb-3 border-b border-[#f2f2f2] lg:text-base  text-sm mt-2">
                  Manage Your Users
                </h1>

                <div className=" px-1 space-y-2 border-b  py-3 border-[#f2f2f2]">
                  <figure className="flex items-center gap-2">
                    <img
                      src={`${process.env.NEXT_PUBLIC_ANIMATION_URL}/people/image1.png`}
                      alt="image-1"
                      className="lg:w-12 w-10 lg:h-12 h-10 object-cover "
                    />
                    <article>
                      <h1 className="lg:text-sm text-xs">Aisha Saah</h1>
                      <p className="lg:text-sm text-xs text-gray-500">
                        Project Manager
                      </p>
                    </article>
                  </figure>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <button className="p-1 px-3 text-white bg-red-400  rounded-full">
                        <Mail className="w-4 h-4" />
                      </button>
                      <button className="p-1 px-3 text-white bg-green-400  rounded-full">
                        <Phone className="w-4 h-4" />
                      </button>
                    </div>
                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger asChild>
                        <button
                          className="text-black bg-gray-100 px-3 py-1 inline-block rounded-xl"
                          aria-label="Customise options"
                        >
                          <Ellipsis />
                        </button>
                      </DropdownMenu.Trigger>

                      <DropdownMenu.Portal>
                        <DropdownMenu.Content
                          className="min-w-32 w-full z-50 rounded-md bg-white p-[5px] shadow-[0px_10px_38px_-10px_rgba(22,_23,_24,_0.35),_0px_10px_20px_-15px_rgba(22,_23,_24,_0.2)] will-change-[opacity,transform] data-[side=bottom]:animate-slideUpAndFade data-[side=left]:animate-slideRightAndFade data-[side=right]:animate-slideLeftAndFade data-[side=top]:animate-slideDownAndFade"
                          sideOffset={5}
                        >
                          <DropdownMenu.Item className="flex gap-1 p-2 text-sm items-center hover:bg-gray-100 cursor-pointer justify-between  ">
                            <CircleUser size={16} />
                            Profile
                          </DropdownMenu.Item>
                          <DropdownMenu.Item className="flex gap-1 p-2 text-sm items-center hover:bg-gray-100 cursor-pointer justify-between ">
                            <Settings size={16} />
                            Settings
                          </DropdownMenu.Item>
                          <DropdownMenu.Item className="flex gap-1 p-2 text-sm items-center hover:bg-red-300 rounded-md bg-red-100  cursor-pointer justify-between">
                            Delete
                            <div className="bg-">
                              <Trash size={16} />
                            </div>
                          </DropdownMenu.Item>
                        </DropdownMenu.Content>
                      </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                  </div>
                </div>
                <div className=" px-1 space-y-2 border-b py-3 border-[#f2f2f2]">
                  <figure className="flex items-center gap-2">
                    <img
                      src={`${process.env.NEXT_PUBLIC_ANIMATION_URL}/people/image4.png`}
                      alt="image-1"
                      className="lg:w-12 w-10 lg:h-12 h-10 object-cover "
                    />
                    <article>
                      <h1 className="lg:text-sm text-xs">Aisha Saah</h1>
                      <p className="lg:text-sm text-xs text-gray-500">
                        Project Manager
                      </p>
                    </article>
                  </figure>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <button className="p-1 px-3 text-white bg-red-400  rounded-full">
                        <Mail className="w-4 h-4" />
                      </button>
                      <button className="p-1 px-3 text-white bg-green-400  rounded-full">
                        <Phone className="w-4 h-4" />
                      </button>
                    </div>
                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger asChild>
                        <button
                          className="text-black bg-gray-100 px-3 py-1 inline-block rounded-xl"
                          aria-label="Customise options"
                        >
                          <Ellipsis />
                        </button>
                      </DropdownMenu.Trigger>

                      <DropdownMenu.Portal>
                        <DropdownMenu.Content
                          className="min-w-32 w-full z-50 rounded-md bg-white p-[5px] shadow-[0px_10px_38px_-10px_rgba(22,_23,_24,_0.35),_0px_10px_20px_-15px_rgba(22,_23,_24,_0.2)] will-change-[opacity,transform] data-[side=bottom]:animate-slideUpAndFade data-[side=left]:animate-slideRightAndFade data-[side=right]:animate-slideLeftAndFade data-[side=top]:animate-slideDownAndFade"
                          sideOffset={5}
                        >
                          <DropdownMenu.Item className="flex gap-1 p-2 text-sm items-center hover:bg-gray-100 cursor-pointer justify-between  ">
                            <CircleUser size={16} />
                            Profile
                          </DropdownMenu.Item>
                          <DropdownMenu.Item className="flex gap-1 p-2 text-sm items-center hover:bg-gray-100 cursor-pointer justify-between ">
                            <Settings size={16} />
                            Settings
                          </DropdownMenu.Item>
                          <DropdownMenu.Item className="flex gap-1 p-2 text-sm items-center hover:bg-red-300 rounded-md bg-red-100  cursor-pointer justify-between">
                            Delete
                            <div className="bg-">
                              <Trash size={16} />
                            </div>
                          </DropdownMenu.Item>
                        </DropdownMenu.Content>
                      </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                  </div>
                </div>
                <div className=" px-1 space-y-2 border-b py-3 border-[#f2f2f2]">
                  <figure className="flex items-center gap-2">
                    <img
                      src={`${process.env.NEXT_PUBLIC_ANIMATION_URL}/people/image2.png`}
                      alt="image-1"
                      className="lg:w-12 w-10 lg:h-12 h-10 object-cover "
                    />
                    <article>
                      <h1 className="lg:text-sm text-xs">Aisha Saah</h1>
                      <p className="lg:text-sm text-xs text-gray-500">
                        Project Manager
                      </p>
                    </article>
                  </figure>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <button className="p-1 px-3 text-white bg-red-400  rounded-full">
                        <Mail className="w-4 h-4" />
                      </button>
                      <button className="p-1 px-3 text-white bg-green-400  rounded-full">
                        <Phone className="w-4 h-4" />
                      </button>
                    </div>
                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger asChild>
                        <button
                          className="text-black bg-gray-100 px-3 py-1 inline-block rounded-xl"
                          aria-label="Customise options"
                        >
                          <Ellipsis />
                        </button>
                      </DropdownMenu.Trigger>

                      <DropdownMenu.Portal>
                        <DropdownMenu.Content
                          className="min-w-32 w-full z-50 rounded-md bg-white p-[5px] shadow-[0px_10px_38px_-10px_rgba(22,_23,_24,_0.35),_0px_10px_20px_-15px_rgba(22,_23,_24,_0.2)] will-change-[opacity,transform] data-[side=bottom]:animate-slideUpAndFade data-[side=left]:animate-slideRightAndFade data-[side=right]:animate-slideLeftAndFade data-[side=top]:animate-slideDownAndFade"
                          sideOffset={5}
                        >
                          <DropdownMenu.Item className="flex gap-1 p-2 text-sm items-center hover:bg-gray-100 cursor-pointer justify-between  ">
                            <CircleUser size={16} />
                            Profile
                          </DropdownMenu.Item>
                          <DropdownMenu.Item className="flex gap-1 p-2 text-sm items-center hover:bg-gray-100 cursor-pointer justify-between ">
                            <Settings size={16} />
                            Settings
                          </DropdownMenu.Item>
                          <DropdownMenu.Item className="flex gap-1 p-2 text-sm items-center hover:bg-red-300 rounded-md bg-red-100  cursor-pointer justify-between">
                            Delete
                            <div className="bg-">
                              <Trash size={16} />
                            </div>
                          </DropdownMenu.Item>
                        </DropdownMenu.Content>
                      </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className=" py-8 pt-16 text-center w-full overflow-hidden">
            <p>
              216,000+ customers in over 135 countries grow their businesses
              with HubSpot
            </p>
            <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
              <Marquee
                pauseOnHover
                className="[--duration:20s] gap-10 py-2 items-center "
              >
                {customers.map((review) => (
                  <figure key={review.name}>
                    <img src={review?.img} className="w-40" alt="" />
                  </figure>
                ))}
              </Marquee>

              <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-layoutHubbg " />
              <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-layoutHubbg " />
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

const SelectItem = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof Select.Item>
>(({ children, className, ...props }, forwardedRef) => {
  return (
    <Select.Item
      className={cn(
        "relative flex h-[25px] select-none items-center rounded-[3px] pl-[25px] pr-[35px] text-[13px] leading-none text-violet11 data-[disabled]:pointer-events-none data-[highlighted]:bg-violet9 data-[disabled]:text-mauve8 data-[highlighted]:text-violet1 data-[highlighted]:outline-none",
        className
      )}
      {...props}
      ref={forwardedRef}
    >
      <Select.ItemText>{children}</Select.ItemText>
      <Select.ItemIndicator className="absolute left-0 inline-flex w-[18px] items-center justify-center">
        <CheckCheck size={16} />
      </Select.ItemIndicator>
    </Select.Item>
  );
});

export default LayoutHubs;

