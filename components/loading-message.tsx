import React from "react";

const LoadingMessage: React.FC = () => {
  return (
    <div className="text-sm">
      <div className="flex flex-col">
        <div className="flex">
          <div className="mr-4 rounded-[20px] px-4 py-3 md:mr-24 text-foreground bg-card border border-border shadow-sm">
            <div className="flex gap-1.5 items-center h-5">
              <div className="w-1.5 h-1.5 animate-bounce bg-primary rounded-full [animation-delay:-0.3s]" />
              <div className="w-1.5 h-1.5 animate-bounce bg-primary rounded-full [animation-delay:-0.15s]" />
              <div className="w-1.5 h-1.5 animate-bounce bg-primary rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingMessage;
