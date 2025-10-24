import { Github, Twitter, Linkedin, Mail } from 'lucide-react';

export const Footer = () => {
  const footerLinks = {
    product: [
      { label: 'Features', href: '#features' },
      { label: 'How It Works', href: '#how-it-works' },
      { label: 'AI Technology', href: '#ai' },
      { label: 'Pricing', href: '#pricing' },
    ],
    company: [
      { label: 'About', href: '#about' },
      { label: 'Team', href: '#team' },
      { label: 'Contact', href: '#contact' },
      { label: 'Blog', href: '#blog' },
    ],
    resources: [
      { label: 'Help Center', href: '#help' },
      { label: 'Community', href: '#community' },
      { label: 'Guides', href: '#guides' },
      { label: 'API Docs', href: '#api' },
    ],
    legal: [
      { label: 'Privacy', href: '#privacy' },
      { label: 'Terms', href: '#terms' },
      { label: 'Security', href: '#security' },
    ],
  };

  const socialLinks = [
    { icon: <Github className="w-5 h-5" />, href: '#github', label: 'GitHub' },
    { icon: <Twitter className="w-5 h-5" />, href: '#twitter', label: 'Twitter' },
    { icon: <Linkedin className="w-5 h-5" />, href: '#linkedin', label: 'LinkedIn' },
    { icon: <Mail className="w-5 h-5" />, href: 'mailto:hello@companion.app', label: 'Email' },
  ];

  return (
    <footer className="bg-slate-900 border-t border-slate-800 pt-20 pb-10 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Main footer content */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-12 mb-16">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center text-xl">
                🐾
              </div>
              <span className="text-xl font-black text-slate-50">Companion</span>
            </div>
            
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Virtual pets that teach real skills. Built for learners, powered by AI.
            </p>

            {/* Social links */}
            <div className="flex gap-3">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  aria-label={social.label}
                  className="w-10 h-10 bg-slate-800 hover:bg-indigo-600 border border-slate-700 hover:border-indigo-600 rounded-lg flex items-center justify-center text-slate-400 hover:text-white transition-all"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          <div>
            <h4 className="font-bold text-slate-50 mb-4">Product</h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-slate-400 hover:text-indigo-400 text-sm transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-50 mb-4">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-slate-400 hover:text-indigo-400 text-sm transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-50 mb-4">Resources</h4>
            <ul className="space-y-3">
              {footerLinks.resources.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-slate-400 hover:text-indigo-400 text-sm transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-50 mb-4">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-slate-400 hover:text-indigo-400 text-sm transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 text-sm">
            © 2025 Companion. Built with curiosity.
          </p>
          
          <div className="flex gap-6">
            <a href="#privacy" className="text-slate-500 hover:text-slate-400 text-sm transition-colors">
              Privacy Policy
            </a>
            <a href="#terms" className="text-slate-500 hover:text-slate-400 text-sm transition-colors">
              Terms of Service
            </a>
            <a href="#cookies" className="text-slate-500 hover:text-slate-400 text-sm transition-colors">
              Cookie Settings
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
