export default function MarqueeTicker() {
    const items = Array(10).fill('THE BEST HOODIES ARE ONLY HERE');

    return (
        <div className="marquee-wrapper">
            <div className="marquee-track">
                {items.map((text, i) => (
                    <div key={i} className="marquee-item">
                        {text}
                        <span className="marquee-dot" />
                    </div>
                ))}
                {/* Duplicate for seamless loop */}
                {items.map((text, i) => (
                    <div key={`dup-${i}`} className="marquee-item">
                        {text}
                        <span className="marquee-dot" />
                    </div>
                ))}
            </div>
        </div>
    );
}
