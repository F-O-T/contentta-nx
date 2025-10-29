import { Button } from "@packages/ui/components/button";
import { cn } from "@packages/ui/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import * as Stepperize from "@stepperize/react";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

const StepperContext = React.createContext<Stepper.ConfigProps | null>(null);

const useStepperProvider = (): Stepper.ConfigProps => {
   const context = React.useContext(StepperContext);
   if (!context) {
      throw new Error("useStepper must be used within a StepperProvider.");
   }
   return context;
};

const defineStepper = <const Steps extends Stepperize.Step[]>(
   ...steps: Steps
): Stepper.DefineProps<Steps> => {
   const { Scoped, useStepper, ...rest } = Stepperize.defineStepper(...steps);

   const StepperContainer = ({
      children,
      className,
      ...props
   }: Omit<React.ComponentProps<"div">, "children"> & {
      children:
         | React.ReactNode
         | ((props: { methods: Stepperize.Stepper<Steps> }) => React.ReactNode);
   }) => {
      const methods = useStepper();

      return (
         <div
            className={cn("w-full", className)}
            date-component="stepper"
            {...props}
         >
            {typeof children === "function" ? children({ methods }) : children}
         </div>
      );
   };

   return {
      ...rest,
      Stepper: {
         Controls: ({ children, className, asChild, ...props }) => {
            const Comp = asChild ? Slot : "div";
            return (
               <Comp
                  className={cn("flex justify-end gap-4", className)}
                  date-component="stepper-controls"
                  {...props}
               >
                  {children}
               </Comp>
            );
         },
         Description,
         Navigation: ({
            children,
            "aria-label": ariaLabel = "Stepper Navigation",
            ...props
         }) => {
            const { variant } = useStepperProvider();
            return (
               <nav
                  aria-label={ariaLabel}
                  date-component="stepper-navigation"
                  {...props}
               >
                  <ol
                     className={classForNavigationList({ variant: variant })}
                     date-component="stepper-navigation-list"
                  >
                     {children}
                  </ol>
               </nav>
            );
         },
         Panel: ({ children, asChild, ...props }) => {
            const Comp = asChild ? Slot : "div";
            const { tracking } = useStepperProvider();

            return (
               <Comp
                  date-component="stepper-step-panel"
                  ref={(node) => scrollIntoStepperPanel(node, tracking)}
                  {...props}
               >
                  {children}
               </Comp>
            );
         },
         Provider: ({
            variant = "horizontal",
            labelOrientation = "horizontal",
            tracking = false,
            children,
            className,
            ...props
         }) => {
            return (
               <StepperContext.Provider
                  value={{ labelOrientation, tracking, variant }}
               >
                  <Scoped
                     initialMetadata={props.initialMetadata}
                     initialStep={props.initialStep}
                  >
                     <StepperContainer className={className} {...props}>
                        {children}
                     </StepperContainer>
                  </Scoped>
               </StepperContext.Provider>
            );
         },
         Step: ({ children, className, icon, ...props }) => {
            const { variant, labelOrientation } = useStepperProvider();
            const { current } = useStepper();

            const utils = rest.utils;
            const steps = rest.steps;

            const stepIndex = utils.getIndex(props.of);
            const step = steps[stepIndex];
            const currentIndex = utils.getIndex(current.id);

            const isLast = utils.getLast().id === props.of;
            const isActive = current.id === props.of;

            const dataState = getStepState(currentIndex, stepIndex);
            const childMap = useStepChildren(children);

            const title = childMap.get("title");
            const description = childMap.get("description");
            const panel = childMap.get("panel");

            if (variant === "circle") {
               return (
                  <li
                     className={cn(
                        "flex shrink-0 items-center gap-4 rounded-md transition-colors",
                        className,
                     )}
                     date-component="stepper-step"
                  >
                     <CircleStepIndicator
                        currentStep={stepIndex + 1}
                        totalSteps={steps.length}
                     />
                     <div
                        className="flex flex-col items-start gap-1"
                        date-component="stepper-step-content"
                     >
                        {title}
                        {description}
                     </div>
                  </li>
               );
            }

            return (
               <>
                  <li
                     className={cn([
                        "group peer relative flex items-center gap-2",
                        "data-[variant=vertical]:flex-row",
                        "data-[label-orientation=vertical]:w-full",
                        "data-[label-orientation=vertical]:flex-col",
                        "data-[label-orientation=vertical]:justify-center",
                     ])}
                     data-disabled={props.disabled}
                     data-label-orientation={labelOrientation}
                     data-state={dataState}
                     data-variant={variant}
                     date-component="stepper-step"
                  >
                     <Button
                        aria-controls={`step-panel-${props.of}`}
                        aria-current={isActive ? "step" : undefined}
                        aria-posinset={stepIndex + 1}
                        aria-selected={isActive}
                        aria-setsize={steps.length}
                        className="rounded-full"
                        date-component="stepper-step-indicator"
                        id={`step-${step?.id}`}
                        onKeyDown={(e) =>
                           onStepKeyDown(
                              e,
                              utils.getNext(props.of),
                              utils.getPrev(props.of),
                           )
                        }
                        role="tab"
                        size="icon"
                        tabIndex={dataState !== "inactive" ? 0 : -1}
                        type="button"
                        variant={
                           dataState !== "inactive" ? "default" : "secondary"
                        }
                        {...props}
                     >
                        {icon ?? stepIndex + 1}
                     </Button>
                     {variant === "horizontal" &&
                        labelOrientation === "vertical" && (
                           <StepperSeparator
                              disabled={props.disabled}
                              isLast={isLast}
                              labelOrientation={labelOrientation}
                              orientation="horizontal"
                              state={dataState}
                           />
                        )}
                     <div
                        className="flex flex-col items-start"
                        date-component="stepper-step-content"
                     >
                        {title}
                        {description}
                     </div>
                  </li>

                  {variant === "horizontal" &&
                     labelOrientation === "horizontal" && (
                        <StepperSeparator
                           disabled={props.disabled}
                           isLast={isLast}
                           orientation="horizontal"
                           state={dataState}
                        />
                     )}

                  {variant === "vertical" && (
                     <div className="flex gap-4">
                        {!isLast && (
                           <div className="flex justify-center ps-[calc(var(--spacing)_*_4.5_-_1px)]">
                              <StepperSeparator
                                 disabled={props.disabled}
                                 isLast={isLast}
                                 orientation="vertical"
                                 state={dataState}
                              />
                           </div>
                        )}
                        <div className="my-3 flex-1 ps-4">{panel}</div>
                     </div>
                  )}
               </>
            );
         },
         Title,
      },
      useStepper,
   };
};

