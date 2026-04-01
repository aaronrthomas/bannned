import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="footer">
            <div className="footer-watermark">BANNNED</div>

            <div className="footer-content">
                <div>
                    <div className="footer-brand">BANNNED</div>
                    <p className="footer-tagline">
                        Premium streetwear crafted for the bold. The best hoodies are only here — made to last, designed to stand out.
                    </p>
                </div>

                <div className="footer-col">
                    <h4>Shop</h4>
                    <ul>
                        <li><Link href="#">Men</Link></li>
                        <li><Link href="#">Women</Link></li>
                        <li><Link href="#">Clothing</Link></li>
                        <li><Link href="#">Accessories</Link></li>
                        <li><Link href="#">Sale</Link></li>
                    </ul>
                </div>

                <div className="footer-col">
                    <h4>Company</h4>
                    <ul>
                        <li><Link href="#">About Us</Link></li>
                        <li><Link href="#">Careers</Link></li>
                        <li><Link href="#">Press</Link></li>
                        <li><Link href="#">Sustainability</Link></li>
                    </ul>
                </div>

                <div className="footer-col">
                    <h4>Support</h4>
                    <ul>
                        <li><Link href="#">Wishlist</Link></li>
                        <li><Link href="#">Order Tracking</Link></li>
                        <li><Link href="#">Returns</Link></li>
                        <li><Link href="#">Contact</Link></li>
                        <li><Link href="#">FAQ</Link></li>
                    </ul>
                </div>
            </div>

            <div className="footer-bottom">
                <p className="footer-copy">© {new Date().getFullYear()} BANNNED. All rights reserved.</p>
                <p className="footer-copy">Designed with ♥ — Avenyou Design Studio</p>
            </div>
        </footer>
    );
}
