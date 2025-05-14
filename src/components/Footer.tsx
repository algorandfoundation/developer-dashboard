import React from 'react';
import { ThemeColors } from './types';

interface FooterProps {
  currentTheme: ThemeColors;
}

const Footer: React.FC<FooterProps> = ({ currentTheme }) => {
  return (
    <footer className="mt-10 pt-6 border-t text-center" style={{ borderColor: currentTheme.tableBorder }}>
      <div className="mb-4">
        <p className="text-sm" style={{ color: currentTheme.text }}>
          Data Source: <a 
            href="https://github.com/electric-capital/crypto-ecosystems"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: currentTheme.primary, textDecoration: "underline" }}
          >
            Electric Capital Crypto Ecosystems
          </a>
        </p>
        <p className="text-sm mt-2" style={{ color: currentTheme.text }}>
          If you're working in open source crypto, submit your repository <a 
            href="https://github.com/electric-capital/crypto-ecosystems"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: currentTheme.primary, textDecoration: "underline" }}
          >
             here
          </a> to be counted.
        </p>
      </div>
      <p className="text-xs pb-2" style={{ color: currentTheme.text, opacity: 0.8 }}>
        Dashboard powered by Algorand Foundation BI team
      </p>
    </footer>
  );
};

export default Footer;
