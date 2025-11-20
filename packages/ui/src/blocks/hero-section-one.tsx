import { ChevronRight, CirclePlay } from "lucide-react";
import { Button } from "../components/button";

export interface HeroSection1Content {
   title: string;
   description: string;
   primaryButtonText: string;
   primaryButtonLink: string;
   secondaryButtonText: string;
   secondaryButtonLink: string;
   trustedByText: string;
   logos: Array<{
      alt: string;
      src: string;
      height: number;
   }>;
   imgUrl: string;
}

const defaultContent: HeroSection1Content = {
   description:
      "One tool that does it all. Search, generate, analyze, and chat—right inside Tailark.",
   imgUrl: "",
   logos: [
      {
         alt: "Column Logo",
         height: 16,
         src: "https://html.tailus.io/blocks/customers/column.svg",
      },
      {
         alt: "Nvidia Logo",
         height: 20,
         src: "https://html.tailus.io/blocks/customers/nvidia.svg",
      },
      {
         alt: "GitHub Logo",
         height: 16,
         src: "https://html.tailus.io/blocks/customers/github.svg",
      },
   ],
   primaryButtonLink: "#link",
   primaryButtonText: "Get Started",
   secondaryButtonLink: "#link",
   secondaryButtonText: "Watch video",
   title: "Simple payments for startups",
   trustedByText: "Trusted by teams at :",
};

export function HeroSection1() {
   const mergedContent = { ...defaultContent };

   return (
      <section className="bg-background">
         <div className="relative py-36">
            <div className="relative z-10 mx-auto w-full max-w-5xl px-6">
               <div className="md:w-1/2">
                  <div>
                     <h1 className="max-w-md text-balance text-5xl font-medium md:text-6xl">
                        {mergedContent.title}
                     </h1>
                     <p className="text-muted-foreground my-8 max-w-2xl text-balance text-xl">
                        {mergedContent.description}
                     </p>

                     <div className="flex items-center gap-3">
                        <Button asChild className="pr-4.5" size="lg">
                           <a href={mergedContent.primaryButtonLink}>
                              <span className="text-nowrap">
                                 {mergedContent.primaryButtonText}
                              </span>
                              <ChevronRight className="opacity-50" />
                           </a>
                        </Button>
                        <Button
                           asChild
                           className="pl-5"
                           key={2}
                           size="lg"
                           variant="outline"
                        >
                           <a href={mergedContent.secondaryButtonLink}>
                              <CirclePlay className="fill-primary/25 stroke-primary" />
                              <span className="text-nowrap">
                                 {mergedContent.secondaryButtonText}
                              </span>
                           </a>
                        </Button>
                     </div>
                  </div>

                  <div className="mt-10">
                     <p className="text-muted-foreground">
                        {mergedContent.trustedByText}
                     </p>
                     <div className="mt-6 grid max-w-sm grid-cols-3 gap-6">
                        {mergedContent.logos.map((logo, index) => (
                           <div className="flex" key={index}>
                              <img
                                 alt={logo.alt}
                                 className="h-4 w-fit"
                                 height={logo.height}
                                 src={logo.src}
                                 width="auto"
                              />
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>

            <div className="perspective-near mt-24 translate-x-12 md:absolute md:-right-6 md:bottom-16 md:left-1/2 md:top-40 md:mt-0 md:translate-x-0">
               <div className="before:border-foreground/5 before:bg-foreground/5 relative h-full before:absolute before:-inset-x-4 before:bottom-7 before:top-0 before:skew-x-6 before:rounded-[calc(var(--radius)+1rem)] before:border">
                  <div className="bg-background rounded-(--radius) shadow-foreground/10 ring-foreground/5 relative h-full -translate-y-12 skew-x-6 overflow-hidden border border-transparent shadow-md ring-1">
                     <img
                        alt="app screen"
                        className="object-top-left size-full object-cover w-20 h-20 shadow-lg"
                        src={mergedContent.imgUrl}
                     />
                  </div>
               </div>
            </div>
         </div>
      </section>
   );
}
