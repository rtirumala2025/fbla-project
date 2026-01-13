import React, { useEffect, useState } from 'react';

export const PerformanceMonitor: React.FC = () => {
    const [fps, setFps] = useState(0);
    const [memoryUsage, setMemoryUsage] = useState(0);

    useEffect(() => {
        let frameCount = 0;
        let lastTime = performance.now();
        let animationFrameId: number;

        function measureFPS() {
            frameCount++;
            const currentTime = performance.now();

            if (currentTime >= lastTime + 1000) {
                setFps(Math.round((frameCount * 1000) / (currentTime - lastTime)));
                frameCount = 0;
                lastTime = currentTime;

                // Memory usage (if available)
                if ((performance as any).memory) {
                    const used = (performance as any).memory.usedJSHeapSize / 1048576;
                    setMemoryUsage(Math.round(used));
                }
            }

            animationFrameId = requestAnimationFrame(measureFPS);
        }

        measureFPS();

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <div className="fixed bottom-6 left-56 z-50 bg-black/70 text-white px-4 py-2 rounded font-mono text-sm pointer-events-none select-none">
            <div className="font-bold text-green-400">FPS: {fps}</div>
            {memoryUsage > 0 && <div className="text-blue-300">Memory: {memoryUsage} MB</div>}
        </div>
    );
};
