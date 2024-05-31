import { useEffect, useState } from 'react';

import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import { Box } from '@mui/material';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'next-i18next';

const UpDownButton = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const pathname = usePathname();
  const { t } = useTranslation();

  const trackScroll = () => {
    const scrolled = window.pageYOffset;
    const viewportHeight = document.documentElement.clientHeight;

    const atBottom =
      pathname === '/attendance-overview' ? scrolled >= 300 : scrolled >= 720;

    const atTop =
      pathname === '/attendance-overview' ? scrolled <= 320 : scrolled <= 720;

    setIsVisible(atTop || atBottom);
    setIsAtBottom(atBottom);
  };

  const handleButtonClick = () => {
    if (isAtBottom) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const targetPosition = pathname === '/attendance-overview' ? 320 : 720;
      window.scrollTo({ top: targetPosition, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const throttledTrackScroll = () => {
        setTimeout(trackScroll, 100);
      };
      window.addEventListener('scroll', throttledTrackScroll);
      trackScroll(); // Check initial scroll position when the component mounts

      return () => {
        window.removeEventListener('scroll', throttledTrackScroll);
      };
    }
  }, [pathname]);

  return (
    <div>
      {isVisible && (
        <Box
          className={`up_down_btn ${isVisible ? 'up_down_btn-show' : ''}`}
          onClick={handleButtonClick}
        >
          <Box className="w-98">
            {isAtBottom ? (
              <Box
                sx={{ height: '88px', width: '64px' }}
                className="flex-column-center"
              >
                <ArrowUpwardIcon />
                <span className="w-78"> {t('DASHBOARD.BACK_TO_TOP')}</span>
              </Box>
            ) : (
              <Box
                sx={{ height: '80px', width: '64px' }}
                className="flex-column-center"
              >
                {t('DASHBOARD.LEARNERS_DASHBOARD')}
                <ArrowDownwardIcon />
              </Box>
            )}
          </Box>
        </Box>
      )}
    </div>
  );
};

export default UpDownButton;
