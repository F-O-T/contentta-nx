"use client";
import {
   type MotionValue,
   motion,
   useScroll,
   useSpring,
   useTransform,
} from "motion/react";

import React from "react";

const defaultProducts = [
   {
      link: "https://gomoonbeam.com",
      thumbnail:
         "https://aceternity.com/images/products/thumbnails/new/moonbeam.png",
      title: "Moonbeam",
   },
   {
      link: "https://cursor.so",
      thumbnail:
         "https://aceternity.com/images/products/thumbnails/new/cursor.png",
      title: "Cursor",
   },
   {
      link: "https://userogue.com",
      thumbnail:
         "https://aceternity.com/images/products/thumbnails/new/rogue.png",
      title: "Rogue",
   },
   {
      link: "https://editorially.org",
      thumbnail:
         "https://aceternity.com/images/products/thumbnails/new/editorially.png",
      title: "Editorially",
   },
   {
      link: "https://editrix.ai",
      thumbnail:
         "https://aceternity.com/images/products/thumbnails/new/editrix.png",
      title: "Editrix AI",
   },
   {
      link: "https://app.pixelperfect.quest",
      thumbnail:
         "https://aceternity.com/images/products/thumbnails/new/pixelperfect.png",
      title: "Pixel Perfect",
   },
   {
      link: "https://algochurn.com",
      thumbnail:
         "https://aceternity.com/images/products/thumbnails/new/algochurn.png",
      title: "Algochurn",
   },
   {
      link: "https://ui.aceternity.com",
      thumbnail:
         "https://aceternity.com/images/products/thumbnails/new/aceternityui.png",
      title: "Aceternity UI",
   },
   {
      link: "https://tailwindmasterkit.com",
      thumbnail:
         "https://aceternity.com/images/products/thumbnails/new/tailwindmasterkit.png",
      title: "Tailwind Master Kit",
   },
   {
      link: "https://smartbridgetech.com",
      thumbnail:
         "https://aceternity.com/images/products/thumbnails/new/smartbridge.png",
      title: "SmartBridge",
   },
   {
      link: "https://renderwork.studio",
      thumbnail:
         "https://aceternity.com/images/products/thumbnails/new/renderwork.png",
      title: "Renderwork Studio",
   },
   {
      link: "https://cremedigital.com",
      thumbnail:
         "https://aceternity.com/images/products/thumbnails/new/cremedigital.png",
      title: "Creme Digital",
   },
   {
      link: "https://goldenbellsacademy.com",
      thumbnail:
         "https://aceternity.com/images/products/thumbnails/new/goldenbellsacademy.png",
      title: "Golden Bells Academy",
   },
   {
      link: "https://invoker.lol",
      thumbnail:
         "https://aceternity.com/images/products/thumbnails/new/invoker.png",
      title: "Invoker Labs",
   },
   {
      link: "https://efreeinvoice.com",
      thumbnail:
         "https://aceternity.com/images/products/thumbnails/new/efreeinvoice.png",
      title: "E Free Invoice",
   },
];

export const HeroParallax = () => {
   const products = defaultProducts;
   const firstRow = products.slice(0, 5);
   const secondRow = products.slice(5, 10);
   const thirdRow = products.slice(10, 15);
   const ref = React.useRef(null);
   const { scrollYProgress } = useScroll({
      offset: ["start start", "end start"],
      target: ref,
   });

   const springConfig = { bounce: 100, damping: 30, stiffness: 300 };

   const translateX = useSpring(
      useTransform(scrollYProgress, [0, 1], [0, 1000]),
      springConfig,
   );
   const translateXReverse = useSpring(
      useTransform(scrollYProgress, [0, 1], [0, -1000]),
      springConfig,
   );
   const rotateX = useSpring(
      useTransform(scrollYProgress, [0, 0.2], [15, 0]),
      springConfig,
   );
   const opacity = useSpring(
      useTransform(scrollYProgress, [0, 0.2], [0.2, 1]),
      springConfig,
   );
   const rotateZ = useSpring(
      useTransform(scrollYProgress, [0, 0.2], [20, 0]),
      springConfig,
   );
   const translateY = useSpring(
      useTransform(scrollYProgress, [0, 0.2], [-700, 500]),
      springConfig,
   );
   return (
      <div
         className="h-[300vh] py-30 overflow-hidden bg-background  antialiased relative flex flex-col self-auto [perspective:1000px] [transform-style:preserve-3d]"
         ref={ref}
      >
         <Header />
         <motion.div
            className=""
            style={{
               opacity,
               rotateX,
               rotateZ,
               translateY,
            }}
         >
            <motion.div className="flex flex-row-reverse space-x-reverse space-x-20 mb-20">
               {firstRow.map((product) => (
                  <ProductCard
                     key={product.title}
                     product={product}
                     translate={translateX}
                  />
               ))}
            </motion.div>
            <motion.div className="flex flex-row  mb-20 space-x-20 ">
               {secondRow.map((product) => (
                  <ProductCard
                     key={product.title}
                     product={product}
                     translate={translateXReverse}
                  />
               ))}
            </motion.div>
            <motion.div className="flex flex-row-reverse space-x-reverse space-x-20">
               {thirdRow.map((product) => (
                  <ProductCard
                     key={product.title}
                     product={product}
                     translate={translateX}
                  />
               ))}
            </motion.div>
         </motion.div>
      </div>
   );
};

export const Header = () => {
   return (
      <div className="max-w-5xl relative mx-auto py-20 md:py-40 px-4 w-full  left-0 top-0">
         <h1 className="text-2xl md:text-7xl font-bold text-foreground">
            The Ultimate <br /> development studio
         </h1>
         <p className="max-w-2xl text-base md:text-xl mt-8 text-muted-foreground">
            We build beautiful products with the latest technologies and
            frameworks. We are a team of passionate developers and designers
            that love to build amazing products.
         </p>
      </div>
   );
};

export const ProductCard = ({
   product,
   translate,
}: {
   product: {
      title: string;
      link: string;
      thumbnail: string;
   };
   translate: MotionValue<number>;
}) => {
   return (
      <motion.div
         className="group/product h-96 w-[30rem] relative flex-shrink-0"
         key={product.title}
         style={{
            x: translate,
         }}
         whileHover={{
            y: -20,
         }}
      >
         <a
            className="block group-hover/product:shadow-2xl "
            href={product.link}
         >
            <img
               alt={product.title}
               className="object-cover object-left-top absolute h-full w-full inset-0"
               src={product.thumbnail}
            />
         </a>
         <div className="absolute inset-0 h-full w-full opacity-0 group-hover/product:opacity-80 bg-black pointer-events-none"></div>
         <h2 className="absolute bottom-4 left-4 opacity-0 group-hover/product:opacity-100 text-white">
            {product.title}
         </h2>
      </motion.div>
   );
};