const Title = ({
   children,
   className,
   asChild,
   ...props
}: React.ComponentProps<"h4"> & { asChild?: boolean }) => {
   const Comp = asChild ? Slot : "h4";

   return (
      <Comp
         className={cn("text-base font-medium", className)}
         date-component="stepper-step-title"
         {...props}
      >
         {children}
      </Comp>
   );
};

const Description = ({
   children,
   className,
   asChild,
   ...props
}: React.ComponentProps<"p"> & { asChild?: boolean }) => {
   const Comp = asChild ? Slot : "p";

   return (
      <Comp
         className={cn("text-sm text-muted-foreground", className)}
         date-component="stepper-step-description"
         {...props}
      >
         {children}
      </Comp>
   );
};

const StepperSeparator = ({
   orientation,
   isLast,
   labelOrientation,
   state,
   disabled,
}: {
   isLast: boolean;
   state: string;
   disabled?: boolean;
} & VariantProps<typeof classForSeparator>) => {
   if (isLast) {
      return null;
   }
   return (
      // biome-ignore lint/a11y/useSemanticElements: <no need>
      <div
         aria-orientation={orientation || "horizontal"}
         aria-valuemax={100}
         aria-valuemin={0}
         aria-valuenow={50}
         className={classForSeparator({ labelOrientation, orientation })}
         data-disabled={disabled}
         data-orientation={orientation}
         data-state={state}
         date-component="stepper-separator"
         role="separator"
         tabIndex={-1}
      />
   );
};

const CircleStepIndicator = ({
   currentStep,
   totalSteps,
   size = 80,
   strokeWidth = 6,
}: Stepper.CircleStepIndicatorProps) => {
   const radius = (size - strokeWidth) / 2;
   const circumference = radius * 2 * Math.PI;
   const fillPercentage = (currentStep / totalSteps) * 100;
   const dashOffset = circumference - (circumference * fillPercentage) / 100;
   return (
      <div
         aria-valuemax={totalSteps}
         aria-valuemin={1}
         aria-valuenow={currentStep}
         className="relative inline-flex items-center justify-center"
         date-component="stepper-step-indicator"
         role="progressbar"
         tabIndex={-1}
      >
         <svg height={size} width={size}>
            <title>Step Indicator</title>
            <circle
               className="text-muted-foreground"
               cx={size / 2}
               cy={size / 2}
               fill="none"
               r={radius}
               stroke="currentColor"
               strokeWidth={strokeWidth}
            />
            <circle
               className="text-primary transition-all duration-300 ease-in-out"
               cx={size / 2}
               cy={size / 2}
               fill="none"
               r={radius}
               stroke="currentColor"
               strokeDasharray={circumference}
               strokeDashoffset={dashOffset}
               strokeWidth={strokeWidth}
               transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
         </svg>
         <div className="absolute inset-0 flex items-center justify-center">
            <span aria-live="polite" className="text-sm font-medium">
               {currentStep} of {totalSteps}
            </span>
         </div>
      </div>
   );
};

