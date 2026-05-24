import React from 'react';

interface CraftifueLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function CraftifueLogo({ className = '', size = 'md' }: CraftifueLogoProps) {
  // Dimensions map based on size
  const strokeColor = '#2B3240'; // Deep Indigo Charcoal from image
  const terracotta = '#D76D42';
  const sageGreen = '#86A171';
  const mustardYellow = '#C38F36';
  const pastelPeach = '#F1B59C';
  const charcoal = '#2D343E';
  
  const scale = size === 'sm' ? 'h-10 w-auto' : size === 'lg' ? 'h-24 w-auto' : 'h-16 w-auto';

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 500 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${scale} transition-all duration-300`}
      >
        {/* FONTS DEPENDENCY - import beautiful handwriting font */}
        <defs>
          <style dangerouslySetInnerHTML={{__html: `
            @import url('https://fonts.googleapis.com/css2?family=Alex+Brush&family=Herr+Von+Muellerhoff&family=Pinyon+Script&display=swap');
            .craftifue-text {
              font-family: 'Alex Brush', 'Brush Script MT', cursive;
              font-weight: 500;
              fill: #2B3240;
            }
          `}} />
        </defs>

        {/* LEFT DECORATIVE LOOPED WIRE AND TASSEL */}
        <g id="left-tassel-wire" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none">
          {/* Looping curl on top-left of name */}
          <path d="M 120,40 C 100,20 60,30 60,60 C 60,90 100,105 100,120 C 100,135 80,150 80,175" />
          {/* Small hook on wire */}
          <path d="M 80,165 C 80,165 85,155 90,160" />
          
          {/* Beads */}
          <circle cx="80" cy="180" r="10" fill={terracotta} stroke={charcoal} strokeWidth="1.5" />
          <path d="M 75,190 L 85,190 M 70,195 L 90,195" strokeWidth="3" stroke={charcoal} />
          
          {/* Tassel fringe body */}
          <path d="M 73,195 L 70,240 L 75,245 L 80,240 L 85,245 L 90,240 L 87,195 Z" fill={terracotta} stroke={charcoal} strokeWidth="1.5" />
          {/* Inner vertical thread lines on tassel */}
          <line x1="75" y1="200" x2="74" y2="235" stroke={charcoal} strokeWidth="1" />
          <line x1="80" y1="200" x2="80" y2="238" stroke={charcoal} strokeWidth="1" />
          <line x1="85" y1="200" x2="86" y2="235" stroke={charcoal} strokeWidth="1" />
          
          {/* Small final tip bottom drop */}
          <circle cx="80" cy="245" r="2" fill={charcoal} />
        </g>

        {/* FLOATING ORGANIC DOTS AROUND TEXT */}
        {/* Top-left Orange dot */}
        <circle cx="180" cy="40" r="6" fill={terracotta} />
        {/* Top-center Green leaf element */}
        <path d="M 280,25 C 290,20 300,30 280,35 C 270,40 265,30 280,25 Z" fill={sageGreen} stroke={charcoal} strokeWidth="0.8" />
        {/* Top-right Peach & Charcoal dots */}
        <circle cx="310" cy="40" r="4.5" fill={terracotta} />
        <circle cx="330" cy="44" r="3" fill={strokeColor} />
        
        {/* Right side floating dots */}
        <circle cx="468" cy="100" r="6.5" fill={sageGreen} />
        <circle cx="484" cy="118" r="4.5" fill={terracotta} />
        <circle cx="476" cy="136" r="3" fill={strokeColor} />

        {/* CALLIGRAPHY text "Craftifue" */}
        {/* Large stylized 'C' and the cursive text */}
        <text
          x="120"
          y="125"
          className="craftifue-text"
          fontSize="115"
          letterSpacing="1.5"
        >
          Craftifue
        </text>

        {/* ORGANIC BOTTOM SURFBOARD/PLATTER */}
        <g id="platter-surfboard" transform="translate(130, 140)">
          {/* Platter body clip or shape with precise vertical slices */}
          {/* Main platter background shell shape for outline */}
          <path 
            d="M 12 40 C 35 15, 235 15, 258 40 C 235 65, 35 65, 12 40 Z" 
            fill="none" 
            stroke={charcoal} 
            strokeWidth="2" 
            strokeLinejoin="round"
          />

          {/* Slices of different textures in a single custom multi-path shape or layered paths */}
          {/* Segment 1: Mustard yellow [12, 15] to ~60 */}
          <g>
            <path d="M 12 40 C 18 33, 35 25, 64 22 L 63 58 C 35 55, 18 47, 12 40 Z" fill={mustardYellow} />
            {/* Horizontal stripes pattern */}
            <line x1="22" y1="34" x2="59" y2="34" stroke={charcoal} strokeWidth="1" />
            <line x1="20" y1="40" x2="61" y2="40" stroke={charcoal} strokeWidth="1" />
            <line x1="22" y1="46" x2="59" y2="46" stroke={charcoal} strokeWidth="1" />
          </g>

          {/* Segment 2: Terracotta Orange with central diamond stitch */}
          <g>
            <path d="M 64 22 C 75 21, 95 20, 111 20 L 111 60 C 95 60, 75 59, 63 58 Z" fill={terracotta} />
            {/* Diamond pattern along center */}
            <path d="M 87 25 L 91 30 L 87 35 L 83 30 Z" fill={charcoal} />
            <path d="M 87 35 L 91 40 L 87 45 L 83 40 Z" fill={charcoal} />
            <path d="M 87 45 L 91 50 L 87 55 L 83 50 Z" fill={charcoal} />
          </g>

          {/* Segment 3: Off-white with 4x3 dots grid */}
          <g>
            <path d="M 111 20 C 122 20, 148 20, 169 21 L 169 59 C 148 59, 122 60, 111 60 Z" fill="#FAF8F3" />
            {/* 4x3 Dot pattern */}
            <circle cx="123" cy="27" r="2" fill={charcoal} />
            <circle cx="138" cy="27" r="2" fill={charcoal} />
            <circle cx="153" cy="27" r="2" fill={charcoal} />
            <circle cx="123" cy="35" r="2" fill={charcoal} />
            <circle cx="138" cy="35" r="2" fill={charcoal} />
            <circle cx="153" cy="35" r="2" fill={charcoal} />
            <circle cx="123" cy="43" r="2" fill={charcoal} />
            <circle cx="138" cy="43" r="2" fill={charcoal} />
            <circle cx="153" cy="43" r="2" fill={charcoal} />
            <circle cx="123" cy="51" r="2" fill={charcoal} />
            <circle cx="138" cy="51" r="2" fill={charcoal} />
            <circle cx="153" cy="51" r="2" fill={charcoal} />
          </g>

          {/* Segment 4: Sage Green with chevrons */}
          <g>
            <path d="M 169 21 C 182 22, 198 24, 218 27 L 217 53 C 198 56, 182 58, 169 59 Z" fill={sageGreen} />
            {/* Chevrons pointing down/right */}
            <path d="M 185 28 L 193 33 L 185 38" fill="none" stroke={charcoal} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M 193 33 L 201 38 L 193 43" fill="none" stroke={charcoal} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M 185 41 L 193 46 L 185 51" fill="none" stroke={charcoal} strokeWidth="1.5" strokeLinecap="round" />
          </g>

          {/* Segment 5: Pastel Peach/Coral with lines and point tip */}
          <g>
            <path d="M 218 27 C 235 30, 250 35, 258 40 C 250 45, 235 50, 217 53 Z" fill={pastelPeach} />
            {/* horizontal hashes right end */}
            <line x1="225" y1="34" x2="249" y2="34" stroke={charcoal} strokeWidth="1" />
            <line x1="224" y1="40" x2="252" y2="40" stroke={charcoal} strokeWidth="1" />
            <line x1="225" y1="46" x2="249" y2="46" stroke={charcoal} strokeWidth="1" />
          </g>

          {/* Vertical segmented dividers */}
          <line x1="64" y1="21" x2="63" y2="59" stroke={charcoal} strokeWidth="1.2" />
          <line x1="111" y1="19" x2="111" y2="61" stroke={charcoal} strokeWidth="1.2" />
          <line x1="169" y1="20" x2="169" y2="60" stroke={charcoal} strokeWidth="1.2" />
          <line x1="218" y1="23" x2="217" y2="57" stroke={charcoal} strokeWidth="1.2" />

          {/* Tiny left pointed and right pointed caps */}
          <circle cx="11.5" cy="40" r="2.5" fill={charcoal} />
          <circle cx="258.5" cy="40" r="2.5" fill={charcoal} />
        </g>
      </svg>
    </div>
  );
}
