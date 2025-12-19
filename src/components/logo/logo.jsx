import React from 'react';

import config from 'src/config';

function Logo() {
  // Use config.logoPath directly - should be full remote URL or relative path
  const logoSrc = config.logoPath || '/assets/logo.jpg';
  
  return <img alt="Logo" style={{ width: 'auto', height: 110 }} src={logoSrc} />;
}

export default Logo;
