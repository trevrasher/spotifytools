import { useEffect, useState } from "react";

interface ErrorPopupProps {
    errorText: string | null;
    onClear: () => void;
}

const ERROR_DISPLAY_DURATION = 3500;
const ERROR_FADE_DURATION = 500;

export default function ErrorPopup({ errorText, onClear }: ErrorPopupProps) {
    const [isFadingOut, setIsFadingOut] = useState(false);

    useEffect(() => {
        if (!errorText) return;
        
        setIsFadingOut(false);
        const timer = setTimeout(() => {
            setIsFadingOut(true);
            setTimeout(() => {
                onClear();
                setIsFadingOut(false);
            }, ERROR_FADE_DURATION);
        }, ERROR_DISPLAY_DURATION);

        return () => clearTimeout(timer);
    }, [errorText, onClear]);

    if (!errorText) return null;

    return (
        <div className={`error ${isFadingOut ? 'fade-out' : ''}`}>
            {errorText}
        </div>
    );
}