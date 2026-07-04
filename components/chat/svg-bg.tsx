export function ChatBgSvg() {
  return (
    <svg
      className="absolute inset-0 h-full w-full opacity-40 dark:opacity-30"
      preserveAspectRatio="xMidYMid slice"
      viewBox="0 0 800 600"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <style>{`
          .doodle-light { stroke: #9ca3af; fill: none; stroke-linecap: round; stroke-linejoin: round; }
          .doodle-dark { stroke: #52525b; fill: none; stroke-linecap: round; stroke-linejoin: round; }
        `}</style>
      </defs>

      {/* Light mode doodles */}
      <g className="doodle-light dark:hidden" strokeWidth="1.5">
        {/* Chat bubbles scattered */}
        <rect x="50" y="40" width="60" height="40" rx="8" />
        <rect x="180" y="80" width="70" height="35" rx="8" />
        <path d="M 50 80 L 30 100 L 50 100" />
        <path d="M 250 95 L 270 115 L 250 115" />
        
        {/* Message bubbles with dots */}
        <g>
          <rect x="100" y="180" width="55" height="40" rx="8" />
          <circle cx="115" cy="195" r="2" fill="#9ca3af" />
          <circle cx="125" cy="195" r="2" fill="#9ca3af" />
          <circle cx="135" cy="195" r="2" fill="#9ca3af" />
        </g>
        <g>
          <rect x="280" y="200" width="60" height="40" rx="8" />
          <circle cx="295" cy="215" r="2" fill="#9ca3af" />
          <circle cx="305" cy="215" r="2" fill="#9ca3af" />
          <circle cx="315" cy="215" r="2" fill="#9ca3af" />
        </g>

        {/* Smiley faces */}
        <circle cx="500" cy="100" r="20" strokeWidth="1.2" />
        <circle cx="505" cy="95" r="2" fill="#9ca3af" />
        <circle cx="495" cy="95" r="2" fill="#9ca3af" />
        <path d="M 493 102 Q 500 108 507 102" strokeWidth="1" />

        <circle cx="650" cy="320" r="18" strokeWidth="1.2" />
        <circle cx="655" cy="315" r="2" fill="#9ca3af" />
        <circle cx="645" cy="315" r="2" fill="#9ca3af" />
        <path d="M 643 322 Q 650 327 657 322" strokeWidth="1" />

        {/* Arrow and send icons */}
        <g>
          <circle cx="150" cy="380" r="18" />
          <path d="M 142 380 L 158 380 M 150 372 L 158 380 L 150 388" strokeWidth="1" />
        </g>

        {/* Video/play icons */}
        <rect x="350" y="360" width="36" height="36" rx="4" />
        <path d="M 360 365 L 360 385 L 378 375 Z" fill="#9ca3af" />

        {/* Paperclip/attachment */}
        <g transform="translate(700, 420)">
          <path d="M 0 12 Q 0 0 12 0 L 12 24 Q 0 24 0 12 Q 0 6 6 6 L 6 18" strokeWidth="1.5" />
        </g>

        {/* Users/people icons */}
        <g>
          <circle cx="400" cy="450" r="6" />
          <path d="M 394 460 Q 400 455 406 460 L 404 468 Q 400 470 396 468" />
        </g>
        <g transform="translate(420, 0)">
          <circle cx="400" cy="450" r="6" />
          <path d="M 394 460 Q 400 455 406 460 L 404 468 Q 400 470 396 468" />
        </g>

        {/* Speech bubbles with text lines */}
        <rect x="50" y="280" width="80" height="50" rx="8" />
        <line x1="60" y1="295" x2="120" y2="295" strokeWidth="1" />
        <line x1="60" y1="305" x2="115" y2="305" strokeWidth="1" />
        <line x1="60" y1="315" x2="125" y2="315" strokeWidth="1" />

        {/* More doodles */}
        <circle cx="550" cy="480" r="25" />
        <line x1="540" y1="480" x2="560" y2="480" strokeWidth="1" />
        <line x1="550" y1="470" x2="550" y2="490" strokeWidth="1" />

        <rect x="200" y="500" width="50" height="50" rx="8" />
        <circle cx="225" cy="510" r="3" fill="#9ca3af" />
        <circle cx="235" cy="510" r="3" fill="#9ca3af" />

        {/* Notification bell */}
        <g transform="translate(650, 500)">
          <path d="M 0 8 Q 0 0 8 0 Q 16 0 16 8 L 14 12 L 2 12 L 0 8" strokeWidth="1" />
          <circle cx="8" cy="18" r="2" fill="#9ca3af" />
        </g>

        {/* Random connecting lines and dots */}
        <circle cx="300" cy="50" r="3" fill="#9ca3af" />
        <circle cx="450" cy="150" r="3" fill="#9ca3af" />
        <circle cx="600" cy="200" r="3" fill="#9ca3af" />
      </g>

      {/* Dark mode doodles */}
      <g className="doodle-dark hidden dark:block" strokeWidth="1.5">
        {/* Chat bubbles scattered */}
        <rect x="50" y="40" width="60" height="40" rx="8" />
        <rect x="180" y="80" width="70" height="35" rx="8" />
        <path d="M 50 80 L 30 100 L 50 100" />
        <path d="M 250 95 L 270 115 L 250 115" />
        
        {/* Message bubbles with dots */}
        <g>
          <rect x="100" y="180" width="55" height="40" rx="8" />
          <circle cx="115" cy="195" r="2" fill="#52525b" />
          <circle cx="125" cy="195" r="2" fill="#52525b" />
          <circle cx="135" cy="195" r="2" fill="#52525b" />
        </g>
        <g>
          <rect x="280" y="200" width="60" height="40" rx="8" />
          <circle cx="295" cy="215" r="2" fill="#52525b" />
          <circle cx="305" cy="215" r="2" fill="#52525b" />
          <circle cx="315" cy="215" r="2" fill="#52525b" />
        </g>

        {/* Smiley faces */}
        <circle cx="500" cy="100" r="20" strokeWidth="1.2" />
        <circle cx="505" cy="95" r="2" fill="#52525b" />
        <circle cx="495" cy="95" r="2" fill="#52525b" />
        <path d="M 493 102 Q 500 108 507 102" strokeWidth="1" />

        <circle cx="650" cy="320" r="18" strokeWidth="1.2" />
        <circle cx="655" cy="315" r="2" fill="#52525b" />
        <circle cx="645" cy="315" r="2" fill="#52525b" />
        <path d="M 643 322 Q 650 327 657 322" strokeWidth="1" />

        {/* Arrow and send icons */}
        <g>
          <circle cx="150" cy="380" r="18" />
          <path d="M 142 380 L 158 380 M 150 372 L 158 380 L 150 388" strokeWidth="1" />
        </g>

        {/* Video/play icons */}
        <rect x="350" y="360" width="36" height="36" rx="4" />
        <path d="M 360 365 L 360 385 L 378 375 Z" fill="#52525b" />

        {/* Paperclip/attachment */}
        <g transform="translate(700, 420)">
          <path d="M 0 12 Q 0 0 12 0 L 12 24 Q 0 24 0 12 Q 0 6 6 6 L 6 18" strokeWidth="1.5" />
        </g>

        {/* Users/people icons */}
        <g>
          <circle cx="400" cy="450" r="6" />
          <path d="M 394 460 Q 400 455 406 460 L 404 468 Q 400 470 396 468" />
        </g>
        <g transform="translate(420, 0)">
          <circle cx="400" cy="450" r="6" />
          <path d="M 394 460 Q 400 455 406 460 L 404 468 Q 400 470 396 468" />
        </g>

        {/* Speech bubbles with text lines */}
        <rect x="50" y="280" width="80" height="50" rx="8" />
        <line x1="60" y1="295" x2="120" y2="295" strokeWidth="1" />
        <line x1="60" y1="305" x2="115" y2="305" strokeWidth="1" />
        <line x1="60" y1="315" x2="125" y2="315" strokeWidth="1" />

        {/* More doodles */}
        <circle cx="550" cy="480" r="25" />
        <line x1="540" y1="480" x2="560" y2="480" strokeWidth="1" />
        <line x1="550" y1="470" x2="550" y2="490" strokeWidth="1" />

        <rect x="200" y="500" width="50" height="50" rx="8" />
        <circle cx="225" cy="510" r="3" fill="#52525b" />
        <circle cx="235" cy="510" r="3" fill="#52525b" />

        {/* Notification bell */}
        <g transform="translate(650, 500)">
          <path d="M 0 8 Q 0 0 8 0 Q 16 0 16 8 L 14 12 L 2 12 L 0 8" strokeWidth="1" />
          <circle cx="8" cy="18" r="2" fill="#52525b" />
        </g>

        {/* Random connecting lines and dots */}
        <circle cx="300" cy="50" r="3" fill="#52525b" />
        <circle cx="450" cy="150" r="3" fill="#52525b" />
        <circle cx="600" cy="200" r="3" fill="#52525b" />
      </g>
    </svg>
  );
}
