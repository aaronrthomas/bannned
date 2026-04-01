const SOCIALS = ['Instagram', 'Telegram', 'Facebook', 'Twitter'];

export default function SocialBar() {
    return (
        <div className="social-bar">
            {SOCIALS.map((s) => (
                <a key={s} href="#" className="social-link">{s}</a>
            ))}
        </div>
    );
}