const classForNavigationList = cva("flex gap-2", {
   variants: {
      variant: {
         circle: "flex-row items-center justify-between",
         horizontal: "flex-row items-center justify-between",
         vertical: "flex-col",
      },
   },
});

const classForSeparator = cva(
   [
      "bg-muted",
      "data-[state=completed]:bg-primary data-[disabled]:opacity-50",
      "transition-all duration-300 ease-in-out",
   ],
   {
      variants: {
         labelOrientation: {
            vertical:
               "absolute left-[calc(50%+30px)] right-[calc(-50%+20px)] top-5 block shrink-0",
         },
         orientation: {
            horizontal: "h-0.5 flex-1",
            vertical: "h-full w-0.5",
         },
      },
   },
);

function scrollIntoStepperPanel(
   node: HTMLDivElement | null,
   tracking?: boolean,
) {
   if (tracking) {
      node?.scrollIntoView({ behavior: "smooth", block: "center" });
   }
}

const useStepChildren = (children: React.ReactNode) => {
   return React.useMemo(() => extractChildren(children), [children]);
};

const extractChildren = (children: React.ReactNode) => {
   const childrenArray = React.Children.toArray(children);
   const map = new Map<string, React.ReactNode>();

   for (const child of childrenArray) {
      if (React.isValidElement(child)) {
         if (child.type === Title) {
            map.set("title", child);
         } else if (child.type === Description) {
            map.set("description", child);
         } else {
            map.set("panel", child);
         }
      }
   }

   return map;
};

const onStepKeyDown = (
   e: React.KeyboardEvent<HTMLButtonElement>,
   nextStep: Stepperize.Step,
   prevStep: Stepperize.Step,
) => {
   const { key } = e;
   const directions = {
      next: ["ArrowRight", "ArrowDown"],
      prev: ["ArrowLeft", "ArrowUp"],
   };

   if (directions.next.includes(key) || directions.prev.includes(key)) {
      const direction = directions.next.includes(key) ? "next" : "prev";
      const step = direction === "next" ? nextStep : prevStep;

      if (!step) {
         return;
      }

      const stepElement = document.getElementById(`step-${step.id}`);
      if (!stepElement) {
         return;
      }

      const isActive =
         stepElement.parentElement?.getAttribute("data-state") !== "inactive";
      if (isActive || direction === "prev") {
         stepElement.focus();
      }
   }
};

const getStepState = (currentIndex: number, stepIndex: number) => {
   if (currentIndex === stepIndex) {
      return "active";
   }
   if (currentIndex > stepIndex) {
      return "completed";
   }
   return "inactive";
};

namespace Stepper {
   export type StepperVariant = "horizontal" | "vertical" | "circle";
   export type StepperLabelOrientation = "horizontal" | "vertical";

   export type ConfigProps = {
      variant?: StepperVariant;
      labelOrientation?: StepperLabelOrientation;
      tracking?: boolean;
   };

   export type DefineProps<Steps extends Stepperize.Step[]> = Omit<
      Stepperize.StepperReturn<Steps>,
      "Scoped"
   > & {
      Stepper: {
         Provider: (
            props: Omit<Stepperize.ScopedProps<Steps>, "children"> &
               Omit<React.ComponentProps<"div">, "children"> &
               Stepper.ConfigProps & {
                  children:
                     | React.ReactNode
                     | ((props: {
                          methods: Stepperize.Stepper<Steps>;
                       }) => React.ReactNode);
               },
         ) => React.ReactElement;
         Navigation: (props: React.ComponentProps<"nav">) => React.ReactElement;
         Step: (
            props: React.ComponentProps<"button"> & {
               of: Stepperize.Get.Id<Steps>;
               icon?: React.ReactNode;
            },
         ) => React.ReactElement;
         Title: (props: AsChildProps<"h4">) => React.ReactElement;
         Description: (props: AsChildProps<"p">) => React.ReactElement;
         Panel: (props: AsChildProps<"div">) => React.ReactElement;
         Controls: (props: AsChildProps<"div">) => React.ReactElement;
      };
   };

   export type CircleStepIndicatorProps = {
      currentStep: number;
      totalSteps: number;
      size?: number;
      strokeWidth?: number;
   };
}

type AsChildProps<T extends React.ElementType> = React.ComponentProps<T> & {
   asChild?: boolean;
};

export { defineStepper };
