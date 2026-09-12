import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export type StepId = 1 | 2 | 3 | 4;

const STEPS: { id: StepId; label: string; sublabel: string }[] = [
  { id: 1, label: "Productos", sublabel: "Items y cantidades" },
  { id: 2, label: "Importación", sublabel: "Costos y tipo de cambio" },
  { id: 3, label: "Precio", sublabel: "Margen y venta" },
  { id: 4, label: "Resumen", sublabel: "Revisión final" },
];

interface CotizacionStepperProps {
  currentStep: StepId;
  onStepClick?: (step: StepId) => void;
  completedSteps?: Set<StepId>;
}

export function CotizacionStepper({
  currentStep,
  onStepClick,
  completedSteps = new Set(),
}: CotizacionStepperProps) {
  return (
    <nav aria-label="Pasos de cotización" className="mb-8">
      <ol className="flex items-center w-full">
        {STEPS.map((step, idx) => {
          const isCompleted = completedSteps.has(step.id);
          const isActive = currentStep === step.id;
          const isClickable = onStepClick && (isCompleted || step.id <= currentStep);

          return (
            <li
              key={step.id}
              className={cn(
                "flex items-center",
                idx < STEPS.length - 1 && "flex-1"
              )}
            >
              {/* Step circle + label */}
              <button
                type="button"
                onClick={() => isClickable && onStepClick?.(step.id)}
                disabled={!isClickable}
                className={cn(
                  "flex flex-col items-center gap-1 transition-opacity",
                  isClickable ? "cursor-pointer" : "cursor-default",
                  !isActive && !isCompleted && "opacity-50"
                )}
                aria-current={isActive ? "step" : undefined}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors",
                    isCompleted
                      ? "border-blue-600 bg-blue-600 text-white"
                      : isActive
                      ? "border-blue-600 bg-white text-blue-600"
                      : "border-slate-300 bg-white text-slate-400"
                  )}
                >
                  {isCompleted ? <Check size={16} strokeWidth={2.5} /> : step.id}
                </span>
                <span className="hidden sm:block text-center">
                  <span
                    className={cn(
                      "block text-xs font-semibold",
                      isActive ? "text-blue-700" : isCompleted ? "text-slate-700" : "text-slate-400"
                    )}
                  >
                    {step.label}
                  </span>
                  <span className="block text-[10px] text-slate-400">{step.sublabel}</span>
                </span>
              </button>

              {/* Connector line */}
              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-3 mt-[-18px] sm:mt-[-30px] transition-colors",
                    completedSteps.has(step.id) ? "bg-blue-600" : "bg-slate-200"
                  )}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
