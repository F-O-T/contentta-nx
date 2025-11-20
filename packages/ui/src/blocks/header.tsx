"use client";

import { Menu, X } from "lucide-react";

import React from "react";
import { Button } from "../components/button";
import { cn } from "../lib/utils";
import { Logo } from "./logo";

const menuItems = [
   { href: "#link", name: "Features" },
   { href: "#link", name: "Pricing" },
   { href: "#link", name: "About" },
];

export const HeroHeader = () => {
   const [menuState, setMenuState] = React.useState(false);
   const [isScrolled, setIsScrolled] = React.useState(false);

   React.useEffect(() => {
      const handleScroll = () => {
         setIsScrolled(window.scrollY > 50);
      };
      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
   }, []);
   return (
      <header>
         <nav
            className={cn(
               "fixed z-20 w-full transition-all duration-300",
               isScrolled &&
                  "bg-background/75 border-b border-black/5 backdrop-blur-lg",
            )}
            data-state={menuState && "active"}
         >
            <div className="mx-auto max-w-5xl px-6">
               <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0">
                  <div className="flex w-full justify-between gap-6 lg:w-auto">
                     <a
                        aria-label="home"
                        className="flex items-center space-x-2"
                        href="/"
                     >
                        <Logo />
                     </a>

                     <button
                        aria-label={menuState ? "Close Menu" : "Open Menu"}
                        className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden"
                        onClick={() => setMenuState(!menuState)}
                        type="button"
                     >
                        <Menu className="in-data-[state=active]:rotate-180 in-data-[state=active]:scale-0 in-data-[state=active]:opacity-0 m-auto size-6 duration-200" />
                        <X className="in-data-[state=active]:rotate-0 in-data-[state=active]:scale-100 in-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200" />
                     </button>

                     <div className="m-auto hidden size-fit lg:block">
                        <ul className="flex gap-1">
                           {menuItems.map((item, index) => (
                              <li key={index}>
                                 <Button asChild size="sm" variant="ghost">
                                    <a className="text-base" href={item.href}>
                                       <span>{item.name}</span>
                                    </a>
                                 </Button>
                              </li>
                           ))}
                        </ul>
                     </div>
                  </div>

                  <div className="bg-background in-data-[state=active]:block lg:in-data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border p-6 shadow-2xl shadow-zinc-300/20 md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none dark:shadow-none dark:lg:bg-transparent">
                     <div className="lg:hidden">
                        <ul className="space-y-6 text-base">
                           {menuItems.map((item, index) => (
                              <li key={index}>
                                 <a
                                    className="text-muted-foreground hover:text-accent-foreground block duration-150"
                                    href={item.href}
                                 >
                                    <span>{item.name}</span>
                                 </a>
                              </li>
                           ))}
                        </ul>
                     </div>
                     <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit">
                        <Button
                           asChild
                           className={cn(isScrolled && "lg:hidden")}
                           size="sm"
                           variant="ghost"
                        >
                           <a href="/#">
                              <span>Login</span>
                           </a>
                        </Button>
                        <Button
                           asChild
                           className={cn(isScrolled && "lg:hidden")}
                           size="sm"
                        >
                           <a href="/#">
                              <span>Sign Up</span>
                           </a>
                        </Button>
                        <Button
                           asChild
                           className={cn(
                              isScrolled ? "lg:inline-flex" : "hidden",
                           )}
                           size="sm"
                        >
                           <a href="/#">
                              <span>Get Started</span>
                           </a>
                        </Button>
                     </div>
                  </div>
               </div>
            </div>
         </nav>
      </header>
   );
};
