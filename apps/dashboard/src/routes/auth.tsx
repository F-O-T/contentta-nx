import { translate } from "@packages/localization";
import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";

export const Route = createFileRoute("/auth")({
   component: AuthLayout,
   staticData: {
      breadcrumb: "Authentication",
   },
});

function AuthLayout() {
   const location = useLocation();

   return (
      <div className="flex min-h-screen w-full overflow-hidden bg-background">
         {/* Form Panel - First on mobile and desktop */}
         <main className="flex flex-1 flex-col justify-center items-center px-4 py-8 md:px-8 lg:px-12 order-1 lg:order-1">
            {/* Mobile Logo */}
            <div className="lg:hidden mb-8">
               <div className="flex items-center gap-2">
                  <img alt="Montte" className="w-10 h-10" src="/favicon.svg" />
                  <span className="text-xl font-semibold">Contentta</span>
               </div>
            </div>

            <section
               className="w-full max-w-md duration-500 animate-in slide-in-from-bottom-4 fade-in"
               key={location.pathname}
            >
               <section aria-label="Authentication">
                  <Outlet />
               </section>
            </section>
         </main>

         {/* Brand Panel - Hidden on mobile, on the right */}
         <aside className="hidden lg:flex lg:w-[40%] relative flex-col justify-between bg-gradient-to-br from-primary via-primary/95 to-primary/85 p-8 xl:p-12 order-2">
            {/* Background Pattern */}
            <div
               aria-hidden="true"
               className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.1)_1px,transparent_0)] bg-[size:32px_32px]"
            />

            {/* Content */}
            <div className="relative z-10">
               <div className="flex items-center gap-3">
                  <img
                     alt="Montte"
                     className="w-10 h-10 brightness-0 invert"
                     src="/favicon.svg"
                  />
                  <span className="text-xl font-semibold text-white">
                     Contentta
                  </span>
               </div>
            </div>

            {/* Center Content - Illustration & Tagline */}
            <div className="relative z-10 space-y-8">
               {/* AI Content Creation Illustration */}
               <div className="relative">
                  <svg
                     className="w-full max-w-md mx-auto opacity-90"
                     fill="none"
                     viewBox="0 0 400 300"
                     xmlns="http://www.w3.org/2000/svg"
                  >
                     <title>AI-powered content creation illustration</title>
                     
                     {/* Main editor window */}
                     <rect
                        height="180"
                        rx="8"
                        stroke="rgba(255,255,255,0.3)"
                        strokeWidth="2"
                        width="240"
                        x="80"
                        y="60"
                     />
                     
                     {/* Editor title bar */}
                     <rect
                        fill="rgba(255,255,255,0.1)"
                        height="24"
                        rx="8"
                        width="240"
                        x="80"
                        y="60"
                     />
                     <circle cx="95" cy="72" fill="rgba(255,255,255,0.3)" r="4" />
                     <circle cx="108" cy="72" fill="rgba(255,255,255,0.2)" r="4" />
                     <circle cx="121" cy="72" fill="rgba(255,255,255,0.15)" r="4" />
                     
                     {/* Text lines representing blog content */}
                     <rect fill="rgba(255,255,255,0.4)" height="6" rx="3" width="140" x="95" y="100" />
                     <rect fill="rgba(255,255,255,0.25)" height="4" rx="2" width="180" x="95" y="116" />
                     <rect fill="rgba(255,255,255,0.25)" height="4" rx="2" width="160" x="95" y="126" />
                     <rect fill="rgba(255,255,255,0.25)" height="4" rx="2" width="170" x="95" y="136" />
                     <rect fill="rgba(255,255,255,0.2)" height="4" rx="2" width="120" x="95" y="146" />
                     
                     {/* Paragraph break */}
                     <rect fill="rgba(255,255,255,0.25)" height="4" rx="2" width="175" x="95" y="162" />
                     <rect fill="rgba(255,255,255,0.25)" height="4" rx="2" width="155" x="95" y="172" />
                     <rect fill="rgba(255,255,255,0.2)" height="4" rx="2" width="90" x="95" y="182" />
                     
                     {/* AI suggestion cursor/highlight */}
                     <rect fill="rgba(255,255,255,0.15)" height="16" rx="2" width="85" x="185" y="178" />
                     
                     {/* AI sparkle icon floating near editor */}
                     <g transform="translate(335, 100)">
                        <circle cx="0" cy="0" fill="rgba(255,255,255,0.25)" r="22" />
                        {/* Sparkle/AI star shape */}
                        <path
                           d="M0 -12 L2 -2 L12 0 L2 2 L0 12 L-2 2 L-12 0 L-2 -2 Z"
                           fill="rgba(255,255,255,0.7)"
                        />
                     </g>
                     
                     {/* Secondary AI sparkle */}
                     <g transform="translate(355, 180)">
                        <circle cx="0" cy="0" fill="rgba(255,255,255,0.15)" r="14" />
                        <path
                           d="M0 -7 L1.2 -1.2 L7 0 L1.2 1.2 L0 7 L-1.2 1.2 L-7 0 L-1.2 -1.2 Z"
                           fill="rgba(255,255,255,0.5)"
                        />
                     </g>
                     
                     {/* Floating document/post cards */}
                     <g transform="translate(30, 90)">
                        <rect fill="rgba(255,255,255,0.12)" height="60" rx="6" width="45" x="0" y="0" />
                        <rect fill="rgba(255,255,255,0.25)" height="3" rx="1.5" width="30" x="7" y="12" />
                        <rect fill="rgba(255,255,255,0.15)" height="2" rx="1" width="35" x="7" y="22" />
                        <rect fill="rgba(255,255,255,0.15)" height="2" rx="1" width="28" x="7" y="28" />
                        <rect fill="rgba(255,255,255,0.1)" height="2" rx="1" width="32" x="7" y="34" />
                     </g>
                     
                     <g transform="translate(40, 170)">
                        <rect fill="rgba(255,255,255,0.1)" height="55" rx="6" width="40" x="0" y="0" />
                        <rect fill="rgba(255,255,255,0.2)" height="3" rx="1.5" width="26" x="7" y="10" />
                        <rect fill="rgba(255,255,255,0.12)" height="2" rx="1" width="30" x="7" y="20" />
                        <rect fill="rgba(255,255,255,0.12)" height="2" rx="1" width="24" x="7" y="26" />
                     </g>
                     
                     {/* Connection lines from AI to editor */}
                     <path
                        d="M335 122 Q 340 150, 320 170"
                        stroke="rgba(255,255,255,0.2)"
                        strokeDasharray="4 4"
                        strokeWidth="1.5"
                        fill="none"
                     />
                     
                     {/* Small floating sparkles */}
                     <circle cx="60" cy="260" fill="rgba(255,255,255,0.2)" r="8" />
                     <circle cx="350" cy="260" fill="rgba(255,255,255,0.15)" r="10" />
                     <circle cx="180" cy="260" fill="rgba(255,255,255,0.1)" r="6" />
                  </svg>
               </div>

               <div className="text-center space-y-4">
                  <h2 className="text-2xl xl:text-3xl font-serif font-semibold text-white">
                     {translate("dashboard.routes.auth.brand.tagline")}
                  </h2>
                  <p className="text-white/70 text-sm xl:text-base max-w-sm mx-auto">
                     {translate("dashboard.routes.auth.brand.description")}
                  </p>
               </div>
            </div>

            {/* Footer */}
            <div className="relative z-10 text-white/50 text-xs">
               © {new Date().getFullYear()} Montte.{" "}
               {translate("common.actions.all-rights-reserved")}
            </div>
         </aside>
      </div>
   );
}
